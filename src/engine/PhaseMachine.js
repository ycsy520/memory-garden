/**
 * PhaseMachine — 回合阶段状态机
 * 管理每个 trial 的四阶段：淡入 → 可见 → 淡出 → 空白恢复
 *
 * 文档 §12.1 修正后的统一 Phase 模型：
 * 用户反应窗口与刺激可见期重叠，而不是刺激结束后才开始思考。
 *
 * @version 5.0
 */

/**
 * @typedef {Object} PhaseConfig
 * @property {number} fadeIn - 淡入时长 (ms)
 * @property {number} visible - 可见时长 (ms)
 * @property {number} fadeOut - 淡出时长 (ms)
 * @property {number} gap - 空白恢复时长 (ms)
 */

/** @type {'idle'|'fadeIn'|'visible'|'fadeOut'|'gap'} */
const PHASES = ['idle', 'fadeIn', 'visible', 'fadeOut', 'gap'];

export default class PhaseMachine {
  /**
   * @param {PhaseConfig} config
   */
  constructor(config) {
    this.config = {
      fadeIn: config.fadeIn || 300,
      visible: config.visible || 2500,
      fadeOut: config.fadeOut || 300,
      gap: config.gap || 1000,
    };

    /** @type {number} 原始可见时长（散步模式可能为 999000，不可直接用于自动推进） */
    this._originalVisible = this.config.visible;
    /** @type {number} 非等待模式的 fallback 可见时长（如热身回合自动推进用） */
    this._fallbackVisible = 2500;

    /** @type {string} 当前阶段 */
    this.phase = 'idle';
    /** @type {number} 当前阶段已过时间 (ms) */
    this.phaseAge = 0;
    /** @type {number} 当前阶段总时长 (ms) */
    this.phaseDuration = 0;

    /** @type {boolean} 当前回合是否等待用户输入才推进（引擎通过 setWaitingForInput 逐回合设置） */
    this.waitingForInput = false;

    /** @type {number|null} 自动推进定时器 ID */
    this._autoAdvanceTimer = null;

    /** @type {function(string, string)} 阶段切换回调 (oldPhase, newPhase) */
    this.onPhaseChange = null;
    /** @type {function} trial 结束回调 */
    this.onTrialEnd = null;
  }

  /**
   * 获取当前阶段
   * @returns {string}
   */
  current() {
    return this.phase;
  }

  /**
   * 当前阶段是否允许用户操作（可见 + 淡出期间都可操作）
   * @returns {boolean}
   */
  isResponseWindow() {
    return this.phase === 'visible' || this.phase === 'fadeOut';
  }

  /**
   * 当前阶段进度 (0-1)
   * @returns {number}
   */
  progress() {
    if (this.phaseDuration === 0) return 0;
    return Math.min(1, this.phaseAge / this.phaseDuration);
  }

  /**
   * 开始一个新 trial 的淡入阶段
   */
  startTrial() {
    this.setPhase('fadeIn');
  }

  /**
   * 设置当前回合是否等待用户输入
   * 引擎在 onPhaseChange('visible') 时逐回合调用
   * 同步切换可见时长：等待模式用原始值（可能很长），非等待模式用 fallback
   * @param {boolean} value
   */
  setWaitingForInput(value) {
    this.waitingForInput = value;
    // 切换可见时长：等待模式用原始值，非等待模式用 fallback（如热身自动推进）
    this.config.visible = value ? this._originalVisible : this._fallbackVisible;
    // 如果当前正处于 visible 阶段，同步更新 phaseDuration
    if (this.phase === 'visible') {
      this.phaseDuration = this.config.visible;
    }
  }

  /**
   * 推进时间
   * @param {number} delta - 帧间隔 (ms)
   */
  advance(delta) {
    if (this.phase === 'idle') return;

    // 等待输入模式：visible 阶段不自动推进，等待用户手动调用 proceed()
    if (this.waitingForInput && this.phase === 'visible') {
      return;
    }

    this.phaseAge += delta;

    // 检查是否需要切换到下一阶段
    if (this.phaseAge >= this.phaseDuration) {
      this.nextPhase();
    }
  }

  /**
   * 手动推进：用户操作后从 visible 进入 fadeOut
   * 仅在 waitingForInput 模式的 visible 阶段有效
   */
  proceed() {
    if (this.waitingForInput && this.phase === 'visible') {
      this.nextPhase();
    }
  }

  /**
   * 切换到下一阶段
   */
  nextPhase() {
    const currentIndex = PHASES.indexOf(this.phase);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= PHASES.length) {
      // 循环结束，回到 idle
      this.setPhase('idle');
      if (this.onTrialEnd) this.onTrialEnd();
      return;
    }

    const nextPhase = PHASES[nextIndex];

    // gap 结束 = trial 结束
    if (this.phase === 'gap') {
      this.setPhase('idle');
      if (this.onTrialEnd) this.onTrialEnd();
      return;
    }

    this.setPhase(nextPhase);
  }

  /**
   * 设置阶段
   * @param {string} newPhase
   */
  setPhase(newPhase) {
    const oldPhase = this.phase;
    this.phase = newPhase;
    this.phaseAge = 0;

    // 设置阶段时长
    switch (newPhase) {
      case 'fadeIn':
        this.phaseDuration = this.config.fadeIn;
        break;
      case 'visible':
        this.phaseDuration = this.config.visible;
        break;
      case 'fadeOut':
        this.phaseDuration = this.config.fadeOut;
        break;
      case 'gap':
        this.phaseDuration = this.config.gap;
        break;
      default:
        this.phaseDuration = 0;
    }

    if (this.onPhaseChange && oldPhase !== newPhase) {
      this.onPhaseChange(oldPhase, newPhase);
    }
  }

  /**
   * 重置到 idle
   */
  reset() {
    this.phase = 'idle';
    this.phaseAge = 0;
    this.phaseDuration = 0;
    this.waitingForInput = false;
    if (this._autoAdvanceTimer) {
      clearTimeout(this._autoAdvanceTimer);
      this._autoAdvanceTimer = null;
    }
  }

  /**
   * 更新速度配置
   * @param {PhaseConfig} config
   */
  updateConfig(config) {
    this.config = {
      fadeIn: config.fadeIn || 300,
      visible: config.visible || 2500,
      fadeOut: config.fadeOut || 300,
      gap: config.gap || 1000,
    };
  }
}
