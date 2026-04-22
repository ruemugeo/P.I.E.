import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. Embed query
    const embeddingResult = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: message,
      config: {
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 3072
      }
    });

    const supabase = getSupabase();

    // 2. Vector Search
    const { data: thoughts, error: searchError } = await supabase.rpc('match_thoughts', { 
      query_embedding: embeddingResult.embeddings[0].values, 
      match_threshold: 0.3, 
      match_count: 10 
    });

    if (searchError) throw searchError;

    // 3. Generate Answer
    const context = thoughts?.map((t: any) => `(${t.category}) ${t.content}`).join('\n') || 'No context.';
    
    for (const modelName of CHAT_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Context: ${context}\n\nUser: ${message}`
        });
        return NextResponse.json({ reply: response.text });
      } catch (error) {
        console.error(`🔥 CHAT ERROR with model ${modelName}:`, error);
      }
    }

    return NextResponse.json({ reply: "Sorry, I couldn't generate a response." });
  } catch (error: any) {
    console.error('🔥 CHAT ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}