/**
 * 花园成长状态管理 — Zustand Store
 * 持久化策略: localStorage (key: 'memory-garden:garden')
 * 管理花园等级、成长点、散步次数、已发现元素
 *
 * 成长阶段（文档 §10.2）：
 * 种子 → 破土 → 发芽 → 长叶 → 花苞 → 半开 → 盛开
 *
 * @version 2.0 - 国际化支持
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@i18n/index';

/** 花园收集元素注册表（存储翻译 key，运行时通过 i18n.t() 获取文案）
 *  icon: store.png 精灵图格子索引（0~24），由 StoreIcon 组件裁切渲染 */
const COLLECTION_ITEMS = [
  { id: 'seed', icon: 10, nameKey: 'garden.collections.seed.name', descKey: 'garden.collections.seed.desc', condition: (s) => s.totalWalks >= 1 },
  { id: 'dew', icon: 3, nameKey: 'garden.collections.dew.name', descKey: 'garden.collections.dew.desc', condition: (s) => s.totalWalks >= 3 },
  { id: 'sprout', icon: 11, nameKey: 'garden.collections.sprout.name', descKey: 'garden.collections.sprout.desc', condition: (s) => s.growthPoints >= 3 },
  { id: 'pebble', icon: 24, nameKey: 'garden.collections.pebble.name', descKey: 'garden.collections.pebble.desc', condition: (s) => s.totalWalks >= 10 },
  { id: 'ladybug', icon: 5, nameKey: 'garden.collections.ladybug.name', descKey: 'garden.collections.ladybug.desc', condition: (s) => s.bestAccuracy >= 0.70 },
  { id: 'butterfly', icon: 7, nameKey: 'garden.collections.butterfly.name', descKey: 'garden.collections.butterfly.desc', condition: (s) => s.bestAccuracy >= 0.85 },
  { id: 'snail', icon: 8, nameKey: 'garden.collections.snail.name', descKey: 'garden.collections.snail.desc', condition: (s) => s.streakDays >= 3 },
  { id: 'breeze', icon: 13, nameKey: 'garden.collections.breeze.name', descKey: 'garden.collections.breeze.desc', condition: (s) => s.growthPoints >= 8 },
  { id: 'clover', icon: 14, nameKey: 'garden.collections.clover.name', descKey: 'garden.collections.clover.desc', condition: (s) => s.bestAccuracy >= 0.90 },
  { id: 'bird', icon: 9, nameKey: 'garden.collections.bird.name', descKey: 'garden.collections.bird.desc', condition: (s) => s.streakDays >= 5 },
  { id: 'mushroom', icon: 23, nameKey: 'garden.collections.mushroom.name', descKey: 'garden.collections.mushroom.desc', condition: (s) => s.totalWalks >= 30 },
  { id: 'stone-path', icon: 24, nameKey: 'garden.collections.stonePath.name', descKey: 'garden.collections.stonePath.desc', condition: (s) => s.growthPoints >= 16 },
  { id: 'dragonfly', icon: 6, nameKey: 'garden.collections.dragonfly.name', descKey: 'garden.collections.dragonfly.desc', condition: (s) => s.streakDays >= 7 },
  { id: 'sunflower', icon: 15, nameKey: 'garden.collections.sunflower.name', descKey: 'garden.collections.sunflower.desc', condition: (s) => s.growthPoints >= 45 },
  { id: 'rainbow', icon: 21, nameKey: 'garden.collections.rainbow.name', descKey: 'garden.collections.rainbow.desc', condition: (s) => s.totalWalks >= 50 },
  { id: 'garden-house', icon: 22, nameKey: 'garden.collections.cottage.name', descKey: 'garden.collections.cottage.desc', condition: (s) => s.growthPoints >= 70 },
];

/**
 * 获取花园收集元素列表（带翻译）
 * @param {Function} t - i18n 翻译函数
 * @returns {Array} 翻译后的收集元素列表
 */
export function getCollectionItems(t) {
  return COLLECTION_ITEMS.map((item) => ({
    ...item,
    name: t(item.nameKey),
    desc: t(item.descKey),
  }));
}

/** 花园成长阶段定义（存储翻译 key）
 *  icon: store.png 精灵图格子索引（0~24） */
const GARDEN_LEVELS = [
  { level: 0, nameKey: 'garden.levels.seed', icon: 10, threshold: 0 },
  { level: 1, nameKey: 'garden.levels.sprout', icon: 11, threshold: 3 },
  { level: 2, nameKey: 'garden.levels.bud', icon: 12, threshold: 8 },
  { level: 3, nameKey: 'garden.levels.leaf', icon: 13, threshold: 16 },
  { level: 4, nameKey: 'garden.levels.budding', icon: 17, threshold: 28 },
  { level: 5, nameKey: 'garden.levels.halfBloom', icon: 16, threshold: 45 },
  { level: 6, nameKey: 'garden.levels.fullBloom', icon: 15, threshold: 70 },
];

/**
 * 获取花园等级列表（带翻译）
 * @param {Function} t - i18n 翻译函数
 * @returns {Array} 翻译后的等级列表
 */
export function getGardenLevels(t) {
  return GARDEN_LEVELS.map((level) => ({
    ...level,
    name: t(level.nameKey),
  }));
}

/**
 * 根据成长点数计算当前等级（使用翻译后的等级列表）
 * @param {number} points - 成长点数
 * @returns {{ level: number, name: string, icon: string, threshold: number, nextThreshold: number, progress: number }}
 */
function computeLevel(points) {
  const levels = getGardenLevels(i18n.t.bind(i18n));
  let current = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].threshold) {
      current = levels[i];
      break;
    }
  }

  const nextIndex = Math.min(current.level + 1, levels.length - 1);
  const nextThreshold = levels[nextIndex].threshold;
  const prevThreshold = current.threshold;
  const progress = nextThreshold > prevThreshold
    ? Math.min(1, (points - prevThreshold) / (nextThreshold - prevThreshold))
    : 1;

  return {
    level: current.level,
    name: current.name,
    icon: current.icon,
    threshold: current.threshold,
    nextThreshold,
    progress,
  };
}

const useGardenStore = create(
  persist(
    (set, get) => ({
      // === 花园状态 ===
      /** @type {number} 成长点数 */
      growthPoints: 0,
      /** @type {number} 总散步次数 */
      totalWalks: 0,
      /** @type {string[]} 已发现的花园元素 ID */
      discovered: [],
      /** @type {string|null} 最后一次散步日期 */
      lastWalkDate: null,
      /** @type {number} 连续散步天数 */
      streakDays: 0,
      /** @type {number} 历史最佳命中率 (0-1) */
      bestAccuracy: 0,
      /** @type {string[]} 本次新解锁的元素 ID */
      newlyUnlocked: [],

      /**
       * 添加成长点（每局结算时调用）
       * @param {Object} params
       * @param {number} params.points - 成长点数
       * @param {number} params.accuracy - 本局命中率 (0-1)
       */
      addGrowthPoints: ({ points, accuracy }) => {
        set((state) => {
          // 计算连续天数
          const today = new Date().toDateString();
          const lastDate = state.lastWalkDate;
          let newStreak = state.streakDays;
          if (lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            newStreak = lastDate === yesterday ? state.streakDays + 1 : 1;
          }

          return {
            growthPoints: state.growthPoints + points,
            totalWalks: state.totalWalks + 1,
            lastWalkDate: today,
            streakDays: newStreak,
            bestAccuracy: Math.max(state.bestAccuracy, accuracy),
            newlyUnlocked: [],
          };
        });
      },

      /**
       * 获取当前满足条件但未解锁的收集元素候选列表
       * @returns {string[]} 候选元素 ID 列表
       */
      getUnlockCandidates: () => {
        const state = get();
        return COLLECTION_ITEMS
          .filter((item) => !state.discovered.includes(item.id) && item.condition(state))
          .map((item) => item.id);
      },

      /**
       * 解锁单个收集元素
       * @param {string} itemId - 元素 ID
       */
      unlockSingle: (itemId) => {
        set((state) => {
          if (state.discovered.includes(itemId)) return {};
          return {
            discovered: [...state.discovered, itemId],
            newlyUnlocked: [itemId],
          };
        });
      },

      /**
       * 获取当前花园等级信息
       * @returns {{ level: number, name: string, icon: string, threshold: number, nextThreshold: number, progress: number }}
       */
      getGardenLevel: () => {
        return computeLevel(get().growthPoints);
      },

      /**
       * 根据命中率计算成长点数
       * @param {number} accuracy - 命中率 (0-1)
       * @returns {number} 成长点数
       */
      calculateGrowthPoints: (accuracy) => {
        let points = 1; // 保底 1 点
        if (accuracy >= 0.70) points += 1;
        if (accuracy >= 0.90) points += 1;
        return points;
      },

      /**
       * 重置花园状态
       */
      reset: () => set({
        growthPoints: 0,
        totalWalks: 0,
        discovered: [],
        lastWalkDate: null,
        streakDays: 0,
        bestAccuracy: 0,
        newlyUnlocked: [],
      }),
    }),
    {
      name: 'memory-garden:garden',
      /**
       * localStorage 写入错误回调
       * 花园数据较小，通常不会溢出，但仍需防御
       * @param {Error} error
       */
      onError: (error) => {
        console.warn('[GardenStore] 存储写入失败:', error.name);
      },
    }
  )
);

export default useGardenStore;
export { GARDEN_LEVELS, COLLECTION_ITEMS, computeLevel };
