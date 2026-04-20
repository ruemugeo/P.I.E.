export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    // Make sure to use the active model!
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // The Upgraded Ghost Architecture Prompt
    const prompt = `
      Analyze this thought deeply: "${content}"
      
      You must return a STRICT JSON object with exactly three keys. Do NOT wrap it in markdown blockquotes, just return the raw JSON.
      
      {
        "category": "A broad 1-2 word category (e.g., Tech, Philosophy, Memory)",
        "sentiment": "A 1-2 word emotional state (e.g., Anxious, Euphoric, Analytical)",
        "ghostTag": "A deep psychological archetype, mental model, or philosophical school representing the subtext (e.g., Existentialism, First Principles, Cognitive Dissonance, Paradigm Shift)"
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Strip markdown formatting just in case the AI disobeys
    if (text.startsWith('```json')) text = text.replace(/```json/g, '');
    if (text.startsWith('```')) text = text.replace(/```/g, '');
    
    const aiData = JSON.parse(text);

    // Combine the sentiment and Ghost Tag so it fits perfectly in our UI without DB changes
    const enhancedSentiment = `${aiData.sentiment} • 👻 ${aiData.ghostTag}`;

    await supabase.from('thoughts').insert([{
      content: content,
      category: aiData.category,
      sentiment: enhancedSentiment
    }]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Logging Error:", error);
    return NextResponse.json({ error: 'Failed to process thought' }, { status: 500 });
  }
}