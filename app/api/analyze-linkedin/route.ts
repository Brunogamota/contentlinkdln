import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { FounderDNA } from "@/lib/founder-dna/types";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function buildDNASection(dna?: FounderDNA): string {
  if (!dna || !dna.companyName) return "";
  return `
🧬 FOUNDER DNA DO USUÁRIO
EMPRESA: ${dna.companyName} — ${dna.companyDescription}
VENDE: ${dna.whatYouSell}
ICP DESEJADO: ${dna.icpRole}
DOR DO ICP: ${dna.icpPain}
DIFERENCIAL: ${dna.uniqueDifferentiator}
${dna.publicEnemies?.length > 0 ? `INIMIGOS: ${dna.publicEnemies.join(", ")}` : ""}
`;
}

const SYSTEM_PROMPT = (dna?: FounderDNA) => `Você é um analista sênior de LinkedIn especializado em founder-led growth.

Sua missão: analisar os posts atuais do founder e devolver uma análise BRUTAL e ACIONÁVEL — não elogio.

${buildDNASection(dna)}

Devolva uma análise estruturada que mostre:
1. O que tá funcionando (padrões repetíveis nos posts que tiveram boa performance, quando informado)
2. O que tá MATANDO o engajamento (padrões ruins recorrentes)
3. Gap entre o conteúdo atual e o ICP desejado (quem ele está atraindo vs quem deveria)
4. Pilares de conteúdo SUB-EXPLORADOS (filosofia, case, polêmica, bastidor — qual falta?)
5. Hooks fracos identificados + 5 hooks fortes alternativos pro mesmo ICP
6. Top 3 ações imediatas pra próxima semana

⚠️ Nada de "parabéns", "ótimo trabalho". Tom direto, cru, founder-pra-founder.

📦 OUTPUT JSON:
{
  "overallScore": 0-100,
  "icpAlignment": 0-100,
  "whatWorks": ["padrão 1", "padrão 2", "padrão 3"],
  "whatKills": ["problema 1", "problema 2", "problema 3"],
  "icpGap": "explicação do gap entre conteúdo atual e ICP desejado",
  "missingPillars": ["pilar negligenciado 1", "pilar negligenciado 2"],
  "weakHooks": ["hook fraco identificado 1", "hook fraco identificado 2"],
  "strongerHooks": ["hook forte alternativo 1", "hook forte alternativo 2", "hook forte alternativo 3", "hook forte alternativo 4", "hook forte alternativo 5"],
  "topActions": ["ação 1 pra próxima semana", "ação 2", "ação 3"],
  "verdict": "veredicto direto em 2-3 frases — o que muda a partir de hoje"
}`;

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json({ error: "API key não configurada." }, { status: 401 });
  }

  try {
    const { posts, founderDNA } = await request.json();

    if (!posts || typeof posts !== "string" || posts.trim().length < 100) {
      return NextResponse.json(
        { error: "Cole pelo menos 1-2 posts seus pra analisar (mínimo 100 caracteres)." },
        { status: 400 }
      );
    }

    const completion = await getClient(apiKey).chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT(founderDNA) },
        {
          role: "user",
          content: `Aqui estão posts recentes do meu LinkedIn (separados por ---). Analise.\n\n${posts.trim()}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Erro ao processar análise." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Analyze error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
