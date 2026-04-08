import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabase
    .from('events')
    .select('*, rsvps(*)')
    .eq('slug', params.id)
    .order('created_at', { referencedTable: 'rsvps', ascending: true })
    .single();

  if (error || !data) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await supabase.from('events').delete().eq('slug', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
