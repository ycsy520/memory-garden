/**
 * GameLoop — rAF 帧级游戏循环
 * 替代 setTimeout，提供精确的时间控制和暂停恢复能力。
 *
 * 核心特性（文档 §16.3）：
 * - requestAnimationFrame 驱动
 * - delta 透传（> 3000ms 帧间隔自动暂停）
 * - timeScale 控制（0 = 暂停，1 = 正常）
 * - phase 时长管理
 * - 暂停/恢复事件通知
 *
 * @version 5.0
 */

/**
 * @typedef {Object} GameLoopOptions
 * @property {function(number, number)} onTick - 每帧回调 (deltaMs, phaseAgeMs)
 * @property {function(string)} onPause - 暂停回调 (reason)
 * @property {function} onResume - 恢复回调
 */

export default class GameLoop {
  /**
   * @param {GameLoopOptions} options
   */
  constructor(options) {
    /** @type {function(number, number)} */
    this.onTick = options.onTick || (() => {});
    /** @type {function(string)} */
    this.onPause = options.onPause || (() => {});
    /** @type {function} */
    this.onResume = options.onResume || (() => {});

    /** @type {number} rAF ID */
    this.rafId = null;
    /** @type {number} 上一帧时间戳 */
    this.lastFrameTime = 0;
    /** @type {number} 时间缩放 (0=暂停, 1=正常) */
    this.timeScale = 1;
    /** @type {string|null} 暂停原因 */
    this.pauseReason = null;
    /** @type {boolean} 是否正在运行 */
    this.running = false;
  }

  /**
   * 启动游戏循环
   */
  start() {
    if (this.running) return;
    this.running = true;
    this.timeScale = 1;
    this.pauseReason = null;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  /**
   * 停止游戏循环
   */
  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 暂停游戏循环
   * @param {string} reason - 暂停原因
   */
  pause(reason) {
    if (!this.running || this.timeScale === 0) return;
    this.timeScale = 0;
    this.pauseReason = reason;
    this.onPause(reason);
  }

  /**
   * 恢复游戏循环
   * 大间隔暂停后 tick 链断裂（未调度下一帧），必须重启 rAF
   */
  resume() {
    if (!this.running) return;
    // 取消可能残留的旧帧，防止双重调度
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastFrameTime = performance.now();
    this.timeScale = 1;
    this.pauseReason = null;
    this.onResume();
    // 重启帧循环
    this.rafId = requestAnimationFrame(this.tick);
  }

  /**
   * 每帧 tick 回调
   * @param {number} now - performance.now() 时间戳
   */
  tick = (now) => {
    if (!this.running) return;

    const rawDelta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // 大 delta gap 检测（切后台、锁屏等）
    if (rawDelta > 3000) {
      this.pause('large-frame-gap');
      return;
    }

    // 不使用固定上限截断：短暂卡顿（100ms~3s）按真实流逝时间推进，
    // 避免回合计时被静默拉长；>3000ms 已由上方自动暂停兜底
    const delta = rawDelta * this.timeScale;

    // 调用上层回调
    this.onTick(delta, rawDelta);

    // 继续下一帧
    this.rafId = requestAnimationFrame(this.tick);
  };
}
