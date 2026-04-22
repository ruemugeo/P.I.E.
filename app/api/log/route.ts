import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 🪜 THE FALLBACK LADDER
// We list models from "Best" to "Fastest/Available"
const CHAT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

async function generateWithFallback(prompt: string) {
  let lastError = null;

  for (const modelName of CHAT_MODELS) {
    try {
      console.log(`🤖 Attempting with: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // If we got here, it worked! Return the text and the model name
      return { 
        data: JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim()),
        activeModel: modelName 
      };
    } catch (error: any) {
      lastError = error;
      // If the error is Quota (429) or Overloaded (503), try the next model
      if (error.status === 429 || error.status === 503) {
        console.warn(`⚠️ ${modelName} failed (Quota/Busy). Switching to next model...`);
        continue; 
      }
      // If it's a different error (like a syntax error), stop and throw
      throw error;
    }
  }
  throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'No content' }, { status: 400 });

    // 1. AI Analysis with Fallback
    const prompt = `Analyze: "${content}". Return strictly JSON: {"category": "One word", "sentiment": "word+emoji", "tasks": [{"title": "Action", "priority": "high|medium|low"}]}`;
    const { data: aiResponse, activeModel } = await generateWithFallback(prompt);

    // 2. Vector Embedding (Note: Embedding models usually have separate, higher quotas)
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" }, { apiVersion: 'v1' });
    const embeddingResult = await embeddingModel.embedContent({
      content: { role: "user", parts: [{ text: content }] },
      taskType: "RETRIEVAL_DOCUMENT" as any,
      outputDimensionality: 768
    } as any);
    const embedding = embeddingResult.embedding.values;

    const supabase = getSupabase();
    
    const { data: thoughtData, error: thoughtError } = await supabase
      .from('thoughts')
      .insert([{ 
        content, 
        category: aiResponse.category || 'Log', 
        sentiment: aiResponse.sentiment || 'neutral', 
        embedding 
      }])
      .select().single();

    if (thoughtError) throw thoughtError;

    if (aiResponse.tasks?.length > 0) {
      await supabase.from('tasks').insert(aiResponse.tasks.map((t: any) => ({
        title: t.title, priority: t.priority, status: 'todo', thought_id: thoughtData.id
      })));
    }

    // Return the success + which model actually did the work
    return NextResponse.json({ 
      success: true, 
      modelUsed: activeModel 
    });

  } catch (error: any) {
    console.error('🔥 FATAL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}