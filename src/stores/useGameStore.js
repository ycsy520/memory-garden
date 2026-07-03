/**
 * 游戏运行时状态管理 — Zustand Store
 * 持久化策略: 不持久化 (仅内存，标签页关闭即清空)
 * 管理游戏进行中的所有实时状态
 */
import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // === 状态枚举 ===
  /** @type {'idle'|'ready'|'active'|'paused'|'finished'|'abandoned'} */
  status: 'idle',

  // === 游戏配置 ===
  /** @type {{ id: string, n: number, speed: number, totalTurns: number, factorId: string, label: string, desc: string }|null} */
  config: null,
  /** @type {number} */
  levelIndex: 0,

  // === 运行时数据 ===
  /** @type {Array} */
  history: [],
  /** @type {number} */
  currentTurn: 0,
  /** @type {number} */
  score: 0,
  /** @type {boolean} */
  showStimulus: false,
  /** @type {boolean} */
  userAnswered: false,
  /** @type {'correct'|'wrong'|'missed'|null} */
  feedback: null,

  // === 统计 ===
  /** @type {number} */
  hits: 0,
  /** @type {number} */
  misses: 0,
  /** @type {number} */
  falseAlarms: 0,
  /** @type {number} */
  correctRejections: 0,
  /** @type {number} */
  streakBest: 0,
  /** @type {number} */
  streakCurrent: 0,

  // === 时间 ===
  /** @type {number|null} */
  startedAt: null,
  /** @type {number|null} 当前回合刺激出现时间戳 */
  trialStartTime: null,
  /** @type {Array<number>} 反应时间记录（ms） */
  reactionTimes: [],
  /** @type {number} 限时模式剩余时间（ms） */
  timedModeRemaining: 0,
  /** @type {number} 当局连续未命中计数（miss + falseAlarm） */
  consecutiveMisses: 0,
  /** @type {number} 当局超时未作答次数 */
  timeoutCount: 0,

  // === 暂停 ===
  /** @type {number|null} */
  pausedAt: null,

  // === 单局计时（散步模式显示已用时间） ===
  /** @type {number|null} */
  /** @type {boolean} 当前回合是否等待用户输入（逐回合，由引擎设置） */
  trialWaitingForInput: false,
  /** @type {number} 当前回合有效可见时长 (ms)，引擎逐回合设置 */
  trialVisibleDuration: 2500,

  // === 动作 ===

  /** 初始化游戏状态，准备开始 */
  init: (config, levelIndex) => set({
    status: 'ready',
    config,
    levelIndex,
    history: [],
    currentTurn: 0,
    score: 0,
    showStimulus: false,
    userAnswered: false,
    feedback: null,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    streakCurrent: 0,
    startedAt: Date.now(),
    pausedAt: null,
    trialStartTime: null,
    trialWaitingForInput: false,
    trialVisibleDuration: 2500,
    consecutiveMisses: 0,
    timeoutCount: 0,
  }),

  /** 添加新的刺激到历史 */
  addFactor: (factor) => set((state) => ({
    history: [...state.history, factor],
  })),

  /** 展示刺激 */
  show: () => set({
    showStimulus: true,
    userAnswered: false,
    feedback: null,
    trialStartTime: Date.now(),
  }),

  /** 隐藏刺激 */
  hide: () => set({ showStimulus: false }),

  /** 设置当前回合是否等待用户输入 */
  setTrialWaitingForInput: (value) => set({ trialWaitingForInput: value }),

  /** 设置当前回合有效可见时长 */
  setTrialVisibleDuration: (value) => set({ trialVisibleDuration: value }),

  /** 推进到下一回合 */
  nextTurn: () => set((state) => ({
    currentTurn: state.currentTurn + 1,
  })),

  /** 标记游戏开始 (第一个回合) */
  start: () => set({ status: 'active' }),

  /**
   * 提交玩家答案并计算结果
   * @deprecated v5.0 — WalkMode + ScoringEngine 接管了判分逻辑。
   *             新代码应通过 useGameEngine.handleMatch() → WalkMode.submitAnswer() → syncModeResult() 路径。
   *             此方法仅作为旧版模式兼容层保留，待所有旧模式迁移完成后移除。
   * @param {boolean} isMatch - 玩家是否按下"似曾相识"
   * @param {number} n - N-back的N值
   * @returns {{ isCorrect: boolean, feedback: string }}
   */
  submitAnswer: (isMatch, n) => {
    const state = get();
    const { history } = state;
    const currentIndex = history.length - 1;
    const isWarmup = history.length <= n;

    // 暖身期不计分
    if (isWarmup) {
      return { isCorrect: false, feedback: 'warmup' };
    }

    const currentItem = history[currentIndex];
    const targetItem = history[currentIndex - n];
    const isTarget = currentItem.value === targetItem.value;

    let isCorrect = false;
    let feedback = 'wrong';
    let scoreDelta = 0;

    if (isTarget && isMatch) {
      // 正确命中
      isCorrect = true;
      feedback = 'correct';
      scoreDelta = 1;
    } else if (!isTarget && !isMatch) {
      // 正确拒绝
      isCorrect = true;
      feedback = null;
    } else if (isTarget && !isMatch) {
      // 漏判
      feedback = 'missed';
    } else {
      // 误判
      feedback = 'wrong';
    }

    set((prev) => {
      const newStreak = isCorrect ? prev.streakCurrent + 1 : 0;
      return {
        userAnswered: true,
        feedback,
        score: prev.score + scoreDelta,
        hits: isTarget && isMatch ? prev.hits + 1 : prev.hits,
        misses: isTarget && !isMatch ? prev.misses + 1 : prev.misses,
        falseAlarms: !isTarget && isMatch ? prev.falseAlarms + 1 : prev.falseAlarms,
        correctRejections: !isTarget && !isMatch ? prev.correctRejections + 1 : prev.correctRejections,
        streakCurrent: newStreak,
        streakBest: Math.max(prev.streakBest, newStreak),
      };
    });

    return { isCorrect, feedback };
  },

  /**
   * 同步模式系统的作答结果到Store
   * v2.0: 模式类接管了判定逻辑，但UI仍需从Store读取 feedback/userAnswered/score/stats
   * 根据 feedback 类型推断 hit/miss/falseAlarm/correctRejection
   * @param {{ isCorrect: boolean, scoreDelta: number, feedback: string }} result
   */
  syncModeResult: (result) => {
    if (!result) {
      console.warn('[syncModeResult] result is null/undefined');
      return;
    }

    // 暖身回合：设置 userAnswered，防止被误判为漏项
    if (result.feedback === 'warmup') {
      set({ userAnswered: true });
      return;
    }

    set((prev) => {
      const newStreak = result.isCorrect ? prev.streakCurrent + 1 : 0;

      // 根据 feedback 推断统计类型
      let { hits, misses, falseAlarms, correctRejections } = prev;
      if (result.feedback === 'correct') {
        hits++;
      } else if (result.feedback === 'correctRejection') {
        correctRejections++;
      } else if (result.feedback === 'missed') {
        misses++;
      } else if (result.feedback === 'wrong') {
        falseAlarms++;
      }

      // 连续未命中计数（miss 或 wrong 都算未命中）
      const isMiss = result.feedback === 'missed' || result.feedback === 'wrong';
      const newConsecutiveMisses = isMiss ? prev.consecutiveMisses + 1 : 0;

      return {
        userAnswered: true,
        feedback: result.feedback || null,
        score: prev.score + (result.scoreDelta || 0),
        streakCurrent: newStreak,
        streakBest: Math.max(prev.streakBest, newStreak),
        hits,
        misses,
        falseAlarms,
        correctRejections,
        reactionTimes: result.rt ? [...prev.reactionTimes, result.rt] : prev.reactionTimes,
        consecutiveMisses: newConsecutiveMisses,
      };
    });
  },

  /** 
   * 游戏结束 — 同步模式系统的权威统计到 Store
   * v2.0: 接收 modeResult 确保 FinishedScreen 显示正确数据
   * @param {{ score: number, hits: number, misses: number, falseAlarms: number, correctRejections: number, streakBest: number }} [modeResult]
   */
  finish: (modeResult) => {
    if (modeResult) {
      set({
        status: 'finished',
        score: modeResult.score,
        hits: modeResult.hits,
        misses: modeResult.misses,
        falseAlarms: modeResult.falseAlarms,
        correctRejections: modeResult.correctRejections,
        streakBest: modeResult.streakBest,
      });
    } else {
      set({ status: 'finished' });
    }
  },

  /** 暂停游戏 */
  pause: () => set({
    status: 'paused',
    pausedAt: Date.now(),
  }),

  /** 恢复游戏 */
  resume: () => set({
    status: 'active',
    pausedAt: null,
  }),

  /** 放弃游戏 */
  abandon: () => set({ status: 'abandoned' }),

  /** 重置所有状态 */
  reset: () => set({
    status: 'idle',
    config: null,
    history: [],
    currentTurn: 0,
    score: 0,
    showStimulus: false,
    userAnswered: false,
    feedback: null,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    streakCurrent: 0,
    streakBest: 0,
    startedAt: null,
    pausedAt: null,
    trialStartTime: null,
    trialWaitingForInput: false,
    trialVisibleDuration: 2500,
    timeoutCount: 0,
  }),
}));

export default useGameStore;
