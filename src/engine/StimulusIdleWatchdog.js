/**
 * 刺激空闲看门狗
 * 监控"单个刺激停留超时"，到达阈值后触发 onIdle 回调（通常用于自动暂停游戏）。
 *
 * 典型场景：waitingForInput 模式下用户人走开、但屏幕没锁屏，
 * 此时 visibility/blur 等事件都不会触发，会导致训练计时/数据统计完全失真。
 *
 * 使用方式：
 *   const wd = new StimulusIdleWatchdog({ timeoutMs: 120000, onIdle: () => pause() });
 *   wd.arm();    // 进入可见阶段时启动
 *   wd.feed();   // 用户作答/切回合时重置计时
 *   wd.disarm(); // 暂停/退出时关闭
 *
 * @version 1.0
 */
export default class StimulusIdleWatchdog {
  /**
   * @param {object} options
   * @param {number} options.timeoutMs - 空闲超时阈值（毫秒），建议 120000（2 分钟）
   * @param {Function} options.onIdle - 达到阈值后的回调（只会触发一次，需重新 arm 才会再次触发）
   */
  constructor({ timeoutMs, onIdle }) {
    /** @type {number} 超时阈值（毫秒） */
    this._timeoutMs = Math.max(0, timeoutMs | 0);
    /** @type {Function} 回调 */
    this._onIdle = typeof onIdle === 'function' ? onIdle : () => {};
    /** @type {number|null} setTimeout 句柄 */
    this._timer = null;
    /** @type {boolean} 是否已触发过（arm 后才会重置） */
    this._fired = false;
  }

  /**
   * 启动 / 重启看门狗。
   * 会先清掉任何已有计时，从头开始计。
   * 若 timeoutMs <= 0 则直接 no-op（允许"功能关闭"配置）。
   */
  arm() {
    this._fired = false;
    if (this._timeoutMs <= 0) return;
    this._clear();
    this._timer = setTimeout(() => {
      this._timer = null;
      if (this._fired) return;
      this._fired = true;
      try { this._onIdle(); } catch { /* 回调异常不影响游戏主流程 */ }
    }, this._timeoutMs);
  }

  /**
   * "喂狗"：重置计时，但不改变 fired 状态。
   * 用户作答/切换回合时调用，表示"用户还在屏幕前"。
   * 若看门狗未 arm / 已触发则 no-op。
   */
  feed() {
    if (this._fired) return;
    if (this._timer == null) return; // 未 arm 则不操作
    this.arm();
  }

  /**
   * 关闭看门狗。
   * 暂停游戏 / 退出游戏时调用，避免误触发。
   */
  disarm() {
    this._clear();
    this._fired = false;
  }

  /**
   * 清理底层定时器句柄
   * @private
   */
  _clear() {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
