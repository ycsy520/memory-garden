/**
 * ScoringEngine 单元测试
 * 验证 Go-No-Go 评分系统的核心逻辑
 */
import { describe, it, expect } from 'vitest';
import {
  classifyTrial,
  computeRates,
  computeScore,
  computeMedianRT,
  computeRTStability,
  computeValidForAdaptation,
  buildSessionMetrics,
} from '../ScoringEngine.js';

describe('ScoringEngine.classifyTrial', () => {
  it('按了 + 是目标 = hit', () => {
    expect(classifyTrial(true, true)).toBe('hit');
  });

  it('没按 + 是目标 = miss', () => {
    expect(classifyTrial(false, true)).toBe('miss');
  });

  it('按了 + 非目标 = falseAlarm', () => {
    expect(classifyTrial(true, false)).toBe('falseAlarm');
  });

  it('没按 + 非目标 = correctRejection', () => {
    expect(classifyTrial(false, false)).toBe('correctRejection');
  });
});

describe('ScoringEngine.computeRates', () => {
  it('应正确计算各项率', () => {
    const rates = computeRates(8, 2, 1, 9);
    expect(rates.hitRate).toBeCloseTo(0.8);
    expect(rates.missRate).toBeCloseTo(0.2);
    expect(rates.falseAlarmRate).toBeCloseTo(0.1);
    expect(rates.correctRejectionRate).toBeCloseTo(0.9);
  });

  it('无除零错误', () => {
    const rates = computeRates(0, 0, 0, 0);
    expect(rates.hitRate).toBe(0);
    expect(rates.falseAlarmRate).toBe(0);
  });
});

describe('ScoringEngine.computeScore', () => {
  it('完美表现应得高分', () => {
    const rates = { hitRate: 1.0, missRate: 0, falseAlarmRate: 0, correctRejectionRate: 1.0 };
    const score = computeScore(rates);
    expect(score).toBeGreaterThan(80);
  });

  it('全错应得低分', () => {
    const rates = { hitRate: 0, missRate: 1.0, falseAlarmRate: 1.0, correctRejectionRate: 0 };
    const score = computeScore(rates);
    expect(score).toBeLessThan(20);
  });

  it('全不按的保守策略不应得高分', () => {
    // 假设 40% 目标率，全不按 → hitRate=0, CR=1, FA=0, missRate=1
    const rates = { hitRate: 0, missRate: 1.0, falseAlarmRate: 0, correctRejectionRate: 1.0 };
    const score = computeScore(rates);
    // 应该中等偏低（因为 missRate 惩罚）
    expect(score).toBeLessThan(50);
  });
});

describe('ScoringEngine.computeMedianRT', () => {
  it('应计算中位数', () => {
    expect(computeMedianRT([100, 200, 300])).toBe(200);
    expect(computeMedianRT([100, 200, 300, 400])).toBe(250);
  });

  it('空数组返回 undefined', () => {
    expect(computeMedianRT([])).toBeUndefined();
  });
});

describe('ScoringEngine.computeValidForAdaptation', () => {
  it('有效训练局应返回 true', () => {
    expect(computeValidForAdaptation({
      mode: 'walk',
      completed: true,
      scoredTrials: 14,
      pauseCount: 0,
      hedgeCount: 0,
      hasAssetError: false,
    })).toBe(true);
  });

  it('回合数不足应返回 false', () => {
    expect(computeValidForAdaptation({
      mode: 'walk',
      completed: true,
      scoredTrials: 5,
    })).toBe(false);
  });

  it('中途中断应返回 false', () => {
    expect(computeValidForAdaptation({
      mode: 'walk',
      completed: false,
      scoredTrials: 14,
    })).toBe(false);
  });
});

describe('ScoringEngine.buildSessionMetrics', () => {
  it('应生成完整的会话指标', () => {
    const trialResults = [
      { trialIndex: 0, responded: false, result: 'correctRejection', wasWarmup: true, wasPaused: false, wasHedged: false },
      { trialIndex: 1, responded: false, result: 'correctRejection', wasWarmup: true, wasPaused: false, wasHedged: false },
      { trialIndex: 2, responded: true, responseTimeMs: 500, result: 'hit', wasWarmup: false, wasPaused: false, wasHedged: false },
      { trialIndex: 3, responded: false, result: 'correctRejection', wasWarmup: false, wasPaused: false, wasHedged: false },
      { trialIndex: 4, responded: true, responseTimeMs: 600, result: 'falseAlarm', wasWarmup: false, wasPaused: false, wasHedged: false },
    ];

    const session = buildSessionMetrics({
      trialResults,
      config: { modeId: 'walk', n: 1, speedProfile: { id: 'morning' } },
      startedAt: '2026-01-01T00:00:00Z',
      endedAt: '2026-01-01T00:05:00Z',
      pauseCount: 0,
      hedgeCount: 0,
      completed: true,
    });

    expect(session.mode).toBe('walk');
    expect(session.n).toBe(1);
    expect(session.scoredTrials).toBe(3); // 排除暖身
    expect(session.hits).toBe(1);
    expect(session.falseAlarms).toBe(1);
    expect(session.correctRejections).toBe(1);
    expect(session.medianReactionTimeMs).toBeDefined();
    expect(typeof session.score).toBe('number');
  });
});
