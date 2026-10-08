/**
 * 集成测试 — 模拟完整的游戏启动流程
 */
import { describe, it, expect } from 'vitest';
import WalkMode from '../modes/WalkMode';
import DualMode from '../modes/DualMode';
import SpatialMode from '../modes/SpatialMode';
import GridMode from '../modes/GridMode';
import ModeFactory from '../modes/ModeFactory';

// 模拟 MenuScreen.buildConfig() 的输出
const buildWalkConfig = () => ({
  n: 1,
  targetRate: 0.38,
  lureRate: 0.15,
  factorId: 'sprite-garden',
  modeId: 'walk',
  warmupTrials: 2,
  totalTurns: 16,
  speedProfile: { fadeIn: 300, visible: 2500, fadeOut: 300, gap: 1000 },
  waitingForInput: false,
  timed: false,
  timeLimit: 0,
  id: 'walk-walk-n1',
  gameMode: 'walk',
});

const buildDualConfig = () => ({
  ...buildWalkConfig(),
  modeId: 'dual',
  id: 'dual-walk-n1',
});

const buildSpatialConfig = () => ({
  ...buildWalkConfig(),
  modeId: 'spatial',
  id: 'spatial-walk-n1',
});

const buildGridConfig = () => ({
  ...buildWalkConfig(),
  modeId: 'grid',
  id: 'grid-walk-n1',
});

describe('Integration: Game startup flow', () => {
  it('WalkMode 创建成功并生成序列', () => {
    const config = buildWalkConfig();
    const mode = new WalkMode(config);
    expect(mode.modeId).toBe('walk');
    expect(mode.trials.length).toBe(16);
    const turn = mode.generateTurn(null);
    expect(turn).not.toBeNull();
    expect(turn.stimulus.type).toBe('visual');
  });

  it('DualMode 创建成功并生成双通道序列', () => {
    const config = buildDualConfig();
    const mode = new DualMode(config);
    expect(mode.modeId).toBe('dual');
    const turn = mode.generateTurn(null);
    expect(turn).not.toBeNull();
    expect(turn.stimulus.type).toBe('dual');
    expect(turn.stimulus.value.visual).toBeDefined();
    expect(turn.stimulus.value.audio).toBeDefined();
  });

  it('SpatialMode 创建成功并生成空间序列', () => {
    const config = buildSpatialConfig();
    const mode = new SpatialMode(config);
    expect(mode.modeId).toBe('spatial');
    const turn = mode.generateTurn(null);
    expect(turn).not.toBeNull();
    expect(turn.stimulus.type).toBe('spatial');
    expect(Array.isArray(turn.stimulus.value)).toBe(true);
  });

  it('GridMode 创建成功并生成栅格序列', () => {
    const config = buildGridConfig();
    const mode = new GridMode(config);
    expect(mode.modeId).toBe('grid');
    const turn = mode.generateTurn(null);
    expect(turn).not.toBeNull();
    expect(turn.stimulus.type).toBe('grid');
    expect(turn.stimulus.value.length).toBe(4);
  });

  it('ModeFactory 创建所有四种模式', () => {
    for (const [modeId, configBuilder] of [
      ['walk', buildWalkConfig],
      ['dual', buildDualConfig],
      ['spatial', buildSpatialConfig],
      ['grid', buildGridConfig],
    ]) {
      const config = configBuilder();
      const mode = ModeFactory.create(modeId, config);
      expect(mode.modeId).toBe(modeId);
      const turn = mode.generateTurn(null);
      expect(turn).not.toBeNull();
      expect(turn.stimulus).toBeDefined();
    }
  });

  it('所有模式 generateTurn 100 次不应抛异常', () => {
    const modes = [
      new WalkMode(buildWalkConfig()),
      new DualMode(buildDualConfig()),
      new SpatialMode(buildSpatialConfig()),
      new GridMode(buildGridConfig()),
    ];
    for (const mode of modes) {
      for (let i = 0; i < 100; i++) {
        expect(() => mode.generateTurn(null)).not.toThrow();
        mode.advanceTurn();
      }
    }
  });
});
