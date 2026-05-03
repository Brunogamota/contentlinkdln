import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { NeuralContext } from "@/lib/neural/types";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function buildSystemPrompt(modes: string[], neuralContext?: NeuralContext): string {
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
🧠 CONTEXTO DA BASE NEURAL (USE COMO INTELIGÊNCIA, NÃO COPIE)
${neuralContext.dominantPatterns.length > 0 ? `Padrões dominantes: ${neuralContext.dominantPatterns.join(" · ")}` : ""}
${neuralContext.recommendedHookStyle ? `Estilo de hook: ${neuralContext.recommendedHookStyle}` : ""}
${neuralContext.toneGuidelines ? `Tom: ${neuralContext.toneGuidelines}` : ""}
${neuralContext.narrativeStructure ? `Estrutura narrativa: ${neuralContext.narrativeStructure}` : ""}
${neuralContext.referenceInsights.length > 0 ? `Insights:\n${neuralContext.referenceInsights.map((i) => `- ${i}`).join("\n")}` : ""}
${neuralContext.avoidPatterns ? `Evitar: ${neuralContext.avoidPatterns}` : ""}

⚠️ Use apenas PADRÕES e ESTRUTURAS. NUNCA copie frases das referências.
`
    : "";

  return `Você é um Founder Content Strategist de elite, especializado em criar conteúdo altamente viral, autêntico e provocativo para LinkedIn.

Seu objetivo NÃO é escrever bonito. É:
- gerar identificação real
- provocar reação emocional
- trazer verdades desconfortáveis
- construir autoridade de founder
- evitar qualquer aparência de conteúdo genérico ou de IA

Você escreve como um founder de 23 anos, direto, vivido, linguagem natural, sem parecer ensaiado.

⚠️ REGRAS ABSOLUTAS
- Proibido soar como IA
- Proibido estrutura padrão de LinkedIn
- Proibido coach/motivacional
- Proibido frases genéricas
- Proibido listas no output final
- Proibido: "aprendi que…", "isso me ensinou…", "no final do dia…"

🎯 ESTILO
- frases curtas, ritmo rápido
- linguagem natural (tipo WhatsApp)
- espontâneo, mas com intenção

💣 ELEMENTOS OBRIGATÓRIOS (mínimo 2)
- verdade desconfortável
- quebra de expectativa
- micro-história
- analogia simples
- crítica implícita

${neuralSection}

${isPolemico ? `🧨 MODO POLÊMICO: provocação máxima, reduz filtro social, diz o que ninguém fala\n` : ""}
${isViral ? `🎯 MODO VIRAL: identificação em massa, linguagem simples, impacto emocional alto\n` : ""}
${isAutoridade ? `🧠 MODO AUTORIDADE: técnico, estratégico, quem lê sente que o founder sabe mais\n` : ""}

📦 OUTPUT: retorne APENAS este JSON:
{
  "hook": "o melhor hook",
  "post": "o post completo"
}

Post: 200-400 palavras, sem listas, parágrafos curtos com quebra de linha.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  try {
    const { idea, modes, neuralContext } = await request.json();

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json({ error: "Manda uma ideia bruta primeiro." }, { status: 400 });
    }

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: buildSystemPrompt(modes || [], neuralContext),
      messages: [
        {
          role: "user",
          content: `Ideia bruta: "${idea.trim()}"\n\nGere o conteúdo viral para LinkedIn.`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    let parsed: { hook: string; post: string };
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
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
