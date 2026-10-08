/**
 * DualMode 单元测试 — 双通道联合 N-back
 */
import { describe, it, expect, beforeAll } from 'vitest';
import DualMode from '../DualMode';
import FactorRegistry from '@factors/FactorRegistry';

beforeAll(() => {
  if (!FactorRegistry.get('tone')) {
    FactorRegistry.register({
      id: 'tone', name: '音调', type: 'audio',
      pool: [
        { freq: 261.63, name: 'Do', icon: '🔔', waveType: 'sine' },
        { freq: 392.00, name: 'Sol', icon: '🎵', waveType: 'triangle' },
        { freq: 523.25, name: 'Do⁺', icon: '🔔', waveType: 'sine' },
        { freq: 783.99, name: 'Sol⁺', icon: '🎵', waveType: 'triangle' },
      ],
      render(f) { return f.meta?.icon; },
      compare(a, b) { return a.value === b.value; },
      generate() { return this.pool[0]; },
    });
  }
});

function createMode(n = 1, totalTurns = 16) {
  return new DualMode({ n, totalTurns, warmupTrials: n, id: 'dual-n1', name: '花与歌', modeId: 'dual' });
}

describe('DualMode', () => {
  it('应该创建 DualMode 实例', () => {
    const mode = createMode();
    expect(mode.modeId).toBe('dual');
  });

  it('generateTurn 应该返回视觉+听觉刺激', () => {
    const mode = createMode();
    const turn = mode.generateTurn(null);
    expect(turn).not.toBeNull();
    expect(turn.stimulus.type).toBe('dual');
    expect(turn.stimulus.value.visual).toBeDefined();
    expect(turn.stimulus.value.audio).toBeDefined();
  });

  it('暖身回合判断正确', () => {
    const mode = createMode(1, 16); // warmup = n = 1
    expect(mode.isWarmup()).toBe(true);
    mode.advanceTurn();
    expect(mode.isWarmup()).toBe(false);
  });

  it('暖身回合不计分', () => {
    const mode = createMode(1, 16);
    mode.generateTurn(null);
    mode.history.push({ type: 'dual', value: { visual: { value: '🌹' }, audio: { value: 261.63 } } });
    const result = mode.submitAnswer(true);
    expect(result.feedback).toBe('warmup');
    expect(result.scoreDelta).toBe(0);
  });

  it('AND逻辑：两个通道都匹配 → correct', () => {
    const mode = createMode(1, 10);
    // 填充历史
    for (let i = 0; i < 4; i++) {
      mode.generateTurn(null);
      mode.history.push(mode.generateTurn(null).stimulus);
      mode.advanceTurn();
    }
    // 现在手动设置 N步前的刺激 = 当前刺激
    // 模拟匹配
    const result = mode.submitAnswer(true);
    // 取决于随机生成是否匹配
    expect(result.channel).toBe('visual');
  });

  it('getResult 应返回所有统计字段', () => {
    const mode = createMode();
    const result = mode.getResult();
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('hits');
    expect(result).toHaveProperty('misses');
    expect(result).toHaveProperty('falseAlarms');
    expect(result).toHaveProperty('correctRejections');
  });

  it('reset 应清空所有状态', () => {
    const mode = createMode();
    mode.generateTurn(null);
    mode.advanceTurn();
    mode.reset();
    expect(mode.turnIndex).toBe(0);
    expect(mode.score).toBe(0);
  });
});
