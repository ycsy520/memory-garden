/**
 * ModeFactory 单元测试 — v5.0
 * 验证所有已注册模式的创建和参数验证
 */
import { describe, it, expect, beforeAll } from 'vitest';
import ModeFactory from '../ModeFactory';
import FactorRegistry from '@factors/FactorRegistry';

beforeAll(() => {
  if (!FactorRegistry.get('emoji-flower')) {
    FactorRegistry.register({
      id: 'emoji-flower', name: '花朵', type: 'visual', pool: ['🌹', '🌻', '🌷'],
      render(f) { return f.value; },
      compare(a, b) { return a.value === b.value; },
      generate() { return { value: '🌹', type: 'emoji-flower' }; },
    });
  }
  if (!FactorRegistry.get('tone')) {
    FactorRegistry.register({
      id: 'tone', name: '音调', type: 'audio', pool: [261, 294, 329],
      render(f) { return f.value; },
      compare(a, b) { return a.value === b.value; },
      generate() { return { value: 440, type: 'tone' }; },
    });
  }
});

const baseConfig = { n: 1, totalTurns: 10, factorId: 'emoji-flower' };

describe('ModeFactory', () => {
  it('should create WalkMode', () => {
    const mode = ModeFactory.create('walk', { ...baseConfig, id: 'walk-n1', name: '散步' });
    expect(mode.modeId).toBe('walk');
  });

  it('should create StandardMode', () => {
    const mode = ModeFactory.create('standard', { ...baseConfig, id: 'standard', name: '标准模式' });
    expect(mode.modeId).toBe('standard');
  });

  it('should create DualMode', () => {
    const mode = ModeFactory.create('dual', { ...baseConfig, id: 'dual', factorIds: ['emoji-flower', 'tone'] });
    expect(mode.modeId).toBe('dual');
  });

  it('should create SpatialMode', () => {
    const mode = ModeFactory.create('spatial', { ...baseConfig, id: 'spatial', gridSize: 3 });
    expect(mode.modeId).toBe('spatial');
  });

  it('should create GridMode', () => {
    const mode = ModeFactory.create('grid', { ...baseConfig, id: 'grid', cols: 2, rows: 2 });
    expect(mode.modeId).toBe('grid');
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
});
