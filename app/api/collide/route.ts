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

    const { data: randomThoughts, error } = await supabase
      .from('thoughts')
      .select('content')
      .neq('content', currentThought)
      .limit(1);

    if (error || !randomThoughts || randomThoughts.length === 0) {
      return NextResponse.json({ 
        analysis: "The lattice is too empty to generate a collision. Add more thoughts first!" 
      });
    }

    const pastThought = randomThoughts[0].content;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
      You are the Collision Generator, an AI designed to find lateral connections between completely unrelated ideas.
      
      Thought A (Current): "${currentThought}"
      Thought B (Past): "${pastThought}"
      
      Your task: Smash these two thoughts together. Find the hidden thread or metaphor that binds them. 
      Write a short, punchy paragraph detailing the new idea that is born from this collision.
      
      CRITICAL INSTRUCTION: Tone it down. Use plain, everyday language. Do NOT use dense philosophical jargon, hyper-academic terms, or overly complex vocabulary. The insight should be profound, but the words should be incredibly easy to understand for anyone.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Format the final text
    const finalOutput = `💥 COLLISION DETECTED 💥\n\nPast: "${pastThought}"\n\nCurrent: "${currentThought}"\n\nSynthesis: ${text}`;

    // NEW: Save the collision back into the database as a new node!
    await supabase.from('thoughts').insert([{
      content: finalOutput,
      category: 'Collision',
      sentiment: 'Synthesis'
    }]);

    return NextResponse.json({ analysis: finalOutput });

  } catch (error) {
    console.error("Collision Error:", error);
    return NextResponse.json({ error: 'Collision failed' }, { status: 500 });
  }
}