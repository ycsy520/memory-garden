/**
 * Supabase 客户端初始化 — 单例模式
 * 全局唯一实例，供 AuthService 和 SyncService 使用
 *
 * @module supabaseClient
 */
import { createClient } from '@supabase/supabase-js';
import APP_FEATURES from '../appFeatures';

/**
 * 读取可选环境变量。
 * 缺失时返回 null，由上层决定是否启用 Supabase 链路。
 *
 * @param {string} key - 环境变量名
 * @returns {string|null}
 */
function getOptionalEnv(key) {
  const value = import.meta.env[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return null;
}

const SUPABASE_URL = getOptionalEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getOptionalEnv('VITE_SUPABASE_ANON_KEY');
let hasLoggedSupabaseConfigWarning = false;

/**
 * 计算当前 Supabase 配置错误信息。
 * 优先返回第一个缺失项，方便线上日志直接定位问题。
 *
 * @returns {string|null}
 */
function getSupabaseConfigError() {
  if (!SUPABASE_URL) return '[supabaseClient] Missing required env: VITE_SUPABASE_URL';
  if (!SUPABASE_ANON_KEY) return '[supabaseClient] Missing required env: VITE_SUPABASE_ANON_KEY';
  return null;
}

/** @type {string|null} 当前 Supabase 配置错误 */
export const supabaseConfigError = getSupabaseConfigError();
/** @type {boolean} 当前是否已完整配置 Supabase */
export const isSupabaseConfigured = APP_FEATURES.cloudSyncEnabled && !supabaseConfigError;

/**
 * Supabase 客户端实例
 * - autoRefreshToken: 自动刷新过期 token
 * - persistSession: 将 session 持久化到 localStorage（key: sb-<ref>-auth-token）
 * - detectSessionInUrl: 关闭 URL 中的 auth callback 检测（PWA 不需要）
 */
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      // 开启 URL 中的 auth callback 检测（OTP 登录回调需要）
      detectSessionInUrl: true,
    },
  })
  : null;

if (supabaseConfigError) {
  if (!hasLoggedSupabaseConfigWarning) {
    console.warn(supabaseConfigError);
    hasLoggedSupabaseConfigWarning = true;
  }
}
