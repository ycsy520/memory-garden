/**
 * WalkMode 单元测试
 * 验证散步模式的核心逻辑
 */
import { describe, it, expect } from 'vitest';
import WalkMode from '../modes/WalkMode.js';

describe('WalkMode', () => {
  it('应正确初始化', () => {
    const mode = new WalkMode({ n: 1, totalTurns: 16 });
    expect(mode.modeId).toBe('walk');
    expect(mode.config.n).toBe(1);
    expect(mode.config.totalTurns).toBe(16);
  });

  it('应预生成 trials', () => {
    const mode = new WalkMode({ n: 1, totalTurns: 16 });
    expect(mode.trials).toHaveLength(16);
  });

  it('generateTurn 应返回有效刺激', () => {
    const mode = new WalkMode({ n: 1, totalTurns: 16 });
    const turn = mode.generateTurn(null);
    expect(turn).toBeDefined();
    expect(turn.stimulus).toBeDefined();
    expect(turn.stimulus.value).toBeDefined();
  });

  it('submitAnswer 应记录用户操作', () => {
    const mode = new WalkMode({ n: 1, totalTurns: 16 });
    // 生成第一个回合
    mode.generateTurn(null);
    // 用户按了按钮
    const result = mode.submitAnswer(true);
    expect(result).toBeDefined();
    expect(typeof result.isCorrect).toBe('boolean');
  });

  it('recordNoResponse 应记录未操作', () => {
    const mode = new WalkMode({ n: 1, totalTurns: 16 });
    mode.generateTurn(null);
    // 不按按钮，等超时
    mode.recordNoResponse();
    expect(mode.trialResults).toHaveLength(1);
  });

  it('isWarmup 前 N+1 回合应返回 true', () => {
    const mode = new WalkMode({ n: 1, totalTurns: 16 });
    // 第 0 回合
    expect(mode.isWarmup()).toBe(true);
  });

  it('getFullResult 应包含完整数据', () => {
    const mode = new WalkMode({ n: 1, totalTurns: 16 });
    // 快速完成几回合
    for (let i = 0; i < 5; i++) {
      mode.generateTurn(null);
      mode.recordNoResponse();
      mode.advanceTurn();
    }
    const result = mode.getFullResult();
    expect(result.modeId).toBe('walk');
    expect(result.n).toBe(1);
    expect(typeof result.hits).toBe('number');
    expect(typeof result.misses).toBe('number');
    expect(typeof result.falseAlarms).toBe('number');
    expect(typeof result.correctRejections).toBe('number');
    expect(Array.isArray(result.trialResults)).toBe(true);
  });

  it('reset 应重置所有状态', () => {
    const mode = new WalkMode({ n: 1, totalTurns: 16 });
    mode.generateTurn(null);
    mode.submitAnswer(true);
    mode.reset();
    expect(mode.trialResults).toHaveLength(0);
    expect(mode.turnIndex).toBe(0);
  });
});
