import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  ReferenceInput,
  FullAnalysis,
  AngleOption,
  PostConfig,
  GeneratedPost,
} from "@/lib/inspiration/types";
import {
  buildGeneratePostSystemPrompt,
  buildGeneratePostUserMessage,
} from "@/lib/inspiration/prompts/generatePost";
import { validateAntiAI } from "@/lib/advanced-config/antiAI";
import { LINKEDIN_MAX_CHARS, combinedLength } from "@/lib/advanced-config/defaults";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function smartTruncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const paraBreak = slice.lastIndexOf("\n\n");
  if (paraBreak > maxChars * 0.7) return slice.slice(0, paraBreak).trimEnd();
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf(".\n"),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? ")
  );
  if (sentenceEnd > maxChars * 0.7) return slice.slice(0, sentenceEnd + 1);
  return slice.trimEnd();
}

/* simple n-gram overlap (4-grams) for client-side similarity check */
function similarity4gram(a: string, b: string): number {
  const tokenize = (s: string) =>
    s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const ngrams = (tokens: string[], n = 4): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i <= tokens.length - n; i++) set.add(tokens.slice(i, i + n).join(" "));
    return set;
  };
  const A = ngrams(tokenize(a));
  const B = ngrams(tokenize(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return Math.round((inter / Math.min(A.size, B.size)) * 100);
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "API key não configurada." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      reference?: ReferenceInput;
      analysis?: FullAnalysis;
      angle?: AngleOption;
      config?: PostConfig;
    };

    const { reference, analysis, angle, config } = body;
    if (!reference || !analysis || !angle || !config) {
      return NextResponse.json(
        { error: "reference, analysis, angle, config são obrigatórios." },
        { status: 400 }
      );
    }

    const client = getClient(apiKey);
    const systemPrompt = buildGeneratePostSystemPrompt();
    const userMessage = buildGeneratePostUserMessage(angle, config, reference, analysis);

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 1.0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let post: GeneratedPost;
    try {
      post = JSON.parse(raw) as GeneratedPost;
    } catch {
      return NextResponse.json({ error: "Falha ao processar post gerado." }, { status: 500 });
    }

    // Validações server-side robustas

    // 1. Word count real
    post.wordCount = countWords(post.post);

    // 2. Similaridade real via n-gram overlap (4-grams) — sobreescreve estimativa do modelo
    const referenceText = reference.extractedText || reference.rawContent;
    const realSimilarity = similarity4gram(referenceText, post.post);
    if (post.originality) {
      post.originality.similarityScore = Math.max(post.originality.similarityScore, realSimilarity);
      post.originality.isSafeToPublish = post.originality.similarityScore < 35;
    }

    // 3. Anti-AI re-validation server-side
    const aiReport = validateAntiAI(post.post);

    // 4. Auto-rewrite se: similaridade > 35% OU anti-AI risk > 6 OU finalScore < 80
    const needsRewrite =
      (post.originality && !post.originality.isSafeToPublish) ||
      aiReport.rewriteRequired ||
      (post.score && post.score.finalScore < 80);

    if (needsRewrite) {
      const reasons: string[] = [];
      if (post.originality && !post.originality.isSafeToPublish) {
        reasons.push(`Similaridade ${post.originality.similarityScore}% > 35% — reescreva afastando da referência: ${post.originality.rewriteInstructions}`);
      }
      if (aiReport.rewriteRequired) {
        reasons.push(`Padrões de IA: ${aiReport.detectedPatterns.join(" · ")}`);
      }
      if (post.score && post.score.finalScore < 80) {
        const weakAxes: string[] = [];
        if (post.score.hookStrength < 75) weakAxes.push("hook");
        if (post.score.brunoVoice < 85) weakAxes.push("voz Bruno");
        if (post.score.originality < 80) weakAxes.push("originalidade");
        if (post.score.humanFeel < 80) weakAxes.push("humanidade");
        reasons.push(`Score baixo (${post.score.finalScore}). Eixos fracos: ${weakAxes.join(", ")}.`);
      }

      const rewrite = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: 1.0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: raw },
          {
            role: "user",
            content: `Reescreva passando nesses critérios:\n${reasons.map((r) => `- ${r}`).join("\n")}\n\nRetorne o JSON completo atualizado. Mantenha o ângulo central.`,
          },
        ],
      });
      const rwRaw = rewrite.choices[0]?.message?.content ?? "";
      try {
        const rwPost = JSON.parse(rwRaw) as GeneratedPost;
        // Recalcular similarity real e word count
        rwPost.wordCount = countWords(rwPost.post);
        const newSim = similarity4gram(referenceText, rwPost.post);
        if (rwPost.originality) {
          rwPost.originality.similarityScore = Math.max(rwPost.originality.similarityScore, newSim);
          rwPost.originality.isSafeToPublish = rwPost.originality.similarityScore < 35;
        }
        // Só substitui se melhorou
        const improved =
          (rwPost.originality?.similarityScore ?? 100) <= (post.originality?.similarityScore ?? 100) &&
          (rwPost.score?.finalScore ?? 0) >= (post.score?.finalScore ?? 0);
        if (improved) post = rwPost;
      } catch {
        /* mantém original se rewrite falhar */
      }
    }

    // ---------- LINKEDIN CHAR CAP — TRAVA FINAL INVIOLÁVEL (3000 chars) ----------
    let combined = combinedLength(post.hook, post.post, post.cta);
    if (combined > LINKEDIN_MAX_CHARS) {
      const cutRetry = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: raw },
          {
            role: "user",
            content: `🚨 LIMITE DO LINKEDIN ULTRAPASSADO
Soma atual (hook + post + cta + quebras) = ${combined} chars
LinkedIn = MÁXIMO ${LINKEDIN_MAX_CHARS} chars
Excedeu em ${combined - LINKEDIN_MAX_CHARS} chars

OBRIGATÓRIO: cortar o POST até soma total ≤ ${LINKEDIN_MAX_CHARS} chars. Mantenha hook e cta. Cortar gordura, não músculo. Retorne o JSON ajustado.`,
          },
        ],
      });
      const cutRaw = cutRetry.choices[0]?.message?.content ?? "";
      try {
        const cutPost = JSON.parse(cutRaw) as GeneratedPost;
        const newCombined = combinedLength(cutPost.hook || post.hook, cutPost.post || post.post, cutPost.cta ?? post.cta);
        if (newCombined < combined && cutPost.post) {
          post.hook = cutPost.hook || post.hook;
          post.post = cutPost.post;
          if (cutPost.cta !== undefined) post.cta = cutPost.cta;
          post.wordCount = countWords(post.post);
          combined = newCombined;
        }
      } catch {
        /* mantém */
      }
    }

    // Fallback programático
    if (combined > LINKEDIN_MAX_CHARS) {
      const reserve = (post.hook?.length ?? 0) + (post.cta ? post.cta.length + 4 : 0) + 4;
      const allowedPostChars = Math.max(200, LINKEDIN_MAX_CHARS - reserve);
      post.post = smartTruncate(post.post, allowedPostChars);
      post.wordCount = countWords(post.post);
    }

    return NextResponse.json(post);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
