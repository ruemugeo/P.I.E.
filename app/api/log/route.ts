import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

async function generateWithFallback(prompt: string) {
  let lastError = null;
  for (const modelName of CHAT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: 'Output ONLY raw JSON: {"category": "string", "sentiment": "string", "tasks": []}'
        }
      });
      return { data: JSON.parse(response.text || "{}"), activeModel: modelName };
    } catch (e: any) {
      lastError = e;
      if (e.status === 429 || e.status === 503) continue;
      throw e;
    }
  }
  throw new Error(`AI Failure: ${lastError?.message}`);
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const { data: aiResponse, activeModel } = await generateWithFallback(`Analyze: ${content}`);

    const embeddingResult = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: content,
      config: { taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: 768 }
    });

    const supabase = getSupabase();
    const { data, error } = await supabase.from('thoughts').insert([{
      content,
      category: aiResponse.category || 'Thought',
      sentiment: aiResponse.sentiment || 'Neutral',
      embedding: embeddingResult.embeddings[0].values
    }]).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, model: activeModel, data });
  } catch (error: any) {
    console.error('🔥 LOG ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}