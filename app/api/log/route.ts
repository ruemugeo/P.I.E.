import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'No content' }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
    const prompt = `Analyze: "${content}". Return strictly JSON: {"category": "One word", "sentiment": "word+emoji", "tasks": [{"title": "Action", "priority": "high|medium|low"}]}`;
    
    const result = await model.generateContent(prompt);
    const aiResponse = JSON.parse(result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim());

    // Generate Vector Embedding for True RAG
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const embeddingResult = await embeddingModel.embedContent(content);
    const embedding = embeddingResult.embedding.values;

    const supabase = getSupabase();
    const { data: thoughtData, error: thoughtError } = await supabase
      .from('thoughts')
      .insert([{ content, category: aiResponse.category || 'Log', sentiment: aiResponse.sentiment || 'neutral', embedding }])
      .select().single();

    if (thoughtError) throw thoughtError;

    if (aiResponse.tasks && aiResponse.tasks.length > 0) {
      await supabase.from('tasks').insert(aiResponse.tasks.map((t: any) => ({
        title: t.title, priority: t.priority || 'medium', status: 'todo', thought_id: thoughtData.id
      })));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}