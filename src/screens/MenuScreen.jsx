/**
 * 菜单首页 — 三步引导式选择
 *
 * 首次用户：三步引导（记忆模式 → 时间节奏 → 记忆难度）
 * 回归用户：快速开始（上次配置 + 一键开始）
 *
 * @version 8.0
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wind, Sprout, BarChart3, Award, Flower2, Eye, Ear, MapPin, Grid3X3,
  Timer, Zap, Sun, ChevronRight, ChevronLeft, Settings,
} from 'lucide-react';
import { useMemo } from 'react';
import useGameStore from '@stores/useGameStore';
import useStatsStore from '@stores/useStatsStore';
import useGardenStore, { computeLevel } from '@stores/useGardenStore';

/**
 * 游戏模式配置（记忆模式）
 */
const GAME_MODE_TYPES = [
  {
    id: 'walk',
    modeId: 'walk',
    label: '散步',
    desc: '看花认花',
    icon: Eye,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    intro: '花儿一朵接一朵出现。记住刚见过的花，再次看到时按下按钮。',
    audience: '适合所有人，尤其是初次接触记忆训练的用户',
  },
  {
    id: 'dual',
    modeId: 'walk',
    label: '花与歌',
    desc: '看花+听声',
    icon: Ear,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    intro: '同时出现一朵花和一个声音。只有花和声音都与之前一样时，才算匹配。',
    audience: '适合已熟悉散步模式、想挑战双通道记忆的用户',
    disabled: true,
    comingSoon: true,
  },
  {
    id: 'spatial',
    modeId: 'walk',
    label: '花坛',
    desc: '记位置',
    icon: MapPin,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    intro: '花会开在花坛的某个位置。记住花的位置和种类，再次出现时按下按钮。',
    audience: '适合想锻炼空间记忆的用户',
    disabled: true,
    comingSoon: true,
  },
  {
    id: 'grid',
    modeId: 'walk',
    label: '花圃',
    desc: '记图案',
    icon: Grid3X3,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    intro: '花坛上同时出现多朵花。记住整个图案，再次看到时按下按钮。',
    audience: '适合进阶用户，想同时锻炼视觉和空间记忆',
    disabled: true,
    comingSoon: true,
  },
];

/**
 * 时间节奏配置
 */
const TIME_MODES = [
  {
    id: 'walk',
    label: '初晨',
    desc: '慢慢看，不赶时间',
    icon: Flower2,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    waitingForInput: true,
    speedProfile: { fadeIn: 300, visible: 999000, fadeOut: 300, gap: 1000 },
    intro: '花儿慢慢出现，不赶时间。适合刚开始练习、想慢慢感受的你。',
    audience: '适合儿童、老人、初次使用者',
  },
  {
    id: 'daily',
    label: '午后',
    desc: '每项限时 3 秒',
    icon: Timer,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    waitingForInput: true,
    speedProfile: { fadeIn: 300, visible: 3000, fadeOut: 250, gap: 400 },
    intro: '每朵花出现 3 秒。有足够时间思考，但也需要集中注意力。',
    audience: '适合日常练习，巩固记忆能力',
  },
  {
    id: 'challenge',
    label: '暮色',
    desc: '每项限时 2 秒',
    icon: Zap,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    waitingForInput: true,
    speedProfile: { fadeIn: 250, visible: 2000, fadeOut: 200, gap: 300 },
    intro: '每朵花只出现 2 秒。需要快速判断，挑战你的反应和记忆。',
    audience: '适合已熟练掌握、想突破自己的用户',
  },
  {
    id: 'timed',
    label: '晨跑',
    desc: '60 秒限时冲刺',
    icon: Timer,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    waitingForInput: true,
    timed: true,
    timeLimit: 60000,
    speedProfile: { fadeIn: 250, visible: 2000, fadeOut: 200, gap: 300 },
    intro: '60 秒内尽可能多命中。测试你的速度和记忆极限。',
    audience: '适合想测试极限、追求高分的用户',
  },
];

/**
 * N 值难度描述
 */
const N_DESCRIPTIONS = {
  1: { label: '1', title: '入门', desc: '记住刚见过的花', detail: '只需要记住上一朵花。适合刚开始练习的你。' },
  2: { label: '2', title: '日常', desc: '记住两步前的花', detail: '需要记住两步前的花。适合日常练习。' },
  3: { label: '3', title: '进阶', desc: '记住三步前的花', detail: '需要记住三步前的花。挑战你的工作记忆。' },
  4: { label: '4', title: '挑战', desc: '记住四步前的花', detail: '需要记住四步前的花。记忆高手的试炼。' },
};

/**
 * 步骤指示器
 */
function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              i + 1 === currentStep
                ? 'bg-[var(--color-brand)] text-white shadow-md'
                : i + 1 < currentStep
                ? 'bg-green-100 text-green-600'
                : 'bg-stone-100 text-stone-400'
            }`}
          >
            {i + 1 < currentStep ? '✓' : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-8 h-0.5 ${i + 1 < currentStep ? 'bg-green-200' : 'bg-stone-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * 选项卡片组件
 */
function OptionCard({ option, isSelected, onClick, showIntro = false }) {
  const Icon = option.icon;
  const isDisabled = option.disabled;
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`w-full flex items-start gap-3 p-4 rounded-2xl transition-all duration-200 border-2 text-left ${
        isDisabled
          ? 'bg-white/20 border-transparent opacity-50 cursor-not-allowed'
          : isSelected
          ? 'bg-white border-[var(--color-brand)] shadow-md'
          : 'bg-white/40 border-transparent hover:bg-white/60'
      }`}
      style={{ minHeight: '80px' }}
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${isSelected && !isDisabled ? option.iconBg : 'bg-stone-100'}`}>
        <Icon size={20} className={isSelected && !isDisabled ? option.iconColor : 'text-[var(--color-text-muted)]'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium flex items-center gap-2 ${isSelected && !isDisabled ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
          {option.label}
          {option.comingSoon && (
            <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-normal">即将推出</span>
          )}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {option.desc}
        </div>
        {showIntro && isSelected && !isDisabled && option.intro && (
          <div className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            {option.intro}
          </div>
        )}
        {showIntro && isSelected && !isDisabled && option.audience && (
          <div className="text-xs text-[var(--color-brand)] mt-1">
            {option.audience}
          </div>
        )}
      </div>
      {isSelected && !isDisabled && (
        <div className="w-5 h-5 rounded-full bg-[var(--color-brand)] flex items-center justify-center flex-shrink-0 mt-1">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}
    </button>
  );
}

/**
 * 默认游戏配置
 */
const DEFAULTS = {
  n: 1,
  targetRate: 0.38,
  lureRate: 0.15,
  factorId: 'emoji-flower',
};

export default function MenuScreen() {
  const navigate = useNavigate();

  // 当前步骤（1=记忆模式, 2=时间节奏, 3=记忆难度）
  const [step, setStep] = useState(1);
  // 是否显示快速开始（回归用户）
  const [showQuickStart, setShowQuickStart] = useState(() => {
    return useStatsStore.getState().sessions.length > 0;
  });

  // 选择状态
  const [selectedGameMode, setSelectedGameMode] = useState(() => {
    try { return localStorage.getItem('memory-garden:sel-gameMode') || 'walk'; } catch { return 'walk'; }
  });
  const [selectedTimeMode, setSelectedTimeMode] = useState(() => {
    try { return localStorage.getItem('memory-garden:sel-timeMode') || 'walk'; } catch { return 'walk'; }
  });
  const [selectedN, setSelectedN] = useState(() => {
    try { return parseInt(localStorage.getItem('memory-garden:sel-n'), 10) || 1; } catch { return 1; }
  });

  /** 持久化选择到 localStorage */
  const persistSelection = (key, value) => {
    try { localStorage.setItem(`memory-garden:sel-${key}`, String(value)); } catch { /* 忽略存储异常 */ }
  };

  /**
   * 构建游戏配置
   */
  const buildConfig = () => {
    const timeMode = TIME_MODES.find((m) => m.id === selectedTimeMode);
    const n = selectedN;
    const sp = timeMode.speedProfile;

    return {
      ...DEFAULTS,
      modeId: 'walk',
      n,
      warmupTrials: n + 1,
      totalTurns: 14 + n * 2,
      speed: sp.visible + sp.fadeIn + sp.fadeOut + sp.gap,
      speedProfile: sp,
      waitingForInput: timeMode.waitingForInput,
      timed: timeMode.timed || false,
      timeLimit: timeMode.timeLimit || 0,
      id: `walk-${timeMode.id}-n${n}`,
      gameMode: timeMode.id,
    };
  };

  /**
   * 开始游戏
   */
  const handleStart = () => {
    const config = buildConfig();
    useGameStore.setState({ config, levelIndex: 0 });
    navigate('/game');
  };

  /**
   * 快速开始（使用上次配置）
   */
  const handleQuickStart = () => {
    handleStart();
  };

  /**
   * 切换到引导模式
   */
  const handleSwitchToWizard = () => {
    setShowQuickStart(false);
  };

  // 当前选中的模式和节奏
  const currentGameMode = GAME_MODE_TYPES.find((m) => m.id === selectedGameMode);
  const currentTimeMode = TIME_MODES.find((m) => m.id === selectedTimeMode);

  // 花园等级（selector 只取原始值，避免返回新对象导致无限循环）
  const growthPoints = useGardenStore((s) => s.growthPoints);
  const totalWalks = useGardenStore((s) => s.totalWalks);
  const gardenLevel = useMemo(() => computeLevel(growthPoints), [growthPoints]);

  // 快速开始视图（回归用户）
  if (showQuickStart) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in p-6 w-full">
        {/* 标题区 */}
        <div className="text-center">
          <div className="bg-white/60 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[var(--color-text-secondary)] text-sm mb-3 shadow-sm">
            <Sun size={14} className="text-orange-400" />
            <span>欢迎回来</span>
          </div>
          <h2
            className="text-3xl text-[var(--color-text-primary)] mb-2"
            style={{ fontFamily: 'var(--font-family-serif)' }}
          >
            继续散步吗？
          </h2>
          {/* 花园等级 */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-lg">{gardenLevel.icon}</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              花园 · {gardenLevel.name}
              {totalWalks > 0 && <span> · {totalWalks} 次散步</span>}
            </span>
          </div>
        </div>

        {/* 上次配置摘要 */}
        <div className="bg-white/60 rounded-2xl p-4 w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1">
              {React.createElement(currentGameMode.icon, { size: 14, className: currentGameMode.iconColor })}
              {currentGameMode.label}
            </span>
            <span className="text-stone-300">·</span>
            <span className="flex items-center gap-1">
              {React.createElement(currentTimeMode.icon, { size: 14, className: currentTimeMode.iconColor })}
              {currentTimeMode.label}
            </span>
            <span className="text-stone-300">·</span>
            <span>N={selectedN}</span>
          </div>
        </div>

        {/* 主按钮 */}
        <button
          onClick={handleQuickStart}
          aria-label="开始散步"
          className="bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)] text-white text-xl py-4 px-16 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center"
          style={{ fontFamily: 'var(--font-family-serif)', minHeight: '56px', fontSize: '20px' }}
        >
          <Wind className="animate-pulse" size={20} />
          开始散步
        </button>

        {/* 副按钮 */}
        <button
          onClick={handleSwitchToWizard}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
          style={{ minHeight: 'var(--touch-min-size)' }}
        >
          换一种模式
        </button>

        {/* 底部入口 */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/stats')}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <BarChart3 size={16} /> 花园日记
          </button>
          <button
            onClick={() => navigate('/achievements')}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <Award size={16} /> 花园收藏
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <Settings size={16} /> 设置
          </button>
        </div>
      </div>
    );
  }

  // 三步引导视图
  return (
    <div className="flex flex-col h-full animate-fade-in p-6 w-full overflow-y-auto relative">
      {/* 返回按钮 */}
      <button
        onClick={() => setShowQuickStart(true)}
        aria-label="返回"
        className="absolute top-4 left-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm bg-white/50 px-3 py-1 rounded-full z-10"
        style={{ minHeight: '44px', touchAction: 'manipulation' }}
      >
        ← 回到花园
      </button>

      {/* 步骤指示器 */}
      <StepIndicator currentStep={step} totalSteps={3} />

      {/* 步骤 1：记忆模式 */}
      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h2
            className="text-2xl text-[var(--color-text-primary)] mb-2 text-center"
            style={{ fontFamily: 'var(--font-family-serif)' }}
          >
            选记忆模式
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
            选择你想练习的记忆方式
          </p>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {GAME_MODE_TYPES.map((mode) => (
              <OptionCard
                key={mode.id}
                option={mode}
                isSelected={selectedGameMode === mode.id}
                onClick={() => { setSelectedGameMode(mode.id); persistSelection('gameMode', mode.id); }}
                showIntro
              />
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="mt-4 w-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)] text-white py-4 rounded-full text-lg flex items-center justify-center gap-2 shadow-lg"
            style={{ minHeight: '56px', touchAction: 'manipulation' }}
          >
            下一步：选时间节奏
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 步骤 2：时间节奏 */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h2
            className="text-2xl text-[var(--color-text-primary)] mb-2 text-center"
            style={{ fontFamily: 'var(--font-family-serif)' }}
          >
            选时间节奏
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
            选择适合你的练习节奏
          </p>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {TIME_MODES.map((mode) => (
              <OptionCard
                key={mode.id}
                option={mode}
                isSelected={selectedTimeMode === mode.id}
                onClick={() => { setSelectedTimeMode(mode.id); persistSelection('timeMode', mode.id); }}
                showIntro
              />
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-stone-100 text-[var(--color-text-secondary)] py-4 rounded-full text-lg flex items-center justify-center gap-2"
              style={{ minHeight: '56px', touchAction: 'manipulation' }}
            >
              <ChevronLeft size={18} />
              上一步
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-[2] bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)] text-white py-4 rounded-full text-lg flex items-center justify-center gap-2 shadow-lg"
              style={{ minHeight: '56px', touchAction: 'manipulation' }}
            >
              下一步：选难度
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 步骤 3：记忆难度 */}
      {step === 3 && (
        <div className="flex-1 flex flex-col">
          <h2
            className="text-2xl text-[var(--color-text-primary)] mb-2 text-center"
            style={{ fontFamily: 'var(--font-family-serif)' }}
          >
            选记忆难度
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
            N 值越大，需要记住的花越多
          </p>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {[1, 2, 3, 4].map((nVal) => {
              const desc = N_DESCRIPTIONS[nVal];
              return (
                <button
                  key={nVal}
                  onClick={() => { setSelectedN(nVal); persistSelection('n', nVal); }}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl transition-all duration-200 border-2 text-left ${
                    selectedN === nVal
                      ? 'bg-white border-[var(--color-brand)] shadow-md'
                      : 'bg-white/40 border-transparent hover:bg-white/60'
                  }`}
                  style={{ minHeight: '80px' }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                    selectedN === nVal ? 'bg-[var(--color-brand)] text-white' : 'bg-stone-100 text-stone-400'
                  }`}>
                    {desc.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${selectedN === nVal ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {desc.title}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {desc.desc}
                    </div>
                    {selectedN === nVal && (
                      <div className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                        {desc.detail}
                      </div>
                    )}
                  </div>
                  {selectedN === nVal && (
                    <div className="w-5 h-5 rounded-full bg-[var(--color-brand)] flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-stone-100 text-[var(--color-text-secondary)] py-4 rounded-full text-lg flex items-center justify-center gap-2"
              style={{ minHeight: '56px', touchAction: 'manipulation' }}
            >
              <ChevronLeft size={18} />
              上一步
            </button>
            <button
              onClick={handleStart}
              aria-label="开始散步"
              className="flex-[2] bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)] text-white py-4 rounded-full text-lg flex items-center justify-center gap-2 shadow-lg"
              style={{ fontFamily: 'var(--font-family-serif)', minHeight: '56px', fontSize: '20px', touchAction: 'manipulation' }}
            >
              <Wind className="animate-pulse" size={20} />
              开始散步
            </button>
          </div>
        </div>
      )}

      {/* 底部入口（仅第一步显示） */}
      {step === 1 && (
        <div className="flex items-center justify-center gap-6 mt-4">
          <button
            onClick={() => navigate('/stats')}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <BarChart3 size={16} /> 花园日记
          </button>
          <button
            onClick={() => navigate('/achievements')}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <Award size={16} /> 花园收藏
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <Settings size={16} /> 设置
          </button>
        </div>
      )}
    </div>
  );
}
