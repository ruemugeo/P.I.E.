import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables!");
  return createClient(url, key);
};

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
          systemInstruction: `
            Analyze the input and return ONLY a JSON object exactly like this:
            {
              "category": "One word (e.g., Work, Health, Idea, Personal)",
              "sentiment": "An emoji + word (e.g., 🚀 Excited)",
              "tasks": ["List of actionable items if any, otherwise empty array"],
              "summary": "A 5-word snappy summary"
            }
          `
        }
      });
      
      const parsedData = JSON.parse(response.text || "{}");
      return { data: parsedData, activeModel: modelName };
      
    } catch (e: any) {
      lastError = e;
      if (e.status === 429 || e.status === 503) continue;
      // Don't throw immediately, let the loop try the fallback model
    }
  }
  throw new Error(`AI Failure: ${lastError?.message || "Unknown Error"}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = body?.content;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // 1. Ask AI to analyze and extract tasks
    const { data: aiResponse, activeModel } = await generateWithFallback(`Analyze: ${content}`);

    // 2. Generate the 3072-dimension Vector Embedding
    const embeddingResult = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: content,
      config: { taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: 3072 }
    });

    const supabase = getSupabase();

    // 3. Save the Thought to the database
    const { data: thoughtData, error: thoughtError } = await supabase
      .from('thoughts')
      .insert([{
        content,
        category: aiResponse.category || 'Thought',
        sentiment: aiResponse.sentiment || 'Neutral',
        embedding: embeddingResult.embeddings[0].values
      }])
      .select()
      .single();

    if (thoughtError) throw thoughtError;

    // 4. Auto-route extracted tasks to the Tasks table!
    if (aiResponse.tasks && Array.isArray(aiResponse.tasks) && aiResponse.tasks.length > 0) {
      const taskInserts = aiResponse.tasks.map((taskStr: string) => ({
        title: taskStr,
        priority: 'medium',
        status: 'todo'
      }));
      
      const { error: taskError } = await supabase.from('tasks').insert(taskInserts);
      if (taskError) console.error("Failed to insert tasks:", taskError);
    }

    return NextResponse.json({ success: true, model: activeModel, thought: thoughtData });
    
  } catch (error: any) {
    console.error('🔥 LOG ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}