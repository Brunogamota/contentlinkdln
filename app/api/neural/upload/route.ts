import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { NeuralReference, StrategicAnalysis, ReferenceScore } from "@/lib/neural/types";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const ANALYSIS_PROMPT = `Você é um estrategista de conteúdo especialista em LinkedIn viral.
Analise essa imagem de referência de conteúdo e extraia uma análise estratégica profunda.

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "extractedText": "texto visível na imagem se houver",
  "strategicAnalysis": {
    "contentType": "tipo do conteúdo (ex: depoimento, polêmico, bastidor, opinião forte, dado surpreendente)",
    "mainSubject": "assunto principal em uma frase curta",
    "identifiedHook": "o gancho/abertura identificado",
    "dominantEmotion": "emoção dominante (ex: indignação, identificação, admiração, surpresa, medo)",
    "toneOfVoice": "tom de voz (ex: direto e cru, reflexivo, provocativo, conversacional)",
    "narrativeStructure": "estrutura narrativa (ex: problema→agravante→revelação, observação→pattern→crítica)",
    "writingStyle": "estilo de escrita (ex: frases curtas e impactantes, ritmo rápido, estilo WhatsApp)",
    "provocationType": 7,
    "authorityLevel": 6,
    "languagePatterns": ["padrão 1", "padrão 2", "padrão 3"],
    "psychologicalTriggers": ["gatilho 1", "gatilho 2"],
    "whyItWorks": "razão principal que faz esse conteúdo funcionar",
    "reusableElements": ["elemento reutilizável 1", "elemento reutilizável 2"],
    "strategicTags": ["tag1", "tag2", "tag3", "tag4"]
  },
  "scores": {
    "virality": 75,
    "authority": 60,
    "controversy": 80,
    "clarity": 85,
    "authenticity": 70,
    "adaptationPotential": 90
  },
  "tags": ["tag geral 1", "tag geral 2", "tag geral 3"]
}

Scores são de 0-100. provocationType e authorityLevel são de 1-10. Seja específico e estratégico.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WEBP ou GIF." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem muito grande. Máximo 5MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: {
      extractedText: string;
      strategicAnalysis: StrategicAnalysis;
      scores: ReferenceScore;
      tags: string[];
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Erro ao processar análise. Tenta de novo." }, { status: 500 });
    }

    const reference: NeuralReference = {
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      imageUrl: dataUrl,
      originalFileName: file.name,
      extractedText: parsed.extractedText ?? "",
      strategicAnalysis: parsed.strategicAnalysis,
      tags: parsed.tags ?? [],
      scores: parsed.scores,
      createdAt: new Date().toISOString(),
      isStrongReference: false,
    };

    return NextResponse.json(reference);
  } catch (error) {
    console.error("Neural upload error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
