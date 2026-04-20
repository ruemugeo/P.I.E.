import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    const flashModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `Analyze this thought and extract metadata. Return ONLY valid JSON with these exact keys: "category" (broad domain), "theme" (specific topic), and "sentiment" (emotional tone). Thought: "${content}"`;
    
    const result = await flashModel.generateContent(prompt);
    const metadata = JSON.parse(result.response.text());

    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(content);
    const embedding = embeddingResult.embedding.values;

    const { error } = await supabase.from('thoughts').insert({
      content,
      category: metadata.category,
      theme: metadata.theme,
      sentiment: metadata.sentiment,
      embedding
    });

    if (error) throw error;

    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    console.error("Ingestion Error:", error);
    return NextResponse.json({ error: 'Failed to process thought' }, { status: 500 });
  }
}