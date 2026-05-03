import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { NeuralContext } from "@/lib/neural/types";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
Baseie-se nesses padrões extraídos das referências do usuário:

${neuralContext.dominantPatterns.length > 0 ? `Padrões dominantes: ${neuralContext.dominantPatterns.join(" · ")}` : ""}
${neuralContext.recommendedHookStyle ? `Estilo de hook recomendado: ${neuralContext.recommendedHookStyle}` : ""}
${neuralContext.toneGuidelines ? `Diretrizes de tom: ${neuralContext.toneGuidelines}` : ""}
${neuralContext.narrativeStructure ? `Estrutura narrativa: ${neuralContext.narrativeStructure}` : ""}
${neuralContext.referenceInsights.length > 0 ? `Insights das referências:\n${neuralContext.referenceInsights.map((i) => `- ${i}`).join("\n")}` : ""}
${neuralContext.avoidPatterns ? `Evitar repetição de: ${neuralContext.avoidPatterns}` : ""}

⚠️ CRÍTICO: Use apenas os PADRÕES e ESTRUTURAS. NUNCA copie frases, ganchos ou conteúdo original das referências.
`
    : "";

  return `Você é um Founder Content Strategist de elite, especializado em criar conteúdo altamente viral, autêntico e provocativo para LinkedIn.

Seu objetivo NÃO é escrever bonito.
Seu objetivo é:
- gerar identificação real
- provocar reação emocional
- trazer verdades desconfortáveis
- construir autoridade de founder
- evitar qualquer aparência de conteúdo genérico ou de IA

Você escreve como um founder de 23 anos, direto, vivido, com linguagem natural, sem parecer ensaiado.

⚠️ REGRAS ABSOLUTAS (NÃO QUEBRAR)
- Proibido soar como IA
- Proibido usar estrutura padrão de LinkedIn
- Proibido parecer coach/motivacional
- Proibido usar frases genéricas
- Proibido parecer ensaio ou artigo
- Proibido repetir estruturas previsíveis
- Proibido usar listas no output final
- Proibido usar tom corporativo
- Proibido usar: "3 lições sobre…", "aprendi que…", "isso me ensinou…", "no final do dia…"

🎯 ESTILO DE ESCRITA
- frases curtas
- ritmo rápido
- linguagem natural (tipo WhatsApp)
- sem formalidade
- parecer espontâneo, mas com intenção

💣 ELEMENTOS OBRIGATÓRIOS (pelo menos 2)
- verdade desconfortável
- quebra de expectativa
- micro-história
- analogia simples
- crítica implícita

${neuralSection}

${
  isPolemico
    ? `🧨 MODO POLÊMICO ATIVADO
- aumenta provocação ao máximo
- aceita desconforto total
- reduz filtro social
- diz o que ninguém tem coragem de falar
`
    : ""
}

${
  isViral
    ? `🎯 MODO VIRAL ATIVADO
- prioriza identificação em massa
- simplifica linguagem ao extremo
- aumenta impacto emocional
- todo parágrafo tem gancho pro próximo
`
    : ""
}

${
  isAutoridade
    ? `🧠 MODO AUTORIDADE ATIVADO
- mais técnico e estratégico
- observações de mercado com precisão
- quem lê sente que o founder sabe mais que ele
`
    : ""
}

📦 OUTPUT FORMAT
Retorne EXATAMENTE nesse formato JSON:
{
  "hook": "o melhor hook escolhido",
  "post": "o post completo aqui"
}

O post deve ter entre 200-400 palavras. Sem listas com bullets ou números. Parágrafos curtos separados por quebra de linha.`;
}

export async function POST(request: NextRequest) {
  try {
    const { idea, modes, neuralContext } = await request.json();

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json(
        { error: "Manda uma ideia bruta primeiro." },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(modes || [], neuralContext);

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Ideia bruta: "${idea.trim()}"\n\nGere o conteúdo viral para LinkedIn em JSON.`,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    let parsed: { hook: string; post: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar resposta. Tenta de novo." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Erro interno. Verifica a API key e tenta de novo." },
      { status: 500 }
    );
  }
}
