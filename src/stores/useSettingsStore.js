/**
 * 用户设置状态管理 — Zustand Store
 * 持久化策略: localStorage (key: 'memory-garden:settings')
 * 管理语言偏好、音量、难度等用户偏好
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import StorageService from '@services/StorageService';

/**
 * Zustand 设置仓库的持久化适配层。
 * 统一通过 StorageService 读写，确保 i18n 初始化与 store 持久化走同一套存储入口。
 */
const settingsPersistStorage = {
  /**
   * 读取设置持久化快照。
   * @param {string} name - 存储键名
   * @returns {object|null}
   */
  getItem(name) {
    return StorageService.get(name);
  },
  /**
   * 写入设置持久化快照。
   * @param {string} name - 存储键名
   * @param {object} value - persist 序列化后的值
   */
  setItem(name, value) {
    StorageService.set(name, value);
  },
  /**
   * 删除设置持久化快照。
   * @param {string} name - 存储键名
   */
  removeItem(name) {
    StorageService.remove(name);
  },
};

const useSettingsStore = create(
  persist(
    (set) => ({
      // === 语言 ===
      /** @type {'zh-CN'|'zh-TW'|'en-US'} */
      lang: 'zh-CN',
      /**
       * 用户是否主动设置过语言
       * - false: 首次启动，走 navigator.language 自动匹配
       * - true: 用户已通过 setLang/switchLanguage 主动选择
       * - undefined: 老用户升级（视为已主动设置，不走自动匹配）
       * @type {boolean|undefined}
       */
      hasLangSetByUser: false,

      // === 音频 ===
      /** @type {boolean} */
      isMuted: false,

      // === 难度选择 ===
      /** @type {number} 当前选择的难度索引 (0=初晨, 1=午后, 2=暮色) */
      levelIndex: 0,

      // === 引导 ===
      /** @type {boolean} 是否已看过引导页 */
      hasSeenIntro: false,

      // === 动作 ===

      /** 切换到下一种语言 */
      switchLanguage: () => set((state) => {
        const langs = ['zh-CN', 'zh-TW', 'en-US'];
        const nextIndex = (langs.indexOf(state.lang) + 1) % langs.length;
        return { lang: langs[nextIndex], hasLangSetByUser: true };
      }),

      /** 设置语言 */
      setLang: (lang) => set({ lang, hasLangSetByUser: true }),

      /** 切换静音 */
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      /**
       * 直接设置背景音乐静音状态
       * 用于让持久化设置与 AudioService 保持单一来源，避免双方各自切换导致状态漂移。
       * @param {boolean} nextMuted - 目标静音状态
       */
      setMuted: (nextMuted) => set({ isMuted: !!nextMuted }),

      /** 设置难度 */
      setLevelIndex: (idx) => set({ levelIndex: idx }),

      /** 标记已看过引导 */
      markIntroSeen: () => set({ hasSeenIntro: true }),
    }),
    {
      name: 'memory-garden:settings',
      storage: settingsPersistStorage,
    }
  )
);

export default useSettingsStore;
