-- ==========================================
-- Memory Garden Analytics Schema
-- 目标：
-- 1. 为登录用户建立正式的 attempt / event / rollup 分析体系
-- 2. 删除账户时通过 user_id -> profiles(id) ON DELETE SET NULL
--    实现分析数据匿名化保留
-- 3. 保持第一阶段最小落地：先建表、索引和 RLS 边界，不在迁移中引入复杂聚合逻辑
-- ==========================================

-- ==========================================
-- 1. analytics_attempts
-- 主分析表：一条记录代表一次完整开局尝试
-- ==========================================
create table if not exists public.analytics_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  session_id uuid not null,
  mode_id text not null,
  rhythm_id text not null,
  difficulty_n int not null check (difficulty_n >= 1),
  timed boolean not null default false,
  time_limit_s int not null default 0 check (time_limit_s >= 0),
  started_at timestamptz not null,
  ended_at timestamptz,
  ended_reason text check (ended_reason in ('finished', 'exit')),
  duration_ms int check (duration_ms is null or duration_ms >= 0),
  pause_duration_ms int not null default 0 check (pause_duration_ms >= 0),
  active_duration_ms int check (active_duration_ms is null or active_duration_ms >= 0),
  warmup_duration_ms int not null default 0 check (warmup_duration_ms >= 0),
  turn_count_total int not null default 0 check (turn_count_total >= 0),
  turn_count_scored int not null default 0 check (turn_count_scored >= 0),
  exit_stage text check (exit_stage in ('intro', 'warmup', 'main', 'finished')),
  exit_turn_index int check (exit_turn_index is null or exit_turn_index >= 0),
  score numeric,
  accuracy numeric,
  rt_p50_ms int check (rt_p50_ms is null or rt_p50_ms >= 0),
  rt_p90_ms int check (rt_p90_ms is null or rt_p90_ms >= 0),
  app_version text not null,
  platform text not null check (platform in ('web', 'pwa', 'android', 'ios')),
  locale text not null default 'zh-CN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.analytics_attempts enable row level security;

-- 用户只允许读取自己的分析尝试数据。
-- 写入统一走 Edge Function / service role，第一阶段不开放客户端直写。
create policy "Users can view their own analytics attempts"
  on public.analytics_attempts for select
  using (auth.uid() = user_id);

create index if not exists idx_analytics_attempts_user_started
  on public.analytics_attempts (user_id, started_at desc);

create index if not exists idx_analytics_attempts_dimensions
  on public.analytics_attempts (mode_id, rhythm_id, difficulty_n, timed, time_limit_s, app_version, platform);

create index if not exists idx_analytics_attempts_session
  on public.analytics_attempts (session_id);

-- ==========================================
-- 2. analytics_events
-- 关键节点事件表：仅记录漏斗、暂停恢复、退出等关键事件
-- ==========================================
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  attempt_id uuid not null references public.analytics_attempts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  ts timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

-- 用户只允许读取自己的分析事件。
-- 第一阶段依旧不开放客户端直写，由 Edge Function 统一入库。
create policy "Users can view their own analytics events"
  on public.analytics_events for select
  using (auth.uid() = user_id);

create index if not exists idx_analytics_events_attempt_ts
  on public.analytics_events (attempt_id, ts desc);

create index if not exists idx_analytics_events_user_ts
  on public.analytics_events (user_id, ts desc);

create index if not exists idx_analytics_events_name_ts
  on public.analytics_events (event_name, ts desc);

-- ==========================================
-- 3. analytics_rollup_daily
-- 日聚合表：给 Supabase 后台简单报表直接读取
-- 第一阶段只建承载结构，不在本迁移中强行写入聚合逻辑
-- ==========================================
create table if not exists public.analytics_rollup_daily (
  id uuid default gen_random_uuid() primary key,
  rollup_date date not null,
  mode_id text not null,
  rhythm_id text not null,
  difficulty_n int not null check (difficulty_n >= 1),
  timed boolean not null default false,
  time_limit_s int not null default 0 check (time_limit_s >= 0),
  app_version text not null,
  platform text not null check (platform in ('web', 'pwa', 'android', 'ios')),
  attempts_started int not null default 0 check (attempts_started >= 0),
  attempts_finished int not null default 0 check (attempts_finished >= 0),
  completion_rate numeric not null default 0,
  p50_active_duration_ms int not null default 0 check (p50_active_duration_ms >= 0),
  p90_active_duration_ms int not null default 0 check (p90_active_duration_ms >= 0),
  pause_rate numeric not null default 0,
  warmup_exit_rate numeric not null default 0,
  main_exit_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.analytics_rollup_daily enable row level security;

-- 报表聚合表默认不向普通用户开放读取；
-- 由 service role / 后台 SQL 统一访问。

create unique index if not exists idx_analytics_rollup_daily_unique
  on public.analytics_rollup_daily (
    rollup_date,
    mode_id,
    rhythm_id,
    difficulty_n,
    timed,
    time_limit_s,
    app_version,
    platform
  );

create index if not exists idx_analytics_rollup_daily_date
  on public.analytics_rollup_daily (rollup_date desc);

-- ==========================================
-- 4. 设计说明
-- ==========================================
-- A. 删除账户时，现有 delete-account 会删除 profiles 记录。
--    因 analytics_attempts / analytics_events.user_id 使用 ON DELETE SET NULL，
--    因此 profile 删除后分析数据会自动匿名化保留。
--
-- B. analytics_rollup_daily 不与 user_id 绑定，天然不受删除账户影响。
--
-- C. 第一阶段不在数据库层校验 event_name 白名单；
--    白名单由 ingest Edge Function 在服务端执行，避免每次新增事件名都需要迁移。
