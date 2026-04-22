import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export async function GET() {
  const { data } = await getSupabase().from('tasks').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ tasks: data });
}

export async function POST(req: Request) {
  const { title, priority } = await req.json();
  const { data } = await getSupabase().from('tasks').insert([{ title, priority, status: 'todo' }]).select().single();
  return NextResponse.json({ task: data });
}

export async function PATCH(req: Request) {
  const { id, updates } = await req.json();
  await getSupabase().from('tasks').update(updates).eq('id', id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await getSupabase().from('tasks').delete().eq('id', id);
  return NextResponse.json({ success: true });
}