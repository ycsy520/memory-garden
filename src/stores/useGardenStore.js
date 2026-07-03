/**
 * 花园成长状态管理 — Zustand Store
 * 持久化策略: localStorage (key: 'memory-garden:garden')
 * 管理花园等级、成长点、散步次数、已发现元素
 *
 * 成长阶段（文档 §10.2）：
 * 种子 → 破土 → 发芽 → 长叶 → 花苞 → 半开 → 盛开
 *
 * @version 1.0
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 花园收集元素注册表 */
const COLLECTION_ITEMS = [
  { id: 'seed', icon: '🌱', name: '种子', desc: '第一次走进花园', condition: (s) => s.totalWalks >= 1 },
  { id: 'dew', icon: '💧', name: '露珠', desc: '清晨的礼物', condition: (s) => s.totalWalks >= 3 },
  { id: 'sprout', icon: '🌿', name: '嫩芽', desc: '花园开始生长', condition: (s) => s.growthPoints >= 3 },
  { id: 'pebble', icon: '🪨', name: '小石子', desc: '铺一条小路', condition: (s) => s.totalWalks >= 10 },
  { id: 'ladybug', icon: '🐞', name: '瓢虫', desc: '记忆越来越准', condition: (s) => s.bestAccuracy >= 0.70 },
  { id: 'butterfly', icon: '🦋', name: '蝴蝶', desc: '花间飞舞', condition: (s) => s.bestAccuracy >= 0.85 },
  { id: 'snail', icon: '🐌', name: '蜗牛', desc: '每天都来', condition: (s) => s.streakDays >= 3 },
  { id: 'breeze', icon: '🍃', name: '微风', desc: '花园长大了', condition: (s) => s.growthPoints >= 8 },
  { id: 'clover', icon: '☘️', name: '四叶草', desc: '好运降临', condition: (s) => s.bestAccuracy >= 0.90 },
  { id: 'bird', icon: '🐦', name: '小鸟', desc: '坚持一周', condition: (s) => s.streakDays >= 5 },
  { id: 'mushroom', icon: '🍄', name: '蘑菇', desc: '雨后生长', condition: (s) => s.totalWalks >= 30 },
  { id: 'stone-path', icon: '🪵', name: '石头路', desc: '花园长叶了', condition: (s) => s.growthPoints >= 16 },
  { id: 'dragonfly', icon: '🪻', name: '蜻蜓', desc: '连续一周', condition: (s) => s.streakDays >= 7 },
  { id: 'sunflower', icon: '🌻', name: '向日葵', desc: '花园半开', condition: (s) => s.growthPoints >= 45 },
  { id: 'rainbow', icon: '🌈', name: '彩虹', desc: '50 次散步', condition: (s) => s.totalWalks >= 50 },
  { id: 'garden-house', icon: '🏡', name: '花园小屋', desc: '花园盛开', condition: (s) => s.growthPoints >= 70 },
];

/** 花园成长阶段定义 */
const GARDEN_LEVELS = [
  { level: 0, name: '种子', icon: '🌱', threshold: 0 },
  { level: 1, name: '破土', icon: '🌿', threshold: 3 },
  { level: 2, name: '发芽', icon: '☘️', threshold: 8 },
  { level: 3, name: '长叶', icon: '🍀', threshold: 16 },
  { level: 4, name: '花苞', icon: '🌸', threshold: 28 },
  { level: 5, name: '半开', icon: '🌺', threshold: 45 },
  { level: 6, name: '盛开', icon: '🌻', threshold: 70 },
];

/**
 * 根据成长点数计算当前等级
 * @param {number} points - 成长点数
 * @returns {{ level: number, name: string, icon: string, threshold: number, nextThreshold: number, progress: number }}
 */
function computeLevel(points) {
  let current = GARDEN_LEVELS[0];
  for (let i = GARDEN_LEVELS.length - 1; i >= 0; i--) {
    if (points >= GARDEN_LEVELS[i].threshold) {
      current = GARDEN_LEVELS[i];
      break;
    }
  }

  const nextIndex = Math.min(current.level + 1, GARDEN_LEVELS.length - 1);
  const nextThreshold = GARDEN_LEVELS[nextIndex].threshold;
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
       * 检查并解锁收集元素
       * @returns {string[]} 本次新解锁的元素 ID 列表
       */
      checkAndUnlock: () => {
        const state = get();
        const newDiscovered = [...state.discovered];
        const newItems = [];
        COLLECTION_ITEMS.forEach((item) => {
          if (!newDiscovered.includes(item.id) && item.condition(state)) {
            newDiscovered.push(item.id);
            newItems.push(item.id);
          }
        });
        if (newItems.length > 0) {
          set({ discovered: newDiscovered, newlyUnlocked: newItems });
        }
        return newItems;
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
    }
  )
);

export default useGardenStore;
export { GARDEN_LEVELS, COLLECTION_ITEMS, computeLevel };
