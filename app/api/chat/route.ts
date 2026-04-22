import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. Embed user query (768 Dimensions)
// 1. Initialize the NEW stable model
const embeddingModel = genAI.getGenerativeModel(
  { model: "gemini-embedding-2" }, // This is the 2026 winner
  { apiVersion: 'v1' }
);

// 2. Embed with the "Matryoshka" dimension lock
const embeddingResult = await embeddingModel.embedContent({
  content: { 
    role: "user", 
    parts: [{ text: content }] // Use 'message' in chat/route.ts
  },
  taskType: "RETRIEVAL_QUERY" as any, // Use "RETRIEVAL_QUERY" in chat/route.ts
  outputDimensionality: 768 // 👈 MANDATORY: Forces 3072 down to 768
} as any);

const embedding = embeddingResult.embedding.values;
    const supabase = getSupabase();

    // 2. Vector Search
    const { data: thoughts, error: searchError } = await supabase.rpc('match_thoughts', { 
      query_embedding: embeddingResult.embedding.values, 
      match_threshold: 0.3, 
      match_count: 10 
    });

    if (searchError) throw searchError;

    // 3. Generate Answer
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });
    const context = thoughts?.map((t: any) => `(${t.category}) ${t.content}`).join('\n') || 'No context.';
    
    const result = await model.generateContent(`Context: ${context}\n\nUser: ${message}`);

    return NextResponse.json({ reply: result.response.text() });
  } catch (error: any) {
    console.error('🔥 CHAT ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}