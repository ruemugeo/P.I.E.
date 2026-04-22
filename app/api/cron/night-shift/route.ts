export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("Auth failed");
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log("Starting Night Shift...");
    
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    console.log("Fetching thoughts since:", yesterday.toISOString());

    const { data: recentThoughts, error: dbError } = await supabase
      .from('thoughts')
      .select('content')
      .gte('created_at', yesterday.toISOString());

    if (dbError) {
      console.error("Database Error:", dbError);
      throw dbError;
    }

    if (!recentThoughts || recentThoughts.length === 0) {
      console.log("No thoughts found.");
      return NextResponse.json({ message: "No thoughts to synthesize." });
    }

    console.log(`Found ${recentThoughts.length} thoughts. Sending to Gemini...`);

    const thoughtCloud = recentThoughts.map(t => t.content).join("\n---\n");

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Analyze these thoughts: "${thoughtCloud}"
      Write a "Morning Synthesis"—a 3-sentence poetic yet practical summary of the user's current mental state.
    `;

    const result = await model.generateContent(prompt);
    const synthesis = result.response.text();

    console.log("Synthesis complete. Saving to database...");

    const { error: insertError } = await supabase.from('thoughts').insert([{
      content: `🌙 NIGHT SHIFT REVELATION:\n\n${synthesis}`,
      category: 'Synthesis',
      sentiment: '👻 Dream State'
    }]);

    if (insertError) {
      console.error("Insert Error:", insertError);
      throw insertError;
    }

    console.log("Night Shift successful!");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("FULL CRASH ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}