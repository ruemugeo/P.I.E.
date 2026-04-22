import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    // 1. Embed user query
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-005' });
    const { embedding } = await embeddingModel.embedContent(message);

    const supabase = getSupabase();
    // 2. Vector Search (Match top 10 most relevant thoughts ever, not just recent)
    const { data: thoughts } = await supabase.rpc('match_thoughts', { query_embedding: embedding.values, match_threshold: 0.5, match_count: 10 });
    const { data: tasks } = await supabase.from('tasks').select('title, priority').eq('status', 'todo');

    const thoughtsContext = thoughts?.map((t: any) => `(${t.category}) ${t.content}`).join('\n') || 'No relevant history found.';
    const tasksContext = tasks?.map((t: any) => `-[${t.priority}] ${t.title}`).join('\n') || 'No active tasks.';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`You are PIE. Answer using ONLY this retrieved context.\nTASKS: ${tasksContext}\nRELEVANT MEMORIES: ${thoughtsContext}\nUSER: "${message}"`);

    return NextResponse.json({ reply: result.response.text() });
  } catch (error) {
    return NextResponse.json({ error: 'RAG failed' }, { status: 500 });
  }
}