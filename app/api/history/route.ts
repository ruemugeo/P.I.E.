import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Fetch the 10 most recent thoughts
    const { data, error } = await supabase
      .from('thoughts')
      .select('id, content, category, sentiment, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ thoughts: data });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}