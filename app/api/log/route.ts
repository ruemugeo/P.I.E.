import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Initialize with Stable v1 API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function fetchWithRetry(apiCall: () => Promise<any>, maxRetries = 3, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if ((error.status === 503 || error.status === 429) && i < maxRetries - 1) {
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        throw error;
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'No content' }, { status: 400 });

    // 1. AI Analysis (Category & Tasks)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });
    const prompt = `Analyze: "${content}". Return strictly JSON: {"category": "One word", "sentiment": "word+emoji", "tasks": [{"title": "Action", "priority": "high|medium|low"}]}`;
    
    const result = await fetchWithRetry(() => model.generateContent(prompt));
    const aiResponse = JSON.parse(result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim());

    // 2. Vector Embedding
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" }, { apiVersion: 'v1' });
    
    const embeddingResult = await fetchWithRetry(() => 
      embeddingModel.embedContent({
        content: { role: "user", parts: [{ text: content }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768
      } as any)
    );
    const embedding = embeddingResult.embedding.values;

    const supabase = getSupabase();
    
    // 3. Insert Thought
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

    // 4. Insert Tasks
    if (aiResponse.tasks && aiResponse.tasks.length > 0) {
      await supabase.from('tasks').insert(aiResponse.tasks.map((t: any) => ({
        title: t.title, 
        priority: t.priority || 'medium', 
        status: 'todo', 
        thought_id: thoughtData.id
      })));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('🔥 LOG ROUTE FATAL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}