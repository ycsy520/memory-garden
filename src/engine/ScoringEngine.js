/**
 * ScoringEngine — Go-No-Go N-back 评分引擎
 * 将用户操作分类为 Hit / Miss / False Alarm / Correct Rejection，
 * 计算加权综合分、反应时、有效训练局等指标。
 *
 * 评分公式（文档 §4.3）：
 * Score = 0.45 × HitRate + 0.25 × CorrectRejectionRate
 *       - 0.20 × FalseAlarmRate - 0.10 × MissRate
 *
 * @version 5.0
 */

/**
 * @typedef {Object} TrialResult
 * @property {number} trialIndex - 回合索引
 * @property {boolean} responded - 用户是否按下按钮
 * @property {number|undefined} responseTimeMs - 反应时间(ms)
 * @property {'hit'|'miss'|'falseAlarm'|'correctRejection'} result - 分类结果
 * @property {boolean} wasWarmup - 是否暖身回合
 * @property {boolean} wasPaused - 是否在暂停后恢复的回合
 * @property {boolean} wasHedged - 是否为辅助回合
 * @property {boolean} [isLure] - 是否为 Lure 干扰回合（R5: 用于隔离冲动抑制失败）
 */

/**
 * @typedef {Object} SessionMetrics
 * @property {string} sessionId - 会话 ID
 * @property {string} startedAt - 开始时间
 * @property {string} endedAt - 结束时间
 * @property {string} mode - 模式 ID
 * @property {'general'|'child'|'adult'|'olderAdult'} userTrack - 用户轨道
 * @property {number} n - N-back 值
 * @property {string} speedProfile - 速度配置 ID
 * @property {number} totalTrials - 总回合数
 * @property {number} scoredTrials - 计分回合数
 * @property {number} hits - 命中数
 * @property {number} misses - 漏判数
 * @property {number} falseAlarms - 误判数
 * @property {number} correctRejections - 正确拒绝数
 * @property {number} hitRate - 命中率
 * @property {number} missRate - 漏判率
 * @property {number} falseAlarmRate - 误判率
 * @property {number} correctRejectionRate - 正确拒绝率
 * @property {number|undefined} medianReactionTimeMs - 中位反应时
 * @property {number|undefined} responseTimeStability - 反应时稳定性
 * @property {number} score - 综合评分
 * @property {boolean} validForAdaptation - 是否可用于自适应
 * @property {number} pauseCount - 暂停次数
 * @property {number} hedgeCount - 辅助回合数
 */

/**
 * 对单个回合进行分类
 * Go-No-Go 逻辑：
 * - 用户按了 + 是目标 = Hit
 * - 用户没按 + 是目标 = Miss
 * - 用户按了 + 非目标 = False Alarm
 * - 用户没按 + 非目标 = Correct Rejection
 *
 * @param {boolean} responded - 用户是否按下按钮
 * @param {boolean} isTarget - 当前回合是否为目标
 * @returns {'hit'|'miss'|'falseAlarm'|'correctRejection'}
 */
export function classifyTrial(responded, isTarget) {
  if (responded && isTarget) return 'hit';
  if (!responded && isTarget) return 'miss';
  if (responded && !isTarget) return 'falseAlarm';
  return 'correctRejection';
}

/**
 * 计算各项率
 * @param {number} hits
 * @param {number} misses
 * @param {number} falseAlarms
 * @param {number} correctRejections
 * @returns {{ hitRate: number, missRate: number, falseAlarmRate: number, correctRejectionRate: number }}
 */
export function computeRates(hits, misses, falseAlarms, correctRejections) {
  const totalTargets = hits + misses;
  const totalNonTargets = falseAlarms + correctRejections;

  return {
    hitRate: totalTargets > 0 ? hits / totalTargets : 0,
    missRate: totalTargets > 0 ? misses / totalTargets : 0,
    falseAlarmRate: totalNonTargets > 0 ? falseAlarms / totalNonTargets : 0,
    correctRejectionRate: totalNonTargets > 0 ? correctRejections / totalNonTargets : 0,
  };
}

/**
 * 计算加权综合评分
 * Score = 0.45 × HitRate + 0.25 × CR_Rate - 0.20 × FA_Rate - 0.10 × MissRate
 *
 * @param {{ hitRate: number, missRate: number, falseAlarmRate: number, correctRejectionRate: number }} rates
 * @returns {number} 评分（0-100 范围，四舍五入到整数）
 */
export function computeScore(rates) {
  const raw =
    0.45 * rates.hitRate +
    0.25 * rates.correctRejectionRate -
    0.20 * rates.falseAlarmRate -
    0.10 * rates.missRate;

  // 映射到 0-100 范围（raw 理论范围 -0.10 到 0.70，归一化到 0-100）
  const normalized = Math.max(0, Math.min(1, (raw + 0.10) / 0.80));
  return Math.round(normalized * 100);
}

/**
 * 计算中位反应时
 * @param {number[]} rts - 反应时数组
 * @returns {number|undefined}
 */
export function computeMedianRT(rts) {
  if (rts.length === 0) return undefined;
  const sorted = [...rts].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * 计算反应时稳定性（变异系数 CV = std / mean）
 * @param {number[]} rts - 反应时数组
 * @returns {number|undefined}
 */
export function computeRTStability(rts) {
  if (rts.length < 3) return undefined;
  const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
  if (mean === 0) return undefined;
  const variance = rts.reduce((sum, rt) => sum + (rt - mean) ** 2, 0) / rts.length;
  const std = Math.sqrt(variance);
  return Math.round((std / mean) * 100) / 100;
}

/**
 * 判断是否为有效训练局
 * 有效训练局条件（文档 §13.2）：
 * - 模式为 walk
 * - 已完成（未中途中断）
 * - 计分回合 >= 12
 * - 暂停次数 <= 1
 * - 辅助回合 = 0
 * - 无素材加载错误
 *
 * @param {Partial<SessionMetrics>} session
 * @returns {boolean}
 */
export function computeValidForAdaptation(session) {
  return (
    session.mode === 'walk' &&
    session.completed !== false &&
    (session.scoredTrials || 0) >= 12 &&
    (session.pauseCount || 0) <= 1 &&
    (session.hedgeCount || 0) === 0 &&
    !session.hasAssetError &&
    // R4: timeout 超过 40% 的局不参与自适应，避免老年用户因生理反应延迟被频繁降 N
    (session.timeoutRate || 0) <= 0.4 &&
    // R6: 前 3 局暖身局不参与自适应计算，避免冷启动锚定失真
    !session.isWarmupSession
  );
}

/**
 * 从 trial 结果数组生成完整会话指标
 *
 * @param {Object} params
 * @param {TrialResult[]} params.trialResults - 所有回合结果（含暖身）
 * @param {Object} params.config - 游戏配置
 * @param {string} params.startedAt - 开始时间
 * @param {string} params.endedAt - 结束时间
 * @param {number} params.pauseCount - 暂停次数
 * @param {number} params.hedgeCount - 辅助回合数
 * @param {boolean} params.completed - 是否完成
 * @returns {SessionMetrics}
 */
export function buildSessionMetrics({
  trialResults,
  config,
  startedAt,
  endedAt,
  pauseCount = 0,
  hedgeCount = 0,
  completed = true,
  isWarmupSession = false,  // R6: 前 3 局暖身标记
}) {
  // 只统计非暖身回合
  const scoredResults = trialResults.filter((r) => !r.wasWarmup);

  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;
  let lureFalseAlarms = 0;  // R5: Lure 误判独立计数
  const rts = [];

  for (const result of scoredResults) {
    switch (result.result) {
      case 'hit':
        hits++;
        break;
      case 'miss':
        misses++;
        break;
      case 'falseAlarm':
        // R5: Lure 误判单独计数，不混入基础误判
        if (result.isLure) {
          lureFalseAlarms++;
        } else {
          falseAlarms++;
        }
        break;
      case 'correctRejection':
        correctRejections++;
        break;
    }
    if (result.responseTimeMs != null) {
      rts.push(result.responseTimeMs);
    }
  }

  // R4: 超时 = 所有 responded === false 且非暖身的回合
  const totalTimeouts = scoredResults.filter((r) => !r.responded).length;

  const rates = computeRates(hits, misses, falseAlarms, correctRejections);
  const score = computeScore(rates);

  const session = {
    sessionId: `session-${Date.now()}`,
    startedAt,
    endedAt,
    mode: config.modeId || 'walk',
    userTrack: 'general',
    n: config.n || 1,
    speedProfile: config.speedProfile?.id || 'morning',
    totalTrials: trialResults.length,
    scoredTrials: scoredResults.length,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    lureFalseAlarms,             // R5: Lure 误判独立计数
    timeoutRate: scoredResults.length > 0
      ? totalTimeouts / scoredResults.length
      : 0,                       // R4: 超时率
    ...rates,
    medianReactionTimeMs: computeMedianRT(rts),
    responseTimeStability: computeRTStability(rts),
    score,
    validForAdaptation: false, // 下面计算
    pauseCount,
    hedgeCount,
    completed,
    isWarmupSession,  // R6: 暖身局标记
  };

  session.validForAdaptation = computeValidForAdaptation(session);

  return session;
}

export default {
  classifyTrial,
  computeRates,
  computeScore,
  computeMedianRT,
  computeRTStability,
  computeValidForAdaptation,
  buildSessionMetrics,
};
