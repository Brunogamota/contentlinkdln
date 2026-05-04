import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { ReferenceInput, FullAnalysis } from "@/lib/inspiration/types";
import { buildAnalyzeSystemPrompt, buildAnalyzeUserMessage } from "@/lib/inspiration/prompts/analyze";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "API key não configurada." }, { status: 401 });

  try {
    const body = (await request.json()) as { reference?: ReferenceInput };
    const reference = body.reference;
    if (!reference) return NextResponse.json({ error: "reference obrigatório." }, { status: 400 });
    const text = reference.extractedText || reference.rawContent;
    if (!text || text.trim().length < 30) {
      return NextResponse.json(
        { error: "Referência muito curta. Cole pelo menos 30 caracteres do post original." },
        { status: 400 }
      );
    }

    const completion = await getClient(apiKey).chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildAnalyzeSystemPrompt() },
        { role: "user", content: buildAnalyzeUserMessage(reference) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: FullAnalysis;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Falha ao processar análise." }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
