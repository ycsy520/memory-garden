/**
 * 花圃 — 栅格图案 N-back
 *
 * 2×2 四格栅格，每格一朵独立随机生成的花。
 * 判断：整版图案与 N 步前完全一致 → 目标
 *
 * @version 5.0
 */
import BaseMode from './BaseMode.js';
import { getAllStimuli } from '../stimuli/GardenStimuli.js';

const POOL = getAllStimuli();
const COLS = 2;
const ROWS = 2;
const CELLS = COLS * ROWS;

function randomFlower() {
  return POOL[Math.floor(Math.random() * POOL.length)].display;
}

function gridEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((cell, i) => cell.value === b[i].value);
}

export default class GridMode extends BaseMode {
  constructor(config) {
    super(config);
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

  get modeId() { return 'grid'; }

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
    const targetRate = 0.35;
    const scoredCount = total - warmup;
    const neededTargets = Math.ceil(targetRate * scoredCount);
    let targetCount = 0;
    let consecutiveTargets = 0;
    let lastGrid = null;
    let sameRun = 0;

    for (let i = 0; i < total; i++) {
      const isWarmup = i < warmup;

      if (isWarmup) {
        let grid;
        do {
          grid = Array.from({ length: CELLS }, (_, idx) => ({
            value: randomFlower(),
            position: { row: Math.floor(idx / COLS), col: idx % COLS },
          }));
        } while (gridEqual(grid, lastGrid));

        this._sequence.push(grid);
        lastGrid = grid;
        sameRun = 1;
        continue;
      }

      const scoredSoFar = this._sequence.filter((_, idx) => idx >= warmup).length;
      const remaining = scoredCount - scoredSoFar;
      const targetsRemaining = neededTargets - targetCount;

      let isTarget = false;
      if (i >= n && targetsRemaining > 0 && remaining > 0 && consecutiveTargets < 2) {
        isTarget = Math.random() < Math.min(targetsRemaining / remaining, 0.5);
      }

      if (isTarget) {
        const targetGrid = this._sequence[i - n];
        if (gridEqual(targetGrid, lastGrid) && sameRun >= 2) {
          isTarget = false;
        }
      }

      if (isTarget) {
        const targetGrid = this._sequence[i - n];
        this._sequence.push(targetGrid);
        targetCount++;
        consecutiveTargets++;
        sameRun = gridEqual(targetGrid, lastGrid) ? sameRun + 1 : 1;
        lastGrid = targetGrid;
      } else {
        let grid;
        let attempts = 0;
        do {
          grid = Array.from({ length: CELLS }, (_, idx) => ({
            value: randomFlower(),
            position: { row: Math.floor(idx / COLS), col: idx % COLS },
          }));
          attempts++;
        } while (attempts < 50 && gridEqual(grid, lastGrid) && sameRun >= 2);

        this._sequence.push(grid);
        consecutiveTargets = 0;
        sameRun = gridEqual(grid, lastGrid) ? sameRun + 1 : 1;
        lastGrid = grid;
      }
    }
  }

  generateTurn(_factorGenerator) {
    this._ensureSequence();
    if (this.turnIndex >= this._sequence.length) return null;

    const grid = this._sequence[this.turnIndex];
    const isTarget = this.turnIndex >= this.config.n &&
      gridEqual(grid, this._sequence[this.turnIndex - this.config.n]);

    return {
      stimulus: {
        id: `grid-${this.turnIndex}`,
        type: 'grid',
        value: grid,
        meta: { cols: COLS, rows: ROWS },
      },
      isTarget,
      turnIndex: this.turnIndex,
    };
  }

  submitAnswer(isMatch) {
    if (this.isWarmup()) {
      return { isCorrect: false, scoreDelta: 0, feedback: 'warmup', channel: 'visual' };
    }

    const n = this.config.n;
    const current = this._sequence[this.turnIndex];
    const target = this._sequence[this.turnIndex - n];
    const isTarget = gridEqual(current, target);

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

    return { isCorrect, scoreDelta, feedback, channel: 'visual' };
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
