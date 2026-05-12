import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { GeneratedPost, ReferenceInput, RefineAction } from "@/lib/inspiration/types";
import { buildRefineSystemPrompt, buildRefineUserMessage } from "@/lib/inspiration/prompts/refine";
import { LINKEDIN_MAX_CHARS, combinedLength } from "@/lib/advanced-config/defaults";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function smartTruncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const paraBreak = slice.lastIndexOf("\n\n");
  if (paraBreak > maxChars * 0.7) return slice.slice(0, paraBreak).trimEnd();
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf(".\n"),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? ")
  );
  if (sentenceEnd > maxChars * 0.7) return slice.slice(0, sentenceEnd + 1);
  return slice.trimEnd();
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

    // LinkedIn char cap — fallback programático
    const combined = combinedLength(refined.hook, refined.post, refined.cta);
    if (combined > LINKEDIN_MAX_CHARS) {
      const reserve = (refined.hook?.length ?? 0) + (refined.cta ? refined.cta.length + 4 : 0) + 4;
      const allowedPostChars = Math.max(200, LINKEDIN_MAX_CHARS - reserve);
      refined.post = smartTruncate(refined.post, allowedPostChars);
      refined.wordCount = countWords(refined.post);
    }

    return NextResponse.json(refined);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
