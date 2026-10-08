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
import { useTranslation } from 'react-i18next';
import {
  Wind, Sprout, BarChart3, Award, Flower2, Eye, Ear, MapPin, Grid3X3,
  Timer, Zap, Sun, ChevronRight, ChevronLeft, Settings, MoreHorizontal,
} from 'lucide-react';
import { useMemo } from 'react';
import BackIconButton from '@components/BackIconButton';
import useGameStore from '@stores/useGameStore';
import useStatsStore from '@stores/useStatsStore';
import GardenBackground from '@components/GardenBackground';
import useGardenStore, { computeLevel } from '@stores/useGardenStore';
import StoreIcon from '@components/StoreIcon';

/**
 * Feature flag：首页花园背景装饰
 * 设为 false 可一键关闭，用于性能问题快速回滚
 */
const ENABLE_GARDEN_BACKGROUND = true;

/**
 * 游戏模式基础配置（仅保留非文本属性，用于解锁逻辑和构建配置）
 */
const GAME_MODE_TYPES = [
  {
    id: 'walk',
    modeId: 'walk',
    icon: Eye,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    unlockRequirement: null,
  },
  {
    id: 'dual',
    modeId: 'dual',
    icon: Ear,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    unlockRequirement: { type: 'modeCompleted', modeId: 'walk', n: 1 },
  },
  {
    id: 'spatial',
    modeId: 'spatial',
    icon: MapPin,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    unlockRequirement: { type: 'modeCompleted', modeId: 'walk', n: 1 },
  },
  {
    id: 'grid',
    modeId: 'grid',
    icon: Grid3X3,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    unlockRequirement: { type: 'modeCompleted', modeId: 'walk', n: 1 },
  },
];

/**
 * 时间节奏基础配置（仅保留非文本属性）
 */
const TIME_MODES = [
  {
    id: 'walk',
    icon: Flower2,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    waitingForInput: true,
    speedProfile: { fadeIn: 300, visible: 999000, fadeOut: 300, gap: 1000 },
  },
  {
    id: 'daily',
    icon: Timer,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    waitingForInput: true,
    speedProfile: { fadeIn: 300, visible: 3000, fadeOut: 250, gap: 400 },
  },
  {
    id: 'challenge',
    icon: Zap,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    waitingForInput: true,
    speedProfile: { fadeIn: 250, visible: 2000, fadeOut: 200, gap: 300 },
  },
  {
    id: 'timed',
    icon: Timer,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    waitingForInput: true,
    timed: true,
    timeLimit: 60000,
    speedProfile: { fadeIn: 250, visible: 2000, fadeOut: 200, gap: 300 },
  },
];

/**
 * N 值难度基础配置（仅保留非文本属性）
 */
const N_DESCRIPTIONS = {
  1: { label: '1', unlockRequirement: null },
  2: { label: '2', unlockRequirement: 1 },
  3: { label: '3', unlockRequirement: 2 },
  4: { label: '4', unlockRequirement: 3 },
};

/**
 * 检查游戏模式是否已解锁
 * @param {Object} mode - 模式配置
 * @param {Object} stats - 统计数据 { completedModes: Set, completedNs: Set }
 * @returns {boolean}
 */
function isModeUnlocked(mode, stats) {
  if (!mode.unlockRequirement) return true;
  const req = mode.unlockRequirement;
  if (req.type === 'modeCompleted') {
    // 需要完成指定模式的指定N值
    return stats.completedModes.has(req.modeId) && stats.completedNs.has(req.n);
  }
  return false;
}

/**
 * 检查N值是否已解锁
 * @param {number} n - N值
 * @param {Set<number>} completedNs - 已完成的N值集合
 * @returns {boolean}
 */
function isNUnlocked(n, completedNs) {
  const desc = N_DESCRIPTIONS[n];
  if (!desc || !desc.unlockRequirement) return true;
  return completedNs.has(desc.unlockRequirement);
}

/**
 * 步骤指示器
 */
function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`ui-chip w-8 h-8 flex items-center justify-center text-sm font-medium transition-all ${
              i + 1 === currentStep
                ? 'bg-[var(--color-brand)] text-white shadow-[0_12px_24px_rgba(125,150,131,0.16)]'
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
 * 步骤页标题块
 * 统一步骤标题、说明文案和纵向节奏，避免三步引导各自使用不同的留白尺度。
 * @param {{ title: string, description: string }} props
 * @returns {JSX.Element}
 */
function StepHeader({ title, description }) {
  return (
    <div className="ui-heading-block mb-6 sm:mb-8">
      <h2
        className="text-2xl sm:text-[1.75rem] text-[var(--color-text-primary)] mb-2 text-balance"
        style={{ fontFamily: 'var(--font-family-serif)' }}
      >
        {title}
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed text-balance">
        {description}
      </p>
    </div>
  );
}

/**
 * 选项卡片组件
 */
function OptionCard({ option, isSelected, onClick, showIntro = false, isLocked = false }) {
  const { t } = useTranslation();
  const Icon = option.icon;
  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`ui-card-primary w-full flex items-start gap-3 p-4 transition-all duration-200 border-2 text-left ${
        isLocked
          ? 'bg-white/20 border-transparent opacity-50 cursor-not-allowed'
          : isSelected
          ? 'bg-white border-[var(--color-brand)] shadow-[0_12px_24px_rgba(120,113,108,0.08)]'
          : 'bg-white/45 border-transparent hover:bg-white/60'
      }`}
      style={{ minHeight: '80px' }}
    >
      <div className={`ui-card-tertiary p-2 flex-shrink-0 ${isSelected && !isLocked ? option.iconBg : 'bg-stone-100'}`}>
        <Icon size={20} className={isSelected && !isLocked ? option.iconColor : 'text-[var(--color-text-muted)]'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium flex items-center gap-2 ${isSelected && !isLocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
          {option.label}
          {isLocked && (
            <span className="ui-chip text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 font-normal">{t('menu.requirePrev')}</span>
          )}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {option.desc}
        </div>
        {showIntro && isSelected && !isLocked && option.intro && (
          <div className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            {option.intro}
          </div>
        )}
        {showIntro && isSelected && !isLocked && option.audience && (
          <div className="text-xs text-[var(--color-brand)] mt-1">
            {option.audience}
          </div>
        )}
      </div>
      {isSelected && !isLocked && (
        <div className="ui-chip w-5 h-5 bg-[var(--color-brand)] flex items-center justify-center flex-shrink-0 mt-1">
          <div className="ui-chip w-2 h-2 bg-white" />
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
  factorId: 'sprite-garden',
};

export default function MenuScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 当前步骤（1=记忆模式, 2=时间节奏, 3=记忆难度）
  const [step, setStep] = useState(1);
  // 步骤切换动画方向
  const [slideDir, setSlideDir] = useState('forward');
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
    const gameMode = GAME_MODE_TYPES.find((m) => m.id === selectedGameMode);
    const timeMode = TIME_MODES.find((m) => m.id === selectedTimeMode);
    const n = selectedN;
    const sp = timeMode.speedProfile;

    return {
      ...DEFAULTS,
      modeId: gameMode.modeId,
      n,
      warmupTrials: n,
      totalTurns: 14 + n * 2,
      speed: sp.visible + sp.fadeIn + sp.fadeOut + sp.gap,
      speedProfile: sp,
      waitingForInput: timeMode.waitingForInput,
      timed: timeMode.timed || false,
      timeLimit: timeMode.timeLimit || 0,
      id: `${gameMode.id}-${timeMode.id}-n${n}`,
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

  /**
   * 获取翻译后的游戏模式列表
   * @param {Function} t - i18n 翻译函数
   * @returns {Array} 包含翻译文本的游戏模式配置数组
   */
  const gameModeTypes = useMemo(() => GAME_MODE_TYPES.map((m) => ({
    ...m,
    label: t(`modes.${m.modeId}.label`),
    desc: t(`modes.${m.modeId}.desc`),
    intro: t(`modes.${m.modeId}.intro`),
    audience: t(`modes.${m.modeId}.audience`),
  })), [t]);

  /**
   * 获取翻译后的时间节奏列表
   * @param {Function} t - i18n 翻译函数
   * @returns {Array} 包含翻译文本的时间节奏配置数组
   */
  const timeModes = useMemo(() => TIME_MODES.map((m) => ({
    ...m,
    label: t(`rhythms.${m.id}.label`),
    desc: t(`rhythms.${m.id}.desc`),
    intro: t(`rhythms.${m.id}.intro`),
    audience: t(`rhythms.${m.id}.audience`),
  })), [t]);

  /**
   * 获取翻译后的N值难度描述
   * @param {Function} t - i18n 翻译函数
   * @returns {Object} 包含翻译文本的N值难度配置对象
   */
  const nDescriptions = useMemo(() => {
    const result = {};
    [1, 2, 3, 4].forEach((n) => {
      const base = N_DESCRIPTIONS[n];
      result[n] = {
        ...base,
        title: t(`difficulties.n${n}.title`),
        desc: t(`difficulties.n${n}.desc`),
        detail: t(`difficulties.n${n}.detail`),
      };
    });
    return result;
  }, [t]);

  // 当前选中的模式和节奏（使用翻译后的版本）
  const currentGameMode = gameModeTypes.find((m) => m.id === selectedGameMode);
  const currentTimeMode = timeModes.find((m) => m.id === selectedTimeMode);
  const startCtaText = t('menu.startWalk');

  /**
   * 把"模式 + 节奏 + N 值档位名（入门/日常/进阶/挑战）"拼成主 CTA 内部的小字副标题
   * 示例：散步 · 初晨 · 入门 ｜ 晨跑 · 60s 冲刺 · 进阶
   * 目的：方案L「禅意首屏」只保留1个主 CTA，把所有配置信息写进按钮正文里，
   *       儿童老人不用再单独理解 Tab 或配置卡，点按钮前能看到自己要玩什么。
   */
  const ctaSubText = useMemo(() => {
    const nLabel = nDescriptions?.[selectedN]?.title ?? `N=${selectedN}`;
    return [
      currentGameMode?.label ?? t('modes.walk.label'),
      currentTimeMode?.label ?? t('rhythms.walk.label'),
      ...(currentTimeMode?.id === 'timed' ? [t('rhythms.timed.desc')] : []),
      nLabel,
    ].join(' · ');
  }, [currentGameMode, currentTimeMode, selectedN, nDescriptions, t]);

  // 花园等级
  const growthPoints = useGardenStore((s) => s.growthPoints);
  const totalWalks = useGardenStore((s) => s.totalWalks);
  const gardenLevel = useMemo(() => computeLevel(growthPoints), [growthPoints]);

  // 计算已解锁的模式和N值（用于渐进解锁）
  const unlockStats = useMemo(() => {
    const sessions = useStatsStore.getState().sessions;
    const completedModes = new Set();
    const completedNs = new Set();
    sessions.forEach((s) => {
      if (s.completed !== false) {
        completedModes.add(s.modeId || s.mode || 'walk');
        completedNs.add(s.difficulty || s.n || 1);
      }
    });
    // 始终解锁基本内容
    completedModes.add('walk');
    completedNs.add(1);
    return { completedModes, completedNs };
  }, []);

  // 快速开始视图（回归用户）
  if (showQuickStart) {
    return (
      <div className="ui-page-shell ui-page-shell-centered relative overflow-hidden">
        {/* 花园背景装饰 */}
        {ENABLE_GARDEN_BACKGROUND && <GardenBackground />}

        {/* 前景内容 — 方案L「禅意极简」V3：主按钮下方 改配置 + 底部3个次级快捷入口（花园日记/收藏/设置）展开平铺 */}
        <div className="ui-page-narrow relative z-10 flex flex-col items-center justify-between min-h-[90vh] sm:min-h-[86vh] py-8 sm:py-10">

          {/* 上半：标题 + 主CTA + 改配置，集中注意力 */}
          <div className="w-full flex flex-col items-center justify-center gap-8 sm:gap-12 mt-8 sm:mt-10">
            {/* 3行纯展示文字（没有任何容器/胶囊/阴影，不会被误认为按钮，老人小孩不瞎点）*/}
            <div className="ui-heading-block flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Sun size={14} className="text-orange-400" />
                <span>{t('menu.welcomeBack')}</span>
              </div>
              {/* 首页鼓励文案：保持温和、陪伴式语气，避免和主按钮“继续训练”产生动作语义重复 */}
              <h2
                className="text-[2rem] sm:text-[2rem] tracking-tight text-[var(--color-text-primary)]"
                style={{ fontFamily: 'var(--font-family-serif)' }}
              >
                {t('menu.continueWalk')}
              </h2>
              {/* 去掉花园图标，只保留纯文字居中，减少视觉噪声 */}
              <div className="flex items-center justify-center pt-1">
                <span className="text-sm text-[var(--color-text-muted)]">
                  {t('menu.gardenLevel', { level: gardenLevel.name })}
                  {totalWalks > 0 && <span> · {t('menu.walkCount', { count: totalWalks })}</span>}
                </span>
              </div>
            </div>

            {/* 主CTA（唯一高饱和大按钮）+ 下方 改配置 胶囊按钮
              主CTA：两行，上大下小（大标题「继续训练」/ 小标题「散步 · 晨跑 60s冲刺 · 入门」）
            */}
            <div className="w-full sm:w-auto flex flex-col items-center gap-8">
              <button
                onClick={handleQuickStart}
                aria-label={`${startCtaText} · ${ctaSubText}`}
                data-testid="menu-start-button"
                className="group ui-btn-base ui-btn-primary w-full sm:w-auto transition-all transform hover:scale-[1.03] active:scale-[0.98] active:translate-y-[1px] animate-glow-pulse focus:outline-none focus:ring-4 focus:ring-[var(--color-brand)] focus:ring-offset-2 focus:ring-opacity-40"
                style={{
                  fontFamily: 'var(--font-family-serif)',
                  minHeight: '84px',
                  paddingLeft: '52px',
                  paddingRight: '52px',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Wind size={22} />
                    <span className="text-2xl sm:text-3xl font-semibold">{startCtaText}</span>
                  </div>
                  {/* 配置说明小字：散步 · 晨跑 · 60s冲刺 · 入门 */}
                  <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs sm:text-sm text-white/80 font-medium tracking-wide">
                    <Eye size={12} />
                    <span>{currentGameMode?.label ?? t('modes.walk.label')}</span>
                    <span aria-hidden>·</span>
                    <Timer size={12} />
                    <span>{currentTimeMode?.label ?? t('rhythms.walk.label')}</span>
                    {currentTimeMode?.id === 'timed' && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="text-white/80">{t('rhythms.timed.desc')}</span>
                      </>
                    )}
                    <span aria-hidden>·</span>
                    <span className="font-semibold text-white/90">
                      {nDescriptions?.[selectedN]?.title ?? `N=${selectedN}`}
                    </span>
                  </div>
                </div>
              </button>

              {/* 主按钮下方：改配置 居中胶囊按钮，次级按钮配色（米白底描边=图3的浅色），不再左右跳视觉更稳 */}
              <div className="w-full flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSwitchToWizard}
                  aria-label={t('menu.customizeConfig')}
                  title={t('menu.customizeConfig')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-300/80 bg-stone-50/90 text-[11px] sm:text-xs text-[var(--color-text-secondary)] shadow-[0_4px_12px_rgba(120,113,108,0.12)] hover:bg-white hover:border-stone-400 hover:text-[var(--color-text-primary)] active:scale-[0.97] active:translate-y-[1px] transition-all focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2"
                  style={{ minWidth: '110px', minHeight: '42px', padding: '8px 18px' }}
                >
                  <Settings size={13} />
                  <span>{t('menu.customizeConfig')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 底部：3个次级快捷入口 平铺展开（次级按钮配色=米白底描边，对应图3的浅色二级按钮）
            原来藏在 ActionSheet 弹窗里的 花园日记/花园收藏/设置 直接铺在底部，老人小孩不用再点开「...」
          */}
          <div className="w-full mt-auto pt-10 sm:pt-12 pb-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto">
              <button
                onClick={() => navigate('/stats')}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-2 py-4 hover:bg-white hover:border-stone-300 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2 shadow-[0_4px_14px_rgba(120,113,108,0.08)]"
                style={{ minHeight: '84px' }}
              >
                <BarChart3 size={20} className="text-[var(--color-brand)]" />
                <span className="text-[11px] sm:text-xs font-medium">{t('menu.gardenDiary')}</span>
              </button>
              <button
                onClick={() => navigate('/achievements')}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-2 py-4 hover:bg-white hover:border-stone-300 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2 shadow-[0_4px_14px_rgba(120,113,108,0.08)]"
                style={{ minHeight: '84px' }}
              >
                <Award size={20} className="text-[var(--color-brand)]" />
                <span className="text-[11px] sm:text-xs font-medium">{t('menu.gardenCollection')}</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-2 py-4 hover:bg-white hover:border-stone-300 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2 shadow-[0_4px_14px_rgba(120,113,108,0.08)]"
                style={{ minHeight: '84px' }}
              >
                <Settings size={20} className="text-[var(--color-brand)]" />
                <span className="text-[11px] sm:text-xs font-medium">{t('menu.settings')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 三步引导视图
  return (
    <div className="ui-page-shell relative">
      <div className="ui-page-frame">
        <div className="ui-page-narrow ui-section-stack pt-6 sm:pt-8">
          {/* 顶层返回统一为图标按钮，和其他页面保持一致。 */}
          <div className="mb-4 sm:mb-6">
            <BackIconButton
              onClick={() => setShowQuickStart(true)}
              ariaLabel={t('menu.backToGarden')}
            />
          </div>

          {/* 步骤指示器 */}
          <StepIndicator currentStep={step} totalSteps={3} />

          {/* 步骤 1：记忆模式 */}
          {step === 1 && (
            <div className={`flex-1 flex flex-col ${slideDir === 'forward' ? 'animate-slide-forward-enter' : 'animate-slide-back-enter'}`}>
              <StepHeader title={t('menu.selectMode')} description={t('menu.selectModeDesc')} />

              <div className="flex-1 space-y-3 overflow-y-auto">
                {gameModeTypes.map((mode) => {
                  const locked = !isModeUnlocked(mode, unlockStats);
                  return (
                    <OptionCard
                      key={mode.id}
                      option={mode}
                      isSelected={selectedGameMode === mode.id}
                      onClick={() => { if (!locked) { setSelectedGameMode(mode.id); persistSelection('gameMode', mode.id); } }}
                      showIntro
                      isLocked={locked}
                    />
                  );
                })}
              </div>

              <button
                onClick={() => { setSlideDir('forward'); setStep(2); }}
                className="ui-btn-base ui-btn-primary mt-4 w-full py-4 text-lg flex items-center justify-center gap-2"
              >
                {t('menu.nextStepRhythm')}
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* 步骤 2：时间节奏 */}
          {step === 2 && (
            <div className={`flex-1 flex flex-col ${slideDir === 'forward' ? 'animate-slide-forward-enter' : 'animate-slide-back-enter'}`}>
              <StepHeader title={t('menu.selectRhythm')} description={t('menu.selectRhythmDesc')} />

              <div className="flex-1 space-y-3 overflow-y-auto">
                {timeModes.map((mode) => (
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
                  onClick={() => { setSlideDir('back'); setStep(1); }}
                  className="ui-btn-base ui-btn-neutral flex-1 py-4 text-lg flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  {t('menu.prevStep')}
                </button>
                <button
                  onClick={() => { setSlideDir('forward'); setStep(3); }}
                  className="ui-btn-base ui-btn-primary flex-[2] py-4 text-lg flex items-center justify-center gap-2"
                >
                  {t('menu.nextStepDifficulty')}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* 步骤 3：记忆难度 */}
          {step === 3 && (
            <div className={`flex-1 flex flex-col ${slideDir === 'forward' ? 'animate-slide-forward-enter' : 'animate-slide-back-enter'}`}>
              <StepHeader title={t('menu.selectDifficulty')} description={t('menu.selectDifficultyDesc')} />

              <div className="flex-1 space-y-3 overflow-y-auto">
                {[1, 2, 3, 4].map((nVal) => {
                  const desc = nDescriptions[nVal];
                  const nLocked = !isNUnlocked(nVal, unlockStats.completedNs);
                  return (
                    <button
                      key={nVal}
                      onClick={nLocked ? undefined : () => { setSelectedN(nVal); persistSelection('n', nVal); }}
                      disabled={nLocked}
                      className={`ui-card-primary w-full flex items-start gap-3 p-4 transition-all duration-200 border-2 text-left ${
                        nLocked
                          ? 'bg-white/20 border-transparent opacity-50 cursor-not-allowed'
                          : selectedN === nVal
                          ? 'bg-white border-[var(--color-brand)] shadow-[0_12px_24px_rgba(120,113,108,0.08)]'
                          : 'bg-white/45 border-transparent hover:bg-white/60'
                      }`}
                      style={{ minHeight: '80px' }}
                    >
                      <div className={`ui-card-tertiary w-10 h-10 flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        nLocked ? 'bg-stone-100 text-stone-300' : selectedN === nVal ? 'bg-[var(--color-brand)] text-white' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {desc.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium flex items-center gap-2 ${!nLocked && selectedN === nVal ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                          {desc.title}
                          {nLocked && (
                            <span className="ui-chip text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 font-normal">{t('menu.requirePrevN', { n: desc.unlockRequirement })}</span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {desc.desc}
                        </div>
                        {!nLocked && selectedN === nVal && (
                          <div className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                            {desc.detail}
                          </div>
                        )}
                      </div>
                      {!nLocked && selectedN === nVal && (
                        <div className="ui-chip w-5 h-5 bg-[var(--color-brand)] flex items-center justify-center flex-shrink-0 mt-1">
                          <div className="ui-chip w-2 h-2 bg-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => { setSlideDir('back'); setStep(2); }}
                  className="ui-btn-base ui-btn-neutral flex-1 py-4 text-lg flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  {t('menu.prevStep')}
                </button>
                <button
                  onClick={handleStart}
                  aria-label={startCtaText}
                  data-testid="menu-start-button"
                  className="ui-btn-base ui-btn-primary flex-[2] py-4 text-lg flex items-center justify-center gap-2 animate-glow-pulse active:animate-button-press"
                  style={{ fontFamily: 'var(--font-family-serif)', fontSize: '20px' }}
                >
                  <Wind className="animate-pulse" size={20} />
                  {startCtaText}
                </button>
              </div>
            </div>
          )}

          {/* 底部入口（仅第一步显示） */}
          {step === 1 && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-2">
              <button
                onClick={() => navigate('/stats')}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                <BarChart3 size={16} /> {t('menu.gardenDiary')}
              </button>
              <button
                onClick={() => navigate('/achievements')}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                <Award size={16} /> {t('menu.gardenCollection')}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                <Settings size={16} /> {t('menu.settings')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
