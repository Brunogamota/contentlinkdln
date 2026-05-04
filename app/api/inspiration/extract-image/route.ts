import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

function getClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

const VISION_PROMPT = `Você está extraindo o texto de uma imagem que mostra um post de LinkedIn (ou similar).
Retorne APENAS o texto integral visível. Mantenha quebras de linha. NÃO interprete, NÃO resuma, NÃO traduza.
Se a imagem não tiver texto legível, retorne string vazia.

📦 OUTPUT JSON: { "text": "..." }`;

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json({ error: "API key não configurada." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 });

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem muito grande (máx 5MB)." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const completion = await getClient(apiKey).chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: { text?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Falha ao processar imagem." }, { status: 500 });
    }
    return NextResponse.json({ text: parsed.text ?? "" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
