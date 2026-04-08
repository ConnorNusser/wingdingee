import { NextResponse } from 'next/server';
import { supabase, type User } from '@/lib/supabase';

// POST /api/users — create a new user with a display name
export async function POST(req: Request) {
  const body = await req.json() as { display_name?: string };
  const display_name = body.display_name?.trim();

  if (!display_name) {
    return NextResponse.json({ error: 'display_name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .insert({ display_name })
    .select()
    .single<User>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/users — update profile fields for a user by id
export async function PATCH(req: Request) {
  const body = await req.json() as { id?: string; display_name?: string; data?: Record<string, unknown> };
  const { id, display_name, data: userData } = body;
  const trimmed = display_name?.trim();

  if (!id || !trimmed) {
    return NextResponse.json({ error: 'id and display_name are required' }, { status: 400 });
  }

  const update: { display_name: string; data?: Record<string, unknown> } = { display_name: trimmed };
  if (userData !== undefined) update.data = userData;

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', id)
    .select()
    .single<User>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
