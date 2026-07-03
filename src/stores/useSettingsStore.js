/**
 * 用户设置状态管理 — Zustand Store
 * 持久化策略: localStorage (key: 'memory-garden:settings')
 * 管理语言偏好、音量、难度等用户偏好
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      // === 语言 ===
      /** @type {'zh-CN'|'zh-TW'|'en-US'} */
      lang: 'zh-CN',

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
        return { lang: langs[nextIndex] };
      }),

      /** 设置语言 */
      setLang: (lang) => set({ lang }),

      /** 切换静音 */
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      /** 设置难度 */
      setLevelIndex: (idx) => set({ levelIndex: idx }),

      /** 标记已看过引导 */
      markIntroSeen: () => set({ hasSeenIntro: true }),
    }),
    {
      name: 'memory-garden:settings',
    }
  )
);

export default useSettingsStore;
