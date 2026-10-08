/**
 * 游戏页 — 散步模式核心界面
 * 主舞台只展示当前刺激，不播放无关动画。
 * 底部单按钮："刚刚见过"（Go-No-Go N-back）
 *
 * 布局（文档 §8.3）：
 * ┌──────────────────────────────────────────┐
 * │  迷你花园区：只显示轻量成长，不抢注意力      │
 * ├──────────────────────────────────────────┤
 * │              主舞台                       │
 * │          当前刺激只在这里出现              │
 * ├──────────────────────────────────────────┤
 * │  回家按钮        主操作按钮        进度      │
 * └──────────────────────────────────────────┘
 *
 * @version 5.0
 */
import React, { memo, useCallback, useState, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Wind, Flower2, Timer, RotateCw } from 'lucide-react';
import BackIconButton from '@components/BackIconButton';
import useGameStore from '@stores/useGameStore';
import useSettingsStore from '@stores/useSettingsStore';
import useGameEngine from '@hooks/useGameEngine';
import useMatchInput from '@hooks/useMatchInput';
import useMediaQuery from '@hooks/useMediaQuery';
import useOrientationGuard from '@hooks/useOrientationGuard';
import AudioService from '@services/AudioService';
import PlatformService from '@services/PlatformService';
import { NATIVE_BACK_REQUEST_EVENT, NATIVE_PAUSE_REQUEST_EVENT } from '@services/NativeAppService';
import WarmupFlowerTimer from '@components/WarmupFlowerTimer';
import ElapsedTimer from '@components/ElapsedTimer';
import StimulusStage from '@components/game/StimulusStage';
import SpatialLayout from '@components/layouts/SpatialLayout';
import GridLayout from '@components/layouts/GridLayout';
import DualLayout from '@components/layouts/DualLayout';
import { confirmDialog } from '@stores/useConfirmStore';

import { getSameButtonText, getDiffButtonText, getHintText, getWarmupEndText, getGenericIntroTitle, getGenericIntroBody, getGenericWarmupText } from '@engine/stimuli/StimulusText';

/**
 * 顶部进度条。
 * 仅依赖回合推进，不跟随秒级倒计时刷新。
 * @param {{ progress: number }} props
 * @returns {JSX.Element}
 */
const GameProgressBar = memo(function GameProgressBar({ progress }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 z-10">
      <div className="ui-page-wide">
        <div className="ui-progress-track h-2 bg-stone-200/50 ring-1 ring-black/5">
          <div
            className="ui-progress-fill bg-[var(--color-brand)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});

/**
 * 暂停遮罩。
 * 从主页面树中拆出，降低暂停状态切换时对其他结构的干扰。
 * @param {{ resumeGame: Function, resumePromptText: string, resumeButtonText: string }} props
 * @returns {JSX.Element|null}
 */
const GamePauseOverlay = memo(function GamePauseOverlay({
  resumeGame,
  resumePromptText,
  resumeButtonText,
}) {
  const { t } = useTranslation();
  const status = useGameStore((s) => s.status);

  if (status !== 'paused') return null;

  return (
    <div className="absolute inset-0 bg-stone-50 z-50 flex flex-col items-center justify-center space-y-6 animate-fade-in">
      <Wind size={48} className="text-[var(--color-text-muted)]" />
      <p
        className="text-xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'var(--font-family-serif)' }}
      >
        {t('game.leftForAwhile')}
      </p>
      <p className="text-[var(--color-text-secondary)]">{resumePromptText}</p>
      <button
        onClick={() => { resumeGame(); }}
        aria-label={resumeButtonText}
        data-testid="resume-game-button"
        className="ui-btn-base ui-btn-primary px-8 py-3"
        style={{ minHeight: '56px', fontSize: '18px' }}
      >
        {resumeButtonText}
      </button>
    </div>
  );
});

/**
 * 运行时 HUD。
 * 把秒级倒计时订阅收进独立组件，避免限时模式每秒触发整个 GameScreen 重渲。
 * @param {{ isTimedMode: boolean, introConfirmed: boolean }} props
 * @returns {JSX.Element}
 */
const GameRuntimeHud = memo(function GameRuntimeHud({ isTimedMode, introConfirmed }) {
  const { t } = useTranslation();
  const status = useGameStore((s) => s.status);
  const timedModeRemaining = useGameStore((s) => s.timedModeRemaining);

  if (!isTimedMode) {
    return <ElapsedTimer isRunning={introConfirmed && status === 'active'} />;
  }

  const remainingSeconds = Math.ceil(timedModeRemaining / 1000);
  const isFinalCountdown = introConfirmed && status === 'active' && timedModeRemaining > 0 && timedModeRemaining <= 5000;
  const isLowTime = remainingSeconds <= 10;

  return (
    <>
      {isFinalCountdown && (
        <div className="fixed left-1/2 top-3 z-40 -translate-x-1/2 pointer-events-none select-none">
          <span
            className="text-5xl font-bold text-red-500/80 animate-pulse"
            style={{ fontFamily: 'var(--font-family-mono)', textShadow: '0 2px 8px rgba(239,68,68,0.3)' }}
          >
            {remainingSeconds}
          </span>
        </div>
      )}

      {introConfirmed && status === 'active' && timedModeRemaining > 0 && (
        <div
          data-testid="timed-countdown-chip"
          className="ui-chip fixed bottom-4 right-4 z-30 flex items-center gap-1.5 bg-white/80 px-3 py-1.5 shadow-[0_10px_20px_rgba(120,113,108,0.06)] backdrop-blur-sm select-none"
          style={{ fontFamily: 'var(--font-family-mono)' }}
          aria-label={t('game.timeRemaining')}
        >
          <Timer size={14} className={isLowTime ? 'text-red-500' : 'text-stone-500'} />
          <span className={`text-sm font-medium ${isLowTime ? 'text-red-500' : 'text-stone-600'}`}>
            {remainingSeconds}s
          </span>
        </div>
      )}
    </>
  );
});

export default function GameScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMuted = useSettingsStore((s) => s.isMuted);
  const setMuted = useSettingsStore((s) => s.setMuted);

  const config = useGameStore((s) => s.config);
  const history = useGameStore((s) => s.history);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const showStimulus = useGameStore((s) => s.showStimulus);
  const userAnswered = useGameStore((s) => s.userAnswered);
  const feedback = useGameStore((s) => s.feedback);
  const status = useGameStore((s) => s.status);
  const trialVisibleDuration = useGameStore((s) => s.trialVisibleDuration);

  // 可见阶段时长（由引擎逐回合同步到 store，优先使用）
  const visibleDuration = trialVisibleDuration || config?.speedProfile?.visible || 2500;

  const {
    startGame,
    handleMatch: rawHandleMatch,
    stopGame,
    pauseGame,
    resumeGame,
    proceedWarmup,
  } = useGameEngine(() => navigate('/finished'));
  const { handleMatch } = useMatchInput(rawHandleMatch);

  // 暖身阶段判定
  const n = config?.n || 1;
  const warmupTrials = config?.warmupTrials ?? n;
  const isWarmupPhase = currentTurn < warmupTrials;

  // 当前游戏模式（标准/双通道/空间/栅格）
  const modeId = config?.modeId || 'walk';
  // 当前时间节奏（walk/daily/challenge/timed）
  const gameMode = config?.gameMode || 'walk';
  // 是否限时模式
  const isTimedMode = config?.timed && config?.timeLimit > 0;
  const startCtaText = isTimedMode ? t('game.startRun') : t('game.startStroll');
  const modeLabel = t(`modes.${modeId}.label`);
  const rhythmLabel = t(`rhythms.${gameMode}.label`);
  const headerTitle = `${modeLabel} · ${rhythmLabel}`;
  const leaveConfirmText = isTimedMode ? t('game.leaveRunConfirm') : t('game.leaveConfirm');
  const resumePromptText = isTimedMode ? t('game.continueRunPrompt') : t('game.continuePrompt');
  const resumeButtonText = isTimedMode ? t('game.continueRun') : t('game.continueStroll');

  // 横屏检测 — 仅平板及以上设备启用左右分栏
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isTabletOrLarger = useMediaQuery('(min-width: 640px)');
  const useLandscapeLayout = isLandscape && isTabletOrLarger;

  // 手机横屏锁定 — 显示竖屏提示并暂停游戏
  const isPhoneLandscapeBlocked = useOrientationGuard();

  // 引导状态：true=展示引导，等待用户确认；false=已确认，游戏进行中
  const [introConfirmed, setIntroConfirmed] = useState(false);
  // 暖身结束提示
  const [showWarmupEnd, setShowWarmupEnd] = useState(false);
  // 追踪用户最后按了哪个按钮（用于 feedback 高亮）
  const [lastAnswer, setLastAnswer] = useState(null); // 'same' | 'different' | null

  // 小花倒计时配置 — 仅在热身阶段展示（走完自动推进下一朵，有实际作用）；
  // 正式回合为"等待输入"模式，倒计时走完无任何推进，展示只会给老人"时间到了我错过了"的误导
  const warmupTimerCount = 3;
  const showFlowerTimer = isWarmupPhase && showStimulus && introConfirmed;
  const isGamePaused = status === 'paused';

  /**
   * 用户确认引导 → 启动游戏引擎
   */
  const handleIntroConfirm = useCallback(() => {
    AudioService.init();
    AudioService.resume();
    const cfg = useGameStore.getState().config;
    if (cfg) {
      startGame(cfg, cfg.levelIndex || 0);
    }
    setIntroConfirmed(true);
  }, [startGame]);

  // 暖身结束时显示提示 1.5 秒
  useEffect(() => {
    if (currentTurn === warmupTrials && !isWarmupPhase) {
      startTransition(() => setShowWarmupEnd(true));
      const timer = setTimeout(() => setShowWarmupEnd(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, warmupTrials, isWarmupPhase]);

  // 进度（排除暖身）
  const totalTurns = config?.totalTurns || 16;
  const scoredTurns = totalTurns - warmupTrials;
  const scoredProgress = Math.max(0, currentTurn - warmupTrials);
  const progress = isWarmupPhase ? 0 : (scoredProgress / scoredTurns) * 100;

  // 当前刺激
  const currentFactor = history.length > 0 ? history[history.length - 1] : null;
  const isInputDisabled = !showStimulus || userAnswered || isWarmupPhase;

  /**
   * 计算"不一样"按钮样式（次级按钮配色）
   * 约束 4：浅色（米白底 + 描边）= 二级按钮，与首页底部 3 个入口 / 改配置 配色保持一致
   * 与"一样"按钮对比：不一样 = 排除型/次级动作，用浅；一样 = 主判断/默认，用深
   * @returns {string}
   */
  const getDifferentButtonClass = useCallback(() => {
    if (feedback === 'correctRejection' && lastAnswer === 'different') {
      return 'animate-feedback-correct bg-green-50 text-green-800 border border-green-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]';
    }
    if (feedback === 'missed' && lastAnswer === 'different') {
      return 'animate-feedback-wrong bg-red-50 text-red-800 border border-red-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';
    }
    if (!showStimulus || isWarmupPhase) {
      return 'bg-stone-100/90 text-stone-400 cursor-default border border-stone-200 shadow-none';
    }
    if (userAnswered) {
      return 'bg-stone-100 text-stone-400 border border-stone-200 shadow-none';
    }

    // 正常态：次级按钮 = 米白底描边（同首页改配置/底部3个入口的 bg-stone-50 + border-stone-200）
    return 'bg-[#f7f4ec] text-stone-700 border border-stone-300/90 shadow-[0_10px_24px_rgba(120,113,108,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-[#f1ecdf] hover:border-stone-400/80 active:bg-[#e9e2d1] active:scale-[0.975] active:translate-y-[1px] active:animate-button-press transition-colors duration-150';
  }, [feedback, isWarmupPhase, lastAnswer, showStimulus, userAnswered]);

  /**
   * 计算"一样"按钮样式（主按钮配色）
   * 约束 4：深色（品牌深绿）= 主按钮，必须与首页"继续训练"按钮配色完全一致
   * 主按钮默认：bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]；与 MenuScreen.jsx ui-btn-primary 同一色值源
   * 默认第一个选/更被用户"默认识别"为主动作，符合 WCAG 视觉主辅层次
   * @returns {string}
   */
  const getSameButtonClass = useCallback(() => {
    if (feedback === 'correct' && lastAnswer === 'same') {
      return 'animate-feedback-correct bg-green-50 text-green-800 border border-green-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]';
    }
    if (feedback === 'wrong' && lastAnswer === 'same') {
      return 'animate-feedback-wrong bg-red-50 text-red-800 border border-red-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';
    }
    if (!showStimulus || isWarmupPhase) {
      return 'bg-stone-100/90 text-stone-400 cursor-default border border-stone-200 shadow-none';
    }
    if (userAnswered) {
      return 'bg-stone-100 text-stone-400 border border-stone-200 shadow-none';
    }

    // 正常态：主按钮 = 首页"继续训练"品牌深绿（var(--color-brand) = 设计系统里的 ui-btn-primary）
    return 'bg-[var(--color-brand)] text-white border border-[rgba(107,142,91,0.55)] shadow-[0_14px_30px_rgba(107,142,91,0.22),inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-[var(--color-brand-hover)] hover:shadow-[0_16px_34px_rgba(107,142,91,0.26),inset_0_1px_0_rgba(255,255,255,0.26)] active:bg-[#6a8460] active:scale-[0.975] active:translate-y-[1px] active:animate-button-press transition-colors duration-150';
  }, [feedback, isWarmupPhase, lastAnswer, showStimulus, userAnswered]);

  /**
   * 处理"一样"按钮 — 用户认为当前刺激与 N 步前相同
   */
  const handleSame = useCallback(() => {
    PlatformService.impact();
    setLastAnswer('same');
    handleMatch(true);
  }, [handleMatch]);

  /**
   * 处理"不一样"按钮 — 用户认为当前刺激与 N 步前不同
   */
  const handleDifferent = useCallback(() => {
    PlatformService.impact();
    setLastAnswer('different');
    handleMatch(false);
  }, [handleMatch]);

  // 无配置时直接跳回菜单
  useEffect(() => {
    if (!config) {
      startTransition(() => navigate('/menu', { replace: true }));
    }
  }, [config, navigate]);

  // 双通道模式：视觉先出现，延迟 300ms 后播放听觉刺激
  // 暂停恢复后重新播放，避免暂停期间丢失听觉通道信息（判定要求视听双通道一致）
  useEffect(() => {
    if (modeId === 'dual' && showStimulus && currentFactor?.value?.audio && status === 'active' && !userAnswered) {
      const freq = currentFactor.value.audio.value;
      const waveType = currentFactor.value.audio.meta?.waveType || 'sine';
      if (typeof freq === 'number') {
        const timer = setTimeout(() => {
          AudioService.playTone(freq, 800, waveType);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [modeId, showStimulus, currentFactor, status, userAnswered]);

  /**
   * 处理停止游戏（确认后才退出）
   */
  const handleStop = useCallback(() => {
    const run = async () => {
      if (!introConfirmed) {
        stopGame();
        navigate('/menu');
        return;
      }

      const accepted = await confirmDialog({
        title: t('common.confirm'),
        message: leaveConfirmText,
        confirmLabel: t('common.confirm'),
        cancelLabel: t('common.cancel'),
      });
      if (accepted) {
        stopGame();
        navigate('/menu');
      }
    };
    run();
  }, [introConfirmed, leaveConfirmText, navigate, stopGame, t]);

  /**
   * 响应 Android 原生返回键与切后台事件
   * 返回键复用页面现有的退出确认；切后台时主动暂停，避免训练在后台继续流逝。
   */
  useEffect(() => {
    /**
     * 处理原生返回请求
     * @returns {void}
     */
    function handleNativeBackRequest() {
      handleStop();
    }

    /**
     * 处理原生切后台暂停请求
     * @returns {void}
     */
    function handleNativePauseRequest() {
      const currentStatus = useGameStore.getState().status;
      if (!introConfirmed) return;
      if (currentStatus !== 'active') return;
      pauseGame('native-background');
    }

    window.addEventListener(NATIVE_BACK_REQUEST_EVENT, handleNativeBackRequest);
    window.addEventListener(NATIVE_PAUSE_REQUEST_EVENT, handleNativePauseRequest);

    return () => {
      window.removeEventListener(NATIVE_BACK_REQUEST_EVENT, handleNativeBackRequest);
      window.removeEventListener(NATIVE_PAUSE_REQUEST_EVENT, handleNativePauseRequest);
    };
  }, [handleStop, introConfirmed, pauseGame]);

  /**
   * 处理静音切换
   */
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setMuted(nextMuted);
    AudioService.setMuted(nextMuted);
  }, [isMuted, setMuted]);

  /**
   * 渲染当前模式的主刺激舞台
   * 倒计时已经提升到 GameScreen 统一锚点，这里只保留各模式自己的刺激内容与提示。
   * @returns {JSX.Element}
   */
  const renderStimulusLayout = () => {
    if (modeId === 'spatial') {
      return (
        <SpatialLayout
          stimulus={currentFactor}
          showStimulus={showStimulus}
          isWarmupPhase={isWarmupPhase}
          warmupText={t('game.warmupPosition')}
        />
      );
    }

    if (modeId === 'grid') {
      return (
        <GridLayout
          stimulus={currentFactor}
          showStimulus={showStimulus}
          isWarmupPhase={isWarmupPhase}
          warmupText={t('game.warmupPattern')}
        />
      );
    }

    if (modeId === 'dual') {
      return (
        <DualLayout
          stimulus={currentFactor}
          showStimulus={showStimulus}
          isWarmupPhase={isWarmupPhase}
          warmupText={t('game.warmupDual')}
        />
      );
    }

    return (
      <StimulusStage
        stimulus={currentFactor}
        showStimulus={showStimulus}
        isWarmupPhase={isWarmupPhase}
        warmupText={t('game.warmupDefault')}
      />
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* 手机横屏锁定遮罩 */}
      {isPhoneLandscapeBlocked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-stone-100/95 backdrop-blur-sm">
          <RotateCw
            size={48}
            className="text-stone-400 mb-6 animate-spin"
            style={{ animationDuration: '3s' }}
          />
          <p
            className="text-lg text-stone-500 font-light tracking-wider"
            style={{ fontFamily: 'var(--font-family-serif)' }}
          >
            {t('game.orientationLock')}
          </p>
        </div>
      )}

      {/* 顶部导航栏 */}
      <div className="px-4 py-4 sm:px-6 lg:px-8 z-20">
        <div className="ui-page-wide flex justify-between items-center">
          <button
            onClick={handleStop}
            aria-label={t('game.back')}
            className="ui-icon-btn ui-icon-btn-soft px-3 py-1 text-sm hover:text-[var(--color-text-secondary)]"
          >
            {t('game.back')}
          </button>

          <div className="flex items-center gap-2">
            <Flower2 size={16} className="text-[var(--color-text-muted)]" />
            <span
              className="text-[var(--color-text-secondary)] font-bold text-lg"
              style={{ fontFamily: 'var(--font-family-serif)' }}
            >
              {headerTitle}
            </span>
          </div>

          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? t('settings.muted') : t('settings.unmuted')}
            className="ui-icon-btn ui-icon-btn-soft p-2"
          >
            {/* 双状态图标：播放=绿色音量，静音=灰色静音符 */}
            {isMuted
              ? <VolumeX size={20} className="text-stone-400" />
              : <Volume2 size={20} className="text-[var(--color-brand)]" />}
          </button>
        </div>
      </div>

      <GameProgressBar progress={progress} />

      {/* 主内容区 — 横屏时进入统一版心的 12 列栅格，竖屏时上下堆叠 */}
      <div className={`flex-1 ${useLandscapeLayout ? 'overflow-hidden px-4 lg:px-8' : 'flex flex-col items-center justify-center overflow-hidden'}`}>
        {useLandscapeLayout ? (
          <div className="ui-page-wide grid h-full grid-cols-12 items-center gap-x-6 lg:gap-x-8">
            {/* 左侧留白 */}
            <div className="col-span-1" />

            {/* 主舞台区域 */}
            <div className="col-span-6 flex items-center justify-center max-h-[70vh]">
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 sm:gap-4">
                <div className="flex min-h-6 items-center justify-center">
                  <WarmupFlowerTimer
                    isActive={showFlowerTimer}
                    isPaused={isGamePaused}
                    flowerCount={warmupTimerCount}
                    durationMs={visibleDuration}
                    onComplete={isWarmupPhase ? proceedWarmup : undefined}
                  />
                </div>
                <div className="flex min-h-0 w-full items-center justify-center">
                  {renderStimulusLayout()}
                </div>
              </div>
            </div>

            {/* 中间沟槽 */}
            <div className="col-span-1" />

            {/* 操作区 — 归入统一版心的右侧功能列（主辅层次：主色「一样」在上 = 用户进页面第一眼就看见主色，与首页继续训练统一）*/}
            <div className="col-span-3 flex justify-center">
              <div className="grid w-full grid-rows-[auto_auto_1fr] items-start gap-y-8" style={{ maxWidth: '20.5rem' }}>
                <div className="grid gap-6 lg:gap-7">
                  {/* "一样"按钮（主色，第一视觉位=上方，与首页"继续训练"主色统一）*/}
                  <button
                    onClick={handleSame}
                    aria-label={t('game.same')}
                    disabled={isInputDisabled}
                    className={`
                      ui-btn-base py-5 sm:py-6 lg:py-7 text-lg sm:text-xl lg:text-2xl tracking-[0.12em]
                      transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center
                      min-h-[56px] sm:min-h-[64px] lg:min-h-[72px]
                      font-medium
                      ${getSameButtonClass()}
                    `}
                    style={{
                      fontFamily: 'var(--font-family-serif)',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                    }}
                  >
                    {getSameButtonText()}
                  </button>

                  {/* "不一样"按钮（次级色，第二视觉位=下方，与首页改配置/底部3个入口浅色调统一）*/}
                  <button
                    onClick={handleDifferent}
                    aria-label={t('game.different')}
                    disabled={isInputDisabled}
                    className={`
                      ui-btn-base py-5 sm:py-6 lg:py-7 text-lg sm:text-xl lg:text-2xl tracking-[0.12em]
                      transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center
                      min-h-[56px] sm:min-h-[64px] lg:min-h-[72px]
                      font-medium
                      ${getDifferentButtonClass()}
                    `}
                    style={{
                      fontFamily: 'var(--font-family-serif)',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                    }}
                  >
                    {getDiffButtonText()}
                  </button>
                </div>

                {/* 提示文字 */}
                <p className="w-full text-center text-[var(--color-text-muted)] text-sm sm:text-base h-6 font-light">
                  <span className={showStimulus && !userAnswered ? 'transition-opacity duration-300' : 'invisible'}>
                    {isWarmupPhase ? t('game.warmupDefault') : getHintText(n)}
                  </span>
                </p>
              </div>
            </div>

            {/* 右侧留白 */}
            <div className="col-span-1" />
          </div>
        ) : (
          <>
            {/* 主舞台区域 — 竖屏布局 */}
            <div className="w-full">
              <div className="flex w-full flex-col items-center justify-center gap-3 sm:gap-4">
                <div className="flex min-h-6 items-center justify-center">
                  <WarmupFlowerTimer
                    isActive={showFlowerTimer}
                    isPaused={isGamePaused}
                    flowerCount={warmupTimerCount}
                    durationMs={visibleDuration}
                    onComplete={isWarmupPhase ? proceedWarmup : undefined}
                  />
                </div>
                <div className="flex w-full items-center justify-center">
                  {renderStimulusLayout()}
                </div>
              </div>
            </div>

            {/* 操作区 — 竖屏（移动端）布局：主色「一样」在左（中文阅读默认第一视觉位），与首页继续训练主色统一；次级「不一样」在右（浅色调）*/}
            <div className="ui-page-narrow px-6 sm:px-8 lg:px-12 pb-8">
              <div className="flex gap-3 sm:gap-4">
                {/* "一样"按钮（主色，左=第一视觉位，与首页"继续训练"主色统一）*/}
                <button
                  onClick={handleSame}
                  aria-label={t('game.same')}
                  disabled={isInputDisabled}
                  className={`
                    ui-btn-base flex-1 py-5 sm:py-6 lg:py-7 text-lg sm:text-xl lg:text-2xl tracking-[0.12em]
                    transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center
                    min-h-[56px] sm:min-h-[64px] lg:min-h-[72px]
                    font-medium
                    ${getSameButtonClass()}
                  `}
                  style={{
                    fontFamily: 'var(--font-family-serif)',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  {getSameButtonText()}
                </button>

                {/* "不一样"按钮（次级色，右=第二视觉位，与首页改配置/底部3个入口浅色调统一）*/}
                <button
                  onClick={handleDifferent}
                  aria-label={t('game.different')}
                  disabled={isInputDisabled}
                  className={`
                    ui-btn-base flex-1 py-5 sm:py-6 lg:py-7 text-lg sm:text-xl lg:text-2xl tracking-[0.12em]
                    transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center
                    min-h-[56px] sm:min-h-[64px] lg:min-h-[72px]
                    font-medium
                    ${getDifferentButtonClass()}
                  `}
                  style={{
                    fontFamily: 'var(--font-family-serif)',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  {getDiffButtonText()}
                </button>
              </div>

              {/* 提示文字 */}
              <p className="text-center w-full mt-4 sm:mt-6 text-[var(--color-text-muted)] text-sm sm:text-base h-6 font-light">
                <span className={showStimulus && !userAnswered ? 'transition-opacity duration-300' : 'invisible'}>
                  {isWarmupPhase ? t('game.warmupDefault') : getHintText(n)}
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* 全屏引导页 — 用户确认前不启动引擎 */}
      {!introConfirmed && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
          {/* 返回按钮 */}
          <BackIconButton
            onClick={handleStop}
            ariaLabel={t('game.back')}
            className="absolute left-4 top-4 z-10"
          />
          <div className="ui-page-narrow text-center">
            <div className="text-5xl mb-6">🌿</div>
            <h2
              className="text-2xl text-[var(--color-text-primary)] mb-4"
              style={{ fontFamily: 'var(--font-family-serif)' }}
            >
              {getGenericIntroTitle(n)}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-2 leading-relaxed">
              {getGenericIntroBody(n)}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mb-8">
              {getGenericWarmupText(n)}
            </p>
            <button
              onClick={handleIntroConfirm}
              aria-label={startCtaText}
              data-testid="game-start-button"
              className="ui-btn-base ui-btn-primary px-10 py-4 text-lg transition-all"
              style={{ minHeight: '56px', fontFamily: 'var(--font-family-serif)' }}
            >
              <Wind size={18} className="inline mr-2" />
              {startCtaText}
            </button>
          </div>
        </div>
      )}

      {/* 暖身结束提示 */}
      {showWarmupEnd && (
        <div className="absolute top-16 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <div className="ui-chip bg-[var(--color-brand)] text-white px-6 py-3 shadow-lg text-sm animate-fade-in">
            {getWarmupEndText(n)}
          </div>
        </div>
      )}

      <GamePauseOverlay
        resumeGame={resumeGame}
        resumePromptText={resumePromptText}
        resumeButtonText={resumeButtonText}
      />
      <GameRuntimeHud isTimedMode={isTimedMode} introConfirmed={introConfirmed} />
    </div>
  );
}
