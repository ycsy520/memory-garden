/**
 * SpatialMode 单元测试 — 空间位置 N-back
 */
import { describe, it, expect } from 'vitest';
import SpatialMode from '../SpatialMode';

function createMode(n = 1, totalTurns = 16, flowerCount = 2) {
  return new SpatialMode({ n, totalTurns, warmupTrials: n, flowerCount, id: 'spatial', name: '花坛', modeId: 'spatial' });
}

describe('SpatialMode', () => {
  it('应该创建 SpatialMode 实例', () => {
    const mode = createMode();
    expect(mode.modeId).toBe('spatial');
  });

  it('generateTurn 应该返回包含多个位置-花对的刺激', () => {
    const mode = createMode(1, 16, 2);
    const turn = mode.generateTurn(null);
    expect(turn).not.toBeNull();
    expect(turn.stimulus.type).toBe('spatial');
    expect(Array.isArray(turn.stimulus.value)).toBe(true);
    expect(turn.stimulus.value.length).toBe(2);
  });

  it('每个位置应该在 3×3 网格内', () => {
    const mode = createMode(1, 16, 2);
    const turn = mode.generateTurn(null);
    turn.stimulus.value.forEach((pair) => {
      expect(pair.position.row).toBeGreaterThanOrEqual(0);
      expect(pair.position.row).toBeLessThan(3);
      expect(pair.position.col).toBeGreaterThanOrEqual(0);
      expect(pair.position.col).toBeLessThan(3);
    });
  });

  it('位置不应重复（同一回合内不同位置）', () => {
    const mode = createMode(1, 16, 2);
    const turn = mode.generateTurn(null);
    const keys = turn.stimulus.value.map((p) => `${p.position.row}-${p.position.col}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('挑战模式应该生成 3 个位置', () => {
    const mode = createMode(1, 16, 3);
    const turn = mode.generateTurn(null);
    expect(turn.stimulus.value.length).toBe(3);
  });

  it('暖身回合应识别为暖身', () => {
    const mode = createMode(1, 16); // warmup = n = 1
    expect(mode.isWarmup()).toBe(true);
    mode.advanceTurn();
    expect(mode.isWarmup()).toBe(false);
  });

  it('getResult 应返回统计字段', () => {
    const mode = createMode();
    const result = mode.getResult();
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('hits');
    expect(result).toHaveProperty('misses');
  });
});
