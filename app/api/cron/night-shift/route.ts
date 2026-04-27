export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RecentThought = {
  content: string;
};

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('Auth failed');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('Starting Night Shift...');

    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    console.log('Fetching thoughts since:', yesterday.toISOString());

    const { data: recentThoughts, error: dbError } = await supabase
      .from('thoughts')
      .select('content')
      .gte('created_at', yesterday.toISOString());

    const thoughts = (recentThoughts ?? []) as RecentThought[];

    if (dbError) {
      console.error('Database Error:', dbError);
      throw dbError;
    }

    if (thoughts.length === 0) {
      console.log('No thoughts found.');
      return NextResponse.json({ message: 'No thoughts to synthesize.' });
    }

    console.log(`Found ${thoughts.length} thoughts. Sending to Gemini...`);

    const thoughtCloud = thoughts.map((thought) => thought.content).join('\n---\n');

    const prompt = `
      Analyze these thoughts: "${thoughtCloud}"
      Write a "Morning Synthesis" - a 3-sentence poetic yet practical summary of the user's current mental state.
    `;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const synthesis = result.text || '';

    console.log('Synthesis complete. Saving to database...');

    const { error: insertError } = await supabase.from('thoughts').insert([
      {
        content: `NIGHT SHIFT REVELATION:\n\n${synthesis}`,
        category: 'Synthesis',
        sentiment: 'Dream State',
      },
    ]);

    if (insertError) {
      console.error('Insert Error:', insertError);
      throw insertError;
    }

    console.log('Night Shift successful!');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('FULL CRASH ERROR:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
