-- =============================================================================
-- CRM App initial schema
-- Run this in Supabase SQL editor (or via `supabase db push`) after creating
-- your project. Safe to re-run (uses IF NOT EXISTS and OR REPLACE).
-- =============================================================================

-- ---------- Enums ----------
do $$ begin
  create type public.lead_status as enum ('new', 'consulting', 'won', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_source as enum
    ('facebook', 'zalo', 'referral', 'google', 'direct', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interaction_type as enum
    ('call', 'chat', 'meeting', 'email');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- leads ----------
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  email       text,
  status      public.lead_status not null default 'new',
  source      public.lead_source not null default 'other',
  position    text, -- position in company
  location    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists leads_owner_idx on public.leads(owner_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_idx on public.leads(created_at desc);

-- ---------- interactions ----------
create table if not exists public.interactions (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references public.leads(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  type              public.interaction_type not null,
  title             text not null,
  content           text,
  duration_minutes  integer,
  occurred_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists interactions_lead_idx
  on public.interactions(lead_id, occurred_at desc);

-- ---------- updated_at trigger (shared) ----------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_on_leads on public.leads;
create trigger set_updated_at_on_leads
  before update on public.leads
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at_on_profiles on public.profiles;
create trigger set_updated_at_on_profiles
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles     enable row level security;
alter table public.leads        enable row level security;
alter table public.interactions enable row level security;

-- ---------- profiles RLS ----------
drop policy if exists "profiles are viewable by owner" on public.profiles;
create policy "profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles are updatable by owner" on public.profiles;
create policy "profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- leads RLS ----------
drop policy if exists "leads select own" on public.leads;
create policy "leads select own"
  on public.leads for select
  using (auth.uid() = owner_id);

drop policy if exists "leads insert own" on public.leads;
create policy "leads insert own"
  on public.leads for insert
  with check (auth.uid() = owner_id);

drop policy if exists "leads update own" on public.leads;
create policy "leads update own"
  on public.leads for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "leads delete own" on public.leads;
create policy "leads delete own"
  on public.leads for delete
  using (auth.uid() = owner_id);

-- ---------- interactions RLS ----------
-- (authors of interactions must also own the parent lead)
drop policy if exists "interactions select own" on public.interactions;
create policy "interactions select own"
  on public.interactions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.leads l
      where l.id = interactions.lead_id and l.owner_id = auth.uid()
    )
  );

drop policy if exists "interactions insert own" on public.interactions;
create policy "interactions insert own"
  on public.interactions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.leads l
      where l.id = lead_id and l.owner_id = auth.uid()
    )
  );

drop policy if exists "interactions update own" on public.interactions;
create policy "interactions update own"
  on public.interactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "interactions delete own" on public.interactions;
create policy "interactions delete own"
  on public.interactions for delete
  using (auth.uid() = user_id);
