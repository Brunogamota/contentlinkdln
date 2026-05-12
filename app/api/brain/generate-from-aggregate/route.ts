import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  AngleOption,
  GeneratedPost,
  PostConfig,
  SavedInspiration,
  ReferenceInput,
  FullAnalysis,
} from "@/lib/inspiration/types";
import {
  buildGeneratePostSystemPrompt,
  buildGeneratePostUserMessage,
} from "@/lib/inspiration/prompts/generatePost";
import { AggregateSynthesis } from "@/lib/inspiration/prompts/synthesize";
import { validateAntiAI } from "@/lib/advanced-config/antiAI";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * N-gram overlap (4-grams) — calcula similaridade contra TODAS as referências fonte.
 * Retorna o score máximo + a referência com maior overlap.
 */
function maxSimilarityAcrossSources(
  draft: string,
  sources: SavedInspiration[]
): { score: number; sourceIdx: number } {
  const tokenize = (s: string) =>
    s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const ngrams = (tokens: string[], n = 4): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i <= tokens.length - n; i++) set.add(tokens.slice(i, i + n).join(" "));
    return set;
  };
  const draftSet = ngrams(tokenize(draft));
  let max = 0;
  let maxIdx = -1;
  sources.forEach((s, idx) => {
    const refText = s.reference.extractedText || s.reference.rawContent;
    const refSet = ngrams(tokenize(refText));
    if (draftSet.size === 0 || refSet.size === 0) return;
    let inter = 0;
    for (const g of draftSet) if (refSet.has(g)) inter++;
    const score = Math.round((inter / Math.min(draftSet.size, refSet.size)) * 100);
    if (score > max) {
      max = score;
      maxIdx = idx;
    }
  });
  return { score: max, sourceIdx: maxIdx };
}

/**
 * Constrói uma "referência sintética" combinando os princípios agregados.
 * Vai como input pro pipeline existente generatePost.
 */
function buildSyntheticReference(
  topic: string,
  aggregate: AggregateSynthesis,
  sources: SavedInspiration[]
): ReferenceInput {
  const sourceCount = sources.length;
  const synthText = `[REFERÊNCIA SINTÉTICA — agregado de ${sourceCount} posts da biblioteca]

Padrões recorrentes identificados:
${aggregate.recurringPatterns.map((p) => `- ${p}`).join("\n")}

Princípios reusáveis seguros:
${aggregate.reusablePrinciples.map((p) => `- ${p}`).join("\n")}

Edge único do Bruno neste tópico:
${aggregate.brunoEdge}

⛔ FRONTEIRAS DE ORIGINALIDADE (não cruzar):
${aggregate.originalityBoundaries.map((b) => `- ${b}`).join("\n")}`;

  return {
    id: `synth_${Date.now()}`,
    type: "multi",
    rawContent: synthText,
    extractedText: synthText,
    userIntent: `Sintetizar conhecimento de ${sourceCount} referências do brain pra criar post original sobre o tópico`,
    targetTopic: topic,
    intensityLevel: 8,
    outputLength: 2000,
    proximityToReference: "baixa",
    ctaMode: "indireto",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Constrói uma "FullAnalysis sintética" a partir do agregado.
 * Usa princípios e fronteiras agregadas como inspirationMap.
 */
function buildSyntheticAnalysis(aggregate: AggregateSynthesis): FullAnalysis {
  const dominantArchetype = (aggregate.dominantArchetypes[0] || "post_anti_consenso") as FullAnalysis["narrativeDNA"]["archetype"];
  const dominantHook = (aggregate.dominantHooks[0] || "verdade_desconfortavel") as FullAnalysis["hookAnalysis"]["hookType"];

  return {
    referenceAnalysis: {
      centralThesis: aggregate.brunoEdge,
      hiddenTension: aggregate.recurringPatterns[0] || "",
      emotionalDriver: aggregate.emotionalPalette.join(", "),
      audiencePain: aggregate.recurringPatterns.slice(1, 3).join(" · "),
      enemy: aggregate.marketEnemiesAggregated.join(" · "),
      beliefBeingAttacked: aggregate.recurringPatterns[0] || "",
      beliefBeingBuilt: aggregate.brunoEdge,
      hookType: dominantHook,
      narrativeStructure: dominantArchetype,
      rhythmProfile: "agregado de múltiplas referências",
      languageProfile: "voz Bruno cru e operacional",
      persuasionMechanics: aggregate.recurringPatterns,
      viralityTriggers: aggregate.dominantHooks,
      originalityRisks: aggregate.contentWarnings,
      forbiddenElements: aggregate.originalityBoundaries,
    },
    hookAnalysis: {
      hookText: aggregate.brunoEdge,
      hookType: dominantHook,
      attentionMechanism: aggregate.dominantHooks.join(", "),
      curiosityGap: aggregate.recurringPatterns[0] || "",
      emotionalPunch: aggregate.emotionalPalette[0] || "",
      whyItWorks: aggregate.brunoEdge,
      riskOfBeingGeneric: aggregate.contentWarnings.join(" · "),
      possibleBrunoVersions: [],
    },
    narrativeDNA: {
      openingMove: "extraído do agregado",
      contextSetup: "extraído do agregado",
      tensionBuild: "extraído do agregado",
      proofMoment: "extraído do agregado",
      turnPoint: "extraído do agregado",
      insightDelivery: aggregate.brunoEdge,
      emotionalPeak: aggregate.emotionalPalette[0] || "",
      closingMove: "provocação ou loop aberto",
      ctaPattern: "indireto, posicionar Reborn como contexto",
      paragraphRhythm: "varia (curto-médio-curto)",
      sentenceCadence: "frases curtas, alguma quebrada, ritmo de WhatsApp",
      archetype: dominantArchetype,
    },
    inspirationMap: {
      reusablePrinciple: aggregate.reusablePrinciples.join(" · "),
      adaptableEmotion: aggregate.emotionalPalette.join(", "),
      safeStructure: dominantArchetype,
      newAngleOptions: aggregate.recurringPatterns,
      brunoPersonalConnection: aggregate.brunoEdge,
      rebornConnection: "contexto operacional sutil",
      marketConnection: aggregate.marketEnemiesAggregated.join(" · "),
      founderConnection: aggregate.brunoEdge,
      contentWarnings: aggregate.contentWarnings,
      originalityBoundaries: aggregate.originalityBoundaries,
    },
  };
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "API key não configurada." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      topic?: string;
      angle?: AngleOption;
      aggregate?: AggregateSynthesis;
      sources?: SavedInspiration[];
      config?: PostConfig;
    };

    const { topic, angle, aggregate, sources, config } = body;
    if (!topic || !angle || !aggregate || !sources || !config) {
      return NextResponse.json(
        { error: "topic, angle, aggregate, sources, config são obrigatórios." },
        { status: 400 }
      );
    }

    const syntheticRef = buildSyntheticReference(topic, aggregate, sources);
    const syntheticAnalysis = buildSyntheticAnalysis(aggregate);

    const client = getClient(apiKey);
    const systemPrompt = buildGeneratePostSystemPrompt();
    const userMessage = buildGeneratePostUserMessage(angle, config, syntheticRef, syntheticAnalysis);

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
      return NextResponse.json({ error: "Falha ao processar post." }, { status: 500 });
    }

    post.wordCount = countWords(post.post);

    // Similaridade real contra TODAS as referências fonte
    const sim = maxSimilarityAcrossSources(post.post, sources);
    if (post.originality) {
      post.originality.similarityScore = Math.max(post.originality.similarityScore, sim.score);
      post.originality.isSafeToPublish = post.originality.similarityScore < 35;
      if (sim.sourceIdx >= 0 && sim.score >= 35) {
        const author = sources[sim.sourceIdx].reference.author || `referência #${sim.sourceIdx + 1}`;
        post.originality.riskySections = [
          ...post.originality.riskySections,
          `proximidade alta com ${author}`,
        ];
      }
    }

    // Anti-AI re-validation
    const aiReport = validateAntiAI(post.post);
    const needsRewrite =
      (post.originality && !post.originality.isSafeToPublish) ||
      aiReport.rewriteRequired ||
      (post.score && post.score.finalScore < 80);

    if (needsRewrite) {
      const reasons: string[] = [];
      if (post.originality && !post.originality.isSafeToPublish) {
        reasons.push(`Similaridade ${post.originality.similarityScore}% > 35% — afaste de TODAS as referências fonte.`);
      }
      if (aiReport.rewriteRequired) {
        reasons.push(`Padrões de IA: ${aiReport.detectedPatterns.join(" · ")}`);
      }
      if (post.score && post.score.finalScore < 80) {
        reasons.push(`Score baixo (${post.score.finalScore}). Reforce voz Bruno e originalidade.`);
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
            content: `Reescreva passando nesses critérios:\n${reasons.map((r) => `- ${r}`).join("\n")}\n\nRetorne o JSON completo atualizado.`,
          },
        ],
      });
      const rwRaw = rewrite.choices[0]?.message?.content ?? "";
      try {
        const rwPost = JSON.parse(rwRaw) as GeneratedPost;
        rwPost.wordCount = countWords(rwPost.post);
        const newSim = maxSimilarityAcrossSources(rwPost.post, sources);
        if (rwPost.originality) {
          rwPost.originality.similarityScore = Math.max(rwPost.originality.similarityScore, newSim.score);
          rwPost.originality.isSafeToPublish = rwPost.originality.similarityScore < 35;
        }
        const improved =
          (rwPost.originality?.similarityScore ?? 100) <= (post.originality?.similarityScore ?? 100) &&
          (rwPost.score?.finalScore ?? 0) >= (post.score?.finalScore ?? 0);
        if (improved) post = rwPost;
      } catch {
        /* mantém */
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
