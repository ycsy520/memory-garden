/**
 * 游戏模式基类 — v5.0 精简版
 * 提供所有游戏模式共享的基础属性和方法。
 * 具体的刺激生成和答案判定由子类（如 WalkMode）实现。
 *
 * 遵循ARCH规则: engine/ 不依赖 React，纯逻辑
 *
 * @version 5.0
 */

/**
 * @typedef {Object} ModeConfig
 * @property {string} id - 模式唯一标识
 * @property {string} name - 显示名称
 * @property {string} modeId - 模式标识
 * @property {number} n - N-back的N值
 * @property {number} totalTurns - 总回合数
 * @property {number} [warmupTrials] - 暖身回合数
 * @property {string} [factorId] - 因子ID
 * @property {string[]} [factorIds] - 因子ID列表
 * @property {Object} [speedProfile] - 速度配置
 */

/**
 * @typedef {Object} Stimulus
 * @property {string} id - 唯一标识
 * @property {string} type - 刺激类型 (visual/spatial/audio)
 * @property {*} value - 刺激值
 * @property {Object} [meta] - 额外元数据
 */

/**
 * @typedef {Object} TurnData
 * @property {Stimulus} stimulus - 当前回合的刺激
 * @property {boolean} isTarget - 是否为目标刺激
 * @property {number} turnIndex - 回合索引
 */

/**
 * @typedef {Object} AnswerResult
 * @property {boolean} isCorrect - 是否回答正确
 * @property {number} scoreDelta - 得分变化
 * @property {'correct'|'wrong'|'missed'|'correctRejection'|'warmup'|null} feedback - 反馈类型
 * @property {string} channel - 判分通道 (visual/audio/spatial)
 */
export default class BaseMode {
  /**
   * @param {ModeConfig} config
   */
  constructor(config) {
    this.config = config;
    this.history = [];
    this.turnIndex = 0;
  }

  /** @returns {string} 模式ID */
  get id() { return this.config.id; }

  /** @returns {string} 模式名称 */
  get name() { return this.config.name; }

  /** @returns {string} 模式ID标识 */
  get modeId() { return this.config.modeId || this.config.id || 'walk'; }

  /** @returns {number} 当前回合数 */
  get currentTurn() { return this.turnIndex; }

  /** @returns {number} 总回合数 */
  get totalTurns() { return this.config.totalTurns; }

  /**
   * 重置模式状态
   */
  reset() {
    this.history = [];
    this.turnIndex = 0;
  }

  /**
   * 判断当前是否处于暖身期
   * @returns {boolean}
   */
  isWarmup() {
    const warmupTrials = this.config.warmupTrials ?? this.config.n;
    return this.turnIndex < warmupTrials;
  }

  /**
   * 检查游戏是否结束
   * @returns {boolean}
   */
  isFinished() {
    return this.turnIndex >= this.config.totalTurns;
  }

  /**
   * 推进到下一回合
   */
  advanceTurn() {
    this.turnIndex++;
  }

  /**
   * 生成当前回合的刺激数据 (子类实现)
   * @param {Function} _factorGenerator - 因子生成函数
   * @returns {TurnData|null}
   */
  generateTurn(_factorGenerator) {
    return null;
  }

  /**
   * 处理玩家答案 (子类实现)
   * @param {*} _answer - 玩家的答案
   * @returns {AnswerResult}
   */
  submitAnswer(_answer) {
    return { isCorrect: false, scoreDelta: 0, feedback: null, channel: 'visual' };
  }
}
