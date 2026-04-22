import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// New Initialization Syntax
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

async function generateWithFallback(prompt: string) {
  let lastError = null;

  for (const modelName of CHAT_MODELS) {
    try {
      // New generation syntax
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          // The new SDK natively supports enforcing JSON!
          responseMimeType: "application/json",
          systemInstruction: 'Output only valid JSON: {"category": "One word", "sentiment": "word+emoji", "tasks": []}'
        }
      });
      
      const text = response.text || "{}";
      
      return { 
        data: JSON.parse(text),
        activeModel: modelName 
      };
    } catch (e: any) {
      lastError = e;
      if (e.status === 429 || e.status === 503) continue;
      throw e; 
    }
  }
  throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    // 1. Analysis
    const { data: aiResponse, activeModel } = await generateWithFallback(`Analyze: ${content}`);

    // 2. Embedding using the new SDK syntax and the 004 model
    const embeddingResult = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: content,
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768
      }
    });

    const supabase = getSupabase();
    
    // The embedding values are accessed slightly differently in the new SDK
    const { data: thought, error } = await supabase.from('thoughts').insert([{
      content,
      category: aiResponse.category || 'Log',
      sentiment: aiResponse.sentiment || 'neutral',
      embedding: embeddingResult.embeddings[0].values
    }]).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, modelUsed: activeModel });
  } catch (error: any) {
    console.error('🔥 LOG ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}