/**
 * 游戏模式工厂 — v5.0 精简版
 * 当前仅管理 WalkMode（散步模式）。
 * 后续模式（花坛/花与歌/花圃）将在迁移到新引擎后重新注册。
 *
 * @version 5.0
 */
import WalkMode from './WalkMode';

export default class ModeFactory {
  /**
   * 模式注册表
   * @type {Map<string, typeof import('./BaseMode').default>}
   */
  static modeRegistry = new Map([
    ['walk', WalkMode],
  ]);

  /**
   * 注册新的游戏模式
   * @param {string} modeId - 模式ID
   * @param {typeof import('./BaseMode').default} ModeClass - 模式类
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
      modes.push({
        id,
        name: ModeClass.name || id,
        description: ModeClass.description || '',
      });
    });
    return modes;
  }

  /**
   * 检查模式是否已注册
   * @param {string} modeId
   * @returns {boolean}
   */
  static hasMode(modeId) {
    return ModeFactory.modeRegistry.has(modeId);
  }

  /**
   * 创建游戏模式实例
   * @param {string} modeId - 模式ID（当前仅 'walk'）
   * @param {Object} config - 模式配置
   * @param {number} config.n - N-back值
   * @param {number} config.totalTurns - 总回合数
   * @returns {import('./BaseMode').default} 模式实例
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
      return new ModeClass(config);
    } catch (error) {
      console.error(`[ModeFactory] 创建模式 "${modeId}" 失败:`, error);
      return new WalkMode(config);
    }
  }
}
