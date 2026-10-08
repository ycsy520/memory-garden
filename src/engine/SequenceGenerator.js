/**
 * 统一序列生成器 — 所有游戏模式的公共逻辑
 *
 * 约束规则：
 * - 同一素材连续出现 ≤ maxConsecutiveSame（默认 2，防 ABBB）
 * - 连续目标 ≤ maxConsecutiveTargets（默认 2）
 * - 目标率 35%-40%
 * - 暖身回合不出现目标
 * - 生成失败重试 100 次，失败后降级放宽约束
 *
 * @version 5.0
 */

/**
 * @typedef {Object} SeqTrial
 * @property {number} trialIndex
 * @property {boolean} isWarmup
 * @property {boolean} isTarget
 * @property {*} stimulus - 用户提供的生成器返回的刺激值
 */

/**
 * @typedef {Object} SequenceConfig
 * @property {number} totalTurns
 * @property {number} n
 * @property {number} [warmupTrials] - 暖身回合数，默认 n+1
 * @property {number} [targetRate] - 目标率，默认 0.38
 * @property {number} [maxConsecutiveSame] - 同素材最大连续出现次数，默认 2
 * @property {number} [maxConsecutiveTargets] - 最大连续目标数，默认 2
 * @property {function():*} generateStimulus - 生成新刺激的函数，返回用于比较的标识键
 * @property {function(*, *):boolean} [compare] - 比较两个刺激是否相同，默认 ===
 */

/**
 * 生成一个完整的 trial 序列
 *
 * @param {SequenceConfig} config
 * @returns {SeqTrial[]}
 */
export function generateSequence(config) {
  const {
    totalTurns,
    n,
    warmupTrials = n,
    targetRate = 0.38,
    maxConsecutiveSame = 2,
    maxConsecutiveTargets = 2,
    generateStimulus,
    compare = (a, b) => a === b,
  } = config;

  const trials = [];
  const scoredCount = totalTurns - warmupTrials;
  let targetCount = 0;
  let consecutiveTargets = 0;
  let sameRepeat = 0;
  let lastStimulus = undefined;

  for (let i = 0; i < totalTurns; i++) {
    const isWarmup = i < warmupTrials;

    if (isWarmup) {
      // 暖身回合：生成新刺激，强制不重复
      let stimulus;
      let attempts = 0;
      do {
        stimulus = generateStimulus();
        attempts++;
      } while (attempts < 50 && lastStimulus !== undefined && compare(stimulus, lastStimulus));

      trials.push({ trialIndex: i, isWarmup: true, isTarget: false, stimulus });
      lastStimulus = stimulus;
      sameRepeat = 1;
      continue;
    }

    // 正式回合：决定是否为目标
    const scoredSoFar = trials.filter((t) => !t.isWarmup).length;
    const remaining = scoredCount - scoredSoFar;
    const neededTargets = Math.ceil(targetRate * scoredCount);
    const targetsRemaining = neededTargets - targetCount;

    let isTarget = false;
    if (i >= n && targetsRemaining > 0 && remaining > 0) {
      const prob = targetsRemaining / remaining;
      isTarget = Math.random() < Math.min(prob, 0.5);

      // 连续目标限制
      if (isTarget && consecutiveTargets >= maxConsecutiveTargets) {
        isTarget = false;
      }
    }

    if (isTarget) {
      // 目标回合：复用 N 步前的刺激
      const targetTrial = trials[i - n];

      // 检查是否会违反连续重复限制
      const wouldRepeat = lastStimulus !== undefined && compare(targetTrial.stimulus, lastStimulus);
      if (wouldRepeat && sameRepeat >= maxConsecutiveSame) {
        // 放弃目标，改为生成新刺激
        isTarget = false;
        consecutiveTargets = 0;
        let stimulus;
        let genAttempts = 0;
        do {
          stimulus = generateStimulus();
          genAttempts++;
        } while (genAttempts < 50 && compare(stimulus, lastStimulus) && sameRepeat >= maxConsecutiveSame);

        trials.push({
          trialIndex: i, isWarmup: false, isTarget: false, stimulus,
        });
        sameRepeat = compare(stimulus, lastStimulus) ? sameRepeat + 1 : 1;
        lastStimulus = stimulus;
      } else {
        trials.push({
          trialIndex: i, isWarmup: false, isTarget: true,
          stimulus: targetTrial.stimulus,
        });
        targetCount++;
        consecutiveTargets++;
        sameRepeat = wouldRepeat ? sameRepeat + 1 : 1;
        lastStimulus = targetTrial.stimulus;
      }
    } else {
      // 非目标回合：生成新刺激
      let stimulus;
      let attempts = 0;
      do {
        stimulus = generateStimulus();
        attempts++;
      } while (
        attempts < 50 &&
        lastStimulus !== undefined &&
        (compare(stimulus, lastStimulus) ? sameRepeat >= maxConsecutiveSame : false)
      );

      // 降级：如果超过重试次数，接受当前值
      trials.push({
        trialIndex: i,
        isWarmup: false,
        isTarget: false,
        stimulus,
      });
      consecutiveTargets = 0;
      sameRepeat = compare(stimulus, lastStimulus) ? sameRepeat + 1 : 1;
      lastStimulus = stimulus;
    }
  }

  return trials;
}

/**
 * 从数组中随机选取一个元素
 */
export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 选取一个不等于 exclude 的随机元素
 */
export function pickExcluding(arr, exclude) {
  const candidates = arr.filter((x) => x !== exclude);
  return candidates.length > 0 ? randomPick(candidates) : randomPick(arr);
}
