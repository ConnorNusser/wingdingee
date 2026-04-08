import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Types ──────────────────────────────────────────────────────────────────

export type RsvpStatus = 'yes' | 'no' | 'maybe';

export interface User {
  id: string;
  display_name: string;
  phone: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

export interface Event {
  id: number;
  slug: string;
  title: string;
  description: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  user_id: string;
  host_name: string;
  data: Record<string, unknown>; // attach any extra fields e.g. { cover_image, dress_code, ... }
  created_at: string;
}

export interface Rsvp {
  id: number;
  event_id: number;
  user_id: string;
  display_name: string;
  status: RsvpStatus;
  data: Record<string, unknown>; // attach any extra fields e.g. { dietary, note, ... }
  created_at: string;
}

export interface EventWithRsvps extends Event {
  rsvps: Rsvp[];
}

export interface EventWithCounts extends Event {
  yes_count: number;
  maybe_count: number;
  no_count: number;
}
