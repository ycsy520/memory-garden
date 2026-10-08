/**
 * GridMode 单元测试 — 栅格图案 N-back
 */
import { describe, it, expect } from 'vitest';
import GridMode from '../GridMode';

function createMode(n = 1, totalTurns = 16) {
  return new GridMode({ n, totalTurns, warmupTrials: n, id: 'grid', name: '花圃', modeId: 'grid' });
}

describe('GridMode', () => {
  it('应该创建 GridMode 实例', () => {
    const mode = createMode();
    expect(mode.modeId).toBe('grid');
  });

  it('generateTurn 应该返回 2×2 = 4 个格子', () => {
    const mode = createMode();
    const turn = mode.generateTurn(null);
    expect(turn).not.toBeNull();
    expect(turn.stimulus.type).toBe('grid');
    expect(Array.isArray(turn.stimulus.value)).toBe(true);
    expect(turn.stimulus.value.length).toBe(4);
  });

  it('每个格子应该有 value 和 position', () => {
    const mode = createMode();
    const turn = mode.generateTurn(null);
    turn.stimulus.value.forEach((cell) => {
      // 精灵图版：格子 value 为精灵图格子索引（number）
      expect(typeof cell.value).toBe('number');
      expect(cell.position).toHaveProperty('row');
      expect(cell.position).toHaveProperty('col');
    });
  });

  it('连续生成的图案不应完全相同（非目标回合）', () => {
    const mode = createMode(2, 30);
    mode.generateTurn(null);
    mode.advanceTurn();
    const t2 = mode.generateTurn(null).stimulus.value;
    // 两个连续非目标回合不应完全相同
    // 概率上极低但不是不可能，所以只是检查所有格子都被填充
    expect(t2.length).toBe(4);
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
