/**
 * 花坛 — 空间位置 N-back
 *
 * 3×3 九宫格，每回合在 flowerCount 个不同位置各放一朵花。
 * 日常训练：2 个位置  挑战模式：3 个位置
 * 判断：所有(位置,花)对都与 N 步前完全相同 → 目标
 *
 * @version 5.0
 */
import BaseMode from './BaseMode.js';
import { getAllStimuli } from '../stimuli/GardenStimuli.js';

const POOL = getAllStimuli();
const GRID = 3;

function randomFlower() {
  return POOL[Math.floor(Math.random() * POOL.length)].display;
}

function randomPositions(count) {
  const all = [];
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      all.push({ row: r, col: c });
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}

/** 比较两个位置-花数组是否完全相同 */
function pairsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((p, i) =>
    p.position.row === b[i].position.row &&
    p.position.col === b[i].position.col &&
    p.flower === b[i].flower
  );
}

export default class SpatialMode extends BaseMode {
  constructor(config) {
    super(config);
    this._flowerCount = config.flowerCount || 2; // 日常2 挑战3
    this._sequence = [];

    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.falseAlarms = 0;
    this.correctRejections = 0;
    this.streakCurrent = 0;
    this.streakBest = 0;
    this.reactionTimes = [];
  }

  get modeId() { return 'spatial'; }

  reset() {
    super.reset();
    this._sequence = [];
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.falseAlarms = 0;
    this.correctRejections = 0;
    this.streakCurrent = 0;
    this.streakBest = 0;
    this.reactionTimes = [];
  }

  _ensureSequence() {
    if (this._sequence.length > 0) return;

    const n = this.config.n || 1;
    const warmup = this.config.warmupTrials ?? n;
    const total = this.config.totalTurns;
    const targetRate = 0.38;
    const scoredCount = total - warmup;
    const neededTargets = Math.ceil(targetRate * scoredCount);
    let targetCount = 0;
    let consecutiveTargets = 0;
    let lastPairs = null;
    let sameRun = 0;

    for (let i = 0; i < total; i++) {
      const isWarmup = i < warmup;

      if (isWarmup) {
        // 暖身：随机生成，避免与上一轮完全相同
        let pairs;
        do {
          const positions = randomPositions(this._flowerCount);
          pairs = positions.map((p) => ({ position: p, flower: randomFlower() }));
        } while (pairsEqual(pairs, lastPairs));

        this._sequence.push(pairs);
        lastPairs = pairs;
        sameRun = 1;
        continue;
      }

      // 正式回合
      const scoredSoFar = this._sequence.filter((_, idx) => idx >= warmup).length;
      const remaining = scoredCount - scoredSoFar;
      const targetsRemaining = neededTargets - targetCount;

      let isTarget = false;
      if (i >= n && targetsRemaining > 0 && remaining > 0 && consecutiveTargets < 2) {
        isTarget = Math.random() < Math.min(targetsRemaining / remaining, 0.5);
      }

      if (isTarget) {
        const targetPairs = this._sequence[i - n];
        // 检查防重复
        if (pairsEqual(targetPairs, lastPairs) && sameRun >= 2) {
          isTarget = false;
        }
      }

      if (isTarget) {
        const targetPairs = this._sequence[i - n];
        this._sequence.push(targetPairs);
        targetCount++;
        consecutiveTargets++;
        sameRun = pairsEqual(targetPairs, lastPairs) ? sameRun + 1 : 1;
        lastPairs = targetPairs;
      } else {
        let pairs;
        let attempts = 0;
        do {
          const positions = randomPositions(this._flowerCount);
          pairs = positions.map((p) => ({ position: p, flower: randomFlower() }));
          attempts++;
        } while (attempts < 50 && pairsEqual(pairs, lastPairs) && sameRun >= 2);

        this._sequence.push(pairs);
        consecutiveTargets = 0;
        sameRun = pairsEqual(pairs, lastPairs) ? sameRun + 1 : 1;
        lastPairs = pairs;
      }
    }
  }

  generateTurn(_factorGenerator) {
    this._ensureSequence();
    if (this.turnIndex >= this._sequence.length) return null;

    const pairs = this._sequence[this.turnIndex];
    const isTarget = this.turnIndex >= (this.config.warmupTrials ?? this.config.n) &&
      this.turnIndex >= this.config.n &&
      pairsEqual(pairs, this._sequence[this.turnIndex - this.config.n]);

    return {
      stimulus: {
        id: `spatial-${this.turnIndex}`,
        type: 'spatial',
        value: pairs,
        meta: { gridSize: GRID },
      },
      isTarget,
      turnIndex: this.turnIndex,
    };
  }

  submitAnswer(isMatch) {
    if (this.isWarmup()) {
      return { isCorrect: false, scoreDelta: 0, feedback: 'warmup', channel: 'spatial' };
    }

    const n = this.config.n;
    const current = this._sequence[this.turnIndex];
    const target = this._sequence[this.turnIndex - n];
    const isTarget = pairsEqual(current, target);

    let isCorrect = false, feedback = 'wrong', scoreDelta = 0;
    if (isTarget && isMatch) { isCorrect = true; feedback = 'correct'; scoreDelta = 1; }
    else if (!isTarget && !isMatch) { isCorrect = true; feedback = 'correctRejection'; }
    else if (isTarget && !isMatch) { feedback = 'missed'; }

    this.score += scoreDelta;
    if (isTarget && isMatch) this.hits++;
    else if (isTarget && !isMatch) this.misses++;
    else if (!isTarget && isMatch) this.falseAlarms++;
    else this.correctRejections++;
    if (isCorrect) { this.streakCurrent++; this.streakBest = Math.max(this.streakBest, this.streakCurrent); }
    else this.streakCurrent = 0;

    return { isCorrect, scoreDelta, feedback, channel: 'spatial' };
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
