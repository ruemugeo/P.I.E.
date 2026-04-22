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
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'No content' }, { status: 400 });

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const prompt = `
      Analyze the thought: "${content}"
      Return strictly JSON (no markdown backticks):
      {
        "category": "One word (e.g. Synthesis, Idea, Vent, System)",
        "sentiment": "1-3 words + emoji",
        "tasks": [{"title": "Actionable item", "priority": "high|medium|low"}]
      }
    `;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
    const aiResponse = JSON.parse(rawText);

    const supabase = getSupabase();
    
    const { data: thoughtData, error: thoughtError } = await supabase
      .from('thoughts')
      .insert([{ content, category: aiResponse.category || 'Log', sentiment: aiResponse.sentiment || 'neutral' }])
      .select().single();

    if (thoughtError) throw thoughtError;

    if (aiResponse.tasks && aiResponse.tasks.length > 0) {
      const tasksToInsert = aiResponse.tasks.map((t: any) => ({
        title: t.title, priority: t.priority || 'medium', status: 'todo', thought_id: thoughtData.id
      }));
      await supabase.from('tasks').insert(tasksToInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log API Error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}