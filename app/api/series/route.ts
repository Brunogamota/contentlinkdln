import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { FounderDNA } from "@/lib/founder-dna/types";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function buildDNASection(dna?: FounderDNA): string {
  if (!dna || !dna.companyName) return "";
  return `
🧬 FOUNDER DNA
EMPRESA: ${dna.companyName} — ${dna.companyDescription}
VENDE: ${dna.whatYouSell}
ICP: ${dna.icpRole}
DOR DO ICP: ${dna.icpPain}
HISTÓRIA: ${dna.founderStory}
DIFERENCIAL: ${dna.uniqueDifferentiator}
TOM: ${dna.voiceTone || "direto, cru, sem coach"}
${dna.publicEnemies?.length > 0 ? `INIMIGOS: ${dna.publicEnemies.join(" · ")}` : ""}
`;
}

const SYSTEM_PROMPT = (dna?: FounderDNA, topic?: string) => `Você é um Founder Content Strategist especializado em FOUNDER-LED GROWTH no LinkedIn.

Sua missão: criar uma SÉRIE NARRATIVA de 7 posts que constrói autoridade, atrai ICP e gera pipeline ao longo de 2 semanas.

${buildDNASection(dna)}

TÓPICO CENTRAL DA SÉRIE: ${topic}

🎯 ESTRUTURA OBRIGATÓRIA DA SÉRIE (7 posts conectados):
1. AGITAÇÃO — escancara o problema do ICP de forma incômoda (pilar: polemica)
2. CONTRARIAN — apresenta sua tese contra o que o mercado faz (pilar: filosofia)
3. CASE — mostra um caso concreto que prova a tese (pilar: case)
4. BASTIDOR — mostra a parte humana/falha do processo (pilar: bastidor)
5. APROFUNDAMENTO — quebra um ponto técnico que ninguém mais explica (pilar: filosofia)
6. POLÊMICA — provocação direta a um inimigo público específico (pilar: polemica)
7. CONVITE — fecha a série convidando o ICP a agir (pilar: case)

⚠️ REGRAS
- Cada post conecta no anterior (referência sutil opcional, sem ser óbvio)
- Cada post FUNCIONA SOZINHO mesmo se for o primeiro que alguém lê
- Ritmo: frases curtas, parágrafos curtos, linguagem natural
- Cada post tem CTA orgânico próprio (DM, comentário, magnet)
- Sem coach, sem genérico, sem soar IA

📦 OUTPUT JSON:
{
  "narrativeArc": "1 frase explicando o arco da série",
  "posts": [
    { "position": 1, "pillarId": "polemica", "hook": "...", "post": "...", "cta": "..." },
    { "position": 2, "pillarId": "filosofia", "hook": "...", "post": "...", "cta": "..." },
    ... 7 posts no total
  ]
}

Cada post: 200-350 palavras. SEM bullets. Parágrafos curtos com quebra de linha.`;

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key não configurada." },
      { status: 401 }
    );
  }

  try {
    const { topic, founderDNA } = await request.json();

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Defina o tópico da série." }, { status: 400 });
    }

    const completion = await getClient(apiKey).chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT(founderDNA, topic.trim()) },
        { role: "user", content: `Gere a série de 7 posts sobre: "${topic.trim()}"` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: { narrativeArc: string; posts: Array<{ position: number; pillarId: string; hook: string; post: string; cta: string }> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Erro ao processar a série." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Series error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
