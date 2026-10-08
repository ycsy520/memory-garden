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
import { getTierOrder } from '@stores/useAchievementStore';
import { evaluateNarrativeUnlocks, evaluateHiddenAchievements } from '@engine/narrativeUnlockEngine';
import WalkMode from '@engine/modes/WalkMode';
import ModeFactory from '@engine/modes/ModeFactory';
import FactorRegistry from '@factors/FactorRegistry';
import GameLoop from '@engine/GameLoop';
import PhaseMachine from '@engine/PhaseMachine';
import StimulusIdleWatchdog from '@engine/StimulusIdleWatchdog';
import AudioService from '@services/AudioService';
import AnalyticsService from '@services/AnalyticsService';
import SyncService from '@services/SyncService';
import PlatformService from '@services/PlatformService';

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
// 旧版引擎：暴露定时器和推进函数供 handleMatch 使用
let _legacyTimer = null;
let _legacyAdvance = null;
let _legacyTimerCallback = null;
let _legacyTimerDueAt = null;
let _legacyTimerRemainingMs = 0;
// 旧版引擎暂停状态追踪（GameLoop 无法控制 setTimeout 链）
let _legacyPaused = false;
let _pauseStartedAt = null;
let _totalPauseMs = 0;
// 限时模式倒计时实际开始时间（暖身结束后记录）
let _timedModeStartAt = null;
let _timedModeStartCallback = null;
let _focusPauseCleanup = null;
// 空闲看门狗：waitingForInput 模式下单个刺激停留超时自动暂停（防用户走开后数据失真）
let _idleWatchdog = null;
// 是否真正运行过游戏（startGame 已调用）。用于区分 StrictMode 开发模式的模拟卸载与真实卸载：
// 模拟卸载发生在 startGame 之前，此时不能 reset store，否则会把 MenuScreen 刚设置的 config 清空。
let _hadStarted = false;

/**
 * 清除旧版引擎当前挂起的 timeout 句柄，但保留回调引用，便于恢复时重新挂回。
 * @returns {void}
 */
function clearLegacyRuntimeTimer() {
  if (_legacyTimer) {
    clearTimeout(_legacyTimer);
    _legacyTimer = null;
  }
  _legacyTimerDueAt = null;
}

/**
 * 为旧版引擎调度 timeout，并记录回调与剩余时长，支持暂停后按原链路恢复。
 * @param {Function} callback - timeout 到期后的回调
 * @param {number} delayMs - 延迟毫秒数
 * @returns {void}
 */
function scheduleLegacyRuntimeTimer(callback, delayMs) {
  const safeDelay = Math.max(0, delayMs);
  clearLegacyRuntimeTimer();
  _legacyTimerCallback = callback;
  _legacyTimerRemainingMs = safeDelay;
  _legacyTimerDueAt = Date.now() + safeDelay;
  _legacyTimer = setTimeout(() => {
    _legacyTimer = null;
    _legacyTimerDueAt = null;
    _legacyTimerRemainingMs = 0;
    callback();
  }, safeDelay);
}


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
  /** R6: 读取已使用的暖身局数，判断当前局是否为暖身局 */
  const warmupSessionsUsed = useStatsStore((s) => s.warmupSessionsUsed);

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
    if (_focusPauseCleanup) {
      _focusPauseCleanup();
      _focusPauseCleanup = null;
    }
    if (_idleWatchdog) {
      _idleWatchdog.disarm();
      _idleWatchdog = null;
    }
    if (_gameLoop) {
      if (typeof _gameLoop.stop === 'function') _gameLoop.stop();
      _gameLoop = null;
    }
    clearLegacyRuntimeTimer();
    _legacyAdvance = null;
    _legacyTimerCallback = null;
    _legacyTimerRemainingMs = 0;
    _legacyPaused = false;
    _pauseStartedAt = null;
    _totalPauseMs = 0;
    _timedModeStartAt = null;
    _timedModeStartCallback = null;
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

  /**
   * 统一暂停入口
   * 同时暂停 GameLoop、旧版计时链和限时模式倒计时，避免出现“状态已暂停但时间仍在流逝”。
   * @param {string} reason
   */
  const pauseRuntime = useCallback((reason = 'user-pause') => {
    if (_idleWatchdog) _idleWatchdog.disarm();
    if (_gameLoop && _gameLoop.running) {
      _gameLoop.pause(reason);
    } else {
      useGameStore.getState().pause(reason);
    }

    _legacyPaused = true;
    _pauseStartedAt = Date.now();

    if (!_gameLoop && _legacyTimer) {
      _legacyTimerRemainingMs = Math.max(0, (_legacyTimerDueAt ?? Date.now()) - Date.now());
      clearLegacyRuntimeTimer();
    }

    if (_timedModeTimer) {
      clearTimeout(_timedModeTimer);
      _timedModeTimer = null;
    }
    if (_timedModeInterval) {
      clearInterval(_timedModeInterval);
      _timedModeInterval = null;
    }
  }, []);

  /**
   * 为所有模式统一注册失焦暂停监听
   * 不能只挂在 walk 的新版引擎分支，否则旧版模式会完全漏掉暂停能力。
   */
  const registerFocusPauseGuards = useCallback(() => {
    const shouldPauseFromVisibilityEvent = () => useGameStore.getState().status === 'active';

    const handleVisibilityChange = () => {
      if (document.hidden && shouldPauseFromVisibilityEvent()) {
        pauseRuntime('visibility-change');
      }
    };

    const handlePageHide = () => {
      if (shouldPauseFromVisibilityEvent()) {
        pauseRuntime('page-hide');
      }
    };

    const handleBlur = () => {
      if (shouldPauseFromVisibilityEvent()) {
        pauseRuntime('blur');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);

    _focusPauseCleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
    };
  }, [pauseRuntime]);

  // 组件卸载时清理 — 防止中途退出后 rAF/限时计时器残留
  // （App.jsx 使用 key={location.pathname} 强制重挂载，卸载即离开游戏页）
  useEffect(() => {
    return () => {
      clearTimers();
      AudioService.stopAmbience();
      if (_modeInstance) {
        _modeInstance.reset();
        _modeInstance = null;
      }
      // 仅在真正运行过游戏后才重置 store，避免 StrictMode 开发模式的模拟卸载
      // 在挂载阶段清空 MenuScreen 刚设置的 config（会导致进入游戏被弹回菜单）
      if (_hadStarted) {
        _hadStarted = false;
        // 正常结束时 handleGameEnd 已通过 finish() 写入结算数据（status='finished'），
        // 此时卸载不能清空，否则结算页会读到全 0；中途退出才需要清理残留状态。
        if (useGameStore.getState().status !== 'finished') {
          useGameStore.getState().reset();
        }
      }
    };
  }, [clearTimers]);

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
    // 计算准确率与平均反应时间（历史记录/排行榜/云端上报依赖这两个字段）
    const totalJudged = modeResult.hits + modeResult.misses + modeResult.falseAlarms + modeResult.correctRejections;
    modeResult.accuracy = totalJudged > 0 ? (modeResult.hits + modeResult.correctRejections) / totalJudged : 0;
    modeResult.reactionTime = modeResult.reactionTimes.length > 0
      ? Math.round(modeResult.reactionTimes.reduce((a, b) => a + b, 0) / modeResult.reactionTimes.length)
      : 0;

    useGameStore.getState().finish(modeResult);

    const newSession = {
      id: crypto.randomUUID(),
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
      // R6: 前 3 局标记为暖身局，不参与自适应计算
      isWarmupSession: warmupSessionsUsed < 3,
    };
    addSession(newSession);
    AnalyticsService.trackSession(newSession);

    const allSessions = useStatsStore.getState().sessions;

    // 命中率（用于花园成长点和解锁引擎，accuracy 已在上面计算）
    const accuracy = modeResult.accuracy;

    // ── 统一解锁引擎：每局最多解锁 1 个，优先级 叙事 > 隐藏 > 花园 ──
    try {
      const candidates = [];

      // 1. 评估叙事收藏品候选
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
      const narrativeUnlocks = evaluateNarrativeUnlocks({
        session: sessionMetrics,
        stats: unlockStats,
        currentUnlockState,
      });
      narrativeUnlocks.forEach((u) => {
        candidates.push({ type: 'narrative', data: u, priority: 1, tierOrder: getTierOrder(u.tierId) });
      });

      // 2. 评估隐藏成就候选
      const statsState = useStatsStore.getState();
      const hiddenUnlocks = evaluateHiddenAchievements({
        perModeCounts: statsState.perModeCounts,
        perNCounts: statsState.perNCounts,
        currentHidden: achievementState.hiddenAchievements,
      });
      hiddenUnlocks.forEach((id) => {
        candidates.push({ type: 'hidden', data: id, priority: 2, tierOrder: 0 });
      });

      // 3. 评估花园收集元素候选
      const gardenStore = useGardenStore.getState();
      gardenStore.addGrowthPoints({ points: gardenStore.calculateGrowthPoints(accuracy), accuracy });
      const gardenCandidates = gardenStore.getUnlockCandidates();
      gardenCandidates.forEach((id) => {
        candidates.push({ type: 'garden', data: id, priority: 3, tierOrder: 0 });
      });

      // 排序：priority 升序（叙事 > 隐藏 > 花园），同级按品质降序（高品质优先）
      candidates.sort((a, b) => a.priority - b.priority || b.tierOrder - a.tierOrder);

      // 只取第一个（最高优先级）
      const winner = candidates[0];
      if (winner) {
        if (winner.type === 'narrative') {
          achievementState.applyUnlocks([winner.data]);
        } else if (winner.type === 'hidden') {
          achievementState.applyHiddenUnlock(winner.data);
        } else if (winner.type === 'garden') {
          useGardenStore.getState().unlockSingle(winner.data);
        }
      }
    } catch {
      /* 解锁引擎异常不影响游戏结算 */
    }

    // 云端同步：游戏结束时将 session 和花园状态上传（仅已登录用户）
    try {
      SyncService.syncSession(newSession);
      const platformInfo = PlatformService.detect();
      const platform = platformInfo.isCapacitor ? platformInfo.os : (platformInfo.isPWA ? 'pwa' : 'web');
      SyncService.syncAnalyticsAttempt({
        sessionId: newSession.id,
        modeId: newSession.modeId,
        rhythmId: config.gameMode || 'walk',
        difficultyN: config.n,
        timed: config.timed || false,
        timeLimitS: config.timed && typeof config.timeLimit === 'number' ? Math.round(config.timeLimit / 1000) : 0,
        startedAt: new Date(newSession.startedAt).toISOString(),
        endedAt: new Date(newSession.endedAt).toISOString(),
        endedReason: 'finished',
        durationMs: Math.max(0, newSession.endedAt - newSession.startedAt),
        pauseDurationMs: _totalPauseMs,
        activeDurationMs: Math.max(0, newSession.endedAt - newSession.startedAt - _totalPauseMs),
        warmupDurationMs: 0,
        turnCountTotal: config.totalTurns,
        turnCountScored: Math.max(0, config.totalTurns - (config.warmupTrials ?? config.n)),
        exitStage: 'finished',
        exitTurnIndex: null,
        score: modeResult.score,
        accuracy,
        rtP50Ms: null,
        rtP90Ms: null,
        appVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
        platform,
        locale: useSettingsStore.getState().lang || 'zh-CN',
      });
      const gardenSnapshot = useGardenStore.getState();
      SyncService.syncGardenState({
        growthPoints: gardenSnapshot.growthPoints,
        totalWalks: gardenSnapshot.totalWalks,
        streakDays: gardenSnapshot.streakDays,
        bestAccuracy: gardenSnapshot.bestAccuracy,
        discovered: gardenSnapshot.discovered,
        lastWalkDate: gardenSnapshot.lastWalkDate,
      });
    } catch {
      /* 同步异常不影响游戏结算 */
    }

    if (onGameEndRef.current) onGameEndRef.current();
  }, [clearTimers, addSession, warmupSessionsUsed]);

  const createStartTimedCountdown = useCallback((config) => {
    return () => {
      if (_timedModeTimer) {
        clearTimeout(_timedModeTimer);
        _timedModeTimer = null;
      }
      if (_timedModeInterval) {
        clearInterval(_timedModeInterval);
        _timedModeInterval = null;
      }

      _timedModeStartAt = Date.now();
      _timedModeInterval = setInterval(() => {
        if (_legacyPaused) return;
        const elapsed = Date.now() - _timedModeStartAt - _totalPauseMs;
        const remaining = Math.max(0, config.timeLimit - elapsed);
        useGameStore.setState({ timedModeRemaining: remaining });
      }, 1000);
      _timedModeTimer = setTimeout(() => {
        if (_legacyPaused) return;
        handleGameEnd(config);
      }, config.timeLimit);
    };
  }, [handleGameEnd]);

  /**
   * 旧版引擎：使用 setTimeout 驱动回合（StandardMode/DualMode/SpatialMode/GridMode）
   * 保留此路径以兼容尚未迁移到 GameLoop+PhaseMachine 的模式。
   *
   * @param {Object} config
   * @param {number} gameN
   * @param {number} gameWarmup
   * @param {number} gameTotal
   */
  const _startLegacyGame = useCallback((config, gameN, gameWarmup, gameTotal) => {
    const speed = config.speedProfile?.visible || config.speed || 3000;
    const factorPlugin = FactorRegistry.get(config.factorId || 'sprite-garden');
    const factorGenerator = factorPlugin ? () => factorPlugin.generate() : null;

    /** 推进到下一回合（超时或用户点击后调用） */
    const advanceToNext = () => {
      if (!_modeInstance) return;
      const wasWarmup = _modeInstance.isWarmup();
      _modeInstance.advanceTurn();
      useGameStore.getState().nextTurn();
      // 暖身→正式回合转换：启动限时模式倒计时
      if (wasWarmup && !_modeInstance.isWarmup() && _timedModeStartCallback) {
        _timedModeStartCallback();
        _timedModeStartCallback = null;
      }
      if (_modeInstance.isFinished() || _modeInstance.turnIndex >= gameTotal) {
        handleGameEnd(config);
        return;
      }
      startNextTurn();
    };

    const startNextTurn = () => {
      if (!_modeInstance) return;
      if (_modeInstance.isFinished() || _modeInstance.turnIndex >= gameTotal) {
        handleGameEnd(config);
        return;
      }

      // 限时模式收尾窗口：剩余 ≤5s 时不生成新回合，直接结算
      if (config.timed && config.timeLimit > 0 && _timedModeStartAt) {
        const elapsed = Date.now() - _timedModeStartAt - _totalPauseMs;
        if (config.timeLimit - elapsed <= 5000) {
          handleGameEnd(config);
          return;
        }
      }

      const turnData = _modeInstance.generateTurn(factorGenerator);
      if (!turnData || !turnData.stimulus) {
        console.warn('[startNextTurn] generateTurn returned null, ending game');
        handleGameEnd(config);
        return;
      }

      const store = useGameStore.getState();
      store.addFactor(turnData.stimulus);
      store.show();
      useGameStore.setState({ trialStartTime: Date.now(), userAnswered: false, feedback: null });
      // 非暖身回合：启动空闲看门狗（waitingForInput 模式下用户人走开也会自动暂停）
      if (!_modeInstance.isWarmup()) {
        _idleWatchdog?.arm();
      }

      if (_modeInstance.turnIndex === 0) {
        store.start();
      }

      // 暖身用 2500ms 自动推进，正式回合用 speed
      const isWarmup = _modeInstance.isWarmup();
      const timeout = isWarmup ? 2500 : speed;

      // 每回合重建推进函数，供 handleMatch 用户点击时调用
      // 作答后保留 900ms 反馈窗口（对老年用户可读），再进入下一回合
      _legacyAdvance = () => {
        clearLegacyRuntimeTimer();
        // 用户已作答，重置空闲看门狗
        _idleWatchdog?.feed();
        useGameStore.getState().hide();
        scheduleLegacyRuntimeTimer(() => {
          advanceToNext();
        }, 900);
      };

      /**
       * 旧版引擎回合超时处理
       * 等待输入模式下非暖身回合未操作时重置定时器继续等待，否则推进到下一回合
       */
      const onLegacyTimeout = () => {
        // 暂停中：重新调度，等恢复后由 resumeGame 重启
        if (_legacyPaused) {
          return;
        }
        const currentStore = useGameStore.getState();

        // 等待输入模式：非暖身回合用户未操作时不推进，重置定时器继续等待
        if (config.waitingForInput && !currentStore.userAnswered && !_modeInstance.isWarmup()) {
          scheduleLegacyRuntimeTimer(onLegacyTimeout, timeout);
          return;
        }

        currentStore.hide();

        // 超时未操作（热身回合不计入超时，避免污染叙事解锁的 timeoutCount 统计）
        if (!currentStore.userAnswered) {
          if (!_modeInstance.isWarmup()) {
            useGameStore.setState((s) => ({ timeoutCount: s.timeoutCount + 1 }));
          }
          let noRespResult = null;
          if (typeof _modeInstance.recordNoResponse === 'function') {
            noRespResult = _modeInstance.recordNoResponse();
          }
          useGameStore.setState({ userAnswered: true, feedback: noRespResult?.feedback ?? null });
          if (noRespResult && noRespResult.feedback !== 'warmup') {
            useGameStore.getState().syncModeResult(noRespResult);
          }
        }

        // 等待 1s 过渡后进入下一回合
        scheduleLegacyRuntimeTimer(() => {
          advanceToNext();
        }, 1000);
      };

      scheduleLegacyRuntimeTimer(onLegacyTimeout, timeout);
    };

    startNextTurn();

    // 限时模式：初始化显示值（暖身结束后才启动实际倒计时）
    if (config.timed && config.timeLimit > 0) {
      useGameStore.setState({ timedModeRemaining: config.timeLimit });
      /**
       * 启动限时模式倒计时（暖身结束后调用）
       * 记录实际开始时间，设置 interval 更新显示 + timeout 触发结算
       */
      // 暖身回合：超时后检测是否结束暖身，是则启动倒计时
      // 非暖身回合：首次 onLegacyTimeout 调用时启动（暖身已结束）
      _timedModeStartCallback = createStartTimedCountdown(config);
    }
  }, [handleGameEnd, createStartTimedCountdown]);

  /**
   * 开始新游戏
   *
   * 路径分流：
   * - modeId === 'walk' → 新版引擎 (GameLoop + PhaseMachine)
   * - 其他模式 (standard/dual/spatial/grid) → 旧版引擎 (setTimeout)
   *
   * @param {Object} config - 游戏配置
   * @param {number} levelIndex - 难度索引
   */
  const startGame = useCallback((config, levelIndex) => {
    clearTimers();
    registerFocusPauseGuards();
    // 标记真正进入游戏：卸载清理（含 store reset）仅在此时之后才生效
    _hadStarted = true;

    // 空闲看门狗：2 分钟单刺激停留超时自动暂停（waitingForInput 模式）
    _idleWatchdog = new StimulusIdleWatchdog({
      timeoutMs: 120000,
      onIdle: () => pauseRuntime('stimulus-idle-timeout'),
    });

    AudioService.init();
    AudioService.resume();
    if (!isMutedRef.current) AudioService.startAmbience();

    const gameN = config.n || 1;
    const gameWarmup = config.warmupTrials || gameN;
    const gameTotal = config.totalTurns || (14 + gameN * 2);
    const modeId = config.modeId || 'walk';

    const modeConfig = {
      ...config,
      n: gameN,
      warmupTrials: gameWarmup,
      totalTurns: gameTotal,
      factorId: config.factorId || 'sprite-garden',
      factorIds: config.factorIds || [config.factorId || 'sprite-garden'],
      gridSize: config.gridSize || 3,
      cols: config.cols || 2,
      rows: config.rows || 2,
    };

    // 创建模式实例
    try {
      if (modeId === 'walk') {
        _modeInstance = new WalkMode(modeConfig);
      } else {
        _modeInstance = ModeFactory.create(modeId, modeConfig);
      }
    } catch (error) {
      console.error('[useGameEngine] 创建游戏模式失败:', error);
      _modeInstance = new WalkMode(modeConfig);
    }

    // ── 辅助函数：从刺激对象中提取可比较的值 ──
    function _extractVal(stimulus) {
      if (stimulus == null) return String(stimulus);
      const v = stimulus.value;
      if (v == null) return JSON.stringify(stimulus);
      if (typeof v === 'string' || typeof v === 'number') return String(v);
      if (typeof v === 'object') {
        // DualMode: {visual: {value: ...}, audio: {value: ...}}
        if (v.visual?.value != null) return String(v.visual.value);
        return JSON.stringify(v);
      }
      return String(v);
    }

    // ── Monkey-patch: 确保旧版模式有正确的 history/评分逻辑 ──
    // （解决 Vite HMR 不更新 StandardMode.js 的问题）
    // 仅在模式缺少关键功能时打补丁，避免覆盖已正确实现的模式（如 DualMode）
    if (modeId !== 'walk' && _modeInstance) {
      const mi = _modeInstance;
      const needsPatch = typeof mi.recordNoResponse !== 'function';
      // 检查模式是否有自己的 submitAnswer 实现（不是继承自 BaseMode 的空实现）
      const modeProto = Object.getPrototypeOf(mi);
      const baseProto = Object.getPrototypeOf(modeProto);
      const hasOwnSubmitAnswer = modeProto.submitAnswer !== baseProto?.submitAnswer;

      if (needsPatch) {
        // 确保 history 数组存在
        if (!Array.isArray(mi.history)) mi.history = [];
        // 保存当前刺激引用
        mi._currentStimulus = null;

        // 包装 generateTurn：捕获当前刺激
        const origGenerateTurn = mi.generateTurn.bind(mi);
        mi.generateTurn = function (factorGen) {
          const turnData = origGenerateTurn(factorGen);
          if (turnData && turnData.stimulus) {
            mi._currentStimulus = turnData.stimulus;
          }
          return turnData;
        };

        // 添加 recordNoResponse（超时未响应时调用）
        // 分类跳过的试次：目标→遗漏(missed)，非目标→正确排除(correctRejection)
        mi.recordNoResponse = function () {
          const isWarmup = typeof mi.isWarmup === 'function' ? mi.isWarmup() : false;
          const val = mi._currentStimulus?.value ?? mi._currentStimulus;
          mi.history.push({
            turnIndex: mi.turnIndex,
            isWarmup,
            value: val,
          });

          if (isWarmup) {
            return { isCorrect: false, scoreDelta: 0, feedback: 'warmup', channel: 'visual' };
          }

          const n = mi.config.n;
          const histLen = mi.history.length;
          const current = mi.history[histLen - 1];
          const target = mi.history[histLen - 1 - n];
          let feedback = 'missed';
          if (current && target) {
            const isTarget = _extractVal(current.value) === _extractVal(target.value);
            if (!isTarget) {
              feedback = 'correctRejection';
              mi.correctRejections = (mi.correctRejections || 0) + 1;
              mi.streakCurrent = (mi.streakCurrent || 0) + 1;
              mi.streakBest = Math.max(mi.streakBest || 0, mi.streakCurrent);
            } else {
              mi.misses = (mi.misses || 0) + 1;
              mi.streakCurrent = 0;
            }
          } else {
            mi.misses = (mi.misses || 0) + 1;
            mi.streakCurrent = 0;
          }
          return { isCorrect: false, scoreDelta: 0, feedback, channel: 'visual' };
        };

        // 仅对没有自己 submitAnswer 的模式覆写评分逻辑
        if (!hasOwnSubmitAnswer) {
          mi.submitAnswer = function (isMatch) {
            // 先记录当前刺激到 history
            // 注意：推入 stimulus.value，_extractVal 会从中提取可比较的值
            mi.history.push({
              turnIndex: mi.turnIndex,
              isWarmup: typeof mi.isWarmup === 'function' ? mi.isWarmup() : false,
              value: mi._currentStimulus?.value ?? mi._currentStimulus,
            });
            // 暖身回合不评分
            if (typeof mi.isWarmup === 'function' && mi.isWarmup()) {
              return { isCorrect: false, scoreDelta: 0, feedback: 'warmup', channel: 'visual' };
            }
            const n = mi.config.n;
            const histLen = mi.history.length;
            const current = mi.history[histLen - 1];
            const target = mi.history[histLen - 1 - n];
            if (!current || !target) {
              return { isCorrect: false, scoreDelta: 0, feedback: 'wrong', channel: 'visual' };
            }
            // 提取刺激值进行比较
            const isTarget = _extractVal(current.value) === _extractVal(target.value);
            let isCorrect = false, feedback = 'wrong', scoreDelta = 0;
            if (isTarget && isMatch) { isCorrect = true; feedback = 'correct'; scoreDelta = 1; }
            else if (!isTarget && !isMatch) { isCorrect = true; feedback = 'correctRejection'; }
            else if (isTarget && !isMatch) { feedback = 'missed'; }
            else { feedback = 'wrong'; }
            // 更新统计
            mi.score = (mi.score || 0) + scoreDelta;
            if (isTarget && isMatch) mi.hits = (mi.hits || 0) + 1;
            else if (isTarget && !isMatch) mi.misses = (mi.misses || 0) + 1;
            else if (!isTarget && isMatch) mi.falseAlarms = (mi.falseAlarms || 0) + 1;
            else mi.correctRejections = (mi.correctRejections || 0) + 1;
            if (isCorrect) {
              mi.streakCurrent = (mi.streakCurrent || 0) + 1;
              mi.streakBest = Math.max(mi.streakBest || 0, mi.streakCurrent);
            } else { mi.streakCurrent = 0; }
            return { isCorrect, scoreDelta, feedback, channel: 'visual' };
          };
        } else {
          // 有自己 submitAnswer 的模式（如 DualMode），包装原始方法以确保 history 记录
          const origSubmit = mi.submitAnswer.bind(mi);
          mi.submitAnswer = function (isMatch) {
            // 确保 history 有当前刺激记录（供后续回合 N-back 比较）
            // 注意：推入 stimulus.value（不是整个 stimulus 对象），匹配各模式自己的 history 格式
            if (mi._currentStimulus) {
              mi.history.push({
                turnIndex: mi.turnIndex,
                isWarmup: typeof mi.isWarmup === 'function' ? mi.isWarmup() : false,
                value: mi._currentStimulus.value ?? mi._currentStimulus,
              });
            }
            return origSubmit(isMatch);
          };
        }
      }
    }

    // 初始化游戏状态
    useGameStore.getState().init({
      ...config,
      modeId: _modeInstance.modeId || modeId,
      n: gameN,
      warmupTrials: gameWarmup,
      totalTurns: gameTotal,
    }, levelIndex);

    // ── 路径 B: 旧版引擎 (setTimeout) — 非 WalkMode 模式 ──
    if (modeId !== 'walk') {
      _startLegacyGame(config, gameN, gameWarmup, gameTotal);
      return;
    }

    // ── 路径 A: 新版引擎 (GameLoop + PhaseMachine) — WalkMode ──

    // 因子生成函数（WalkMode 使用 TrialGenerator 预生成序列）
    const factorGenerator = null;

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
        // 限时模式收尾窗口：剩余 ≤5s 时不生成新刺激
        if (config.timed && config.timeLimit > 0 && _timedModeStartAt) {
          const elapsed = Date.now() - _timedModeStartAt - _totalPauseMs;
          if (config.timeLimit - elapsed <= 5000) return;
        }
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

        // 非暖身回合：启动空闲看门狗（waitingForInput 模式下用户人走开也会自动暂停）
        if (!_modeInstance.isWarmup()) {
          _idleWatchdog?.arm();
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

        // 超时未操作 = 漏项（热身回合不计入超时，避免污染叙事解锁的 timeoutCount 统计）
        if (!useGameStore.getState().userAnswered) {
          const isWarmupTrial = _modeInstance.isWarmup();
          if (!isWarmupTrial) {
            // 记录超时未作答
            useGameStore.setState((s) => ({ timeoutCount: s.timeoutCount + 1 }));
          }
          // WalkMode 有 recordNoResponse，其他模式使用 submitMiss
          if (typeof _modeInstance.recordNoResponse === 'function') {
            _modeInstance.recordNoResponse();
            // 同步未操作的结果到 store
            const noResponseResult = _modeInstance.trialResults[_modeInstance.trialResults.length - 1];
            if (noResponseResult && !noResponseResult.wasWarmup) {
              // 未作答：正确排除（不按=认为与N步前不同）计入 correctRejections 并延续连胜；
              // 漏报（该按未按）计入 misses 并清零连胜
              useGameStore.getState().syncModeResult({
                isCorrect: noResponseResult.result === 'correctRejection',
                scoreDelta: 0,
                feedback: noResponseResult.result === 'miss' ? 'missed' : 'correctRejection',
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
      // 取消悬空的旧版定时器，防止与 PhaseMachine 路径冲突
      clearLegacyRuntimeTimer();
      // 当前回合结束后，检查是否还有下一回合
      // turnIndex 从 0 开始，totalTurns=16 时，最后一个有效回合是 turnIndex=15
      // 限时模式下不检查 totalTurns，由定时器控制结束
      const isTimedMode = config.timed && config.timeLimit > 0;
      const isLastTrial = !isTimedMode && _modeInstance.turnIndex >= _modeInstance.config.totalTurns - 1;

      // 限时模式：暖身结束时启动倒计时（PhaseMachine 路径）
      if (isTimedMode && _timedModeStartCallback) {
        const warmupTrials = _modeInstance.config?.warmupTrials || 0;
        if (_modeInstance.turnIndex >= warmupTrials - 1 && warmupTrials > 0) {
          _timedModeStartCallback();
          _timedModeStartCallback = null;
        }
      }

      // 限时模式收尾窗口：剩余 ≤5s 时不生成新回合，直接结算
      if (isTimedMode && _timedModeStartAt) {
        const elapsed = Date.now() - _timedModeStartAt - _totalPauseMs;
        if (config.timeLimit - elapsed <= 5000) {
          handleGameEnd(config);
          return;
        }
      }

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
      onPause: (reason) => {
        useGameStore.getState().pause(reason);
        // 仅用户主动暂停才计入 pauseCount（成就评级），自动触发（visibility/idle/frame-gap）不算
        if (_modeInstance && reason === 'user-pause') {
          _modeInstance.pauseCount = (_modeInstance.pauseCount || 0) + 1;
        }
      },
      onResume: () => {
        useGameStore.getState().resume();
      },
    });

    // 启动游戏循环
    _gameLoop.start();
    _phaseMachine.startTrial();

    // 限时模式：初始化显示值（暖身结束后才启动实际倒计时）
    if (config.timed && config.timeLimit > 0) {
      useGameStore.setState({ timedModeRemaining: config.timeLimit });
      _timedModeStartCallback = createStartTimedCountdown(config);
    }
  }, [clearTimers, handleGameEnd, registerFocusPauseGuards, _startLegacyGame, createStartTimedCountdown, pauseRuntime]);

  /**
   * 处理玩家匹配动作（双按钮：true=一样，false=不一样）
   * @param {boolean} isSame - 用户认为是否与 N 步前相同
   * @returns {{ isCorrect: boolean, feedback: string }|null}
   */
  const handleMatch = useCallback((isSame = true) => {
    if (!_modeInstance) return null;

    const state = useGameStore.getState();
    if (!state.showStimulus || state.userAnswered || !state.config) {
      return null;
    }

    AudioService.init();
    AudioService.resume();

    // 计算反应时间
    const rt = state.trialStartTime ? Date.now() - state.trialStartTime : null;

    let result;

    try {
      result = _modeInstance.submitAnswer(isSame);
    } catch (e) {
      console.error('[handleMatch] submitAnswer THREW:', e);
      return null;
    }
    // 附加反应时间
    if (result && rt !== null) {
      result.rt = rt;
    }
    try {
      useGameStore.getState().syncModeResult(result);
    } catch (e) {
      console.error('[handleMatch] syncModeResult THREW:', e);
      return null;
    }
    // 用户已作答，重置空闲看门狗
    _idleWatchdog?.feed();
    // 新版引擎：推进 PhaseMachine；旧版引擎：调用 _legacyAdvance 即时推进
    if (_phaseMachine) {
      _phaseMachine.proceed();
    } else if (_legacyAdvance) {
      _legacyAdvance();
    }

    return result;
  }, []);

  /**
   * 暂停游戏（用户主动暂停或原生生命周期触发）
   * 新版路径暂停 GameLoop，旧版路径暂停 setTimeout 链。
   *
   * @param {string} reason
   */
  const pauseGame = useCallback((reason = 'user-pause') => {
    pauseRuntime(reason);
  }, [pauseRuntime]);

  /**
   * 恢复游戏
   * 新版路径恢复 GameLoop，旧版路径重启 setTimeout 链
   */
  const resumeGame = useCallback(() => {
    if (_gameLoop && _gameLoop.running) {
      _gameLoop.resume();
    } else {
      useGameStore.getState().resume();
    }
    // 旧版引擎：取消暂停标记，重启限时模式定时器
    if (_legacyPaused) {
      if (_pauseStartedAt) {
        _totalPauseMs += Date.now() - _pauseStartedAt;
        _pauseStartedAt = null;
      }
      _legacyPaused = false;
      const config = useGameStore.getState().config;
      if (!_gameLoop && _legacyTimerCallback && !_legacyTimer) {
        scheduleLegacyRuntimeTimer(_legacyTimerCallback, _legacyTimerRemainingMs);
      }
      if (config?.timed && config.timeLimit > 0 && _modeInstance && _timedModeStartAt) {
        const elapsed = Date.now() - _timedModeStartAt - _totalPauseMs;
        const remaining = Math.max(0, config.timeLimit - elapsed);
        if (remaining > 0) {
          useGameStore.setState({ timedModeRemaining: remaining });
          _timedModeInterval = setInterval(() => {
            if (_legacyPaused) return;
            const e = Date.now() - _timedModeStartAt - _totalPauseMs;
            useGameStore.setState({ timedModeRemaining: Math.max(0, config.timeLimit - e) });
          }, 1000);
          _timedModeTimer = setTimeout(() => {
            if (!_legacyPaused) handleGameEnd(config);
          }, remaining);
        } else {
          handleGameEnd(config);
        }
      }
    }
    // 恢复后若当前处于"可见+未作答"阶段（非暖身），重启动空闲看门狗
    const s = useGameStore.getState();
    if (s.showStimulus && !s.userAnswered && _modeInstance && !_modeInstance.isWarmup()) {
      _idleWatchdog?.arm();
    }
  }, [handleGameEnd]);

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
