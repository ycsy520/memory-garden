/**
 * 散步模式 — Go-No-Go N-back
 * 用户只在认为"当前刺激与 N 步前匹配"时按按钮；
 * 不操作 = 认为不匹配。
 *
 * 内部使用 TrialGenerator 预生成完整序列，
 * 使用 ScoringEngine 进行 Hit/Miss/FA/CR 分类。
 *
 * @version 5.0
 */
import BaseMode from './BaseMode.js';
import { generateTrials, pickExcluding } from '../TrialGenerator.js';
import { classifyTrial } from '../ScoringEngine.js';
import { getAllStimuli } from '../stimuli/GardenStimuli.js';

export default class WalkMode extends BaseMode {
  /**
   * @param {Object} config - 游戏配置
   * @param {number} config.n - N-back 值
   * @param {number} config.totalTurns - 总回合数
   * @param {number} [config.warmupTrials] - 暖身回合数
   * @param {number} [config.targetRate] - 目标率
   * @param {number} [config.lureRate] - lure 率
   */
  constructor(config) {
    super({
      ...config,
      id: config.id || `walk-n${config.n}`,
      name: '散步',
      modeId: 'walk',
    });

    // 限时模式标记
    this._isTimedMode = config.timed && config.timeLimit > 0;

    if (this._isTimedMode) {
      // 限时模式：不预生成序列，使用实时生成
      this.trials = [];
      this._allStimuli = getAllStimuli();
      this._lastTargetIndex = -Infinity;
      this._lastStimulusId = null;
    } else {
      // 普通模式：预生成完整 trial 序列
      this.trials = generateTrials({
        mode: 'walk',
        n: config.n,
        totalTrials: config.totalTurns,
        warmupTrials: config.warmupTrials ?? config.n,
        targetRate: config.targetRate || 0.38,
        lureRate: config.lureRate || 0.15,
        maxSameStimulusRepeat: 1, // 避免同一素材连续出现
        allowConsecutiveTargets: false,
      });
    }

    // 每回合的用户操作记录
    /** @type {import('../ScoringEngine.js').TrialResult[]} */
    this.trialResults = [];

    // 当前回合开始时间（用于计算 RT）
    this._trialStartTime = 0;

    // 暂停计数
    this.pauseCount = 0;

    // 辅助回合计数
    this.hedgeCount = 0;
  }

  // WalkMode 内部统计（v5.0: 移除了 BaseMode 的 recordAnswer/getResult，改为使用 ScoringEngine）
  /** @type {number} */
  score = 0;
  /** @type {number} */
  hits = 0;
  /** @type {number} */
  misses = 0;
  /** @type {number} */
  falseAlarms = 0;
  /** @type {number} */
  correctRejections = 0;
  /** @type {number} */
  streakCurrent = 0;
  /** @type {number} */
  streakBest = 0;
  /** @type {number[]} */
  reactionTimes = [];

  /**
   * 记录一次作答结果，更新内部统计
   * @param {import('./BaseMode').AnswerResult} result
   * @param {boolean} isTarget
   * @param {boolean} isMatch
   */
  recordAnswer(result, isTarget, isMatch) {
    if (result.feedback === 'warmup') return;
    this.score += result.scoreDelta || 0;
    if (isTarget && isMatch) this.hits++;
    else if (isTarget && !isMatch) this.misses++;
    else if (!isTarget && isMatch) this.falseAlarms++;
    else this.correctRejections++;
    if (result.isCorrect) {
      this.streakCurrent++;
      this.streakBest = Math.max(this.streakBest, this.streakCurrent);
    } else {
      this.streakCurrent = 0;
    }
  }

  /**
   * 获取游戏结束后的统计结果（向后兼容旧 getResult() 调用）
   * @returns {Object}
   */
  getResult() {
    const totalJudged = this.hits + this.misses + this.falseAlarms + this.correctRejections;
    return {
      score: this.score,
      hits: this.hits,
      misses: this.misses,
      falseAlarms: this.falseAlarms,
      correctRejections: this.correctRejections,
      accuracy: totalJudged > 0 ? (this.hits + this.correctRejections) / totalJudged : 0,
      reactionTime: this.reactionTimes.length > 0
        ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
        : 0,
      streakBest: this.streakBest,
    };
  }

  /**
   * 重置模式状态
   */
  reset() {
    super.reset();
    this.trialResults = [];
    this._trialStartTime = 0;
    this.pauseCount = 0;
    this.hedgeCount = 0;
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.falseAlarms = 0;
    this.correctRejections = 0;
    this.streakCurrent = 0;
    this.streakBest = 0;
    this.reactionTimes = [];

    if (this._isTimedMode) {
      // 限时模式：清空 trials，重置实时生成状态
      this.trials = [];
      this._lastTargetIndex = -Infinity;
      this._lastStimulusId = null;
    } else {
      // 普通模式：重新生成 trials
      this.trials = generateTrials({
        mode: 'walk',
        n: this.config.n,
        totalTurns: this.config.totalTurns,
        warmupTrials: this.config.warmupTrials ?? this.config.n,
        targetRate: this.config.targetRate || 0.38,
        lureRate: this.config.lureRate || 0.15,
      });
    }
  }

  /**
   * 获取当前回合的 trial 数据
   * 兼容 BaseMode 的 generateTurn 接口
   *
   * @param {Function} _factorGenerator - 未使用（素材由 TrialGenerator 预生成或实时生成）
   * @returns {import('./BaseMode').TurnData}
   */
  generateTurn(_factorGenerator) {
    // 限时模式：实时生成刺激项
    if (this._isTimedMode) {
      return this._generateRealtimeTurn();
    }

    // 普通模式：从预生成序列中获取
    const trial = this.trials[this.turnIndex];
    if (!trial) {
      return null;
    }

    // 记录回合开始时间
    this._trialStartTime = Date.now();

    return {
      stimulus: {
        id: `trial-${trial.trialIndex}`,
        type: 'visual',
        value: trial.stimulusDisplay,
        meta: {
          stimulusId: trial.stimulusId,
          stimulusDisplay: trial.stimulusDisplay,
        },
      },
      isTarget: trial.isTarget,
      turnIndex: trial.trialIndex,
    };
  }

  /**
   * 限时模式实时生成时选取非目标刺激。
   * 同时排除上一个素材与 N 步前素材，避免"视觉上与 N 步前相同却按 isTarget=false 判误判"。
   * @returns {import('../stimuli/GardenStimuli.js').StimulusDef}
   */
  _pickNonTargetStimulus() {
    const n = this.config.n;
    const excludeIds = [this._lastStimulusId];
    const nBackTrial = this.turnIndex >= n ? this.trials[this.turnIndex - n] : null;
    if (nBackTrial) {
      excludeIds.push(nBackTrial.stimulusId);
    }
    return pickExcluding(this._allStimuli, excludeIds);
  }

  /**
   * 限时模式实时生成刺激项
   * 不预生成序列，每回合实时决定：
   * - 是否为目标回合（复用 N 步前的刺激）
   * - 目标项间隔：至少 n+1 回合，目标率约 35%
   *
   * @returns {import('./BaseMode').TurnData}
   */
  _generateRealtimeTurn() {
    const n = this.config.n;
    const warmupTrials = this.config.warmupTrials ?? n;
    const isWarmup = this.turnIndex < warmupTrials;

    // 判断是否为目标回合
    let isTarget = false;
    if (!isWarmup && this.turnIndex >= n) {
      // 检查是否满足最小间隔（至少 n+1 回合）
      const turnsSinceLastTarget = this.turnIndex - this._lastTargetIndex;
      if (turnsSinceLastTarget >= n + 1) {
        // 使用概率决定是否为目标（约 35% 概率）
        isTarget = Math.random() < 0.35;
      }
    }

    let stimulusId, stimulusDisplay;
    if (isTarget && this.turnIndex >= n) {
      // 目标回合：复用 N 步前的刺激
      const targetTrial = this.trials[this.turnIndex - n];
      if (targetTrial) {
        stimulusId = targetTrial.stimulusId;
        stimulusDisplay = targetTrial.stimulusDisplay;
        this._lastTargetIndex = this.turnIndex;
      } else {
        // 降级：随机生成（排除上一个与 N 步前素材，避免偶然重合造成假目标）
        const stimulus = this._pickNonTargetStimulus();
        stimulusId = stimulus.id;
        stimulusDisplay = stimulus.display;
        isTarget = false;
      }
    } else {
      // 非目标回合：随机生成新刺激（排除上一个与 N 步前素材）
      const stimulus = this._pickNonTargetStimulus();
      stimulusId = stimulus.id;
      stimulusDisplay = stimulus.display;
    }

    this._lastStimulusId = stimulusId;

    // 构造 trial 对象
    const trial = {
      trialIndex: this.turnIndex,
      isWarmup,
      n,
      mode: 'walk',
      stimulusId,
      stimulusDisplay,
      isTarget,
      targetType: isTarget ? 'visual' : 'none',
      isLure: false,
      lureType: undefined,
      expectedAction: isTarget ? 'press' : 'noPress',
    };

    // 追加到 trials 数组（用于后续目标项复用）
    this.trials.push(trial);

    // 记录回合开始时间
    this._trialStartTime = Date.now();

    return {
      stimulus: {
        id: `trial-${trial.trialIndex}`,
        type: 'visual',
        value: trial.stimulusDisplay,
        meta: {
          stimulusId: trial.stimulusId,
          stimulusDisplay: trial.stimulusDisplay,
        },
      },
      isTarget: trial.isTarget,
      turnIndex: trial.trialIndex,
    };
  }

  /**
   * 处理用户操作（双按钮：一样 / 不一样）
   * isMatch=true  → Go（认为与 N 步前相同，responded=true）
   * isMatch=false → No-Go（认为不同，responded=false）
   *
   * @param {boolean} isMatch - 用户是否认为与 N 步前相同
   * @returns {import('./BaseMode').AnswerResult}
   */
  submitAnswer(isMatch) {
    const trial = this.trials[this.turnIndex];
    if (!trial) {
      return { isCorrect: false, scoreDelta: 0, feedback: 'wrong', channel: 'visual' };
    }

    // 暖身回合不计分
    if (trial.isWarmup) {
      const responded = isMatch;
      const now = Date.now();
      this.trialResults.push({
        trialIndex: trial.trialIndex,
        responded,
        responseTimeMs: now - this._trialStartTime,
        result: responded ? 'hit' : 'correctRejection',
        wasWarmup: true,
        wasPaused: false,
        wasHedged: false,
        isLure: false,
        phaseStartedAt: this._trialStartTime,
        phaseEndedAt: now,
      });
      this.history.push(trial);
      return { isCorrect: true, scoreDelta: 0, feedback: 'warmup', channel: 'visual' };
    }

    // 正式回合：isMatch=true → responded=true(Go)，isMatch=false → responded=false(No-Go)
    const responded = isMatch;
    const now = Date.now();
    const responseTimeMs = now - this._trialStartTime;
    const result = classifyTrial(responded, trial.isTarget);

    const isCorrect = result === 'hit' || result === 'correctRejection';
    const scoreDelta = result === 'hit' ? 1 : 0;

    this.trialResults.push({
      trialIndex: trial.trialIndex,
      responded,
      responseTimeMs,
      result,
      wasWarmup: false,
      wasPaused: false,
      wasHedged: false,
      isLure: trial.isLure || false,
      phaseStartedAt: this._trialStartTime,
      phaseEndedAt: now,
    });

    const feedbackMap = {
      hit: 'correct',
      miss: 'missed',
      falseAlarm: 'wrong',
      correctRejection: 'correctRejection',
    };

    this.recordAnswer({ isCorrect, scoreDelta, feedback: feedbackMap[result], channel: 'visual' }, trial.isTarget, responded);
    this.reactionTimes.push(responseTimeMs);
    this.history.push(trial);

    return { isCorrect, scoreDelta, feedback: feedbackMap[result], channel: 'visual' };
  }

  /**
   * 记录用户未操作（Go-No-Go 的 "No-Go"）
   * 在回合超时时由引擎调用
   */
  recordNoResponse() {
    const trial = this.trials[this.turnIndex];
    if (!trial) return;

    const now = Date.now();

    if (trial.isWarmup) {
      this.trialResults.push({
        trialIndex: trial.trialIndex,
        responded: false,
        responseTimeMs: undefined,
        result: 'correctRejection',
        wasWarmup: true,
        wasPaused: false,
        wasHedged: false,
        isLure: false,
        phaseStartedAt: this._trialStartTime,
        phaseEndedAt: now,
      });
      this.history.push(trial);
      return;
    }

    const result = classifyTrial(false, trial.isTarget);
    const isCorrect = result === 'correctRejection';
    const scoreDelta = 0;

    this.trialResults.push({
      trialIndex: trial.trialIndex,
      responded: false,
      responseTimeMs: undefined,
      result,
      wasWarmup: false,
      wasPaused: false,
      wasHedged: false,
      isLure: trial.isLure || false,
      phaseStartedAt: this._trialStartTime,
      phaseEndedAt: now,
    });

    const feedbackMap = {
      hit: 'correct',
      miss: 'missed',
      falseAlarm: 'wrong',
      correctRejection: null,
    };

    this.recordAnswer({ isCorrect, scoreDelta, feedback: feedbackMap[result], channel: 'visual' }, trial.isTarget, false);
    this.history.push(trial);
  }

  /**
   * 获取当前是否为暖身回合
   * @returns {boolean}
   */
  isWarmup() {
    const trial = this.trials[this.turnIndex];
    return trial ? trial.isWarmup : false;
  }

  /**
   * 获取当前回合是否为 lure
   * @returns {boolean}
   */
  isCurrentLure() {
    const trial = this.trials[this.turnIndex];
    return trial ? trial.isLure : false;
  }

  /**
   * 获取完整会话结果（包含 ScoringEngine 所需的所有字段）
   * @returns {Object}
   */
  getFullResult() {
    const basicResult = this.getResult();
    return {
      ...basicResult,
      trialResults: this.trialResults,
      pauseCount: this.pauseCount,
      hedgeCount: this.hedgeCount,
      modeId: 'walk',
      n: this.config.n,
      speedProfile: this.config.speedProfile?.id || 'morning',
      completed: this.isFinished(),
    };
  }
}
