import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { GeneratedPost, ReferenceInput, RefineAction } from "@/lib/inspiration/types";
import { buildRefineSystemPrompt, buildRefineUserMessage } from "@/lib/inspiration/prompts/refine";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "API key não configurada." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      post?: GeneratedPost;
      action?: RefineAction;
      reference?: ReferenceInput;
    };

    const { post, action, reference } = body;
    if (!post || !action) {
      return NextResponse.json({ error: "post e action obrigatórios." }, { status: 400 });
    }

    const completion = await getClient(apiKey).chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 1.0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildRefineSystemPrompt() },
        { role: "user", content: buildRefineUserMessage(post, action, reference) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let refined: GeneratedPost;
    try {
      refined = JSON.parse(raw) as GeneratedPost;
    } catch {
      return NextResponse.json({ error: "Falha ao processar refino." }, { status: 500 });
    }

    refined.wordCount = countWords(refined.post);
    return NextResponse.json(refined);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
