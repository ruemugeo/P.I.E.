import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    // Save directly to the database without AI categorization
    await supabase.from('thoughts').insert([{
      content: content,
      category: 'Interest',
      sentiment: 'Core' // Tagged so we know it's a foundational concept
    }]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to add interest' }, { status: 500 });
  }
}
