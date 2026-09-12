create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  display_name text,
  profile_picture_url text,
  posts_analyzed integer not null check (posts_analyzed > 0 and posts_analyzed <= 50),
  archetype text not null,
  strength text not null,
  weakness text not null,
  summary text not null,
  overall_score integer not null check (overall_score between 0 and 100),
  conversation_score integer not null check (conversation_score between 0 and 100),
  originality_score integer not null check (originality_score between 0 and 100),
  authority_score integer not null check (authority_score between 0 and 100),
  consistency_score integer not null check (consistency_score between 0 and 100),
  virality_score integer not null check (virality_score between 0 and 100),
  top_signals jsonb not null default '[]'::jsonb,
  public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Intentionally no anon/authenticated policies. The app reads/writes reports only
-- from server-side code using the Supabase service role key.
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_username_idx on public.reports (username);
