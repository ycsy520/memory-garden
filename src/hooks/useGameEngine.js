/**
 * 游戏引擎Hook — 连接游戏模式系统与React状态
 * 管理回合计时器、暖身期、模式切换等逻辑
 * 将游戏循环逻辑从UI组件中解耦
 *
 * v5.0 P0-B: 使用 rAF GameLoop + PhaseMachine 替代 setTimeout
 *
 * @version 5.0
 * @author Memory Garden Team
 */
import { useCallback, useRef, useEffect } from 'react';
import useGameStore from '@stores/useGameStore';
import useStatsStore from '@stores/useStatsStore';
import useSettingsStore from '@stores/useSettingsStore';
import useGardenStore from '@stores/useGardenStore';
import useAchievementStore from '@stores/useAchievementStore';
import { evaluateNarrativeUnlocks, evaluateHiddenAchievements } from '@engine/narrativeUnlockEngine';
import WalkMode from '@engine/modes/WalkMode';
import GameLoop from '@engine/GameLoop';
import PhaseMachine from '@engine/PhaseMachine';
import AudioService from '@services/AudioService';
import AnalyticsService from '@services/AnalyticsService';

/**
 * 模块级变量 — 跨组件共享游戏实例
 * useGameEngine 被 MenuScreen 和 GameScreen 分别调用，
 * ref 在每处调用独立存在，因此使用模块级变量共享。
 */
let _modeInstance = null;
let _gameLoop = null;
let _phaseMachine = null;
let _timedModeTimer = null;
let _timedModeInterval = null;


/**
 * 从历史 sessions 计算解锁引擎所需的累计统计
 * @param {Array} sessions - 所有历史 session 记录
 * @param {Object} achievementState - useAchievementStore 状态
 * @returns {Object} 解锁引擎所需的 stats 对象
 */
function computeUnlockStats(sessions, achievementState) {
  const days = new Set();
  const modes = new Set();
  let maxN = 0;
  let totalCorrect = 0;
  let stableSessionCount = 0;

  sessions.forEach((s) => {
    if (s.startedAt) days.add(new Date(s.startedAt).toDateString());
    modes.add(s.modeId || s.mode || 'walk');
    maxN = Math.max(maxN, s.difficulty || 1);
    totalCorrect += (s.hits || 0) + (s.correctRejections || 0);
    if (s.completed && (s.timeoutCount || 0) <= 1) stableSessionCount++;
  });

  // 连续天数
  let streakDays = 0;
  const sortedDays = Array.from(days).sort();
  if (sortedDays.length > 0) {
    streakDays = 1;
    for (let i = sortedDays.length - 1; i > 0; i--) {
      const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / 86400000;
      if (diff === 1) streakDays++;
      else break;
    }
  }

  return {
    totalWalks: sessions.length,
    streakDays,
    maxN,
    usedModes: new Set(modes),
    stableSessionCount,
    totalCorrect,
    diaryViewedCount: achievementState.hasViewedGardenDiary ? 1 : 0,
    customizedRhythm: false,
  };
}

/**
 * 将扁平的 unlockedNarratives 转换为引擎期望的嵌套格式
 * @param {Object} unlockedNarratives - { collectibleId: highestTierId }
 * @returns {Object} { collectibleId: { tiers: { tierId: { unlocked: boolean } } } }
 */
function buildUnlockState(unlockedNarratives) {
  const TIER_ORDER = { sprout: 0, leaf: 1, bloom: 2, fullBloom: 3 };
  const result = {};
  for (const [collectibleId, highestTierId] of Object.entries(unlockedNarratives)) {
    const highestOrder = TIER_ORDER[highestTierId] ?? -1;
    const tiers = {};
    for (const [tierId, order] of Object.entries(TIER_ORDER)) {
      tiers[tierId] = { unlocked: order <= highestOrder };
    }
    result[collectibleId] = { tiers };
  }
  return result;
}

/**
 * 游戏引擎Hook
 * @param {Function} onGameEnd - 游戏结束回调 (用于导航到结果页)
 * @returns {{ startGame: Function, handleMatch: Function, stopGame: Function, pauseGame: Function, resumeGame: Function }}
 */
export default function useGameEngine(onGameEnd) {
  const onGameEndRef = useRef(onGameEnd);

  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  const addSession = useStatsStore((s) => s.addSession);

  const isMutedRef = useRef(false);
  useEffect(() => {
    const unsub = useSettingsStore.subscribe(
      (state) => { isMutedRef.current = state.isMuted; }
    );
    // 初始化一次
    isMutedRef.current = useSettingsStore.getState().isMuted;
    return unsub;
  }, []);

  /**
   * 清理所有定时器和循环
   */
  const clearTimers = useCallback(() => {
    if (_gameLoop) {
      _gameLoop.stop();
      _gameLoop = null;
    }
    if (_timedModeTimer) {
      clearTimeout(_timedModeTimer);
      _timedModeTimer = null;
    }
    if (_timedModeInterval) {
      clearInterval(_timedModeInterval);
      _timedModeInterval = null;
    }
    if (_phaseMachine) {
      _phaseMachine.reset();
      _phaseMachine = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      AudioService.stopAmbience();
    };
  }, []);

  /**
   * 游戏结束处理 — 保存会话、解锁成就、导航到结果页
   * @param {Object} config - 游戏配置
   */
  const handleGameEnd = useCallback((config) => {
    clearTimers();
    AudioService.stopAmbience();

    const mode = _modeInstance;
    if (!mode) return;

    // 直接使用 store 中的数据（由 syncModeResult 实时更新）
    const finalState = useGameStore.getState();
    const modeResult = {
      score: finalState.score,
      hits: finalState.hits,
      misses: finalState.misses,
      falseAlarms: finalState.falseAlarms,
      correctRejections: finalState.correctRejections,
      streakBest: finalState.streakBest,
      reactionTimes: finalState.reactionTimes,
    };

    useGameStore.getState().finish(modeResult);

    const newSession = {
      id: `session-${Date.now()}`,
      modeId: mode.modeId,
      difficulty: config.n,
      factorId: config.factorId,
      factorIds: config.factorIds || [config.factorId],
      score: modeResult.score,
      totalTurns: config.totalTurns,
      hits: modeResult.hits,
      misses: modeResult.misses,
      falseAlarms: modeResult.falseAlarms,
      correctRejections: modeResult.correctRejections,
      accuracy: modeResult.accuracy || 0,
      reactionTime: modeResult.reactionTime || 0,
      reactionTimes: modeResult.reactionTimes || [],
      startedAt: finalState.startedAt,
      endedAt: Date.now(),
      duration: Math.round((Date.now() - finalState.startedAt) / 1000),
      streakBest: finalState.streakBest,
      mode: mode.modeId,
      validForAdaptation: modeResult.validForAdaptation || false,
      pauseCount: modeResult.pauseCount || 0,
      hedgeCount: modeResult.hedgeCount || 0,
      visualScore: modeResult.visualScore,
      audioScore: modeResult.audioScore,
      spatialScore: modeResult.spatialScore,
      gridSize: modeResult.gridSize,
      timeoutCount: finalState.timeoutCount,
      timed: config.timed || false,
      completed: true,
      hadConsecutiveMisses: finalState.consecutiveMisses >= 3,
      falseAlarmCount: finalState.falseAlarms,
    };
    addSession(newSession);
    AnalyticsService.trackSession(newSession);

    const allSessions = useStatsStore.getState().sessions;

    // ── 叙事解锁引擎：评估本局新增解锁 ──
    try {
      const achievementState = useAchievementStore.getState();
      const unlockStats = computeUnlockStats(allSessions, achievementState);
      const sessionMetrics = {
        completed: true,
        falseAlarmCount: finalState.falseAlarms,
        timeoutCount: finalState.timeoutCount,
        streakBest: finalState.streakBest,
        n: config.n,
        gameMode: mode.modeId,
        timed: config.timed || false,
        hadConsecutiveMisses: finalState.consecutiveMisses >= 3,
      };
      const currentUnlockState = buildUnlockState(achievementState.unlockedNarratives);
      const newUnlocks = evaluateNarrativeUnlocks({
        session: sessionMetrics,
        stats: unlockStats,
        currentUnlockState,
      });
      if (newUnlocks.length > 0) {
        achievementState.applyUnlocks(newUnlocks);
      }
    } catch {
      /* 解锁引擎异常不影响游戏结算 */
    }

    // ── 隐藏成就评估（花园秘密） ──
    try {
      const statsState = useStatsStore.getState();
      const hiddenState = useAchievementStore.getState();
      const hiddenUnlocks = evaluateHiddenAchievements({
        perModeCounts: statsState.perModeCounts,
        perNCounts: statsState.perNCounts,
        currentHidden: hiddenState.hiddenAchievements,
      });
      hiddenUnlocks.forEach((id) => hiddenState.applyHiddenUnlock(id));
    } catch {
      /* 隐藏成就异常不影响游戏结算 */
    }

    // 花园成长：根据命中率计算成长点
    const totalJudged = modeResult.hits + modeResult.misses + modeResult.falseAlarms + modeResult.correctRejections;
    const accuracy = totalJudged > 0 ? (modeResult.hits + modeResult.correctRejections) / totalJudged : 0;
    const gardenStore = useGardenStore.getState();
    const growthPoints = gardenStore.calculateGrowthPoints(accuracy);
    gardenStore.addGrowthPoints({ points: growthPoints, accuracy });
    // 检查并解锁收集元素
    gardenStore.checkAndUnlock();

    if (onGameEndRef.current) onGameEndRef.current();
  }, [clearTimers, addSession]);

  /**
   * 开始新游戏 — 统一使用 PhaseMachine + GameLoop 驱动
   * @param {Object} config - 游戏配置
   * @param {number} levelIndex - 难度索引
   */
  const startGame = useCallback((config, levelIndex) => {
    clearTimers();

    AudioService.init();
    AudioService.resume();
    if (!isMutedRef.current) AudioService.startAmbience();

    const gameN = config.n || 1;
    const gameWarmup = config.warmupTrials || gameN + 1;
    const gameTotal = config.totalTurns || (14 + gameN * 2);

    // 创建 WalkMode 实例（唯一支持的模式）
    const modeConfig = {
      ...config,
      n: gameN,
      warmupTrials: gameWarmup,
      totalTurns: gameTotal,
      factorId: config.factorId || 'emoji-flower',
    };

    try {
      _modeInstance = new WalkMode(modeConfig);
    } catch (error) {
      console.error('[useGameEngine] 创建 WalkMode 失败:', error);
      _modeInstance = new WalkMode(modeConfig);
    }

    // 因子生成函数（WalkMode 使用 TrialGenerator 预生成序列，不需要运行时生成）
    const factorGenerator = null;

    // 初始化游戏状态
    useGameStore.getState().init({
      ...config,
      modeId: 'walk',
      n: gameN,
      warmupTrials: gameWarmup,
      totalTurns: gameTotal,
    }, levelIndex);

    // 创建 PhaseMachine
    const speedProfile = config.speedProfile || {
      fadeIn: 300, visible: 2500, fadeOut: 300, gap: 1000,
    };
    _phaseMachine = new PhaseMachine(speedProfile);

    // 是否等待输入（散步模式全局开关，热身回合强制关闭）
    const wantsWaitingForInput = config.waitingForInput || false;

    // PhaseMachine 回调
    _phaseMachine.onPhaseChange = (oldPhase, newPhase) => {
      if (newPhase === 'fadeIn') {
        // 生成当前回合刺激（StandardMode 需要 factorGenerator，其他模式不需要）
        const turnData = _modeInstance.generateTurn(factorGenerator);
        if (!turnData || !turnData.stimulus) return;

        const gameStore = useGameStore.getState();
        gameStore.addFactor(turnData.stimulus);
        gameStore.show();

        // 记录刺激出现时间（用于计算反应时间）
        useGameStore.setState({ trialStartTime: Date.now() });

        if (_modeInstance.turnIndex === 0) {
          gameStore.start();
        }
      }

      // 进入可见阶段时，逐回合决定是否等待输入
      // 热身回合强制自动推进（按钮被禁用，无法手动推进）
      if (newPhase === 'visible') {
        const isWarmup = _modeInstance.isWarmup();
        const trialWantsInput = !isWarmup && wantsWaitingForInput;
        _phaseMachine.setWaitingForInput(trialWantsInput);
        useGameStore.getState().setTrialWaitingForInput(trialWantsInput);
        // 同步有效可见时长（PhaseMachine 已根据 waitingForInput 切换）
        useGameStore.getState().setTrialVisibleDuration(_phaseMachine.config.visible);
      }

      if (newPhase === 'gap') {
        // 刺激消失
        useGameStore.getState().hide();

        // 超时未操作 = 漏项
        if (!useGameStore.getState().userAnswered) {
          // 记录超时未作答
          useGameStore.setState((s) => ({ timeoutCount: s.timeoutCount + 1 }));
          // WalkMode 有 recordNoResponse，其他模式使用 submitMiss
          if (typeof _modeInstance.recordNoResponse === 'function') {
            _modeInstance.recordNoResponse();
            // 同步未操作的结果到 store
            const noResponseResult = _modeInstance.trialResults[_modeInstance.trialResults.length - 1];
            if (noResponseResult && !noResponseResult.wasWarmup) {
              useGameStore.getState().syncModeResult({
                isCorrect: noResponseResult.result === 'correctRejection' || noResponseResult.result === 'miss',
                scoreDelta: 0,
                feedback: noResponseResult.result === 'miss' ? 'missed' : null,
              });
            }
          } else if (typeof _modeInstance.submitMiss === 'function') {
            // 其他模式使用 submitMiss
            const missResult = _modeInstance.submitMiss();
            useGameStore.getState().syncModeResult(missResult);
          }
          useGameStore.setState({ userAnswered: true, feedback: null });
        }
      }
    };

    _phaseMachine.onTrialEnd = () => {
      // 当前回合结束后，检查是否还有下一回合
      // turnIndex 从 0 开始，totalTurns=16 时，最后一个有效回合是 turnIndex=15
      // 限时模式下不检查 totalTurns，由定时器控制结束
      const isTimedMode = config.timed && config.timeLimit > 0;
      const isLastTrial = !isTimedMode && _modeInstance.turnIndex >= _modeInstance.config.totalTurns - 1;

      if (isLastTrial) {
        // 最后一回合的 gap 已结束，直接结算
        handleGameEnd(config);
        return;
      }

      // 推进到下一回合
      _modeInstance.advanceTurn();
      useGameStore.getState().nextTurn();

      // 重置 userAnswered 为下一回合做准备
      useGameStore.setState({ userAnswered: false, feedback: null });

      // 开始下一个 trial
      _phaseMachine.startTrial();
    };

    // 创建 GameLoop
    _gameLoop = new GameLoop({
      onTick: (delta) => {
        if (_phaseMachine) {
          _phaseMachine.advance(delta);
        }
      },
      onPause: (_reason) => {
        useGameStore.getState().pause();
        if (_modeInstance) {
          _modeInstance.pauseCount = (_modeInstance.pauseCount || 0) + 1;
        }
      },
      onResume: () => {
        useGameStore.getState().resume();
      },
    });

    // 注册 visibility 自动暂停（不自动恢复，需手动点击继续）
    const handleVisibilityChange = () => {
      if (document.hidden && _gameLoop && _gameLoop.running) {
        _gameLoop.pause('visibility-change');
      }
    };
    const handlePageHide = () => {
      if (_gameLoop && _gameLoop.running) {
        _gameLoop.pause('page-hide');
      }
    };
    const handleBlur = () => {
      if (_gameLoop && _gameLoop.running) {
        _gameLoop.pause('blur');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);

    // 存储清理函数（供 stopGame 使用）
    _gameLoop._cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
    };

    // 启动游戏循环
    _gameLoop.start();
    _phaseMachine.startTrial();

    // 限时模式：设置时间限制定时器 + 倒计时更新
    if (config.timed && config.timeLimit > 0) {
      useGameStore.setState({ timedModeRemaining: config.timeLimit });
      _timedModeInterval = setInterval(() => {
        const elapsed = Date.now() - useGameStore.getState().startedAt;
        const remaining = Math.max(0, config.timeLimit - elapsed);
        useGameStore.setState({ timedModeRemaining: remaining });
      }, 1000);
      _timedModeTimer = setTimeout(() => {
        handleGameEnd(config);
      }, config.timeLimit);
    }
  }, [clearTimers, handleGameEnd]);

  /**
   * 处理玩家匹配动作（双按钮：true=一样，false=不一样）
   * @param {boolean} isSame - 用户认为是否与 N 步前相同
   * @returns {{ isCorrect: boolean, feedback: string }|null}
   */
  const handleMatch = useCallback((isSame = true) => {
    if (!_modeInstance) return null;

    const state = useGameStore.getState();
    if (!state.showStimulus || state.userAnswered || !state.config) return null;

    AudioService.init();
    AudioService.resume();

    // 计算反应时间
    const rt = state.trialStartTime ? Date.now() - state.trialStartTime : null;

    let result;

    // 统一处理所有模式的匹配逻辑
    result = _modeInstance.submitAnswer(isSame);
    // 附加反应时间
    if (result && rt !== null) {
      result.rt = rt;
    }
    useGameStore.getState().syncModeResult(result);
    // 散步模式：用户操作后手动推进到 fadeOut
    if (_phaseMachine) _phaseMachine.proceed();

    return result;
  }, []);

  /**
   * 暂停游戏（用户主动暂停或 visibility 触发）
   */
  const pauseGame = useCallback(() => {
    if (_gameLoop && _gameLoop.running) {
      _gameLoop.pause('user-pause');
    }
  }, []);

  /**
   * 恢复游戏
   */
  const resumeGame = useCallback(() => {
    if (_gameLoop && _gameLoop.running) {
      _gameLoop.resume();
    }
  }, []);

  /**
   * 热身回合主动推进 — 用于小花倒计时完成时触发回合结束
   * 仅在热身阶段且 PhaseMachine 处于 visible 阶段时生效
   */
  const proceedWarmup = useCallback(() => {
    if (!_modeInstance || !_phaseMachine) return;
    // 仅热身阶段且当前处于 visible 阶段才推进
    if (_modeInstance.isWarmup() && _phaseMachine.phase === 'visible') {
      _phaseMachine.proceed();
    }
  }, []);

  /**
   * 停止游戏并返回菜单
   */
  const stopGame = useCallback(() => {
    clearTimers();
    AudioService.stopAmbience();
    if (_modeInstance) {
      _modeInstance.reset();
      _modeInstance = null;
    }
    if (_gameLoop && _gameLoop._cleanup) {
      _gameLoop._cleanup();
    }
    useGameStore.getState().reset();
  }, [clearTimers]);

  return { startGame, handleMatch, stopGame, pauseGame, resumeGame, proceedWarmup };
}
