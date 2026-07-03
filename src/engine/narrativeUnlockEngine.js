/**
 * 叙事解锁引擎 — 集中管理所有解锁条件判断
 * 锚定文档：docs/08-GARDEN-NARRATIVE.md §6.3 推荐解锁映射
 *
 * 输入 session metrics + lifetime stats + current unlock state
 * 输出本局新增解锁列表
 *
 * @version 2.1
 */
import { NARRATIVE_COLLECTIBLES } from '@engine/narratives';

/**
 * unlockKey → 条件函数映射
 * 每个函数接收 { session, stats }，返回 boolean
 *
 * @type {Object<string, function({session: Object, stats: Object}): boolean>}
 */
const UNLOCK_RULES = {
  // ── 小花盆 · 关于开始 ──
  /** 完成第一次练习散步 */
  first_practice_walk: ({ stats }) => stats.totalWalks >= 1,
  /** 完成第一次日常训练（需 3 局，确保不是单局偶然） */
  first_daily_training: ({ stats }) => stats.totalWalks >= 3,
  /** 尝试更高记忆距离 */
  try_higher_n: ({ stats }) => stats.maxN >= 2,
  /** 累计完成 7 次散步 */
  seven_walks: ({ stats }) => stats.totalWalks >= 7,

  // ── 浇水壶 · 关于照看 ──
  /** 连续 2 天回来 */
  streak_2: ({ stats }) => stats.streakDays >= 2,
  /** 累计完成 5 天散步 */
  streak_5: ({ stats }) => stats.streakDays >= 5,
  /** 完成一次稳定训练（需 3 局基础） */
  stable_session: ({ session, stats }) => session.completed && session.timeoutCount <= 1 && stats.totalWalks >= 3,
  /** 累计完成 15 天散步 */
  streak_15: ({ stats }) => stats.streakDays >= 15,

  // ── 露珠 · 关于看见 ──
  /** 完成一局且没有误触（需 2 局基础） */
  no_false_alarms: ({ session, stats }) => session.completed && session.falseAlarmCount === 0 && stats.totalWalks >= 2,
  /** 未作答不超过 1 次（需 3 局基础，与 no_false_alarms 错开） */
  no_response_lte_1: ({ session, stats }) => session.completed && session.timeoutCount <= 1 && stats.totalWalks >= 3,
  /** 在更高记忆距离中完成一次稳定表现 */
  stable_higher_n: ({ session }) => session.completed && session.n >= 2 && session.timeoutCount <= 1,
  /** 完成一次自己选择的挑战 */
  self_chosen_challenge: ({ session }) => session.completed && session.timed === true,

  // ── 花瓣 · 关于记得 ──
  /** 累计认对 30 次（需多局积累） */
  correct_30: ({ stats }) => stats.totalCorrect >= 30,
  /** 累计认对 60 次 */
  correct_60: ({ stats }) => stats.totalCorrect >= 60,
  /** 连续几局保持稳定（需 3 局基础，连对 5 次） */
  stable_streak: ({ session, stats }) => session.completed && session.streakBest >= 5 && stats.totalWalks >= 3,
  /** 回看一次花园日记 */
  view_diary: ({ stats }) => stats.diaryViewedCount >= 1,

  // ── 小石头 · 关于积累 ──
  /** 累计完成 10 次散步 */
  walks_10: ({ stats }) => stats.totalWalks >= 10,
  /** 累计完成 30 次散步 */
  walks_30: ({ stats }) => stats.totalWalks >= 30,
  /** 累计完成 50 次散步 */
  walks_50: ({ stats }) => stats.totalWalks >= 50,
  /** 累计完成 100 次散步 */
  walks_100: ({ stats }) => stats.totalWalks >= 100,

  // ── 蝴蝶 · 关于相遇 ──
  /** 连续答对 3 次（需 2 局基础） */
  streak_3: ({ session, stats }) => session.completed && session.streakBest >= 3 && stats.totalWalks >= 2,
  /** 连续答对 5 次（需 3 局基础） */
  streak_5_answer: ({ session, stats }) => session.completed && session.streakBest >= 5 && stats.totalWalks >= 3,
  /** 尝试不同素材或不同玩法 */
  try_different_modes: ({ stats }) => stats.usedModes.size >= 2,
  /** 在多个玩法中都完成一次稳定表现 */
  multi_mode_stable: ({ stats }) => stats.usedModes.size >= 2 && stats.stableSessionCount >= 3,

  // ── 风车 · 关于变化 ──
  /** 使用 1 种玩法（需 2 层基础，排除单局必然触发） */
  use_1_mode: ({ stats }) => stats.usedModes.size >= 1 && stats.totalWalks >= 2,
  /** 使用 2 种玩法 */
  use_2_modes: ({ stats }) => stats.usedModes.size >= 2,
  /** 使用 3 种玩法 */
  use_3_modes: ({ stats }) => stats.usedModes.size >= 3,
  /** 自定义过一次节奏或玩法（NOTE: 自定义节奏功能未实现，此条件暂不触发） */
  custom_rhythm: ({ stats }) => stats.customizedRhythm === true,

  // ── 萤火虫 · 关于微光 ──
  /** 开启暮色主题或完成一次安静散步（NOTE: 暮色主题未实现，暂用 challenge/timed 近似） */
  evening_or_quiet: ({ session }) => session.completed && (session.gameMode === 'challenge' || session.gameMode === 'timed'),
  /** 累计完成 7 天散步 */
  streak_7: ({ stats }) => stats.streakDays >= 7,
  /** 在困难局后仍完成散步（需 5 局基础） */
  hard_then_complete: ({ session, stats }) => session.completed && session.hadConsecutiveMisses && stats.totalWalks >= 5,
  /** 累计完成 30 天散步 */
  streak_30: ({ stats }) => stats.streakDays >= 30,
};

/**
 * 评估本局新增解锁
 *
 * @param {Object} params
 * @param {Object} params.session - 本局 session metrics
 * @param {boolean} params.session.completed - 是否完成
 * @param {number} params.session.falseAlarmCount - 误触次数
 * @param {number} params.session.timeoutCount - 未作答次数
 * @param {number} params.session.streakBest - 本局最佳连胜
 * @param {number} params.session.n - N 值
 * @param {string} params.session.gameMode - 游戏模式 (walk/daily/challenge/timed)
 * @param {boolean} params.session.timed - 是否限时模式
 * @param {boolean} params.session.hadConsecutiveMisses - 是否有连续未命中
 * @param {Object} params.stats - 累计统计
 * @param {number} params.stats.totalWalks - 总散步次数
 * @param {number} params.stats.streakDays - 连续天数
 * @param {number} params.stats.maxN - 最大 N 值
 * @param {Set} params.stats.usedModes - 已使用的模式集合
 * @param {number} params.stats.stableSessionCount - 稳定训练次数
 * @param {number} params.stats.totalCorrect - 累计认对次数
 * @param {number} params.stats.diaryViewedCount - 花园日记查看次数
 * @param {boolean} params.stats.customizedRhythm - 是否自定义过节奏
 * @param {Object} params.currentUnlockState - 当前解锁状态 { collectibleId: { tiers: { tierId: { unlocked } } } }
 * @returns {Array<{collectibleId: string, tierId: string, unlockedAt: string}>}
 */
export function evaluateNarrativeUnlocks({ session, stats, currentUnlockState }) {
  const newUnlocks = [];
  const now = new Date().toISOString();

  // 遍历所有收藏品和品质
  for (const collectibleId in UNLOCK_RULES_TO_COLLECTIBLE) {
    const mapping = UNLOCK_RULES_TO_COLLECTIBLE[collectibleId];
    for (const tierId in mapping) {
      const unlockKey = mapping[tierId];

      // 检查是否已解锁
      const already = currentUnlockState?.[collectibleId]?.tiers?.[tierId]?.unlocked;
      if (already) continue;

      // 检查条件
      const rule = UNLOCK_RULES[unlockKey];
      if (!rule) continue;

      try {
        if (rule({ session, stats })) {
          newUnlocks.push({ collectibleId, tierId, unlockedAt: now });
        }
      } catch {
        // 条件函数异常时跳过，不影响其他解锁
      }
    }
  }

  return newUnlocks;
}

/**
 * unlockKey → 收藏品/品质的反向映射
 * 从 narratives.js 的 NARRATIVE_COLLECTIBLES 自动生成，无需手动维护
 *
 * @type {Object<string, Object<string, string>>}
 * 结构: { collectibleId: { tierId: unlockKey } }
 */
const UNLOCK_RULES_TO_COLLECTIBLE = {};
NARRATIVE_COLLECTIBLES.forEach((c) => {
  UNLOCK_RULES_TO_COLLECTIBLE[c.id] = {};
  c.tiers.forEach((t) => {
    UNLOCK_RULES_TO_COLLECTIBLE[c.id][t.tierId] = t.unlockKey;
  });
});

/**
 * 根据 unlockKey 获取解锁规则函数（用于测试）
 * @param {string} unlockKey
 * @returns {Function|undefined}
 */
export function getUnlockRule(unlockKey) {
  return UNLOCK_RULES[unlockKey];
}

/**
 * 获取所有 unlockKey 列表（用于测试）
 * @returns {string[]}
 */
export function getAllUnlockKeys() {
  return Object.keys(UNLOCK_RULES);
}

// ═══════════════════════════════════════════════════════
// 隐藏成就 — 花园秘密
// 独立于 8 件收藏品体系，不在 narratives.js 中
// ═══════════════════════════════════════════════════════

/**
 * 隐藏成就定义
 * 每个成就包含：条件函数 + 激励文案
 *
 * 设计意图：
 * - walk-50/100：激励散步模式用户挑战更高难度
 * - n2/n3/n4-persist：激励在高难度下坚持
 *
 * @type {Object<string, {check: Function, text: string}>}
 */
export const HIDDEN_ACHIEVEMENTS = {
  /** 散步模式累计 50 局 — 激励挑战更高 N */
  'walk-50': {
    check: ({ perModeCounts }) => (perModeCounts.walk || 0) >= 50,
    text: '你在这里走了很久。花园外还有更高的山。',
  },
  /** 散步模式累计 100 局 — 强激励挑战 */
  'walk-100': {
    check: ({ perModeCounts }) => (perModeCounts.walk || 0) >= 100,
    text: '这条路你闭着眼都能走。试试睁开眼走一条新的？',
  },
  /** N=2 累计 10 局 — 激励坚持 */
  'n2-persist': {
    check: ({ perNCounts }) => (perNCounts[2] || 0) >= 10,
    text: '你开始看得更远了。',
  },
  /** N=3 累计 10 局 — 激励坚持 */
  'n3-persist': {
    check: ({ perNCounts }) => (perNCounts[3] || 0) >= 10,
    text: '有些距离，走着走着就短了。',
  },
  /** N=4 累计 10 局 — 最高难度坚持 */
  'n4-persist': {
    check: ({ perNCounts }) => (perNCounts[4] || 0) >= 10,
    text: '你记住了很远的事。花园为你亮了一盏灯。',
  },
};

/**
 * 评估隐藏成就
 *
 * @param {Object} params
 * @param {Object} params.perModeCounts - { walk: N, dual: N, ... }
 * @param {Object} params.perNCounts - { 1: N, 2: N, 3: N, 4: N }
 * @param {Object} params.currentHidden - 已解锁的隐藏成就 { id: unlockedAt }
 * @returns {string[]} 新解锁的隐藏成就 ID 列表
 */
export function evaluateHiddenAchievements({ perModeCounts, perNCounts, currentHidden }) {
  const newUnlocks = [];
  for (const [id, achievement] of Object.entries(HIDDEN_ACHIEVEMENTS)) {
    if (currentHidden[id]) continue;
    try {
      if (achievement.check({ perModeCounts, perNCounts })) {
        newUnlocks.push(id);
      }
    } catch {
      /* 条件函数异常时跳过 */
    }
  }
  return newUnlocks;
}
