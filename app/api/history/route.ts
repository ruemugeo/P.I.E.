import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || '0');
  const start = Number.isFinite(page) && page > 0 ? page * 20 : 0;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: thoughts, error } = await supabase
    .from('thoughts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(start, start + 19);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ thoughts });
}
