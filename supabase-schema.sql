-- Paste this into Supabase: Dashboard → SQL Editor → New Query → Run

drop table if exists rsvps;
drop table if exists events;
drop table if exists users;

create table users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  phone text unique,                      -- null until phone auth is wired up
  data jsonb default '{}',               -- flexible extra fields per user
  created_at timestamptz default now()
);

create table events (
  id bigint primary key generated always as identity,
  slug text unique not null,
  title text not null,
  description text default '',
  location text default '',
  date text not null,
  start_time text default '',
  end_time text default '',
  user_id uuid not null references users(id) on delete cascade,
  host_name text not null,               -- denormalized for fast reads
  data jsonb default '{}',               -- flexible extra fields e.g. cover_image, dress_code
  created_at timestamptz default now()
);

create table rsvps (
  id bigint primary key generated always as identity,
  event_id bigint not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null,            -- denormalized for fast reads
  status text not null check (status in ('yes', 'no', 'maybe')),
  data jsonb default '{}',               -- flexible extra fields e.g. dietary, note
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Disable RLS — everyone in the friend group is trusted
alter table users  disable row level security;
alter table events disable row level security;
alter table rsvps  disable row level security;
