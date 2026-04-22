import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const supabase = getSupabase();

    const { data: thoughts } = await supabase.from('thoughts').select('content, category').order('created_at', { ascending: false }).limit(50);
    const { data: tasks } = await supabase.from('tasks').select('title, priority').eq('status', 'todo');

    const thoughtsContext = thoughts?.map(t => `(${t.category}) ${t.content}`).join('\n') || 'No recent thoughts.';
    const tasksContext = tasks?.map(t => `-[${t.priority}] ${t.title}`).join('\n') || 'No active tasks.';

    const systemPrompt = `
      You are PIE, the user's AI second brain. Answer their prompt concisely using their context.
      ACTIVE TASKS: ${tasksContext}
      RECENT THOUGHTS: ${thoughtsContext}
      USER: "${message}"
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt);

    return NextResponse.json({ reply: result.response.text() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to query lattice' }, { status: 500 });
  }
}