/**
 * 统计数据状态管理 — Zustand Store
 * 持久化策略: localStorage (key: 'memory-garden:stats')
 * v1.0使用localStorage，v1.1将迁移至IndexedDB
 * 管理高分记录、会话历史、成就
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStatsStore = create(
  persist(
    (set, get) => ({
      // === 高分记录 ===
      /** @type {Record<string, number>} modeId → bestScore */
      bestScores: {},

      // === 会话记录 ===
      /** @type {Array} 最近的游戏会话 (最多100条) */
      sessions: [],

      // === 按模式/N值的累计计数 ===
      /** @type {Record<string, number>} modeId → 累计局数 */
      perModeCounts: {},
      /** @type {Record<number, number>} N值 → 累计局数 */
      perNCounts: {},

      // === 动作 ===

      /**
       * 保存一场游戏会话
       * @param {Object} session - 会话数据
       */
      addSession: (session) => set((state) => {
        const newSessions = [...state.sessions, session].slice(-100);
        const modeId = session.modeId || `standard-n${session.difficulty}`;
        const currentBest = state.bestScores[modeId] || 0;
        const newBest = Math.max(currentBest, session.score);

        // 按模式累计计数
        const newPerMode = { ...state.perModeCounts };
        newPerMode[modeId] = (newPerMode[modeId] || 0) + 1;

        // 按 N 值累计计数
        const n = session.difficulty || 1;
        const newPerN = { ...state.perNCounts };
        newPerN[n] = (newPerN[n] || 0) + 1;

        return {
          sessions: newSessions,
          bestScores: {
            ...state.bestScores,
            [modeId]: newBest,
          },
          perModeCounts: newPerMode,
          perNCounts: newPerN,
        };
      }),

      /**
       * 获取指定模式的最高分
       * @param {string} modeId
       * @returns {number}
       */
      getBestScore: (modeId) => {
        return get().bestScores[modeId] || 0;
      },

      /**
       * 获取指定模式的平均分
       * @param {string} modeId
       * @param {number} [recent=10] - 取最近N场
       * @returns {number}
       */
      getAverageScore: (modeId, recent = 10) => {
        const sessions = get().sessions
          .filter((s) => (s.modeId || `standard-n${s.difficulty}`) === modeId)
          .slice(-recent);
        if (sessions.length === 0) return 0;
        return sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length;
      },
    }),
    {
      name: 'memory-garden:stats',
    }
  )
);

export default useStatsStore;
