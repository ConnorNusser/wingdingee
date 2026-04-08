import { NextResponse } from 'next/server';
import { supabase, type RsvpStatus } from '@/lib/supabase';

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  const body = await req.json() as {
    user_id?: string;
    display_name?: string;
    status?: string;
  };
  const { user_id, display_name, status } = body;

  const validStatuses: RsvpStatus[] = ['yes', 'no', 'maybe'];
  if (!user_id || !display_name || !status || !validStatuses.includes(status as RsvpStatus)) {
    return NextResponse.json({ error: 'user_id, display_name, and status are required' }, { status: 400 });
  }

  // Look up event by slug to get numeric id
  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('slug', params.id)
    .single();

  if (eventError || !eventRow) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const { error: upsertError } = await supabase
    .from('rsvps')
    .upsert(
      {
        event_id: eventRow.id,
        user_id,
        display_name,
        status: status as RsvpStatus,
      },
      { onConflict: 'event_id,user_id' }
    );

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  const { data } = await supabase
    .from('events')
    .select('*, rsvps(*)')
    .eq('slug', params.id)
    .single();

  return NextResponse.json(data);
}
