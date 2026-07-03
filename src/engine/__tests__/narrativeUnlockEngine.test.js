/**
 * narrativeUnlockEngine 单元测试 — 解锁规则引擎
 */
import { describe, it, expect } from 'vitest';
import { evaluateNarrativeUnlocks, getUnlockRule, getAllUnlockKeys, evaluateHiddenAchievements } from '../narrativeUnlockEngine';

describe('narrativeUnlockEngine', () => {
  describe('getAllUnlockKeys', () => {
    it('应该包含所有 32 个规则（8件 × 4档）', () => {
      const keys = getAllUnlockKeys();
      expect(keys.length).toBe(32);
    });

    it('应包含 first_practice_walk 规则', () => {
      expect(getAllUnlockKeys()).toContain('first_practice_walk');
    });

    it('应包含 walks_100 规则', () => {
      expect(getAllUnlockKeys()).toContain('walks_100');
    });
  });

  describe('getUnlockRule', () => {
    it('first_practice_walk: 完成1次即触发', () => {
      const rule = getUnlockRule('first_practice_walk');
      expect(rule).toBeDefined();
      expect(rule({ session: {}, stats: { totalWalks: 1 } })).toBe(true);
      expect(rule({ session: {}, stats: { totalWalks: 0 } })).toBe(false);
    });

    it('seven_walks: 完成7次才触发', () => {
      const rule = getUnlockRule('seven_walks');
      expect(rule({ stats: { totalWalks: 7 } })).toBe(true);
      expect(rule({ stats: { totalWalks: 6 } })).toBe(false);
    });

    it('walks_100: 完成100次才触发', () => {
      const rule = getUnlockRule('walks_100');
      expect(rule({ stats: { totalWalks: 100 } })).toBe(true);
      expect(rule({ stats: { totalWalks: 99 } })).toBe(false);
    });
  });

  describe('evaluateNarrativeUnlocks', () => {
    it('首次完成后应解锁 small-pot sprout', () => {
      const result = evaluateNarrativeUnlocks({
        session: { completed: true, falseAlarmCount: 2, timeoutCount: 0, streakBest: 1, n: 1, gameMode: 'walk', timed: false, hadConsecutiveMisses: false },
        stats: { totalWalks: 1, streakDays: 1, maxN: 1, usedModes: new Set(['walk']), stableSessionCount: 0, totalCorrect: 2, diaryViewedCount: 0, customizedRhythm: false },
        currentUnlockState: {},
      });
      const smallPotSprout = result.find((r) => r.collectibleId === 'small-pot' && r.tierId === 'sprout');
      expect(smallPotSprout).toBeDefined();
    });

    it('已解锁的不应重复返回', () => {
      const result = evaluateNarrativeUnlocks({
        session: { completed: true, falseAlarmCount: 2, timeoutCount: 0, streakBest: 1, n: 1, gameMode: 'walk', timed: false, hadConsecutiveMisses: false },
        stats: { totalWalks: 1, streakDays: 1, maxN: 1, usedModes: new Set(['walk']), stableSessionCount: 0, totalCorrect: 2, diaryViewedCount: 0, customizedRhythm: false },
        currentUnlockState: { 'small-pot': { tiers: { sprout: { unlocked: true }, leaf: { unlocked: false }, bloom: { unlocked: false }, fullBloom: { unlocked: false } } } },
      });
      const smallPotSprout = result.find((r) => r.collectibleId === 'small-pot' && r.tierId === 'sprout');
      expect(smallPotSprout).toBeUndefined();
    });
  });

  describe('evaluateHiddenAchievements', () => {
    it('walk-50: 散步50局触发', () => {
      const result = evaluateHiddenAchievements({
        perModeCounts: { walk: 50 },
        perNCounts: {},
        currentHidden: {},
      });
      expect(result).toContain('walk-50');
    });

    it('walk-100: 散步100局触发', () => {
      const result = evaluateHiddenAchievements({
        perModeCounts: { walk: 100 },
        perNCounts: {},
        currentHidden: {},
      });
      expect(result).toContain('walk-100');
    });

    it('已解锁的不重复', () => {
      const result = evaluateHiddenAchievements({
        perModeCounts: { walk: 50 },
        perNCounts: {},
        currentHidden: { 'walk-50': '2026-01-01' },
      });
      expect(result).not.toContain('walk-50');
    });
  });
});
