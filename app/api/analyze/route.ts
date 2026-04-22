import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// 🛡️ FIX 1: Prevent Vercel from trying to "pre-render" this API route
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    // 🛡️ FIX 2: Check for API Key inside the handler to avoid build crashes
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    // 🛡️ FIX 3: Use the new class name 'GoogleGenAI'
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Perform a deep analysis on this thought: "${content}". 
                 Categorize it and suggest 3 actionable next steps. 
                 Format as JSON: {"category": "...", "steps": ["...", "...", "..."]}`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return NextResponse.json({ 
      analysis: JSON.parse(response.text || "{}") 
    });

  } catch (error: any) {
    console.error('🔥 ANALYZE ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}