-- 目标：
-- 1) 修复 sessions / narrative_unlocks / diary_entries 等表的外键约束报错（user_id -> profiles.id）
-- 2) 确保新用户创建后自动拥有 profiles 行（避免 pullFromCloud/syncSession 失败）
-- 3) 为客户端补齐 profiles 的 insert 权限（RLS）

-- 1) 允许用户插入自己的 profile（auth.uid() = id）
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2) 自动为新 auth.users 创建 profile（安全 definer）
create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, created_at, updated_at)
  values (new.id, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_auth_user_profile();

-- 3) 为已存在但缺失 profile 的用户补齐（一次性执行）
insert into public.profiles (id, created_at, updated_at)
select u.id, now(), now()
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

