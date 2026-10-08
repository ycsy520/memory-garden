/**
 * 花园收藏系统 — Zustand Store (v2)
 * 持久化策略: localStorage (key: 'memory-garden:achievements')
 *
 * 只存用户解锁状态，不存故事文本
 * 故事文本从 narratives.js 派生
 *
 * @version 2.0
 * @requires narratives.js — 唯一文本来源
 * @requires narrativeUnlockEngine.js — 唯一解锁逻辑
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NARRATIVE_COLLECTIBLES } from '@engine/narratives';
import SyncService from '@services/SyncService';

/**
 * v1 → v2 收藏品 ID 映射
 * 旧 ID → 新 ID（对齐 narratives.js）
 */
const V1_TO_V2_ID_MAP = {
  flowerpot: 'small-pot',
  wateringCan: 'watering-can',
  dewdrop: 'dew',
  petal: 'petal',
  pebble: 'small-stone',
  butterfly: 'butterfly',
  windmill: 'pinwheel',
  firefly: 'firefly',
};

/**
 * v1 → v2 品质 ID 映射
 * 旧 ID → 新 ID（对齐 narratives.js）
 */
const V1_TO_V2_TIER_MAP = {
  sprout: 'sprout',
  leaf: 'leaf',
  bloom: 'bloom',
  full: 'fullBloom',
};

/**
 * v1 → v2 数据迁移函数
 * 将旧格式的 collection 转换为新格式的 unlockedNarratives
 *
 * @param {Object} v1Collection - 旧格式 { flowerpot: 'leaf', ... }
 * @returns {Object} 新格式 { 'small-pot': 'leaf', ... }
 */
function migrateV1Collection(v1Collection) {
  if (!v1Collection || typeof v1Collection !== 'object') return {};

  const migrated = {};
  Object.entries(v1Collection).forEach(([oldId, oldTier]) => {
    const newId = V1_TO_V2_ID_MAP[oldId];
    const newTier = V1_TO_V2_TIER_MAP[oldTier];
    if (newId && newTier) {
      migrated[newId] = newTier;
    }
  });
  return migrated;
}

const initialAchievementState = {
  achievementSchemaVersion: 2,
  unlockedNarratives: {},
  unlockTimestamps: {},
  recentUnlockQueue: [],
  readNarratives: [],
  diaryEntries: [],
  fullTextEntries: {},
  hasViewedGardenDiary: false,
  hiddenAchievements: {},
};

/**
 * 花园收藏状态 Store
 *
 * 状态结构：
 * - achievementSchemaVersion: number — 版本号，用于迁移
 * - unlockedNarratives: { collectibleId: highestTierId } — 最高解锁品质
 * - recentUnlockQueue: Array<{collectibleId, tierId, unlockedAt}> — 待展示队列
 * - readNarratives: string[] — 已读故事（格式 "collectibleId:tierId"）
 * - diaryEntries: Array<{collectibleId, tierId, fragmentIndex, readAt}> — 已读日记碎片
 * - fullTextEntries: { [collectibleId]: { text: string, savedAt: string } } — 完整故事文本
 * - hasViewedGardenDiary: boolean — 是否已查看花园日记入口
 * - hiddenAchievements: { [id: string]: string } — 隐藏成就 { 'walk-50': unlockedAt }
 */
const useAchievementStore = create(
  persist(
    (set, get) => ({
      // ── 状态 ──
      ...initialAchievementState,

      // ── 解锁操作 ──

      /**
       * 批量应用解锁结果（由 useGameEngine 结算时调用）
       * @param {Array<{collectibleId: string, tierId: string, unlockedAt: string}>} unlocks
       */
      applyUnlocks: (unlocks) => {
        if (!unlocks || unlocks.length === 0) return;

        set((state) => {
          const newUnlocked = { ...state.unlockedNarratives };
          const newTimestamps = { ...state.unlockTimestamps };
          const newQueue = [...state.recentUnlockQueue];

          unlocks.forEach(({ collectibleId, tierId, unlockedAt }) => {
            const ts = unlockedAt || new Date().toISOString();
            // 更新最高解锁品质
            const currentTier = newUnlocked[collectibleId];
            if (!currentTier || getTierOrder(tierId) > getTierOrder(currentTier)) {
              newUnlocked[collectibleId] = tierId;
            }
            // 记录首次发现时间
            if (!newTimestamps[collectibleId]) {
              newTimestamps[collectibleId] = ts;
            }
            // R10: 加入待展示队列前按 collectibleId:tierId 去重
            const queueKey = `${collectibleId}:${tierId}`;
            const alreadyQueued = newQueue.some(
              (item) => `${item.collectibleId}:${item.tierId}` === queueKey
            );
            if (!alreadyQueued) {
              newQueue.push({ collectibleId, tierId, unlockedAt: ts });
            }
          });

          // 云端同步：解锁发生时上传到 Supabase（仅已登录用户）
          try {
            SyncService.syncNarrativeUnlocks(unlocks);
          } catch {
            /* 同步异常不影响解锁流程 */
          }

          return {
            unlockedNarratives: newUnlocked,
            unlockTimestamps: newTimestamps,
            recentUnlockQueue: newQueue,
          };
        });
      },

      /**
       * 从队列中取出下一个待展示的解锁
       * @returns {{collectibleId: string, tierId: string, unlockedAt: string} | null}
       */
      popRecentUnlock: () => {
        const state = get();
        if (state.recentUnlockQueue.length === 0) return null;

        const [next, ...rest] = state.recentUnlockQueue;
        set({ recentUnlockQueue: rest });
        return next;
      },

      /**
       * 清空待展示队列
       */
      clearUnlockQueue: () => set({ recentUnlockQueue: [] }),

      /**
       * 解锁隐藏成就
       * @param {string} achievementId - 隐藏成就 ID（如 'walk-50'）
       * @returns {boolean} 是否为新解锁
       */
      applyHiddenUnlock: (achievementId) => {
        const state = get();
        if (state.hiddenAchievements[achievementId]) return false;
        set({
          hiddenAchievements: {
            ...state.hiddenAchievements,
            [achievementId]: new Date().toISOString(),
          },
        });
        return true;
      },

      // ── 阅读状态 ──

      /**
       * 标记某档故事已读
       * @param {string} collectibleId
       * @param {string} tierId
       */
      markNarrativeRead: (collectibleId, tierId) => {
        const key = `${collectibleId}:${tierId}`;
        set((state) => {
          if (state.readNarratives.includes(key)) return state;
          return { readNarratives: [...state.readNarratives, key] };
        });
      },

      /**
       * 检查某档故事是否已读
       * @param {string} collectibleId
       * @param {string} tierId
       * @returns {boolean}
       */
      isNarrativeRead: (collectibleId, tierId) => {
        return get().readNarratives.includes(`${collectibleId}:${tierId}`);
      },

      // ── 日记碎片 ──

      /**
       * 记录日记碎片已读
       * @param {string} collectibleId
       * @param {string} tierId
       * @param {number} fragmentIndex
       */
      markDiaryFragmentRead: (collectibleId, tierId, fragmentIndex) => {
        set((state) => {
          const exists = state.diaryEntries.some(
            (e) => e.collectibleId === collectibleId && e.tierId === tierId && e.fragmentIndex === fragmentIndex
          );
          if (exists) return state;
          const newEntry = { collectibleId, tierId, fragmentIndex, readAt: new Date().toISOString() };

          // 云端同步：日记碎片新增时上传（仅已登录用户）
          try {
            SyncService.syncDiaryEntry(newEntry);
          } catch {
            /* 同步异常不影响日记记录 */
          }

          return {
            diaryEntries: [
              ...state.diaryEntries,
              newEntry,
            ],
          };
        });
      },

      /**
       * 标记花园日记入口已查看
       */
      markGardenDiaryViewed: () => set({ hasViewedGardenDiary: true }),

      // ── 完整故事文本 ──

      /**
       * 保存完整故事文本到日记
       * @param {string} collectibleId - 收藏品 ID
       * @param {string} text - 完整故事文本
       */
      saveFullText: (collectibleId, text) => set((state) => ({
        fullTextEntries: {
          ...state.fullTextEntries,
          [collectibleId]: {
            text,
            savedAt: new Date().toISOString(),
          },
        },
      })),

      /**
       * 获取已保存的完整故事
       * @param {string} collectibleId
       * @returns {{ text: string, savedAt: string }|undefined}
       */
      getFullText: (collectibleId) => {
        return get().fullTextEntries[collectibleId];
      },

      // ── 查询方法 ──

      /**
       * 获取指定收藏品的最高解锁品质
       * @param {string} collectibleId
       * @returns {string|null} tierId 或 null
       */
      getHighestTier: (collectibleId) => {
        return get().unlockedNarratives[collectibleId] || null;
      },

      /**
       * 检查某档是否已解锁
       * @param {string} collectibleId
       * @param {string} tierId
       * @returns {boolean}
       */
      isTierUnlocked: (collectibleId, tierId) => {
        const highest = get().unlockedNarratives[collectibleId];
        if (!highest) return false;
        return getTierOrder(tierId) <= getTierOrder(highest);
      },

      /**
       * 获取所有已解锁的收藏品 ID 列表
       * @returns {string[]}
       */
      getUnlockedCollectibleIds: () => {
        return Object.keys(get().unlockedNarratives);
      },

      /**
       * 获取已读日记碎片列表（按时间倒序）
       * @returns {Array}
       */
      getDiaryEntries: () => {
        return [...get().diaryEntries].sort((a, b) => new Date(b.readAt) - new Date(a.readAt));
      },

      /**
       * 获取指定收藏品的首次发现时间
       * @param {string} collectibleId
       * @returns {string|null} ISO 日期字符串
       */
      getUnlockTimestamp: (collectibleId) => {
        return get().unlockTimestamps[collectibleId] || null;
      },

      /**
       * 获取解锁统计
       * @returns {{totalUnlocked: number, totalPossible: number, percentage: number}}
       */
      getUnlockStats: () => {
        const unlocked = Object.keys(get().unlockedNarratives).length;
        const total = 8; // 8 件收藏品
        return {
          totalUnlocked: unlocked,
          totalPossible: total,
          percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
        };
      },

      /**
       * 重置收藏与日记状态到新用户初始态
       */
      reset: () => set(initialAchievementState),
    }),
    {
      name: 'memory-garden:achievements',
      /**
       * 仅持久化用户事实数据
       * 完整故事文本可由 narratives.js 重建，不落盘以保持备份和本地存储精简
       */
      partialize: (state) => ({
        achievementSchemaVersion: state.achievementSchemaVersion,
        unlockedNarratives: state.unlockedNarratives,
        unlockTimestamps: state.unlockTimestamps,
        recentUnlockQueue: state.recentUnlockQueue,
        readNarratives: state.readNarratives,
        diaryEntries: state.diaryEntries,
        hasViewedGardenDiary: state.hasViewedGardenDiary,
        hiddenAchievements: state.hiddenAchievements,
      }),
      /**
       * localStorage 写入错误回调
       * 捕获 QuotaExceededError 后自动裁剪 diaryEntries
       * @param {Error} error
       */
      onError: (error) => {
        console.warn('[AchievementStore] 存储写入失败:', error.name);
        if (error.name === 'QuotaExceededError') {
          try {
            const state = useAchievementStore.getState();
            const trimmed = (state.diaryEntries || []).slice(-50);
            useAchievementStore.setState({ diaryEntries: trimmed });
            console.warn('[AchievementStore] 已自动裁剪 diaryEntries 至最近 50 条');
          } catch {
            // 裁剪也失败，静默降级
          }
        }
      },
      /**
       * 自定义反序列化：处理 v1 → v2 迁移
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // 检查是否需要迁移
        if (state.achievementSchemaVersion < 2) {
          console.log('[AchievementStore] Migrating v1 → v2...');

          // 迁移 collection → unlockedNarratives
          if (state.collection) {
            state.unlockedNarratives = migrateV1Collection(state.collection);
            delete state.collection;
          }

          // 迁移 recentUnlock → recentUnlockQueue
          if (state.recentUnlock && !state.recentUnlockQueue) {
            state.recentUnlockQueue = [state.recentUnlock];
          }
          delete state.recentUnlock;

          // 初始化新字段
          if (!state.unlockTimestamps) state.unlockTimestamps = {};
          if (!state.readNarratives) state.readNarratives = [];
          if (!state.diaryEntries) state.diaryEntries = [];
          if (!state.hasViewedGardenDiary) state.hasViewedGardenDiary = false;

          state.achievementSchemaVersion = 2;
          console.log('[AchievementStore] Migration complete:', state.unlockedNarratives);
        }
      },
    }
  )
);

/**
 * 品质档位排序值（用于比较高低）
 * @param {string} tierId
 * @returns {number}
 */
function getTierOrder(tierId) {
  const order = { sprout: 0, leaf: 1, bloom: 2, fullBloom: 3 };
  return order[tierId] ?? -1;
}

// ── 向后兼容导出（T6/T7 完成屏幕重写后移除） ──

/**
 * 品质档位定义（向后兼容）
 * T7 重写 AchievementsScreen 后此导出将移除
 */
const TIERS = [
  { id: 'sprout', name: '初芽', order: 0 },
  { id: 'leaf', name: '翠叶', order: 1 },
  { id: 'bloom', name: '繁花', order: 2 },
  { id: 'fullBloom', name: '盛放', order: 3 },
];

/**
 * 从 narratives.js 派生的收藏品定义（向后兼容）
 * T6/T7 重写屏幕后此导出将移除
 *
 * @type {Array<{id: string, name: string, desc: string, tiers: Array<{tier: string, icon: string}>}>}
 */
const COLLECTION_DEFS = NARRATIVE_COLLECTIBLES.map((c) => ({
  id: c.id,
  name: c.name,
  desc: c.description,
  tiers: c.tiers.map((t) => ({
    tier: t.tierId,
    icon: c.icon,
  })),
}));

export default useAchievementStore;
export { COLLECTION_DEFS, TIERS, migrateV1Collection, getTierOrder };
