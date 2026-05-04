import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { NeuralContext } from "@/lib/neural/types";
import { FounderDNA, ContentPillar } from "@/lib/founder-dna/types";
import {
  AdvancedPostConfig,
  GenerationResult,
  HookScore,
} from "@/lib/advanced-config/types";
import {
  buildFinalSystemPrompt,
  shouldOmitCTA,
} from "@/lib/advanced-config/promptBuilder";
import {
  resolveLengthRange,
  resolveWordTarget,
  temperatureFor,
  countWords,
  DEFAULT_CONFIG,
} from "@/lib/advanced-config/defaults";
import { validateAntiAI, buildAntiAIRewriteInstruction } from "@/lib/advanced-config/antiAI";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

interface RawModelResponse {
  hook?: string;
  post?: string;
  cta?: string | null;
  hookAlternatives?: HookScore[];
  winnerIndex?: number;
}

function parseSafe(raw: string): RawModelResponse {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function pickHookFromAlternatives(alts: HookScore[] | undefined, winnerIndex?: number): string | null {
  if (!alts || alts.length === 0) return null;
  const idx = typeof winnerIndex === "number" && alts[winnerIndex] ? winnerIndex : alts.reduce((bestIdx, h, i, all) => (h.total > all[bestIdx].total ? i : bestIdx), 0);
  return alts[idx]?.text ?? null;
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key não configurada. Clica em 'add key' no topo da página." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      idea?: string;
      modes?: string[];
      neuralContext?: NeuralContext;
      founderDNA?: FounderDNA;
      pillar?: ContentPillar;
      refineInstruction?: string;
      advancedConfig?: Partial<AdvancedPostConfig>;
    };

    const { idea, modes, neuralContext, founderDNA, pillar, refineInstruction } = body;
    const config: AdvancedPostConfig = { ...DEFAULT_CONFIG, ...(body.advancedConfig || {}) };

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json({ error: "Manda uma ideia bruta primeiro." }, { status: 400 });
    }

    // Insights da base neural
    const neuralInsights: string[] = [];
    if (neuralContext) {
      if (neuralContext.dominantPatterns?.length) {
        neuralInsights.push(`Padrões dominantes: ${neuralContext.dominantPatterns.join(" · ")}`);
      }
      if (neuralContext.recommendedHookStyle) {
        neuralInsights.push(`Hook style aprendido: ${neuralContext.recommendedHookStyle}`);
      }
      if (neuralContext.toneGuidelines) {
        neuralInsights.push(`Tom aprendido: ${neuralContext.toneGuidelines}`);
      }
      if (neuralContext.referenceInsights?.length) {
        neuralInsights.push(...neuralContext.referenceInsights);
      }
      if (neuralContext.avoidPatterns) {
        neuralInsights.push(`EVITAR: ${neuralContext.avoidPatterns}`);
      }
    }

    const systemPrompt = buildFinalSystemPrompt({
      config,
      founderDNA,
      pillar,
      neuralInsights,
      modes,
    });

    const userMessage = refineInstruction
      ? `IDEIA BRUTA: "${idea.trim()}"\n\n🛠️ INSTRUÇÃO DE REFINO: ${refineInstruction}\n\nReescreva aplicando o refino e respeitando TODAS as diretivas avançadas.`
      : `IDEIA BRUTA: "${idea.trim()}"\n\nGere o post seguindo TODAS as diretivas. Respeite o tamanho-alvo em palavras.`;

    const temperature = temperatureFor(config.creativeVariation);
    const client = getClient(apiKey);

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseSafe(raw);

    let hook = parsed.hook ?? "";
    let post = parsed.post ?? "";
    let cta: string | null = shouldOmitCTA(config) ? null : parsed.cta ?? null;
    let hookAlternatives: HookScore[] | undefined = parsed.hookAlternatives;

    // Se hook engine ativado, garante o hook escolhido vem das alternatives
    if (config.generateHookVariations && hookAlternatives && hookAlternatives.length > 0) {
      const chosen = pickHookFromAlternatives(hookAlternatives, parsed.winnerIndex);
      if (chosen) hook = chosen;
    }

    // 1. WORD TARGET — expande se ficou curto demais
    const wt = resolveWordTarget(config);
    let wordCount = countWords(post);
    if (wordCount < wt.min && post.length > 0) {
      const expansionInstruction = `O post tem ${wordCount} palavras, abaixo do mínimo de ${wt.min} (alvo ${wt.target}). Expanda mantendo EXATAMENTE o mesmo estilo, tom e voz. Adicione: exemplos concretos, bastidor operacional, densidade técnica do domínio. NÃO enrole, NÃO repita, NÃO genericalize. Mantenha hook e CTA. Retorne o mesmo JSON com "post" expandido pra atingir ${wt.target} palavras.`;
      const expansion = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: Math.max(0.5, temperature - 0.2),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: raw },
          { role: "user", content: expansionInstruction },
        ],
      });
      const expRaw = expansion.choices[0]?.message?.content ?? "";
      const expParsed = parseSafe(expRaw);
      if (expParsed.post && countWords(expParsed.post) > wordCount) {
        post = expParsed.post;
        if (expParsed.hook) hook = expParsed.hook;
        if (!shouldOmitCTA(config) && expParsed.cta) cta = expParsed.cta;
        wordCount = countWords(post);
      }
    }

    // 2. ANTI-IA VALIDATOR — reescreve se score > 6 ou se antiAILevel >= 8
    let antiAIReport = validateAntiAI(post);
    const shouldRewriteForAI =
      antiAIReport.rewriteRequired || (config.antiAILevel >= 8 && antiAIReport.aiRiskScore >= 4);

    if (shouldRewriteForAI) {
      const rewriteInstruction = buildAntiAIRewriteInstruction(antiAIReport);
      const rewrite = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: Math.min(1.3, temperature + 0.15),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: JSON.stringify({ hook, post, cta }) },
          { role: "user", content: rewriteInstruction },
        ],
      });
      const rwRaw = rewrite.choices[0]?.message?.content ?? "";
      const rwParsed = parseSafe(rwRaw);
      if (rwParsed.post) {
        const newReport = validateAntiAI(rwParsed.post);
        if (newReport.aiRiskScore < antiAIReport.aiRiskScore) {
          post = rwParsed.post;
          if (rwParsed.hook) hook = rwParsed.hook;
          if (!shouldOmitCTA(config) && rwParsed.cta) cta = rwParsed.cta;
          antiAIReport = newReport;
          wordCount = countWords(post);
        }
      }
    }

    // 3. HARD LIMIT (chars) — retry se fora do range
    const charRange = resolveLengthRange(config);
    if (config.hardLimit && (post.length < charRange.min || post.length > charRange.max)) {
      const retry = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: Math.max(0.4, temperature - 0.3),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: JSON.stringify({ hook, post, cta }) },
          {
            role: "user",
            content: `Hard limit ATIVO. Post atual tem ${post.length} chars. Ajuste para EXATAMENTE entre ${charRange.min} e ${charRange.max} caracteres mantendo voz e densidade. Mesmo JSON.`,
          },
        ],
      });
      const retryRaw = retry.choices[0]?.message?.content ?? "";
      const retryParsed = parseSafe(retryRaw);
      if (retryParsed.post) {
        post = retryParsed.post;
        if (retryParsed.hook) hook = retryParsed.hook;
        if (!shouldOmitCTA(config) && retryParsed.cta) cta = retryParsed.cta;
        antiAIReport = validateAntiAI(post);
        wordCount = countWords(post);
      }
    }

    const result: GenerationResult = {
      hook,
      post,
      cta,
      hookAlternatives,
      wordCount,
      antiAIReport,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
