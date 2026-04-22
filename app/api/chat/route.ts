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

// 1. Embed user query
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" }, { apiVersion: 'v1' });
    
    // We cast the whole object to 'any' to bypass the local type-check
    const { embedding } = await embeddingModel.embedContent({
      content: { role: "user", parts: [{ text: message }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: 768
    } as any);

    const supabase = getSupabase();

    // 2. Vector Search (Using the match_thoughts function we created in SQL)
    const { data: thoughts, error: searchError } = await supabase.rpc('match_thoughts', { 
      query_embedding: embedding.values, 
      match_threshold: 0.3, // Lowered slightly for better recall
      match_count: 10 
    });

    if (searchError) throw searchError;

    // 3. Fetch current todos for context
    const { data: tasks } = await supabase.from('tasks').select('title, priority').eq('status', 'todo');

    const thoughtsContext = thoughts?.map((t: any) => `(${t.category}) ${t.content}`).join('\n') || 'No memories found.';
    const tasksContext = tasks?.map((t: any) => `-[${t.priority}] ${t.title}`).join('\n') || 'No active tasks.';

    // 4. Generate Answer with Context
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });
    const result = await model.generateContent(`
      You are PIE (Personal Intelligence Engine). 
      Answer the user based on their specific memories and tasks.
      
      ACTIVE TASKS:
      ${tasksContext}

      RELEVANT MEMORIES:
      ${thoughtsContext}

      USER QUESTION: "${message}"
    `);

    return NextResponse.json({ reply: result.response.text() });
  } catch (error: any) {
    console.error('🔥 CHAT ROUTE FATAL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}