/**
 * 游戏模式工厂 — 创建和管理游戏模式实例
 *
 * v5.0: WalkMode 使用新引擎（GameLoop+PhaseMachine），
 *       StandardMode/DualMode/SpatialMode/GridMode 使用旧版引擎（setTimeout），
 *       两套引擎通过 useGameEngine 中的 modeId 分流。
 *
 * @version 5.0
 */
import WalkMode from './WalkMode';
import StandardMode from './StandardMode';
import DualMode from './DualMode';
import SpatialMode from './SpatialMode';
import GridMode from './GridMode';
import FactorRegistry from '@factors/FactorRegistry';

export default class ModeFactory {
  /**
   * 模式注册表
   * @type {Map<string, typeof import('./BaseMode').default>}
   */
  static modeRegistry = new Map([
    ['walk', WalkMode],
    ['standard', StandardMode],
    ['dual', DualMode],
    ['spatial', SpatialMode],
    ['grid', GridMode],
  ]);

  /**
   * 注册新的游戏模式
   * @param {string} modeId
   * @param {typeof import('./BaseMode').default} ModeClass
   */
  static register(modeId, ModeClass) {
    if (!modeId || typeof modeId !== 'string') {
      throw new Error('[ModeFactory] 模式ID必须是非空字符串');
    }
    if (!ModeClass || typeof ModeClass !== 'function') {
      throw new Error('[ModeFactory] 模式类必须是构造函数');
    }
    ModeFactory.modeRegistry.set(modeId, ModeClass);
  }

  /**
   * 获取所有可用模式
   * @returns {Array<{id: string, name: string, description: string}>}
   */
  static getAvailableModes() {
    const modes = [];
    ModeFactory.modeRegistry.forEach((ModeClass, id) => {
      modes.push({ id, name: ModeClass.name || id, description: ModeClass.description || '' });
    });
    return modes;
  }

  /**
   * 检查模式是否已注册
   */
  static hasMode(modeId) {
    return ModeFactory.modeRegistry.has(modeId);
  }

  /**
   * 创建游戏模式实例
   *
   * @param {string} modeId - walk/standard/dual/spatial/grid
   * @param {Object} config - 模式配置
   * @returns {import('./BaseMode').default}
   */
  static create(modeId, config) {
    if (!config || typeof config !== 'object') {
      throw new Error('[ModeFactory] 配置参数必须是对象');
    }
    if (typeof config.n !== 'number' || config.n < 1) {
      throw new Error('[ModeFactory] N-back值必须是正整数');
    }
    if (typeof config.totalTurns !== 'number' || config.totalTurns < 1) {
      throw new Error('[ModeFactory] 总回合数必须是正整数');
    }

    const ModeClass = ModeFactory.modeRegistry.get(modeId);
    if (!ModeClass) {
      console.warn(`[ModeFactory] 未知模式 "${modeId}"，降级到散步模式`);
      return new WalkMode(config);
    }

    try {
      if (modeId === 'dual') {
        const visualPlugin = FactorRegistry.get(config.factorIds?.[0] || config.factorId || 'sprite-garden');
        const audioPlugin = FactorRegistry.get('tone');
        const visualGenerator = visualPlugin ? () => visualPlugin.generate() : null;
        const audioGenerator = audioPlugin ? () => audioPlugin.generate() : null;
        return new ModeClass(config, { visualGenerator, audioGenerator });
      }
      if (modeId === 'spatial') {
        return new ModeClass(config, { gridSize: config.gridSize || 3, factorGenerator: null });
      }
      if (modeId === 'grid') {
        return new ModeClass(config, { cols: config.cols || 2, rows: config.rows || 2, factorGenerator: null });
      }
      return new ModeClass(config);
    } catch (error) {
      console.error(`[ModeFactory] 创建模式 "${modeId}" 失败:`, error);
      return new WalkMode(config);
    }
  }
}
