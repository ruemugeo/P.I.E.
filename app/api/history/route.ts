import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '0');
  const limit = 20;
  const start = page * limit;
  const end = start + limit - 1;

  const { data } = await getSupabase().from('thoughts').select('*').order('created_at', { ascending: false }).range(start, end);
  return NextResponse.json({ thoughts: data });
}