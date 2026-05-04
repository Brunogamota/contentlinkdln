import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { SavedInspiration, AngleOption } from "@/lib/inspiration/types";
import {
  buildSynthesizeSystemPrompt,
  buildSynthesizeUserMessage,
  AggregateSynthesis,
} from "@/lib/inspiration/prompts/synthesize";
import { newAngleId } from "@/lib/inspiration/store";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "API key não configurada." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      topic?: string;
      desiredAngle?: string;
      categories?: string[];
      inspirations?: SavedInspiration[];
    };

    if (!body.topic || !body.inspirations || body.inspirations.length === 0) {
      return NextResponse.json(
        { error: "topic e inspirations (pelo menos 1) obrigatórios." },
        { status: 400 }
      );
    }

    const completion = await getClient(apiKey).chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 0.95,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSynthesizeSystemPrompt() },
        {
          role: "user",
          content: buildSynthesizeUserMessage({
            topic: body.topic,
            desiredAngle: body.desiredAngle,
            categories: body.categories ?? [],
            inspirations: body.inspirations,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: AggregateSynthesis;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Falha ao processar síntese." }, { status: 500 });
    }

    const angles: AngleOption[] = (parsed.angles || []).map((a) => ({
      ...a,
      id: newAngleId(),
    }));

    return NextResponse.json({ ...parsed, angles });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
