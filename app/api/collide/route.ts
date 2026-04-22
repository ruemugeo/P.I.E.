import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { currentThought } = await req.json();

    const { data: allItems, error } = await supabase.from('thoughts').select('content, category');

    if (error || !allItems || allItems.length < 2) {
      return NextResponse.json({ analysis: "Need at least 2 thoughts in the matrix to collide!" });
    }

    let thoughtA = currentThought;
    let thoughtB = "";
    let targetType = "Past Data";

    // If input is empty, pick two random thoughts from the DB!
    if (!thoughtA) {
      const randomA = allItems[Math.floor(Math.random() * allItems.length)];
      thoughtA = randomA.content;
      
      const remainingItems = allItems.filter(i => i.content !== thoughtA);
      const randomB = remainingItems[Math.floor(Math.random() * remainingItems.length)];
      thoughtB = randomB.content;
      targetType = randomB.category;
    } else {
      // If user typed something, pick one random thought
      const remainingItems = allItems.filter(i => i.content !== thoughtA);
      const randomB = remainingItems[Math.floor(Math.random() * remainingItems.length)];
      thoughtB = randomB.content;
      targetType = randomB.category;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
      You are the Collision Generator. Smash these two concepts together.
      Thought A: "${thoughtA}"
      Thought B (${targetType}): "${thoughtB}"
      
      Write a short, punchy paragraph detailing the new idea born from this collision. 
      CRITICAL: Tone it down. Use plain, everyday language. No academic jargon.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const finalOutput = `💥 COLLISION DETECTED 💥\n\nConcept A: "${thoughtA}"\n\nConcept B: "${thoughtB}"\n\nSynthesis: ${text}`;

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