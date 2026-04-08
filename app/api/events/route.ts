import { NextResponse } from 'next/server';
import { supabase, type EventWithCounts } from '@/lib/supabase';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .replace(/-$/, '');
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : suffix;
}

export async function GET() {
  const { data, error } = await supabase
    .from('events')
    .select('*, rsvps(status, display_name, user_id, data)')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type RsvpRow = { status: string; display_name: string; user_id: string; data: Record<string, unknown> };

  const events: EventWithCounts[] = (data ?? []).map((e) => {
    const rsvps = (e.rsvps as RsvpRow[]) ?? [];
    const toPreview = (r: RsvpRow) => ({
      user_id: r.user_id,
      display_name: r.display_name,
      avatar: r.data?.avatar as string | undefined,
    });
    return {
      ...e,
      yes_count: rsvps.filter((r) => r.status === 'yes').length,
      maybe_count: rsvps.filter((r) => r.status === 'maybe').length,
      no_count: rsvps.filter((r) => r.status === 'no').length,
      going_rsvps: rsvps.filter((r) => r.status === 'yes').map(toPreview),
      maybe_rsvps: rsvps.filter((r) => r.status === 'maybe').map(toPreview),
      no_rsvps: rsvps.filter((r) => r.status === 'no').map(toPreview),
      rsvps: undefined,
    };
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const body = await req.json() as {
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    user_id?: string;
    host_name?: string;
  };
  const { title, description, location, date, start_time, end_time, user_id, host_name } = body;

  if (!title || !date || !user_id || !host_name) {
    return NextResponse.json(
      { error: 'title, date, user_id, and host_name are required' },
      { status: 400 }
    );
  }

  const slug = generateSlug(title);

  const { data, error } = await supabase
    .from('events')
    .insert({
      slug,
      title,
      description: description ?? '',
      location: location ?? '',
      date,
      start_time: start_time ?? '',
      end_time: end_time ?? '',
      user_id,
      host_name,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
