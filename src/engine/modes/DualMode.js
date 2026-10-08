/**
 * 花与歌 — 双通道联合 N-back
 *
 * 视觉通道：花朵 emoji 先出现
 * 听觉通道：300ms 后播放音符（Do/Sol/Do⁺/Sol⁺）
 * 判断逻辑 AND：花和声音都与 N 步前匹配 → 目标
 *
 * 双通道共享同一组目标位置，确保视觉和听觉在同一回合同时重复。
 *
 * @version 6.0
 */
import BaseMode from './BaseMode.js';
import { generateSequence } from '../SequenceGenerator.js';
import { getAllStimuli } from '../stimuli/GardenStimuli.js';
import FactorRegistry from '@factors/FactorRegistry.js';

const VISUAL_POOL = getAllStimuli();
const AUDIO_PLUGIN = FactorRegistry.get('tone');

/** 默认音符池 */
const DEFAULT_TONE_POOL = [
  { freq: 261.63, name: 'Do', icon: '/img/bell_ico.png', waveType: 'sine' },
  { freq: 392.00, name: 'Sol', icon: '/img/voice_ico.png', waveType: 'triangle' },
  { freq: 523.25, name: 'Do⁺', icon: '/img/bell_ico.png', waveType: 'sine' },
  { freq: 783.99, name: 'Sol⁺', icon: '/img/voice_ico.png', waveType: 'triangle' },
];

export default class DualMode extends BaseMode {
  constructor(config) {
    super(config);
    this._visualSeq = [];
    this._audioSeq = [];

    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.falseAlarms = 0;
    this.correctRejections = 0;
    this.streakCurrent = 0;
    this.streakBest = 0;
    this.reactionTimes = [];
  }

  get modeId() { return 'dual'; }

  reset() {
    super.reset();
    this._visualSeq = [];
    this._audioSeq = [];
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
   * 预生成双通道序列
   *
   * 策略：先用 generateSequence 生成统一的目标位置结构，
   * 再分别生成视觉和听觉刺激，目标回合复用各自通道 N 步前的值。
   * 这样两个通道在同一回合同时为重复项。
   */
  _ensureSequences() {
    if (this._visualSeq.length > 0) return;

    const n = this.config.n || 1;
    const warmup = this.config.warmupTrials ?? n;
    const total = this.config.totalTurns;

    // 第一步：生成统一的目标位置结构（只用 isTarget 标记，不关心 stimulus 值）
    const structure = generateSequence({
      totalTurns: total, n, warmupTrials: warmup, targetRate: 0.38,
      maxConsecutiveSame: 2, maxConsecutiveTargets: 2,
      generateStimulus: () => ({}),  // 占位符
    });

    // 第二步：根据统一的目标位置，分别生成视觉和听觉刺激
    const tonePool = AUDIO_PLUGIN?.pool || DEFAULT_TONE_POOL;
    const visHistory = [];
    const audHistory = [];

    for (let i = 0; i < total; i++) {
      const isTarget = structure[i].isTarget;
      let vis, aud;

      if (isTarget && i >= n) {
        // 目标回合：复用各自通道 N 步前的值
        vis = visHistory[i - n];
        aud = audHistory[i - n];
      } else {
        // 非目标回合（含暖身）：生成新刺激
        vis = VISUAL_POOL[Math.floor(Math.random() * VISUAL_POOL.length)].display;
        aud = tonePool[Math.floor(Math.random() * tonePool.length)];
      }

      visHistory.push(vis);
      audHistory.push(aud);

      this._visualSeq.push({ trialIndex: i, isWarmup: i < warmup, isTarget, stimulus: vis });
      this._audioSeq.push({ trialIndex: i, isWarmup: i < warmup, isTarget, stimulus: aud });
    }
  }

  generateTurn(_factorGenerator) {
    this._ensureSequences();
    if (this.turnIndex >= this._visualSeq.length) return null;

    const vTrial = this._visualSeq[this.turnIndex];
    const aTrial = this._audioSeq[this.turnIndex];

    const visualStimulus = {
      value: vTrial.stimulus,
      stimulusId: vTrial.stimulus,
    };
    const audioStimulus = {
      value: aTrial.stimulus?.freq,
      meta: {
        name: aTrial.stimulus?.name || '?',
        icon: aTrial.stimulus?.icon || '🎵',
        waveType: aTrial.stimulus?.waveType || 'sine',
      },
    };

    return {
      stimulus: {
        id: `dual-${this.turnIndex}`,
        type: 'dual',
        value: { visual: visualStimulus, audio: audioStimulus },
      },
      isTarget: vTrial.isTarget && aTrial.isTarget,
      turnIndex: this.turnIndex,
    };
  }

  submitAnswer(isMatch) {
    if (this.isWarmup()) {
      return { isCorrect: false, scoreDelta: 0, feedback: 'warmup', channel: 'visual' };
    }

    const n = this.config.n;
    const current = this.history[this.history.length - 1];
    const target = this.history[this.history.length - 1 - n];
    if (!current || !target) {
      return { isCorrect: false, scoreDelta: 0, feedback: 'wrong', channel: 'visual' };
    }

    const vMatch = current.value.visual.value === target.value.visual.value;
    const aMatch = current.value.audio.value === target.value.audio.value;
    const isTarget = vMatch && aMatch;

    let isCorrect = false, feedback = 'wrong', scoreDelta = 0;
    if (isTarget && isMatch) {
      isCorrect = true; feedback = 'correct'; scoreDelta = 1;
    } else if (!isTarget && !isMatch) {
      isCorrect = true; feedback = 'correctRejection';
    } else if (isTarget && !isMatch) {
      feedback = 'missed';
    } else {
      feedback = 'wrong';
    }

    this._updateStats(isCorrect, isTarget, isMatch, scoreDelta);
    return { isCorrect, scoreDelta, feedback, channel: 'visual' };
  }

  _updateStats(isCorrect, isTarget, isMatch, scoreDelta) {
    this.score += scoreDelta;
    if (isTarget && isMatch) this.hits++;
    else if (isTarget && !isMatch) this.misses++;
    else if (!isTarget && isMatch) this.falseAlarms++;
    else this.correctRejections++;
    if (isCorrect) { this.streakCurrent++; this.streakBest = Math.max(this.streakBest, this.streakCurrent); }
    else this.streakCurrent = 0;
  }

  getResult() {
    const total = this.hits + this.misses + this.falseAlarms + this.correctRejections;
    return {
      score: this.score, hits: this.hits, misses: this.misses,
      falseAlarms: this.falseAlarms, correctRejections: this.correctRejections,
      accuracy: total > 0 ? (this.hits + this.correctRejections) / total : 0,
      streakBest: this.streakBest,
    };
  }
}
