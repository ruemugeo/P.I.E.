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
      console.log(`🤖 Fallback check: Trying ${modelName}...`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        // 🛡️ SYSTEM INSTRUCTION: This tells the AI what its "job" is.
        systemInstruction: "You are a data extraction engine. You must output ONLY valid raw JSON. Do not include any conversational text, explanations, or markdown code blocks.",
      }, { apiVersion: 'v1' });

      // We pass the prompt directly. Because of the System Instruction, 
      // the model won't say "Here is your JSON".
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Clean up any rogue backticks just in case the AI slips up
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      return { 
        data: JSON.parse(cleanJson),
        activeModel: modelName 
      };
    } catch (e: any) {
      // 429 = Quota, 503 = Server Busy
      if (e.status === 429 || e.status === 503) {
        console.warn(`⚠️ ${modelName} unavailable, falling back...`);
        continue;
      }
      throw e; // If it's a real code error, stop here
    }
  }
  throw new Error("All Gemini models are currently at capacity.");
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