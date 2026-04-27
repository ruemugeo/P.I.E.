import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ThoughtRow = {
  content: string;
  category: string;
};

export async function POST(req: Request) {
  try {
    const { currentThought } = await req.json();

    const { data: allItems, error } = await supabase
      .from('thoughts')
      .select('content, category');

    const thoughtItems = (allItems ?? []) as ThoughtRow[];

    if (error || thoughtItems.length < 2) {
      return NextResponse.json({ analysis: 'Need at least 2 thoughts in the matrix to collide!' });
    }

    let thoughtA = currentThought;
    let thoughtB = '';
    let targetType = 'Past Data';

    if (!thoughtA) {
      const randomA = thoughtItems[Math.floor(Math.random() * thoughtItems.length)];
      thoughtA = randomA.content;

      const remainingItems = thoughtItems.filter((item) => item.content !== thoughtA);
      const randomB = remainingItems[Math.floor(Math.random() * remainingItems.length)];
      thoughtB = randomB.content;
      targetType = randomB.category;
    } else {
      const remainingItems = thoughtItems.filter((item) => item.content !== thoughtA);
      const randomB = remainingItems[Math.floor(Math.random() * remainingItems.length)];
      thoughtB = randomB.content;
      targetType = randomB.category;
    }

    const prompt = `
      You are the Collision Generator. Smash these two concepts together.
      Thought A: "${thoughtA}"
      Thought B (${targetType}): "${thoughtB}"

      Write a short, punchy paragraph detailing the new idea born from this collision.
      CRITICAL: Tone it down. Use plain, everyday language. No academic jargon.
    `;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = result.text || '';

    const finalOutput = `COLLISION DETECTED\n\nConcept A: "${thoughtA}"\n\nConcept B: "${thoughtB}"\n\nSynthesis: ${text}`;

    await supabase.from('thoughts').insert([
      {
        content: finalOutput,
        category: 'Collision',
        sentiment: 'Synthesis',
      },
    ]);

    return NextResponse.json({ analysis: finalOutput });
  } catch (error) {
    console.error('Collision Error:', error);
    return NextResponse.json({ error: 'Collision failed' }, { status: 500 });
  }
}
