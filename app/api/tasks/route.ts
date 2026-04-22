import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch all tasks
export async function GET() {
  const supabase = getSupabase();
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('status', { ascending: false }) // 'todo' comes before 'done'
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks });
}

// POST: Add a new task
export async function POST(req: Request) {
  const { title, priority } = await req.json();
  const supabase = getSupabase();
  const { data: task, error } = await supabase
    .from('tasks')
    .insert([{ title, priority }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task });
}

// PATCH: Toggle task status
export async function PATCH(req: Request) {
  const { id, status } = await req.json();
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE: Remove a task
export async function DELETE(req: Request) {
  const { id } = await req.json();
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}