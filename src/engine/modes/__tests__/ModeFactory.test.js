/**
 * ModeFactory 单元测试 — v5.0
 * 验证 WalkMode 创建、回退和参数验证
 */
import { describe, it, expect } from 'vitest';
import ModeFactory from '../ModeFactory';

const baseConfig = { n: 1, totalTurns: 16, warmupTrials: 2, factorId: 'emoji-flower' };

describe('ModeFactory', () => {
  it('should create WalkMode', () => {
    const mode = ModeFactory.create('walk', { ...baseConfig, id: 'walk-n1', name: '散步' });
    expect(mode.modeId).toBe('walk');
  });

  it('should fallback to WalkMode for unknown mode', () => {
    const mode = ModeFactory.create('unknown', baseConfig);
    expect(mode.modeId).toBe('walk');
  });

  it('should throw for missing n', () => {
    expect(() => ModeFactory.create('walk', { totalTurns: 10 })).toThrow('N-back');
  });

  it('should throw for missing totalTurns', () => {
    expect(() => ModeFactory.create('walk', { n: 1 })).toThrow('总回合数');
  });

  it('should list available modes', () => {
    const modes = ModeFactory.getAvailableModes();
    expect(modes.length).toBeGreaterThanOrEqual(1);
    expect(modes.map((m) => m.id)).toContain('walk');
  });

  it('should register new mode', () => {
    class TestMode {
      constructor(cfg) { this.config = cfg; }
      get modeId() { return 'test'; }
    }
    ModeFactory.register('test', TestMode);
    expect(ModeFactory.hasMode('test')).toBe(true);
    const mode = ModeFactory.create('test', baseConfig);
    expect(mode.modeId).toBe('test');
  });
});
