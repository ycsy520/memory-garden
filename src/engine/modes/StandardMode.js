/**
 * 标准N-back模式 — 视觉记忆训练（v2.0 兼容层）
 *
 * 玩家观察依次呈现的视觉刺激，判断当前刺激是否与N步前相同。
 * 使用 SequenceGenerator 预生成序列。
 *
 * @deprecated v5.0 — WalkMode + TrialGenerator 是推荐的散步模式实现。
 *             此文件保留用于向后兼容，以及作为 DualMode/SpatialMode/GridMode 的参考基类。
 * @version 2.0
 */
import BaseMode from './BaseMode.js';
import { generateSequence } from '../SequenceGenerator.js';

export default class StandardMode extends BaseMode {
  /**
   * @param {import('./BaseMode').ModeConfig} config
   */
  constructor(config) {
    super(config);
    this._sequence = [];
    this._sequenceIndex = 0;
    this._currentStimulus = null;

    // 统计数据
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.falseAlarms = 0;
    this.correctRejections = 0;
    this.streakCurrent = 0;
    this.streakBest = 0;
    this.reactionTimes = [];
  }

  reset() {
    super.reset();
    this._sequence = [];
    this._sequenceIndex = 0;
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.falseAlarms = 0;
    this.correctRejections = 0;
    this.streakCurrent = 0;
    this.streakBest = 0;
    this.reactionTimes = [];
  }

  /**
   * 预生成序列（延迟初始化）
   */
  _prepareSequence(factorGenerator) {
    const n = this.config.n || 1;
    const warmupTrials = this.config.warmupTrials ?? n;
    this._sequence = generateSequence({
      totalTurns: this.config.totalTurns,
      n,
      warmupTrials,
      generateStimulus: factorGenerator,
    });
    this._sequenceIndex = 0;
  }

  /**
   * 生成当前回合的刺激数据
   */
  generateTurn(factorGenerator) {
    if (this._sequence.length === 0 && factorGenerator) {
      this._prepareSequence(factorGenerator);
    }
    const item = this._sequence[this._sequenceIndex];
    if (!item) return null;
    this._sequenceIndex++;
    // 保存当前刺激，供 submitAnswer 记录 history 用
    this._currentStimulus = item.stimulus;
    return {
      stimulus: {
        id: `turn-${this.turnIndex}`,
        type: 'visual',
        value: item.stimulus?.value,
        meta: item.stimulus,
      },
      isTarget: item.isTarget,
      turnIndex: this.turnIndex,
    };
  }

  /**
   * 处理玩家答案
   *
   * 关键：先记录 history，再判断暖身。暖身回合也记录 history，
   * 这样正式回合开始时 history 中已有足够的历史数据用于 N-back 比较。
   *
   * @param {boolean} isMatch - 玩家认为是否与 N 步前相同
   * @returns {import('./BaseMode').AnswerResult}
   */
  submitAnswer(isMatch) {
    // 先记录当前刺激到 history（暖身和正式回合都记录）
    const turnData = {
      turnIndex: this.turnIndex,
      isWarmup: this.isWarmup(),
      value: this._currentStimulus, // 与 DualMode/WalkMode 结构一致：{ value: 实际刺激 }
    };
    this.history.push(turnData);

    // 暖身回合不评分
    if (this.isWarmup()) {
      return { isCorrect: false, scoreDelta: 0, feedback: 'warmup', channel: 'visual' };
    }

    const n = this.config.n;
    const current = this.history[this.history.length - 1];
    const target = this.history[this.history.length - 1 - n];
    if (!current || !target) {
      return { isCorrect: false, scoreDelta: 0, feedback: 'wrong', channel: 'visual' };
    }

    // 比较 value.value（实际刺激值，如 emoji 字符串），而非整个对象
    const isTarget = current.value?.value === target.value?.value;

    let isCorrect = false, feedback = 'wrong', scoreDelta = 0;
    if (isTarget && isMatch) { isCorrect = true; feedback = 'correct'; scoreDelta = 1; }
    else if (!isTarget && !isMatch) { isCorrect = true; feedback = 'correctRejection'; }
    else if (isTarget && !isMatch) { feedback = 'missed'; }
    else { feedback = 'wrong'; }

    this._recordAnswer({ isCorrect, scoreDelta, feedback, channel: 'visual' }, isTarget, isMatch);
    return { isCorrect, scoreDelta, feedback, channel: 'visual' };
  }

  _recordAnswer(result, isTarget, isMatch) {
    if (result.feedback === 'warmup') return;
    this.score += result.scoreDelta || 0;
    if (isTarget && isMatch) this.hits++;
    else if (isTarget && !isMatch) this.misses++;
    else if (!isTarget && isMatch) this.falseAlarms++;
    else this.correctRejections++;
    if (result.isCorrect) { this.streakCurrent++; this.streakBest = Math.max(this.streakBest, this.streakCurrent); }
    else { this.streakCurrent = 0; }
  }

  /**
   * 记录超时未响应（暖身自动推进或正式回合超时时调用）
   * 将当前刺激记录到 history，确保后续回合有 N-back 比较数据
   */
  recordNoResponse() {
    const turnData = {
      turnIndex: this.turnIndex,
      isWarmup: this.isWarmup(),
      value: this._currentStimulus,
    };
    this.history.push(turnData);

    if (!this.isWarmup()) {
      const n = this.config.n;
      const current = this.history[this.history.length - 1];
      const target = this.history[this.history.length - 1 - n];
      if (current && target) {
        const isTarget = current.value?.value === target.value?.value;
        if (isTarget) { this.misses++; this.streakCurrent = 0; }
        else { this.correctRejections++; this.streakCurrent++; this.streakBest = Math.max(this.streakBest, this.streakCurrent); }
      }
    }
  }

  getResult() {
    const total = this.hits + this.misses + this.falseAlarms + this.correctRejections;
    return {
      score: this.score, hits: this.hits, misses: this.misses,
      falseAlarms: this.falseAlarms, correctRejections: this.correctRejections,
      accuracy: total > 0 ? (this.hits + this.correctRejections) / total : 0,
      reactionTime: this.reactionTimes.length > 0
        ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length) : 0,
      streakBest: this.streakBest,
    };
  }
}
