/**
 * 认证状态 Zustand Store
 * 不持久化到 localStorage（每次启动从 Supabase Session 重新获取）
 * 管理登录状态、同步状态、用户信息
 *
 * @module useAuthStore
 */
import { create } from 'zustand';

/**
 * 认证状态 Store
 *
 * 状态结构：
 * - user: Supabase User 对象 | null
 * - isAnonymous: 是否匿名用户（默认 true）
 * - isLoggedIn: 是否已登录（非匿名，默认 false）
 * - isLoading: 初始化中（默认 true）
 * - lastSyncAt: 最后同步时间（ISO 字符串）
 * - isSyncing: 是否正在同步
 * - syncError: 同步错误信息
 * - pendingSyncCount: 待同步条数
 */
const useAuthStore = create((set) => ({
  // ── 认证状态 ──
  /** @type {Object|null} Supabase User 对象 */
  user: null,
  /** @type {boolean} 是否匿名用户 */
  isAnonymous: true,
  /** @type {boolean} 是否已登录（非匿名） */
  isLoggedIn: false,
  /** @type {boolean} 初始化中 */
  isLoading: true,

  // ── 同步状态 ──
  /** @type {string|null} 最后同步时间（ISO 字符串） */
  lastSyncAt: null,
  /** @type {boolean} 是否正在同步 */
  isSyncing: false,
  /** @type {string|null} 同步错误信息 */
  syncError: null,
  /** @type {number} 待同步条数 */
  pendingSyncCount: 0,
  /** @type {number|undefined} 本轮同步中被丢弃的条数（重试耗尽或类型未知，仅诊断用） */
  droppedSyncCount: undefined,

  // ── 动作 ──

  /**
   * 设置用户信息（AuthService.init 调用）
   * @param {Object|null} user - Supabase User 对象
   */
  setUser: (user) => set({
    user,
    isAnonymous: user?.is_anonymous ?? true,
    isLoggedIn: user ? !user.is_anonymous : false,
    isLoading: false,
  }),

  /**
   * 设置初始化完成（无用户时调用）
   */
  setLoadingDone: () => set({ isLoading: false }),

  /**
   * 更新同步状态
   * @param {Object} status - { isSyncing?, lastSyncAt?, syncError?, pendingSyncCount? }
   */
  setSyncStatus: (status) => set(status),
}));

export default useAuthStore;
