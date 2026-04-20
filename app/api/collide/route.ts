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
    const { currentThought } = await req.json();

    // 1. Grab a random past thought from the lattice
    // We use a neat trick here: sorting by random UUID
    const { data: randomThoughts, error } = await supabase
      .from('thoughts')
      .select('content')
      .neq('content', currentThought) // Don't collide with itself
      .limit(1);

    if (error || !randomThoughts || randomThoughts.length === 0) {
      return NextResponse.json({ 
        analysis: "The lattice is too empty to generate a collision. Add more thoughts first!" 
      });
    }

    const pastThought = randomThoughts[0].content;

    // 2. Smash them together using Gemini
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });    
    const prompt = `
      You are the Collision Generator, an AI designed to find profound, lateral connections between completely unrelated ideas.
      
      Thought A (Current): "${currentThought}"
      Thought B (Past): "${pastThought}"
      
      Your task: Smash these two thoughts together. Find the hidden thread, metaphor, or philosophical connection that binds them. 
      Write a short, punchy, and mind-expanding paragraph detailing the new idea that is born from this collision.
      Do not use pleasantries. Be bold and highly conceptual.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ 
      analysis: `💥 COLLISION DETECTED 💥\n\nPast Thought: "${pastThought}"\n\nSynthesis: ${text}` 
    });

  } catch (error) {
    console.error("Collision Error:", error);
    return NextResponse.json({ error: 'Collision failed' }, { status: 500 });
  }
}