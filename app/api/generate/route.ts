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
  isGibberishOutput,
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
  const idx =
    typeof winnerIndex === "number" && alts[winnerIndex]
      ? winnerIndex
      : alts.reduce((bestIdx, h, i, all) => (h.total > all[bestIdx].total ? i : bestIdx), 0);
  return alts[idx]?.text ?? null;
}

/** SAFETY CAP — temperature da OpenAI nunca pode passar de 1.0 (gera word salad acima disso) */
const MAX_SAFE_TEMP = 1.0;
const safeTemp = (t: number) => Math.max(0.1, Math.min(MAX_SAFE_TEMP, t));

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

    const baseTemp = safeTemp(temperatureFor(config.creativeVariation));
    const client = getClient(apiKey);

    // ---------- CALL 1: gerar base ----------
    let completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: baseTemp,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    let raw = completion.choices[0]?.message?.content ?? "";
    let parsed = parseSafe(raw);

    // ---------- GUARD: gibberish detection ----------
    // Se o post saiu como word salad / mistura de idiomas / texto incoerente,
    // retry com temperature MUITO MAIS BAIXA (caso 1.0 ainda esteja gerando ruído)
    if (parsed.post && isGibberishOutput(parsed.post)) {
      const recoveryTemp = safeTemp(Math.min(0.5, baseTemp - 0.3));
      completion = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: recoveryTemp,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${userMessage}\n\n⚠️ IMPORTANTE: escreva 100% em PORTUGUÊS DO BRASIL coerente. Texto NORMAL. Sem mistura de idiomas, sem caracteres exóticos.`,
          },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? "";
      parsed = parseSafe(raw);
    }

    let hook = parsed.hook ?? "";
    let post = parsed.post ?? "";
    let cta: string | null = shouldOmitCTA(config) ? null : parsed.cta ?? null;
    const hookAlternatives: HookScore[] | undefined = parsed.hookAlternatives;

    if (config.generateHookVariations && hookAlternatives && hookAlternatives.length > 0) {
      const chosen = pickHookFromAlternatives(hookAlternatives, parsed.winnerIndex);
      if (chosen) hook = chosen;
    }

    // ---------- HARD LIMIT — enforçar WORD TARGET (até 2 retries) ----------
    const wt = resolveWordTarget(config);
    let wordCount = countWords(post);
    let hardLimitRetries = 0;
    while (
      config.hardLimit &&
      (wordCount < wt.min || wordCount > wt.max) &&
      hardLimitRetries < 2 &&
      post.length > 0
    ) {
      hardLimitRetries++;
      const direction =
        wordCount < wt.min
          ? `O post está com ${wordCount} palavras — ABAIXO do mínimo (${wt.min}). EXPANDA até atingir ${wt.target} palavras mantendo voz, ritmo e densidade. Adicione exemplos concretos, bastidor operacional, profundidade técnica. NÃO enrolar.`
          : `O post está com ${wordCount} palavras — ACIMA do máximo (${wt.max}). CORTE até atingir entre ${wt.min} e ${wt.max} palavras mantendo o impacto. Cortar gordura, não músculo.`;

      const retry = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: safeTemp(baseTemp - 0.15 * hardLimitRetries),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: JSON.stringify({ hook, post, cta }) },
          {
            role: "user",
            content: `${direction}\n\nAlvo OBRIGATÓRIO: entre ${wt.min} e ${wt.max} palavras. CONTE antes de retornar. Mantenha hook e CTA. Retorne o mesmo JSON.`,
          },
        ],
      });
      const retryRaw = retry.choices[0]?.message?.content ?? "";
      const retryParsed = parseSafe(retryRaw);

      if (retryParsed.post && !isGibberishOutput(retryParsed.post)) {
        const newCount = countWords(retryParsed.post);
        const oldDistance = Math.min(Math.abs(wordCount - wt.min), Math.abs(wordCount - wt.max));
        const newDistance = Math.min(Math.abs(newCount - wt.min), Math.abs(newCount - wt.max));
        // Só substitui se ficou MAIS PRÓXIMO da faixa
        if (newCount >= wt.min && newCount <= wt.max) {
          post = retryParsed.post;
          if (retryParsed.hook) hook = retryParsed.hook;
          if (!shouldOmitCTA(config) && retryParsed.cta) cta = retryParsed.cta;
          wordCount = newCount;
          break;
        } else if (newDistance < oldDistance) {
          post = retryParsed.post;
          if (retryParsed.hook) hook = retryParsed.hook;
          if (!shouldOmitCTA(config) && retryParsed.cta) cta = retryParsed.cta;
          wordCount = newCount;
        }
      }
    }

    // ---------- WORD TARGET soft (não-hardLimit) — expande se ficou MUITO abaixo ----------
    if (!config.hardLimit && wordCount < wt.min * 0.7 && post.length > 0) {
      const expansion = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: safeTemp(baseTemp - 0.1),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: JSON.stringify({ hook, post, cta }) },
          {
            role: "user",
            content: `Post atual ${wordCount} palavras — muito abaixo do alvo ${wt.target}. Expanda pra ~${wt.target} mantendo voz, densidade, exemplos concretos. Mantenha hook e CTA. Mesmo JSON.`,
          },
        ],
      });
      const expRaw = expansion.choices[0]?.message?.content ?? "";
      const expParsed = parseSafe(expRaw);
      if (expParsed.post && !isGibberishOutput(expParsed.post) && countWords(expParsed.post) > wordCount) {
        post = expParsed.post;
        if (expParsed.hook) hook = expParsed.hook;
        if (!shouldOmitCTA(config) && expParsed.cta) cta = expParsed.cta;
        wordCount = countWords(post);
      }
    }

    // ---------- ANTI-IA VALIDATOR ----------
    let antiAIReport = validateAntiAI(post);
    const shouldRewriteForAI =
      antiAIReport.rewriteRequired || (config.antiAILevel >= 8 && antiAIReport.aiRiskScore >= 4);

    if (shouldRewriteForAI) {
      const rewriteInstruction = buildAntiAIRewriteInstruction(antiAIReport);
      const rewrite = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: safeTemp(baseTemp),
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
      if (rwParsed.post && !isGibberishOutput(rwParsed.post)) {
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
