/**
 * 认证状态管理服务
 * 职责：匿名登录、登录状态监听、账户注销、匿名升级
 * 与 useAuthStore 配合，将 Supabase Auth API 封装为业务层接口
 *
 * @module AuthService
 */
import { supabase, isSupabaseConfigured, supabaseConfigError } from './supabaseClient';
import useAuthStore from '@stores/useAuthStore';
import SyncService from './SyncService';

let hasLoggedAuthUnavailable = false;

const AuthService = {
  /**
   * 判断当前是否允许使用认证链路。
   * 环境变量缺失时直接短路，避免整站因配置问题崩溃。
   *
   * @returns {boolean}
   */
  _isAvailable() {
    if (isSupabaseConfigured) return true;
    if (!hasLoggedAuthUnavailable) {
      console.warn('[AuthService] Supabase 未配置，跳过认证流程:', supabaseConfigError);
      hasLoggedAuthUnavailable = true;
    }
    useAuthStore.getState().setLoadingDone();
    return false;
  },

  /**
   * 初始化认证流程
   * 1. 检查 localStorage 中是否有 Supabase Session
   * 2. 若有 → 恢复登录状态
   * 3. 若无 → 创建匿名账户
   * 4. 监听后续 auth 状态变化（token 刷新、登出等）
   *
   * @returns {Promise<void>}
   */
  async init() {
    if (!this._isAvailable()) return;

    try {
      // 检查现有 session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('[AuthService] getSession 失败:', error.message);
        await this._signInAnonymously();
        return;
      }

      if (session?.user) {
        // 已有 session，恢复登录状态
        useAuthStore.getState().setUser(session.user);
        if (!session.user.is_anonymous) {
          await SyncService.hydrateFromCloud();
        }
      } else {
        // 无 session，创建匿名账户
        await this._signInAnonymously();
      }

      // 监听 auth 状态变化（token 刷新、登出、OTP 回调等）
      supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user ?? null;
        if (user) {
          useAuthStore.getState().setUser(user);
          if (!user.is_anonymous) {
            await SyncService.hydrateFromCloud({ force: event === 'SIGNED_IN' });
          }
        } else {
          useAuthStore.getState().setUser(null);
          useAuthStore.getState().setLoadingDone();
          SyncService.resetHydrationState();
        }

        // OTP 登录回调后，清除 URL 中的 auth token 参数，避免路由混乱
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      });
    } catch (e) {
      console.warn('[AuthService] 初始化异常:', e);
      useAuthStore.getState().setLoadingDone();
    }
  },

  /**
   * 内部方法：创建匿名账户
   * @private
   */
  async _signInAnonymously() {
    if (!this._isAvailable()) return;

    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn('[AuthService] 匿名登录失败:', error.message);
        useAuthStore.getState().setLoadingDone();
        return;
      }
      useAuthStore.getState().setUser(data.user);
    } catch (e) {
      console.warn('[AuthService] 匿名登录异常:', e);
      useAuthStore.getState().setLoadingDone();
    }
  },

  /**
   * 获取当前认证状态
   * @returns {{ user: Object|null, isAnonymous: boolean, isLoggedIn: boolean }}
   */
  getCurrentUser() {
    const state = useAuthStore.getState();
    return {
      user: state.user,
      isAnonymous: state.isAnonymous,
      isLoggedIn: state.isLoggedIn,
    };
  },

  /**
   * 邮箱验证码登录（OTP）
   * 用户收到邮件后点击链接完成登录
   * @param {string} email - 邮箱地址
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async signInWithEmailOtp(email) {
    if (!this._isAvailable()) {
      return { success: false, error: supabaseConfigError };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * 匿名用户升级为正式用户（绑定邮箱）
   * 保留匿名账户的所有数据，只是添加邮箱认证
   * @param {string} email - 邮箱地址
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async upgradeAnonymous(email) {
    if (!this._isAvailable()) {
      return { success: false, error: supabaseConfigError };
    }

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * 退出登录
   * 清除 Supabase Session，用户变为未登录状态
   * @returns {Promise<void>}
   */
  async signOut() {
    if (!this._isAvailable()) return;

    try {
      await supabase.auth.signOut();
      useAuthStore.getState().setUser(null);
      SyncService.resetHydrationState();
    } catch (e) {
      console.warn('[AuthService] 退出登录异常:', e);
    }
  },

  /**
   * 注销账户并删除所有云端数据
   * 调用 Edge Function 执行级联删除
   * @param {string} confirmText - 必须输入 "DELETE" 确认
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteAccount(confirmText) {
    if (!this._isAvailable()) {
      return { success: false, error: supabaseConfigError };
    }

    if (confirmText !== 'DELETE') {
      return { success: false, error: '请输入 DELETE 确认' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: '未登录' };
      }

      const response = await supabase.functions.invoke('delete-account', {
        body: { confirmText },
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      // 注销成功，清除本地状态
      useAuthStore.getState().setUser(null);
      SyncService.resetHydrationState();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
};

export default AuthService;
