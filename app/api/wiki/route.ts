import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export async function GET() {
  const { data } = await getSupabase().from('wiki').select('*').order('updated_at', { ascending: false });
  return NextResponse.json({ pages: data });
}

export async function POST(req: Request) {
  const { title, content } = await req.json();
  const { data } = await getSupabase().from('wiki').insert([{ title, content }]).select().single();
  return NextResponse.json({ page: data });
}