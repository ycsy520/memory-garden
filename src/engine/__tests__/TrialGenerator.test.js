/**
 * TrialGenerator 单元测试
 * 验证回合序列生成器的核心规则
 */
import { describe, it, expect } from 'vitest';
import { generateTrials } from '../TrialGenerator.js';

describe('TrialGenerator', () => {
  it('应生成正确数量的 trials', () => {
    const trials = generateTrials({ totalTrials: 16, warmupTrials: 2 });
    expect(trials).toHaveLength(16);
  });

  it('暖身回合应标记 isWarmup=true', () => {
    const trials = generateTrials({ totalTrials: 16, warmupTrials: 2 });
    expect(trials[0].isWarmup).toBe(true);
    expect(trials[1].isWarmup).toBe(true);
    expect(trials[2].isWarmup).toBe(false);
  });

  it('暖身回合的 expectedAction 应为 noPress', () => {
    const trials = generateTrials({ totalTrials: 16, warmupTrials: 2 });
    expect(trials[0].expectedAction).toBe('noPress');
  });

  it('目标回合的 expectedAction 应为 press', () => {
    const trials = generateTrials({ totalTrials: 20, warmupTrials: 2, targetRate: 0.5 });
    const scoredTrials = trials.filter((t) => !t.isWarmup);
    const targets = scoredTrials.filter((t) => t.isTarget);
    targets.forEach((t) => {
      expect(t.expectedAction).toBe('press');
    });
  });

  it('非目标回合的 expectedAction 应为 noPress', () => {
    const trials = generateTrials({ totalTrials: 20, warmupTrials: 2, targetRate: 0.3 });
    const nonTargets = trials.filter((t) => !t.isWarmup && !t.isTarget);
    nonTargets.forEach((t) => {
      expect(t.expectedAction).toBe('noPress');
    });
  });

  it('目标率应在合理范围内', () => {
    const trials = generateTrials({ totalTrials: 30, warmupTrials: 2, targetRate: 0.38 });
    const scoredTrials = trials.filter((t) => !t.isWarmup);
    const targetCount = scoredTrials.filter((t) => t.isTarget).length;
    const targetRate = targetCount / scoredTrials.length;
    // 允许一定误差
    expect(targetRate).toBeGreaterThan(0.15);
    expect(targetRate).toBeLessThan(0.65);
  });

  it('目标回合应复用 N 步前的素材', () => {
    const trials = generateTrials({ n: 1, totalTrials: 20, warmupTrials: 2 });
    trials.forEach((trial, i) => {
      if (!trial.isWarmup && trial.isTarget) {
        const nBackTrial = trials[i - trial.n];
        expect(trial.stimulusId).toBe(nBackTrial.stimulusId);
      }
    });
  });

  it('lure 回合应标记 isLure=true', () => {
    const trials = generateTrials({
      n: 2,
      totalTrials: 30,
      warmupTrials: 3,
      lureRate: 0.3,
    });
    const lures = trials.filter((t) => t.isLure);
    expect(lures.length).toBeGreaterThan(0);
    lures.forEach((t) => {
      expect(t.lureType).toBeDefined();
    });
  });

  it('连续目标不应超过 2 次', () => {
    const trials = generateTrials({
      n: 1,
      totalTrials: 50,
      warmupTrials: 2,
      targetRate: 0.5,
      allowConsecutiveTargets: false,
    });
    const scoredTrials = trials.filter((t) => !t.isWarmup);
    let consecutiveCount = 0;
    for (const trial of scoredTrials) {
      if (trial.isTarget) {
        consecutiveCount++;
        expect(consecutiveCount).toBeLessThanOrEqual(2);
      } else {
        consecutiveCount = 0;
      }
    }
  });

  it('每个 trial 应包含必要字段', () => {
    const trials = generateTrials({ totalTrials: 10, warmupTrials: 2 });
    trials.forEach((trial) => {
      expect(trial.trialIndex).toBeDefined();
      expect(typeof trial.isWarmup).toBe('boolean');
      expect(typeof trial.isTarget).toBe('boolean');
      expect(typeof trial.isLure).toBe('boolean');
      expect(trial.stimulusId).toBeDefined();
      expect(trial.stimulusDisplay).toBeDefined();
      expect(trial.expectedAction).toMatch(/^(press|noPress)$/);
    });
  });
});
