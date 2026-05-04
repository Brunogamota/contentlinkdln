import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { ReferenceInput, FullAnalysis, AngleOption } from "@/lib/inspiration/types";
import { buildAnglesSystemPrompt, buildAnglesUserMessage } from "@/lib/inspiration/prompts/angles";
import { newAngleId } from "@/lib/inspiration/store";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "API key não configurada." }, { status: 401 });

  try {
    const body = (await request.json()) as { reference?: ReferenceInput; analysis?: FullAnalysis };
    if (!body.reference || !body.analysis) {
      return NextResponse.json({ error: "reference e analysis são obrigatórios." }, { status: 400 });
    }

    const completion = await getClient(apiKey).chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 1.0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildAnglesSystemPrompt() },
        { role: "user", content: buildAnglesUserMessage(body.analysis, body.reference) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: { angles?: Omit<AngleOption, "id">[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Falha ao processar ângulos." }, { status: 500 });
    }

    const angles: AngleOption[] = (parsed.angles || []).map((a) => ({ ...a, id: newAngleId() }));
    return NextResponse.json({ angles });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
