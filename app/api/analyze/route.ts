import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Perform a deep analysis on: "${content}". Format as JSON: {"category": "...", "steps": []}`,
      config: { responseMimeType: "application/json" }
    });

    return NextResponse.json({ analysis: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}