export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  // 1. Security Check: Only Vercel or you with the secret can run this
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch all thoughts from the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const { data: recentThoughts, error } = await supabase
      .from('thoughts')
      .select('content')
      .gte('created_at', yesterday.toISOString());

    if (error || !recentThoughts || recentThoughts.length === 0) {
      return NextResponse.json({ message: "No thoughts to synthesize." });
    }

    const thoughtCloud = recentThoughts.map(t => t.content).join("\n---\n");

    // 3. Summon Gemini for the Dream Synthesis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are the Night Shift Processor. Below is a "Thought Cloud" of everything logged in the last 24 hours:
      
      "${thoughtCloud}"
      
      Analyze these thoughts. Find the hidden thread connecting them. 
      Write a "Morning Synthesis"—a 3-sentence poetic yet practical summary of the user's current mental state and a piece of advice for the day ahead. 
      Tone: Deep, slightly mysterious, but grounded.
    `;

    const result = await model.generateContent(prompt);
    const synthesis = result.response.text();

    // 4. Save back to the Lattice as a special entry
    await supabase.from('thoughts').insert([{
      content: `🌙 NIGHT SHIFT REVELATION:\n\n${synthesis}`,
      category: 'Synthesis',
      sentiment: '👻 Dream State'
    }]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Night Shift Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}