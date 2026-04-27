import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const ANALYSIS_MODELS = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];

async function analyzeWithFallback(prompt: string) {
  let lastError: Error | null = null;

  for (const modelName of ANALYSIS_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return response.text || '';
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error('Unknown Gemini error');
      console.error(`Fallback: ${modelName} failed, trying next...`);
      continue;
    }
  }

  throw new Error(lastError?.message || 'All AI models are currently offline.');
}

export async function POST(req: Request) {
  try {
    const { content, lens, id } = await req.json();

    const prompts = {
      angel: 'Identify the growth mindset, positive connections, and future potential in this thought.',
      devil: 'Critically analyze this thought for risks, logical flaws, and blind spots.',
      zap: 'Connect this thought to an unrelated scientific or artistic field for a new insight.',
    };

    const selectedPrompt = prompts[lens as keyof typeof prompts] || prompts.zap;
    const finalPrompt = `${selectedPrompt}\n\n"${content}"`;

    const analysis = await analyzeWithFallback(finalPrompt);

    await supabase
      .from('thoughts')
      .update({
        metadata: { [`analysis_${lens}`]: analysis },
      })
      .eq('id', id);

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
