/**
 * SignalDetection 单元测试 — d'/β 计算
 */
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import i18n from '@i18n/index';
import { calculateSDT, interpretDPrime, interpretBeta } from '../SignalDetection';

let originalLanguage = 'en-US';

/**
 * 在断言文案前锁定测试语言
 * 避免不同机器上的默认语言不同，导致同一套测试出现不稳定结果。
 */
beforeAll(async () => {
  originalLanguage = i18n.language;
  await i18n.changeLanguage('zh-CN');
});

/**
 * 恢复测试前语言
 * 避免当前用例对其他测试文件产生额外影响。
 */
afterAll(async () => {
  await i18n.changeLanguage(originalLanguage);
});

describe('calculateSDT', () => {
  it('理想用户：全命中，零误判', () => {
    const result = calculateSDT({ hits: 5, misses: 0, falseAlarms: 0, correctRejections: 10 });
    expect(result.dPrime).toBeGreaterThan(3);
    expect(result.accuracy).toBeGreaterThan(0.9);
  });

  it('随机猜测：命中率≈误判率', () => {
    const result = calculateSDT({ hits: 5, misses: 5, falseAlarms: 5, correctRejections: 5 });
    expect(Math.abs(result.dPrime)).toBeLessThan(0.5);
  });

  it('全不按策略：零命中，零误判', () => {
    const result = calculateSDT({ hits: 0, misses: 10, falseAlarms: 0, correctRejections: 10 });
    expect(result.hitRate).toBeLessThan(0.1);
    expect(result.falseAlarmRate).toBeLessThan(0.1);
  });

  it('全按策略：全命中，全误判', () => {
    const result = calculateSDT({ hits: 10, misses: 0, falseAlarms: 10, correctRejections: 0 });
    expect(result.hitRate).toBeGreaterThan(0.9);
    expect(result.falseAlarmRate).toBeGreaterThan(0.9);
  });

  it('零回合不抛异常', () => {
    const result = calculateSDT({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });
    expect(result.dPrime).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  it('应返回所有预期字段', () => {
    const result = calculateSDT({ hits: 3, misses: 2, falseAlarms: 1, correctRejections: 4 });
    expect(result).toHaveProperty('dPrime');
    expect(result).toHaveProperty('beta');
    expect(result).toHaveProperty('hitRate');
    expect(result).toHaveProperty('falseAlarmRate');
    expect(result).toHaveProperty('accuracy');
  });
});

describe('interpretDPrime', () => {
  it('d\' >= 3 为优秀', () => {
    expect(interpretDPrime(3.5).level).toBe('优秀');
  });
  it('d\' >= 2 为良好', () => {
    expect(interpretDPrime(2.5).level).toBe('良好');
  });
  it('d\' >= 1 为中等', () => {
    expect(interpretDPrime(1.5).level).toBe('中等');
  });
  it('d\' >= 0.5 为较弱', () => {
    expect(interpretDPrime(0.7).level).toBe('较弱');
  });
  it('d\' < 0.5 为需提升', () => {
    expect(interpretDPrime(0.2).level).toBe('需提升');
  });
});

describe('interpretBeta', () => {
  it('beta > 1.5 为保守型', () => {
    expect(interpretBeta(2.0).type).toBe('保守型');
  });
  it('beta > 0.8 为均衡型', () => {
    expect(interpretBeta(1.0).type).toBe('均衡型');
  });
  it('beta <= 0.8 为激进型', () => {
    expect(interpretBeta(0.5).type).toBe('激进型');
  });
});
