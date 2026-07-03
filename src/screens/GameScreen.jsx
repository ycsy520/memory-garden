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
import React, { useCallback, useState, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Wind, Flower2, Timer } from 'lucide-react';
import useGameStore from '@stores/useGameStore';
import useSettingsStore from '@stores/useSettingsStore';
import useGameEngine from '@hooks/useGameEngine';
import useMatchInput from '@hooks/useMatchInput';
import AudioService from '@services/AudioService';
import PlatformService from '@services/PlatformService';
import WarmupFlowerTimer from '@components/WarmupFlowerTimer';
import ElapsedTimer from '@components/ElapsedTimer';
import StimulusStage from '@components/game/StimulusStage';

import { getSameButtonText, getDiffButtonText, getHintText, getWarmupEndText, getGenericIntroTitle, getGenericIntroBody, getGenericWarmupText } from '@engine/stimuli/StimulusText';

export default function GameScreen() {
  const navigate = useNavigate();
  const isMuted = useSettingsStore((s) => s.isMuted);
  const toggleMute = useSettingsStore((s) => s.toggleMute);

  const config = useGameStore((s) => s.config);
  const history = useGameStore((s) => s.history);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const showStimulus = useGameStore((s) => s.showStimulus);
  const userAnswered = useGameStore((s) => s.userAnswered);
  const feedback = useGameStore((s) => s.feedback);
  const status = useGameStore((s) => s.status);
  const resume = useGameStore((s) => s.resume);
  const trialVisibleDuration = useGameStore((s) => s.trialVisibleDuration);
  const timedModeRemaining = useGameStore((s) => s.timedModeRemaining);

  // 可见阶段时长（由引擎逐回合同步到 store，优先使用）
  const visibleDuration = trialVisibleDuration || config?.speedProfile?.visible || 2500;

  const { startGame, handleMatch: rawHandleMatch, stopGame, resumeGame, proceedWarmup } = useGameEngine(() => navigate('/finished'));
  const { handleMatch } = useMatchInput(rawHandleMatch);

  // 暖身阶段判定
  const n = config?.n || 1;
  const warmupTrials = config?.warmupTrials || n + 1;
  const isWarmupPhase = currentTurn < warmupTrials;

  // 当前游戏模式（标准/双通道/空间/栅格）
  const modeId = config?.modeId || 'walk';
  // 当前时间节奏（walk/daily/challenge/timed）
  const gameMode = config?.gameMode || 'walk';
  // 是否限时模式
  const isTimedMode = config?.timed && config?.timeLimit > 0;

  // 引导状态：true=展示引导，等待用户确认；false=已确认，游戏进行中
  const [introConfirmed, setIntroConfirmed] = useState(false);
  // 暖身结束提示
  const [showWarmupEnd, setShowWarmupEnd] = useState(false);
  // 追踪用户最后按了哪个按钮（用于 feedback 高亮）
  const [lastAnswer, setLastAnswer] = useState(null); // 'same' | 'different' | null

  // 小花倒计时配置
  // 散步模式：热身3朵，正式无；日常训练：热身3朵，正式3朵；挑战：热身3朵，正式2朵
  const flowerCount = isWarmupPhase ? 3 : (gameMode === 'challenge' ? 2 : 3);
  const showFlowerTimer = isWarmupPhase
    ? (showStimulus && introConfirmed)
    : (showStimulus && introConfirmed && gameMode !== 'walk');

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

  // 双通道模式：播放听觉刺激
  useEffect(() => {
    if (modeId === 'dual' && showStimulus && currentFactor?.value?.audio) {
      // ToneFactor.generate() 返回的 value 就是频率数字（如 261.63）
      const freq = currentFactor.value.audio.value;
      const waveType = currentFactor.value.audio.meta?.waveType || 'sine';
      if (typeof freq === 'number') {
        AudioService.playTone(freq, 300, waveType);
      }
    }
  }, [modeId, showStimulus, currentFactor]);

  /**
   * 处理停止游戏（确认后才退出）
   */
  const handleStop = useCallback(() => {
    if (!introConfirmed || window.confirm('确定要离开这次散步吗？当前进度不会保留。')) {
      stopGame();
      navigate('/menu');
    }
  }, [stopGame, navigate, introConfirmed]);

  /**
   * 处理静音切换
   */
  const handleToggleMute = useCallback(() => {
    toggleMute();
    AudioService.toggleMute();
  }, [toggleMute]);

  return (
    <div className="flex flex-col h-full relative">
      {/* 顶部导航栏 */}
      <div className="flex justify-between items-center p-4 z-20">
        <button
          onClick={handleStop}
          aria-label="回到花园"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm bg-white/50 px-3 py-1 rounded-full"
          style={{ minHeight: '44px', touchAction: 'manipulation' }}
        >
          回到花园
        </button>

        <div className="flex items-center gap-2">
          <Flower2 size={16} className="text-[var(--color-text-muted)]" />
          <span
            className="text-[var(--color-text-secondary)] font-bold text-lg"
            style={{ fontFamily: 'var(--font-family-serif)' }}
          >
            散步
          </span>
        </div>

        <button
          onClick={handleToggleMute}
          aria-label={isMuted ? '开启声音' : '静音'}
          className="p-2 rounded-full bg-white/50 text-[var(--color-text-secondary)] hover:bg-white transition-colors"
          style={{ minHeight: '44px', minWidth: '44px', touchAction: 'manipulation' }}
        >
          {isMuted ? <Volume2 size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* 进度条（瓢虫走小路） */}
      <div className="absolute top-0 left-0 w-full h-2 bg-stone-200/50">
        <div
          className="h-full bg-[var(--color-brand)] transition-all duration-1000 ease-linear rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 主舞台区域 — 使用 StimulusStage */}
      <StimulusStage
        stimulus={currentFactor}
        showStimulus={showStimulus}
        isWarmupPhase={isWarmupPhase}
        showFlowerTimer={showFlowerTimer}
        flowerCount={flowerCount}
        visibleDuration={visibleDuration}
        proceedWarmup={proceedWarmup}
        warmupText="先看看，熟悉一下"
      />

      {/* 操作区 — 双按钮：一样 / 不一样 */}
      <div className="w-full px-6 sm:px-8 max-w-md pb-8">
        <div className="flex gap-3">
          {/* "不一样"按钮 */}
          <button
            onClick={handleDifferent}
            aria-label="不一样"
            disabled={!showStimulus || userAnswered || isWarmupPhase}
            className={`
              flex-1 py-5 sm:py-6 rounded-[2rem] text-lg sm:text-xl tracking-wider
              transition-all duration-200 ease-out flex items-center justify-center
              ${
                (feedback === 'correctRejection' && lastAnswer === 'different')
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : (feedback === 'missed' && lastAnswer === 'different')
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : !showStimulus || isWarmupPhase
                  ? 'bg-stone-100 text-stone-400 cursor-default border border-stone-200'
                  : userAnswered
                  ? 'bg-stone-100 text-stone-400 border border-stone-200'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 active:scale-[0.98] border border-stone-300 shadow-sm'
              }
            `}
            style={{
              minHeight: '56px',
              fontSize: '18px',
              fontFamily: 'var(--font-family-serif)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {getDiffButtonText()}
          </button>

          {/* "一样"按钮 */}
          <button
            onClick={handleSame}
            aria-label="一样"
            disabled={!showStimulus || userAnswered || isWarmupPhase}
            className={`
              flex-1 py-5 sm:py-6 rounded-[2rem] text-lg sm:text-xl tracking-wider
              transition-all duration-200 ease-out flex items-center justify-center
              ${
                (feedback === 'correct' && lastAnswer === 'same')
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : (feedback === 'wrong' && lastAnswer === 'same')
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : !showStimulus || isWarmupPhase
                  ? 'bg-stone-100 text-stone-400 cursor-default border border-stone-200'
                  : userAnswered
                  ? 'bg-stone-100 text-stone-400 border border-stone-200'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 active:scale-[0.98] border border-stone-300 shadow-sm'
              }
            `}
            style={{
              minHeight: '56px',
              fontSize: '18px',
              fontFamily: 'var(--font-family-serif)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {getSameButtonText()}
          </button>
        </div>

        {/* 提示文字 */}
        <p className="text-center mt-4 sm:mt-6 text-[var(--color-text-muted)] text-sm sm:text-base h-6 font-light">
          <span className={showStimulus && !userAnswered ? 'transition-opacity duration-300' : 'invisible'}>
            {isWarmupPhase ? '先看看，不计分' : getHintText(n)}
          </span>
        </p>
      </div>

      {/* 全屏引导页 — 用户确认前不启动引擎 */}
      {!introConfirmed && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
          {/* 返回按钮 */}
          <button
            onClick={handleStop}
            aria-label="回到花园"
            className="absolute top-4 left-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm bg-white/50 px-3 py-1 rounded-full"
            style={{ minHeight: '44px', touchAction: 'manipulation' }}
          >
            ← 回到花园
          </button>
          <div className="max-w-sm w-full text-center">
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
              aria-label="开始散步"
              className="bg-[var(--color-brand)] text-white px-10 py-4 rounded-full text-lg shadow-lg hover:bg-[var(--color-brand-hover)] active:scale-95 transition-all"
              style={{ minHeight: '56px', fontFamily: 'var(--font-family-serif)', touchAction: 'manipulation' }}
            >
              <Wind size={18} className="inline mr-2" />
              开始散步
            </button>
          </div>
        </div>
      )}

      {/* 暖身结束提示 */}
      {showWarmupEnd && (
        <div className="absolute top-16 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <div className="bg-[var(--color-brand)] text-white px-6 py-3 rounded-full shadow-lg text-sm animate-fade-in">
            {getWarmupEndText(n)}
          </div>
        </div>
      )}

      {/* 暂停遮罩 */}
      {status === 'paused' && (
        <div className="absolute inset-0 bg-stone-50 z-50 flex flex-col items-center justify-center space-y-6 animate-fade-in">
          <Wind size={48} className="text-[var(--color-text-muted)]" />
          <p
            className="text-xl text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-family-serif)' }}
          >
            刚刚离开了一会儿
          </p>
          <p className="text-[var(--color-text-secondary)]">要继续这次散步吗？</p>
          <button
            onClick={() => { resumeGame(); resume(); }}
            aria-label="继续散步"
            className="bg-[var(--color-brand)] text-white px-8 py-3 rounded-full shadow-lg"
            style={{ minHeight: '56px', fontSize: '18px' }}
          >
            继续散步
          </button>
        </div>
      )}

      {/* 右下角计时：限时模式显示倒计时，普通模式显示已用时间 */}
      {isTimedMode ? (
        introConfirmed && status === 'active' && (
          <div
            className="fixed bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm z-30 select-none"
            style={{ fontFamily: 'var(--font-family-mono)' }}
            aria-label="剩余时间"
          >
            <Timer size={14} className={Math.ceil(timedModeRemaining / 1000) <= 10 ? 'text-red-500' : 'text-stone-500'} />
            <span className={`text-sm font-medium ${Math.ceil(timedModeRemaining / 1000) <= 10 ? 'text-red-500' : 'text-stone-600'}`}>
              {Math.ceil(timedModeRemaining / 1000)}s
            </span>
          </div>
        )
      ) : (
        <ElapsedTimer isRunning={introConfirmed && status === 'active'} />
      )}
    </div>
  );
}
