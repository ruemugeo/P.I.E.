import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Fallback Ladder for Quota Management
const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

async function generateWithFallback(prompt: string) {
  for (const modelName of CHAT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName 
      }, { apiVersion: 'v1' });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          // 🛡️ THIS IS THE CRITICAL ADDITION:
          responseMimeType: "application/json",
        }
      });

      const text = result.response.text().trim();
      
      // Since we forced the MIME type, the text is guaranteed to be JSON
      return { 
        data: JSON.parse(text),
        activeModel: modelName 
      };
    } catch (e: any) {
      if (e.status === 429 || e.status === 503) {
        console.warn(`⚠️ ${modelName} hit quota, trying next...`);
        continue;
      }
      throw e;
    }
  }
  throw new Error("All models hit quota.");
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    // 1. Analysis
    const { data: aiResponse, activeModel } = await generateWithFallback(`Analyze: ${content}. Return JSON: {"category":"string","sentiment":"string","tasks":[]}`);

    // 2. Embedding (768 Dimensions)
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" }, { apiVersion: 'v1' });
    const embeddingResult = await embeddingModel.embedContent({
      content: { role: "user", parts: [{ text: content }] }, // 👈 Keep 'content' here
      taskType: "RETRIEVAL_DOCUMENT" as any,
      outputDimensionality: 768
    } as any);

    const supabase = getSupabase();
    const { data: thought, error } = await supabase.from('thoughts').insert([{
      content,
      category: aiResponse.category,
      embedding: embeddingResult.embedding.values
    }]).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, modelUsed: activeModel });
  } catch (error: any) {
    console.error('🔥 LOG ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}