/**
 * 统计数据状态管理 — Zustand Store
 * 持久化策略: localStorage (key: 'memory-garden:stats')
 * v1.0使用localStorage，v1.1将迁移至IndexedDB
 * 管理高分记录、会话历史、成就
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 为 session 补齐稳定主键。
 * @param {Object} session
 * @returns {Object}
 */
export function ensureSessionId(session) {
  if (!session || typeof session !== 'object') return session;
  if (typeof session.id === 'string' && session.id.length > 0) return session;
  return {
    ...session,
    id: crypto.randomUUID(),
  };
}

/**
 * 从 sessions 重建统计派生字段，避免出现“双份真相”。
 * @param {Array} rawSessions
 * @param {number} warmupSessionsUsed
 * @returns {{sessions: Array, bestScores: Record<string, number>, perModeCounts: Record<string, number>, perNCounts: Record<string, number>, warmupSessionsUsed: number}}
 */
export function buildStatsSnapshot(rawSessions, warmupSessionsUsed = 0) {
  const sessions = Array.isArray(rawSessions)
    ? rawSessions
        .filter((s) => s && typeof s.score === 'number' && s.startedAt)
        .map((s) => ensureSessionId(s))
        .slice(-100)
    : [];

  const bestScores = {};
  const perModeCounts = {};
  const perNCounts = {};

  sessions.forEach((session) => {
    const modeId = session.modeId || `standard-n${session.difficulty}`;
    const score = typeof session.score === 'number' ? session.score : 0;
    bestScores[modeId] = Math.max(bestScores[modeId] || 0, score);
    perModeCounts[modeId] = (perModeCounts[modeId] || 0) + 1;

    const n = session.difficulty || 1;
    perNCounts[n] = (perNCounts[n] || 0) + 1;
  });

  return {
    sessions,
    bestScores,
    perModeCounts,
    perNCounts,
    warmupSessionsUsed:
      typeof warmupSessionsUsed === 'number' && Number.isFinite(warmupSessionsUsed)
        ? warmupSessionsUsed
        : sessions.filter((session) => session.isWarmupSession).length,
  };
}

const initialStatsState = {
  /** @type {Record<string, number>} modeId → bestScore */
  bestScores: {},
  /** @type {Array} 最近的游戏会话 (最多100条) */
  sessions: [],
  /** @type {Record<string, number>} modeId → 累计局数 */
  perModeCounts: {},
  /** @type {Record<number, number>} N值 → 累计局数 */
  perNCounts: {},
  /** @type {number} 已使用的暖身局数（前 3 局不参与自适应计算） */
  warmupSessionsUsed: 0,
};

const useStatsStore = create(
  persist(
    (set, get) => ({
      ...initialStatsState,

      // === 动作 ===

      /**
       * 保存一场游戏会话
       * @param {Object} session - 会话数据
       */
      addSession: (session) => set((state) => {
        const normalizedSession = ensureSessionId(session);
        const snapshot = buildStatsSnapshot(
          [...state.sessions, normalizedSession],
          session.isWarmupSession
            ? state.warmupSessionsUsed + 1
            : state.warmupSessionsUsed,
        );
        return snapshot;
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

      /**
       * 重置统计状态到新用户初始态
       */
      reset: () => set(initialStatsState),
    }),
    {
      name: 'memory-garden:stats',
      /**
       * 合并持久化状态时过滤掉旧版 session 数据
       * 旧版 session 缺少 hits/falseAlarms/accuracy 等字段会导致统计页 NaN
       * @param {Object} persistedState - 从 localStorage 读取的状态
       * @param {Object} currentState - store 的默认初始状态
       * @returns {Object} 合并后的有效状态
       */
      merge: (persistedState, currentState) => {
        const snapshot = buildStatsSnapshot(
          persistedState.sessions,
          persistedState.warmupSessionsUsed ?? currentState.warmupSessionsUsed,
        );
        return {
          ...currentState,
          ...persistedState,
          ...snapshot,
        };
      },
      /**
       * localStorage 写入错误回调
       * 捕获 QuotaExceededError 后自动裁剪最旧的 session
       * @param {Error} error
       */
      onError: (error) => {
        console.warn('[StatsStore] 存储写入失败:', error.name);
        // 如果是配额超限，裁剪最旧的 session
        if (error.name === 'QuotaExceededError' || error.code === 22) {
          try {
            const state = useStatsStore.getState();
            const snapshot = buildStatsSnapshot(state.sessions.slice(-50), state.warmupSessionsUsed);
            useStatsStore.setState(snapshot);
            console.warn('[StatsStore] 已自动裁剪至最近 50 局');
          } catch {
            // 裁剪也失败，静默降级
          }
        }
      },
    }
  )
);

export default useStatsStore;
