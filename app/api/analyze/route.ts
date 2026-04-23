import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // FIX FOR REFERENCE ERROR
import { GoogleGenAI } from '@google/genai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const ANALYSIS_MODELS = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];

async function analyzeWithFallback(prompt: string) {
  for (const modelName of ANALYSIS_MODELS) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.error(`Fallback: ${modelName} failed, trying next...`);
      continue;
    }
  }
  throw new Error("All AI models are currently offline.");
}

export async function POST(req: Request) {
  try {
    const { content, lens, id } = await req.json();

    const prompts = {
      angel: "Identify the growth mindset, positive connections, and future potential in this thought.",
      devil: "Critically analyze this thought for risks, logical flaws, and blind spots.",
      zap: "Connect this thought to an unrelated scientific or artistic field for a new insight."
    };

    const selectedPrompt = prompts[lens as keyof typeof prompts] || prompts.zap;
    const finalPrompt = `${selectedPrompt}\n\n"${content}"`;

    const analysis = await analyzeWithFallback(finalPrompt);

    // PIE LOGIC: Store the analysis back in the database metadata
    await supabase.from('thoughts').update({
      metadata: { [`analysis_${lens}`]: analysis }
    }).eq('id', id);

    return NextResponse.json({ analysis });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}