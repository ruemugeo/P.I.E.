import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 🛠️ THE SHIELD: A helper function to automatically retry failed AI calls
async function fetchWithRetry(apiCall: () => Promise<any>, maxRetries = 3, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error.status === 503 && i < maxRetries - 1) {
        console.warn(`Google API 503 Overloaded. Retrying in ${delayMs}ms... (Attempt ${i + 1} of ${maxRetries})`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        throw error; // If it's not a 503, or we are out of retries, throw the real error
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'No content' }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
    const prompt = `Analyze: "${content}". Return strictly JSON: {"category": "One word", "sentiment": "word+emoji", "tasks": [{"title": "Action", "priority": "high|medium|low"}]}`;
    
    // Wrap the text generation in the retry shield
    const result = await fetchWithRetry(() => model.generateContent(prompt));
    const aiResponse = JSON.parse(result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim());

    // Wrap the embedding generation in the retry shield
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-005' });
    const embeddingResult = await fetchWithRetry(() => embeddingModel.embedContent(content));
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
    
  } catch (error: any) {
    console.error('🔥 LOG ROUTE FATAL ERROR:', error);
    return NextResponse.json({ 
      error: 'Failed to process', 
      details: error.message || String(error) 
    }, { status: 500 });
  }
}