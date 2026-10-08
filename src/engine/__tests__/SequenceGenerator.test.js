/**
 * SequenceGenerator 单元测试
 * 验证：暖身排除、目标率、防连续重复、连续目标限制
 */
import { describe, it, expect } from 'vitest';
import { generateSequence, randomPick } from '../SequenceGenerator';

const POOL = ['🌹', '🌻', '🌷', '🌸', '🌺', '🍀', '🌿', '🦋', '🐞', '🐝', '🍓', '🍎'];

function makeGen({ totalTurns = 16, n = 1, warmupTrials, targetRate, maxConsecutiveSame }) {
  return generateSequence({
    totalTurns, n,
    warmupTrials: warmupTrials ?? n,
    targetRate: targetRate ?? 0.38,
    maxConsecutiveSame: maxConsecutiveSame ?? 2,
    maxConsecutiveTargets: 2,
    generateStimulus: () => randomPick(POOL),
    compare: (a, b) => a === b,
  });
}

describe('SequenceGenerator', () => {
  it('应该生成正确数量的 trial', () => {
    const trials = makeGen({ totalTurns: 16, n: 1 });
    expect(trials.length).toBe(16);
  });

  it('暖身回合不应该包含目标', () => {
    const trials = makeGen({ totalTurns: 20, n: 2, warmupTrials: 3 });
    const warmup = trials.slice(0, 3);
    warmup.forEach((t) => {
      expect(t.isWarmup).toBe(true);
      expect(t.isTarget).toBe(false);
    });
  });

  it('目标率应在 30%-50% 之间（计分回合）', () => {
    // 运行多次取平均
    const runs = 10;
    let totalTargets = 0;
    let totalScored = 0;
    for (let i = 0; i < runs; i++) {
      const trials = makeGen({ totalTurns: 20, n: 1 });
      const scored = trials.filter((t) => !t.isWarmup);
      const targets = scored.filter((t) => t.isTarget);
      totalTargets += targets.length;
      totalScored += scored.length;
    }
    const rate = totalTargets / totalScored;
    expect(rate).toBeGreaterThan(0.25);
    expect(rate).toBeLessThan(0.55);
  });

  it('前 N 个回合不应该有目标（历史不够）', () => {
    const trials = makeGen({ totalTurns: 20, n: 2, warmupTrials: 0 });
    // 前2个回合(targetIndex < n)不能是目标
    for (let i = 0; i < 2; i++) {
      expect(trials[i].isTarget).toBe(false);
    }
  });

  describe('防连续重复', () => {
    it('同一素材连续出现不应超过 maxConsecutiveSame', () => {
      const trials = makeGen({ totalTurns: 30, n: 1, maxConsecutiveSame: 2 });
      let run = 1;
      for (let i = 1; i < trials.length; i++) {
        if (trials[i].stimulus === trials[i - 1].stimulus) {
          run++;
        } else {
          run = 1;
        }
        expect(run).toBeLessThanOrEqual(2);
      }
    });

    it('序列应该有多样性（不只是重复少量素材）', () => {
      const trials = makeGen({ totalTurns: 20, n: 1 });
      const unique = new Set(trials.map((t) => t.stimulus));
      expect(unique.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('连续目标限制', () => {
    it('连续目标不应超过 2 次', () => {
      const trials = makeGen({ totalTurns: 30, n: 1 });
      let consecutive = 0;
      for (const t of trials) {
        if (t.isTarget) {
          consecutive++;
          expect(consecutive).toBeLessThanOrEqual(2);
        } else {
          consecutive = 0;
        }
      }
    });
  });

  describe('目标回合验证', () => {
    it('目标回合的刺激应该等于N步前的刺激', () => {
      const trials = makeGen({ totalTurns: 20, n: 2 });
      for (let i = 2; i < trials.length; i++) {
        if (trials[i].isTarget && !trials[i].isWarmup) {
          expect(trials[i].stimulus).toBe(trials[i - 2].stimulus);
        }
      }
    });
  });
});
