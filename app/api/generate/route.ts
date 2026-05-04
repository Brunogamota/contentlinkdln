import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { NeuralContext } from "@/lib/neural/types";
import { FounderDNA, ContentPillar } from "@/lib/founder-dna/types";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function buildDNASection(dna?: FounderDNA): string {
  if (!dna || !dna.companyName) return "";
  return `
🧬 FOUNDER DNA (CALIBRA TUDO PRO ICP)

EMPRESA: ${dna.companyName}${dna.companyDescription ? ` — ${dna.companyDescription}` : ""}
${dna.whatYouSell ? `O QUE VENDE: ${dna.whatYouSell}` : ""}

🎯 ICP — ÚNICA PESSOA QUE IMPORTA:
- Cargo: ${dna.icpRole}
- Dor que faz acordar de noite: ${dna.icpPain}
${dna.icpDecisionMaker ? `- Quem decide compra: ${dna.icpDecisionMaker}` : ""}

⚠️ TODA palavra do post precisa ressoar com ${dna.icpRole}. Se ${dna.icpRole} não engaja, o post FALHOU — não importa quanto alcance teve.

VOCÊ (founder):
${dna.founderStory}

DIFERENCIAL: ${dna.uniqueDifferentiator}
${dna.voiceTone ? `TOM: ${dna.voiceTone}` : ""}
${dna.publicEnemies && dna.publicEnemies.length > 0
    ? `INIMIGOS PÚBLICOS (use como combustível): ${dna.publicEnemies.join(" · ")}`
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
  neuralContext?: NeuralContext,
  dna?: FounderDNA,
  pillar?: ContentPillar
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

  return `Você é um Founder Content Strategist especializado em FOUNDER-LED GROWTH.

Seu trabalho NÃO é fazer post viral genérico. É:
- Atrair o ICP do founder (quem PAGA por ele)
- Construir autoridade no nicho específico
- Mover o leitor pra ação concreta (DM, comentário qualificado, follow estratégico)
- Fazer o ICP pensar "esse founder entende o problema"

${buildDNASection(dna)}
${buildPillarSection(pillar)}
${neuralSection}

⚠️ REGRAS ABSOLUTAS
- Proibido soar como IA
- Proibido coach/motivacional
- Proibido frases genéricas tipo "no final do dia", "isso me ensinou"
- Proibido listas de bullets no output final (use parágrafos curtos)
- Proibido jargão de management de livro
- Frases curtas, ritmo rápido, linguagem natural

💣 ELEMENTOS OBRIGATÓRIOS (mínimo 2)
- verdade desconfortável que SÓ alguém que opera saberia
- crítica implícita ao que o ICP faz errado hoje
- micro-história ou número concreto
- analogia simples
- quebra de expectativa

${isPolemico ? `🧨 POLÊMICO: provocação máxima, reduz filtro social, diz o que ninguém fala\n` : ""}
${isViral ? `🎯 VIRAL: identificação em massa do ICP, linguagem simples, impacto emocional\n` : ""}
${isAutoridade ? `🧠 AUTORIDADE: técnico, estratégico, ICP sente que você sabe mais\n` : ""}

🎯 CTA OBRIGATÓRIO (separado do post)
Toda geração termina com um CTA orgânico e magnético. Tipos válidos:
- LEAD MAGNET: "comenta 'X' que te mando Y" (Y = template, framework, planilha real que existe)
- DM DIRETO: "se ${dna?.icpRole || "founder"} tá nessa, me chama no DM" (situação específica do ICP)
- ENGAGEMENT LOOP: "concorda? me fala nos comentários como você lida com isso"
- POLLING: "qual lado você tá? A ou B?"

PROIBIDO no CTA:
- "siga pra mais conteúdo"
- "compre agora"
- "link na bio"
- coach/genérico

📦 OUTPUT JSON (apenas isso):
{
  "hook": "frase de abertura única, magnética, que para o scroll do ICP",
  "post": "corpo do post 200-400 palavras, parágrafos curtos com quebra de linha, SEM o CTA no final",
  "cta": "1-2 frases curtas que movem pra ação"
}`;
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
    const { idea, modes, neuralContext, founderDNA, pillar, refineInstruction } = await request.json();

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json({ error: "Manda uma ideia bruta primeiro." }, { status: 400 });
    }

    const userMessage = refineInstruction
      ? `Ideia bruta: "${idea.trim()}"\n\nINSTRUÇÃO DE REFINO: ${refineInstruction}\n\nGere a nova versão aplicando o refino.`
      : `Ideia bruta: "${idea.trim()}"\n\nGere o conteúdo pro LinkedIn.`;

    const completion = await getClient(apiKey).chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(modes || [], neuralContext, founderDNA, pillar) },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: { hook: string; post: string; cta: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Erro ao processar resposta. Tenta de novo." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generate error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
