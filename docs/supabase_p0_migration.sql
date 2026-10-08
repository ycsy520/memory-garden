-- ==========================================
-- Memory Garden P0 迁移脚本
-- 执行顺序：在 supabase_schema.sql 之后执行
-- 日期：2026-07-08
-- ==========================================

-- ==========================================
-- 1. 扩展 profiles 表：添加花园状态字段
-- ==========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS growth_points int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_walks int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_accuracy numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discovered_elements jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_walk_date date;

-- ==========================================
-- 2. RLS 策略：禁止匿名用户写入云端数据
-- 匿名用户的 JWT 中 is_anonymous = true
-- ==========================================

-- sessions：禁止匿名写入
CREATE POLICY "Disallow anonymous write to sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  );

-- sessions：禁止匿名更新
CREATE POLICY "Disallow anonymous update sessions"
  ON public.sessions FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  );

-- narrative_unlocks：禁止匿名写入
CREATE POLICY "Disallow anonymous write to narrative_unlocks"
  ON public.narrative_unlocks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  );

-- diary_entries：禁止匿名写入
CREATE POLICY "Disallow anonymous write to diary_entries"
  ON public.diary_entries FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  );

-- ==========================================
-- 3. RLS 策略：profiles 表花园字段更新
-- ==========================================

-- 已登录用户可以更新自己的花园状态
CREATE POLICY "Users can update their garden state"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  )
  WITH CHECK (
    auth.uid() = id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  );

-- profiles 表 INSERT 策略（新用户注册时自动创建）
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- 4. RLS 策略：user_settings 表补充
-- ==========================================

-- INSERT 策略
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  );

-- UPDATE 策略
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  );

-- ==========================================
-- 5. 索引优化
-- ==========================================

-- sessions 表：按用户+时间查询优化
CREATE INDEX IF NOT EXISTS idx_sessions_user_created
  ON public.sessions (user_id, created_at DESC);

-- narrative_unlocks 表：按用户+收藏品查询优化
CREATE INDEX IF NOT EXISTS idx_unlocks_user_collectible
  ON public.narrative_unlocks (user_id, collectible_id);

-- diary_entries 表：按用户+时间查询优化
CREATE INDEX IF NOT EXISTS idx_diaries_user_created
  ON public.diary_entries (user_id, created_at DESC);
