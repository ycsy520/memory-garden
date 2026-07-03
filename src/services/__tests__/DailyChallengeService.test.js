/**
 * DailyChallengeService 单元测试
 */
import { describe, it, expect } from 'vitest';
import DailyChallengeService from '../DailyChallengeService';

describe('DailyChallengeService', () => {
  describe('getTodayString', () => {
    it('should return YYYY-MM-DD format', () => {
      const result = DailyChallengeService.getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('dateToSeed', () => {
    it('should return a number', () => {
      const seed = DailyChallengeService.dateToSeed('2026-06-28');
      expect(typeof seed).toBe('number');
    });

    it('should return different seeds for different dates', () => {
      const seed1 = DailyChallengeService.dateToSeed('2026-06-27');
      const seed2 = DailyChallengeService.dateToSeed('2026-06-28');
      expect(seed1).not.toBe(seed2);
    });
  });

  describe('getChallenge', () => {
    it('should return a valid challenge config', () => {
      const challenge = DailyChallengeService.getChallenge('2026-06-28');
      expect(challenge.id).toBe('daily-2026-06-28');
      expect(challenge.isDaily).toBe(true);
      expect(challenge.dailyDate).toBe('2026-06-28');
      expect(challenge.modeId).toBeDefined();
      expect(challenge.factorId).toBeDefined();
      expect(challenge.n).toBeGreaterThanOrEqual(1);
      expect(challenge.speed).toBeGreaterThan(0);
      expect(challenge.totalTurns).toBeGreaterThan(0);
    });

    it('should return same config for same date', () => {
      const c1 = DailyChallengeService.getChallenge('2026-06-28');
      const c2 = DailyChallengeService.getChallenge('2026-06-28');
      expect(c1).toEqual(c2);
    });

    it('should return different config for different dates', () => {
      const c1 = DailyChallengeService.getChallenge('2026-06-27');
      const c2 = DailyChallengeService.getChallenge('2026-06-28');
      // 至少有一项不同（模式/因子/难度）
      const differs = c1.modeId !== c2.modeId || c1.factorId !== c2.factorId || c1.n !== c2.n;
      expect(differs).toBe(true);
    });

    it('should use today by default', () => {
      const challenge = DailyChallengeService.getChallenge();
      const today = DailyChallengeService.getTodayString();
      expect(challenge.dailyDate).toBe(today);
    });
  });

  describe('isCompletedToday', () => {
    it('should return false when no sessions', () => {
      expect(DailyChallengeService.isCompletedToday([])).toBe(false);
    });

    it('should return true when today is completed', () => {
      const today = DailyChallengeService.getTodayString();
      const sessions = [{ dailyDate: today, isDaily: true }];
      expect(DailyChallengeService.isCompletedToday(sessions)).toBe(true);
    });

    it('should return false for yesterday only', () => {
      const sessions = [{ dailyDate: '2020-01-01', isDaily: true }];
      expect(DailyChallengeService.isCompletedToday(sessions)).toBe(false);
    });
  });

  describe('getDescription', () => {
    it('should return a readable string', () => {
      const challenge = DailyChallengeService.getChallenge('2026-06-28');
      const desc = DailyChallengeService.getDescription(challenge);
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
      expect(desc).toContain('N=');
    });
  });
});
