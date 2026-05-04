import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { NeuralContext } from "@/lib/neural/types";
import { FounderDNA, ContentPillar } from "@/lib/founder-dna/types";
import { AdvancedPostConfig } from "@/lib/advanced-config/types";
import { buildAdvancedConfigInstructions, shouldOmitCTA } from "@/lib/advanced-config/promptBuilder";
import { resolveLengthRange, temperatureFor, DEFAULT_CONFIG } from "@/lib/advanced-config/defaults";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function buildDNASection(dna?: FounderDNA): string {
  if (!dna || !dna.companyName) return "";
  return `
🧬 FOUNDER DNA (calibra tudo pro ICP)

EMPRESA: ${dna.companyName}${dna.companyDescription ? ` — ${dna.companyDescription}` : ""}
${dna.whatYouSell ? `O QUE VENDE: ${dna.whatYouSell}` : ""}

🎯 ICP — ÚNICA PESSOA QUE IMPORTA:
- Cargo: ${dna.icpRole}
- Dor que faz acordar de noite: ${dna.icpPain}
${dna.icpDecisionMaker ? `- Quem decide compra: ${dna.icpDecisionMaker}` : ""}

⚠️ TODA palavra do post precisa ressoar com ${dna.icpRole}. Se ${dna.icpRole} não engaja, o post FALHOU.

VOCÊ (founder):
${dna.founderStory}

DIFERENCIAL: ${dna.uniqueDifferentiator}
${dna.voiceTone ? `TOM BASE: ${dna.voiceTone}` : ""}
${dna.publicEnemies && dna.publicEnemies.length > 0
    ? `INIMIGOS PÚBLICOS (combustível pra polêmica): ${dna.publicEnemies.join(" · ")}`
    : ""}
`;
}

function buildPillarSection(pillar?: ContentPillar): string {
  if (!pillar) return "";
  return `
📌 PILAR DESTE POST: ${pillar.emoji} ${pillar.name}
INTENÇÃO: ${pillar.intent}
INSTRUÇÃO: ${pillar.promptGuidance}
`;
}

function buildSystemPrompt(
  modes: string[],
  neuralContext: NeuralContext | undefined,
  dna: FounderDNA | undefined,
  pillar: ContentPillar | undefined,
  advancedConfig: AdvancedPostConfig
): string {
  const isPolemico = modes.includes("polemico");
  const isViral = modes.includes("viral");
  const isAutoridade = modes.includes("autoridade");

  const hasNeuralContext =
    neuralContext &&
    (neuralContext.dominantPatterns.length > 0 ||
      neuralContext.recommendedHookStyle ||
      neuralContext.referenceInsights.length > 0);

  const neuralSection = hasNeuralContext
    ? `
🧠 BASE NEURAL (use como inteligência, NÃO copie)
${neuralContext.dominantPatterns.length > 0 ? `Padrões: ${neuralContext.dominantPatterns.join(" · ")}` : ""}
${neuralContext.recommendedHookStyle ? `Hook style: ${neuralContext.recommendedHookStyle}` : ""}
${neuralContext.toneGuidelines ? `Tom: ${neuralContext.toneGuidelines}` : ""}
${neuralContext.referenceInsights.length > 0 ? `Insights:\n${neuralContext.referenceInsights.map((i) => `- ${i}`).join("\n")}` : ""}
${neuralContext.avoidPatterns ? `Evitar: ${neuralContext.avoidPatterns}` : ""}
`
    : "";

  const omitCTA = shouldOmitCTA(advancedConfig);

  const outputSchema = omitCTA
    ? `📦 OUTPUT JSON (apenas isso):
{
  "hook": "frase de abertura magnética que para o scroll do ICP",
  "post": "corpo do post no tamanho configurado, parágrafos curtos, fechando por si só (SEM CTA explícito)",
  "cta": null
}`
    : `📦 OUTPUT JSON (apenas isso):
{
  "hook": "frase de abertura magnética que para o scroll do ICP",
  "post": "corpo do post no tamanho configurado, parágrafos curtos com quebra de linha, SEM o CTA no final",
  "cta": "1-2 frases curtas que movem pra ação conforme o tipo de CTA configurado"
}`;

  return `Você é um Founder Content Strategist sênior, especializado em FOUNDER-LED GROWTH.

Seu trabalho NÃO é fazer post viral genérico. É:
- Atrair o ICP do founder (quem PAGA por ele)
- Construir autoridade no nicho específico
- Mover o leitor pra ação concreta
- Fazer o ICP pensar "esse founder entende o problema de verdade"

${buildDNASection(dna)}
${buildPillarSection(pillar)}
${neuralSection}

${buildAdvancedConfigInstructions(advancedConfig)}

⚠️ REGRAS ABSOLUTAS (sobrepõem qualquer config conflitante)
- NUNCA soar como post genérico de LinkedIn
- NUNCA usar tom de coach
- NUNCA usar frases tipo "no final do dia", "isso me ensinou", "aprendi que", "a verdade é que"
- NÃO escrever texto perfeito demais
- Preferir frases com tensão, bastidor e visão de operador
- Linguagem simples, direta, humana
- Sem jargão de management/livro de negócios

${isPolemico ? `🧨 MODO POLÊMICO: provocação máxima, reduz filtro social\n` : ""}${isViral ? `🎯 MODO VIRAL: identificação em massa do ICP\n` : ""}${isAutoridade ? `🧠 MODO AUTORIDADE: técnico, ICP sente que você sabe mais\n` : ""}
${outputSchema}`;
}

function isPostInRange(post: string, config: AdvancedPostConfig): boolean {
  const { min, max } = resolveLengthRange(config);
  const len = post.length;
  return len >= min && len <= max;
}

function buildRetryMessage(config: AdvancedPostConfig, currentLength: number): string {
  const { min, max } = resolveLengthRange(config);
  return `O post anterior tem ${currentLength} caracteres, fora do limite RÍGIDO de ${min}–${max}. Reescreva o POST (apenas o campo "post") respeitando exatamente esse intervalo. Mantenha o hook e o cta. Retorne o mesmo JSON com "post" ajustado.`;
}

interface GenerateResult {
  hook: string;
  post: string;
  cta: string | null;
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
      advancedConfig?: AdvancedPostConfig;
    };

    const { idea, modes, neuralContext, founderDNA, pillar, refineInstruction } = body;
    const advancedConfig: AdvancedPostConfig = { ...DEFAULT_CONFIG, ...(body.advancedConfig || {}) };

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json({ error: "Manda uma ideia bruta primeiro." }, { status: 400 });
    }

    const userMessage = refineInstruction
      ? `Ideia bruta: "${idea.trim()}"\n\nINSTRUÇÃO DE REFINO: ${refineInstruction}\n\nGere a nova versão aplicando o refino e respeitando todas as configurações avançadas.`
      : `Ideia bruta: "${idea.trim()}"\n\nGere o post seguindo TODAS as configurações avançadas e o Founder DNA.`;

    const systemPrompt = buildSystemPrompt(modes || [], neuralContext, founderDNA, pillar, advancedConfig);
    const temperature = temperatureFor(advancedConfig.creativeVariation);
    const client = getClient(apiKey);

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: GenerateResult;
    try {
      const tmp = JSON.parse(raw) as { hook?: string; post?: string; cta?: string | null };
      parsed = {
        hook: tmp.hook ?? "",
        post: tmp.post ?? "",
        cta: shouldOmitCTA(advancedConfig) ? null : tmp.cta ?? null,
      };
    } catch {
      return NextResponse.json({ error: "Erro ao processar resposta. Tenta de novo." }, { status: 500 });
    }

    // hardLimit: 1 retry se fora do range
    if (advancedConfig.hardLimit && !isPostInRange(parsed.post, advancedConfig)) {
      const retry = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 2048,
        temperature: Math.max(0.3, temperature - 0.3),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: raw },
          { role: "user", content: buildRetryMessage(advancedConfig, parsed.post.length) },
        ],
      });

      const retryRaw = retry.choices[0]?.message?.content ?? "";
      try {
        const tmp = JSON.parse(retryRaw) as { hook?: string; post?: string; cta?: string | null };
        parsed = {
          hook: tmp.hook ?? parsed.hook,
          post: tmp.post ?? parsed.post,
          cta: shouldOmitCTA(advancedConfig) ? null : tmp.cta ?? parsed.cta,
        };
      } catch {
        // mantém o original se o retry falhar de parsear
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generate error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
