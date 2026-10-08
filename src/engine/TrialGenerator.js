/**
 * TrialGenerator — 回合序列生成器
 * 为 Go-No-Go N-back 任务生成完整的 trial 序列。
 *
 * 核心规则：
 * - 暖身回合（warmup）不计入评分，前 N+1 回合为暖身
 * - 正式回合中目标率 ≈ 35%-40%
 * - lure 率 ≈ 15%-25%
 * - 连续目标不超过 2 次
 * - 同一素材连续出现不超过 2 次
 * - 生成失败时最多重试 100 次，失败则降低 lure 约束
 *
 * @version 5.0
 */

import {
  getAllStimuli,
  getStimulusById,
  getSimilarStimuli,
} from './stimuli/GardenStimuli.js';

/**
 * @typedef {Object} TrialGeneratorConfig
 * @property {'walk'|'flower-bed'|'flower-song'|'garden-grid'} mode - 模式
 * @property {number} n - N-back 值
 * @property {number} totalTrials - 总回合数（含暖身）
 * @property {number} warmupTrials - 暖身回合数
 * @property {number} targetRate - 目标率（0.35-0.40）
 * @property {number} lureRate - lure 率（0.15-0.25）
 * @property {boolean} allowConsecutiveTargets - 是否允许连续目标
 * @property {number} maxSameStimulusRepeat - 同素材最大连续重复
 */

/**
 * @typedef {Object} Trial
 * @property {number} trialIndex - 回合索引
 * @property {boolean} isWarmup - 是否暖身回合
 * @property {number} n - N-back 值
 * @property {'walk'|'flower-bed'|'flower-song'|'garden-grid'} mode - 模式
 * @property {string} stimulusId - 素材 ID
 * @property {string} stimulusDisplay - 素材展示内容
 * @property {boolean} isTarget - 是否为目标回合
 * @property {'none'|'visual'|'audio'|'spatial'|'conjunctive'} targetType - 目标类型
 * @property {boolean} isLure - 是否为 lure 回合
 * @property {'nMinus1'|'nPlus1'|'singleChannel'|'similarStimulus'|undefined} lureType - lure 类型
 * @property {'press'|'noPress'} expectedAction - 预期操作
 */

/**
 * 从数组中随机选取一个元素
 * @param {any[]} arr
 * @returns {any}
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 生成散步模式的 trial 序列
 *
 * @param {Partial<TrialGeneratorConfig>} userConfig - 用户配置
 * @returns {Trial[]} 生成的 trial 序列
 */
export function generateTrials(userConfig) {
  const config = {
    mode: 'walk',
    n: 1,
    totalTrials: 16,
    warmupTrials: 2,
    targetRate: 0.38,
    lureRate: 0.15,
    allowConsecutiveTargets: false,
    maxSameStimulusRepeat: 2,
    ...userConfig,
  };

  const allStimuli = getAllStimuli();
  const trials = [];

  // 统计计数器（仅正式回合）
  let scoredTrials = 0;
  let targetCount = 0;
  let lureCount = 0;
  let consecutiveTargets = 0;
  let sameStimulusRepeat = 0;
  let lastStimulusId = null;

  for (let i = 0; i < config.totalTrials; i++) {
    const isWarmup = i < config.warmupTrials;
    const remainingScored = config.totalTrials - config.warmupTrials - scoredTrials;

    let trial;

    if (isWarmup) {
      // 暖身回合：随机素材，不计目标
      const stimulus = pickNonRepeating(allStimuli, lastStimulusId);
      trial = {
        trialIndex: i,
        isWarmup: true,
        n: config.n,
        mode: config.mode,
        stimulusId: stimulus.id,
        stimulusDisplay: stimulus.display,
        isTarget: false,
        targetType: 'none',
        isLure: false,
        lureType: undefined,
        expectedAction: 'noPress',
      };
      lastStimulusId = stimulus.id;
    } else {
      // 正式回合：决定是否为目标
      const canBeTarget = i >= config.n && remainingScored > 0;
      let isTarget = false;
      let isLure = false;
      let lureType = undefined;
      let stimulus;

      if (canBeTarget) {
        // 检查目标率：如果当前目标数不足，强制生成目标
        const neededTargets = Math.ceil(config.targetRate * (config.totalTrials - config.warmupTrials));
        const targetsRemaining = neededTargets - targetCount;
        const trialsRemaining = config.totalTrials - config.warmupTrials - scoredTrials;

        if (targetsRemaining > 0 && trialsRemaining > 0) {
          const targetProbability = targetsRemaining / trialsRemaining;
          isTarget = Math.random() < targetProbability;
        }

        // 连续目标限制
        if (isTarget && !config.allowConsecutiveTargets && consecutiveTargets >= 2) {
          isTarget = false;
        }
      }

      if (isTarget) {
        // 目标回合：复用 N 步前的素材
        const targetTrial = trials[i - config.n];
        stimulus = getStimulusById(targetTrial.stimulusId);
        consecutiveTargets++;
        targetCount++;
        scoredTrials++;

        trial = {
          trialIndex: i,
          isWarmup: false,
          n: config.n,
          mode: config.mode,
          stimulusId: stimulus.id,
          stimulusDisplay: stimulus.display,
          isTarget: true,
          targetType: 'visual',
          isLure: false,
          lureType: undefined,
          expectedAction: 'press',
        };
      } else {
        // 非目标回合：检查是否生成 lure
        if (canBeTarget && i >= config.n + 1) {
          const remainingForLure = config.totalTrials - config.warmupTrials - scoredTrials;
          const neededLures = Math.ceil(config.lureRate * (config.totalTrials - config.warmupTrials));
          if (lureCount < neededLures && remainingForLure > 0) {
            isLure = Math.random() < (neededLures - lureCount) / remainingForLure;
          }
        }

        if (isLure) {
          // Lure 回合：选择 lure 类型
          const lureResult = generateLure(
            trials,
            i,
            config.n,
            allStimuli,
            lastStimulusId,
          );
          stimulus = lureResult.stimulus;
          lureType = lureResult.lureType;
          lureCount++;
          scoredTrials++;
        } else {
          // 普通非目标回合：排除上一个素材与 N 步前素材，
          // 避免"视觉上与 N 步前相同却按 isTarget=false 判误判"的偶然重合
          const excludeIds = [lastStimulusId];
          if (i >= config.n && trials[i - config.n]) {
            excludeIds.push(trials[i - config.n].stimulusId);
          }
          stimulus = pickExcluding(allStimuli, excludeIds);
          scoredTrials++;
        }

        // 同素材连续重复检查
        if (stimulus.id === lastStimulusId) {
          sameStimulusRepeat++;
          if (sameStimulusRepeat > config.maxSameStimulusRepeat) {
            stimulus = pickExcluding(allStimuli, [lastStimulusId]);
            sameStimulusRepeat = 1;
          }
        } else {
          sameStimulusRepeat = 1;
        }

        consecutiveTargets = 0;
        lastStimulusId = stimulus.id;

        trial = {
          trialIndex: i,
          isWarmup: false,
          n: config.n,
          mode: config.mode,
          stimulusId: stimulus.id,
          stimulusDisplay: stimulus.display,
          isTarget: false,
          targetType: 'none',
          isLure,
          lureType,
          expectedAction: 'noPress',
        };
      }

      lastStimulusId = trial.stimulusId;
    }

    trials.push(trial);
  }

  return trials;
}

/**
 * 生成 lure 回合的素材
 * 优先 nMinus1（与 N-1 步前匹配），其次 similarStimulus（同相似组）
 *
 * @param {Trial[]} trials - 已生成的 trials
 * @param {number} currentIndex - 当前索引
 * @param {number} n - N-back 值
 * @param {StimulusDef[]} allStimuli - 全部素材
 * @param {string} lastStimulusId - 上一个素材 ID
 * @returns {{ stimulus: StimulusDef, lureType: string }}
 */
function generateLure(trials, currentIndex, n, allStimuli, lastStimulusId) {
  // 50% 概率选择 nMinus1，50% 选择 similarStimulus
  const useNMinus1 = Math.random() < 0.5;

  if (useNMinus1 && currentIndex >= n - 1 && n > 1) {
    // nMinus1: 与 N-1 步前匹配
    // 若 N-1 步前的素材恰好等于 N 步前（真目标），则跳过该 lure 类型，
    // 避免把"真正的目标"误标为 lure（用户按键会被判误判）
    const lureTarget = trials[currentIndex - (n - 1)];
    const nBackTrial = trials[currentIndex - n];
    if (lureTarget && (!nBackTrial || lureTarget.stimulusId !== nBackTrial.stimulusId)) {
      const stimulus = getStimulusById(lureTarget.stimulusId);
      if (stimulus) {
        return { stimulus, lureType: 'nMinus1' };
      }
    }
  }

  // similarStimulus: 从 N 步前素材的相似组中选择
  if (currentIndex >= n) {
    const nBackTrial = trials[currentIndex - n];
    const similar = getSimilarStimuli(nBackTrial.stimulusId);
    if (similar.length > 0) {
      return { stimulus: randomPick(similar), lureType: 'similarStimulus' };
    }
  }

  // 降级：随机选一个不同的素材（排除上一个与 N 步前素材，避免偶然重合）
  const excludeIds = [lastStimulusId];
  const nBackTrial = currentIndex >= n ? trials[currentIndex - n] : null;
  if (nBackTrial) {
    excludeIds.push(nBackTrial.stimulusId);
  }
  const stimulus = pickExcluding(allStimuli, excludeIds);
  return { stimulus, lureType: 'similarStimulus' };
}

/**
 * 选择一个与上一个不同的素材（避免连续重复）
 * @param {StimulusDef[]} pool
 * @param {string} excludeId
 * @returns {StimulusDef}
 */
function pickNonRepeating(pool, excludeId) {
  const candidates = pool.filter((s) => s.id !== excludeId);
  return candidates.length > 0 ? randomPick(candidates) : randomPick(pool);
}

/**
 * 从素材池中排除指定 ID 后随机选择
 * @param {StimulusDef[]} pool
 * @param {string[]} excludeIds
 * @returns {StimulusDef}
 */
function pickExcluding(pool, excludeIds) {
  const candidates = pool.filter((s) => !excludeIds.includes(s.id));
  return candidates.length > 0 ? randomPick(candidates) : randomPick(pool);
}

export { pickNonRepeating, pickExcluding };
