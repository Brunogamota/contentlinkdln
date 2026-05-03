import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.OPENAI_API_KEY;
  return NextResponse.json({
    hasKey: !!key,
    keyPreview: key ? `${key.slice(0, 7)}...${key.slice(-4)}` : null,
  });
}
