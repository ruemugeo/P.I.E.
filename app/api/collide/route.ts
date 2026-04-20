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

    // 1. Fetch EVERYTHING except the current thought
    const { data: allItems, error } = await supabase
      .from('thoughts')
      .select('content, category')
      .neq('content', currentThought);

    if (error || !allItems || allItems.length === 0) {
      return NextResponse.json({ analysis: "The lattice is too empty!" });
    }

    // 2. Separate into Interests and normal Thoughts
    const interests = allItems.filter(i => i.category === 'Interest');
    const thoughts = allItems.filter(i => i.category !== 'Interest');

    // 3. Flip a coin: 50% chance to collide with an Interest (if you have any)
    let pool = thoughts;
    let targetType = "Past Thought";

    if (interests.length > 0 && Math.random() > 0.5) {
      pool = interests;
      targetType = "Core Interest";
    }

    // Fallback if the chosen pool is empty
    if (pool.length === 0) pool = allItems;

    // 4. Pick a TRUE random item from the pool
    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    const targetContent = randomItem.content;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
      You are the Collision Generator. Smash these two concepts together.
      
      Thought A (Current): "${currentThought}"
      Target B (${targetType}): "${targetContent}"
      
      Write a short, punchy paragraph detailing the new idea born from this collision.
      CRITICAL: Tone it down. Use plain, everyday language. No academic jargon.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const finalOutput = `💥 COLLISION DETECTED 💥\n\nTarget (${targetType}): "${targetContent}"\n\nCurrent: "${currentThought}"\n\nSynthesis: ${text}`;

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