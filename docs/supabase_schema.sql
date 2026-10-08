-- Memory Garden Supabase Backend Schema
-- Created on: 2026-07-07
-- This schema represents Phase 1 & 2 of the database architecture.

-- Enable Row Level Security (RLS) on all tables.

-- ==========================================
-- 1. PROFILES TABLE (User Profile)
-- ==========================================
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  nickname text,
  avatar_url text,
  total_sessions int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- ==========================================
-- 2. SESSIONS TABLE (Training Records)
-- ==========================================
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mode text not null, -- 'walk', 'flower-bed', etc.
  n_value int not null,
  speed_profile text not null,
  score numeric,
  hit_rate numeric,
  false_alarm_rate numeric,
  timeout_count int,
  lure_false_alarm_count int, -- Independent lure tracking
  valid_for_adaptation boolean default true,
  schema_version int default 5, -- Critical for preventing R8 stale data corruption
  device_info jsonb,
  created_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "Users can CRUD their own sessions" 
  on public.sessions for all 
  using (auth.uid() = user_id);

-- ==========================================
-- 3. NARRATIVE UNLOCKS TABLE
-- ==========================================
create table if not exists public.narrative_unlocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  collectible_id text not null,
  tier_id text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, collectible_id, tier_id)
);

alter table public.narrative_unlocks enable row level security;

create policy "Users can CRUD their own unlocks" 
  on public.narrative_unlocks for all 
  using (auth.uid() = user_id);

-- ==========================================
-- 4. DIARY ENTRIES TABLE (User-collected snippets)
-- ==========================================
create table if not exists public.diary_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  fragment_text text not null,
  full_text text, -- Snapshot to prevent disruption when narrative updates
  source_collectible_id text,
  created_at timestamptz default now()
);

alter table public.diary_entries enable row level security;

create policy "Users can CRUD their own diaries" 
  on public.diary_entries for all 
  using (auth.uid() = user_id);

-- ==========================================
-- 5. AUTH IDENTITIES TABLE (Multi-login Identity Support)
-- ==========================================
create table if not exists public.auth_identities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider_type text not null, -- 'guest', 'phone', 'email', 'apple', 'wechat'
  provider_user_id text not null,
  phone_hash text,
  email_hash text,
  created_at timestamptz default now(),
  last_used_at timestamptz default now(),
  unique(provider_type, provider_user_id)
);

alter table public.auth_identities enable row level security;

create policy "Users can view their own identities" 
  on public.auth_identities for select 
  using (auth.uid() = user_id);

-- ==========================================
-- 6. USER SETTINGS TABLE (User Preferences)
-- ==========================================
create table if not exists public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade not null primary key,
  sound_enabled boolean default true,
  reduced_motion boolean default false,
  cloud_sync_enabled boolean default true,
  privacy_training_record_enabled boolean default true,
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "Users can CRUD their own settings" 
  on public.user_settings for all 
  using (auth.uid() = user_id);
