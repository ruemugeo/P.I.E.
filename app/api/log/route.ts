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
  let lastError = null;

  for (const modelName of CHAT_MODELS) {
    try {
      console.log(`🤖 Engine check: Trying ${modelName}...`);
      
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });

      // We combine the instruction and prompt into one clear request.
      // This is the most compatible way across all SDK versions.
      const finalPrompt = `
        INSTRUCTION: You are a JSON-only data extractor. 
        Output ONLY raw JSON. No conversational text.
        
        DATA TO ANALYZE: "${prompt}"
        
        REQUIRED JSON FORMAT: 
        {"category": "One word", "sentiment": "word+emoji", "tasks": []}
      `;

      const result = await model.generateContent(finalPrompt);
      const text = result.response.text().trim();
      
      // Safety: Strip away any markdown code blocks if the AI includes them
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      return { 
        data: JSON.parse(cleanJson),
        activeModel: modelName 
      };
    } catch (e: any) {
      lastError = e;
      // 🛡️ IMPROVED FALLBACK: 
      // If we hit a 400 (Bad Request), 429 (Quota), or 503 (Busy), try the next model.
      console.warn(`⚠️ ${modelName} failed with status ${e.status}. Error: ${e.message}`);
      continue; 
    }
  }
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    // 1. Analysis
    const { data: aiResponse, activeModel } = await generateWithFallback(`Analyze: ${content}. Return JSON: {"category":"string","sentiment":"string","tasks":[]}`);

    // 2. Embedding (768 Dimensions)
// 1. Initialize the NEW stable model
const embeddingModel = genAI.getGenerativeModel(
  { model: "text-embedding-004" }, // This is the 2026 winner
  { apiVersion: 'v1' }
);

// 2. Embed with the "Matryoshka" dimension lock
const embeddingResult = await embeddingModel.embedContent({
  content: { 
    role: "user", 
    parts: [{ text: content }] // Use 'message' in chat/route.ts
  },
  taskType: "RETRIEVAL_DOCUMENT" as any, // Use "RETRIEVAL_QUERY" in chat/route.ts
  outputDimensionality: 768 // 👈 MANDATORY: Forces 3072 down to 768
} as any);

const embedding = embeddingResult.embedding.values;
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