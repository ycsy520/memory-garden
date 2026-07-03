/**
 * 模式引导屏 — 每种游戏模式的可视化教程
 * 设计原则: 花园隐喻 + 3步教会 + 动画演示 + 一句话总结
 * 
 * @version 3.3
 * @author Memory Garden Team
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Eye, Ear, MapPin, Grid3x3, Heart } from 'lucide-react';
import AudioService from '@services/AudioService';

/** 花朵 emoji 池 */
const FLOWERS = ['🌹', '🌻', '🌷', '🌼', '🌺', '🪷'];

/**
 * 标准模式动画演示
 * 展示: 花朵依次出现 → 重复的花 → 按按钮
 */
function StandardDemo() {
  const [phase, setPhase] = useState(0); // 0: 第一朵, 1: 第二朵, 2: 重复出现, 3: 按钮亮起
  const flowers = useMemo(() => ['🌹', '🌻', '🌹'], []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(0), 3600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 花朵序列 */}
      <div className="flex items-center gap-3">
        {flowers.map((f, i) => (
          <div key={i} className="relative">
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-500
              ${i <= phase ? 'opacity-100 scale-100 bg-white shadow-md' : 'opacity-0 scale-50 bg-stone-100'}
              ${i === 2 && phase >= 2 ? 'ring-4 ring-amber-300 ring-offset-2' : ''}
            `}>
              {f}
            </div>
            {i < 2 && i <= phase && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-stone-300 text-xs">→</div>
            )}
          </div>
        ))}
      </div>

      {/* 按钮提示 */}
      {phase >= 3 && (
        <div className="flex items-center gap-2 bg-[var(--color-brand)] text-white px-4 py-2 rounded-full text-sm animate-bounce">
          <Heart size={16} className="fill-white" />
          <span>似曾相识！</span>
        </div>
      )}

      {/* 说明文字 */}
      <p className="text-sm text-stone-500 text-center mt-2">
        {phase < 2 ? '花儿一朵接一朵绽放...' : phase < 3 ? '这朵花刚才见过！' : '按下按钮！'}
      </p>
    </div>
  );
}

/**
 * 双通道模式动画演示
 * 展示: 花朵 + 声音同时出现，两个都要匹配
 */
function DualDemo() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 双通道展示 */}
      <div className="flex items-center gap-6">
        {/* 视觉通道 */}
        <div className="flex flex-col items-center gap-2">
          <Eye size={20} className="text-blue-400" />
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500
            ${phase >= 1 ? 'opacity-100 scale-100 bg-white shadow-md' : 'opacity-0 scale-50'}
            ${phase >= 2 ? 'ring-3 ring-blue-300' : ''}
          `}>
            🌹
          </div>
          <span className="text-xs text-blue-500">眼睛</span>
        </div>

        <span className="text-2xl text-stone-300">+</span>

        {/* 听觉通道 */}
        <div className="flex flex-col items-center gap-2">
          <Ear size={20} className="text-purple-400" />
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500
            ${phase >= 1 ? 'opacity-100 scale-100 bg-purple-50 shadow-md' : 'opacity-0 scale-50'}
            ${phase >= 2 ? 'ring-3 ring-purple-300' : ''}
          `}>
            🎵
          </div>
          <span className="text-xs text-purple-500">耳朵</span>
        </div>
      </div>

      {/* 匹配提示 */}
      {phase >= 3 && (
        <div className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-full text-sm animate-bounce">
          <span>花和声音都一样！</span>
        </div>
      )}

      <p className="text-sm text-stone-500 text-center mt-2">
        {phase < 2 ? '同时记住花的样子和声音...' : phase < 3 ? '花和声音都和刚才一样！' : '两个都对才算对！'}
      </p>
    </div>
  );
}

/**
 * 空间模式动画演示
 * 展示: 花出现在网格的某个位置 → 又出现在同一位置
 */
function SpatialDemo() {
  const [phase, setPhase] = useState(0);
  const gridSize = 3;
  const targetPos = { row: 1, col: 1 }; // 中间位置

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${gridSize}, 48px)` }}>
        {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
          const row = Math.floor(idx / gridSize);
          const col = idx % gridSize;
          const isFirst = phase >= 1 && row === targetPos.row && col === targetPos.col;
          const isSecond = phase >= 2 && row === targetPos.row && col === targetPos.col;

          return (
            <div
              key={idx}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300
                ${isSecond ? 'bg-green-100 ring-2 ring-green-400' : isFirst ? 'bg-amber-100 ring-2 ring-amber-300' : 'bg-stone-100'}
              `}
            >
              {(isFirst || isSecond) && <span className="text-xl">🌸</span>}
            </div>
          );
        })}
      </div>

      {phase >= 3 && (
        <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm animate-bounce">
          <MapPin size={16} />
          <span>位置一样！</span>
        </div>
      )}

      <p className="text-sm text-stone-500 text-center mt-2">
        {phase < 2 ? '记住花出现在哪里...' : phase < 3 ? '又开在同一个地方！' : '位置相同就按按钮！'}
      </p>
    </div>
  );
}

/**
 * 栅格模式动画演示
 * 展示: 网格中多朵花同时亮起 → 暗掉 → 判断对错
 */
function GridDemo() {
  const [phase, setPhase] = useState(0);
  const cols = 2;
  const flowers = ['🌹', '🌻', '🌷', '🌼'];

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 48px)` }}>
        {flowers.map((f, idx) => (
          <div
            key={idx}
            className={`
              w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all duration-500
              ${phase >= 1 && phase < 2 ? 'bg-purple-50 shadow-md scale-105' : ''}
              ${phase >= 2 ? 'bg-stone-200' : ''}
              ${phase < 1 ? 'bg-stone-100' : ''}
            `}
          >
            {phase >= 1 && phase < 2 ? f : phase >= 2 ? '❓' : ''}
          </div>
        ))}
      </div>

      {phase >= 3 && (
        <div className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-full text-sm animate-bounce">
          <Grid3x3 size={16} />
          <span>记住位置了吗？</span>
        </div>
      )}

      <p className="text-sm text-stone-500 text-center mt-2">
        {phase < 2 ? '快速记住所有花的位置...' : phase < 3 ? '花藏起来了！' : '判断：刚才这里有没有花？'}
      </p>
    </div>
  );
}

/** 模式配置 */
const MODE_CONFIGS = {
  standard: {
    icon: Eye,
    color: 'green',
    title: '似曾相识',
    subtitle: '标准模式',
    oneLiner: '这朵花，刚才见过吗？',
    steps: [
      { emoji: '👀', title: '看', desc: '花儿一朵一朵绽放' },
      { emoji: '🧠', title: '记', desc: '记住刚才那朵花的样子' },
      { emoji: '👆', title: '按', desc: '如果和之前那朵一样，就按「似曾相识」' },
    ],
    Demo: StandardDemo,
  },
  dual: {
    icon: Ear,
    color: 'purple',
    title: '花与歌',
    subtitle: '双通道模式',
    oneLiner: '花和声音，都和刚才一样吗？',
    steps: [
      { emoji: '👀', title: '看+听', desc: '同时记住花的样子和声音' },
      { emoji: '🧠', title: '记', desc: '两个都要记住哦' },
      { emoji: '👆', title: '按', desc: '花和声音都一样，才按按钮' },
    ],
    Demo: DualDemo,
  },
  spatial: {
    icon: MapPin,
    color: 'blue',
    title: '花在哪儿',
    subtitle: '空间模式',
    oneLiner: '这朵花，刚才也是开在这里吗？',
    steps: [
      { emoji: '👀', title: '看', desc: '花在花园的某个位置绽放' },
      { emoji: '🧠', title: '记', desc: '记住花开在哪个格子里' },
      { emoji: '👆', title: '按', desc: '位置和之前一样，就按按钮' },
    ],
    Demo: SpatialDemo,
  },
  grid: {
    icon: Grid3x3,
    color: 'amber',
    title: '记忆快照',
    subtitle: '栅格模式',
    oneLiner: '记住花的位置，对还是错？',
    steps: [
      { emoji: '📸', title: '快看', desc: '很多花同时亮起，像拍照片' },
      { emoji: '🧠', title: '记', desc: '快速记住每朵花的位置' },
      { emoji: '👆', title: '按', desc: '判断：和刚才看到的一样吗？' },
    ],
    Demo: GridDemo,
  },
};

export default function ModeGuideScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeId = searchParams.get('mode') || 'standard';
  const [step, setStep] = useState(0);

  const modeConfig = MODE_CONFIGS[modeId] || MODE_CONFIGS.standard;
  const { icon: ModeIcon, title, subtitle, oneLiner, steps, Demo } = modeConfig;

  const totalSteps = 5;

  const handleNext = () => {
    AudioService.init();
    AudioService.resume();
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      // 引导完成，进入游戏
      navigate(`/menu?startMode=${modeId}`);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 animate-fade-in bg-white/40 backdrop-blur-sm">
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl max-w-sm w-full min-h-[480px] flex flex-col items-center text-center relative border-4 border-white">

        {/* 步骤指示器 */}
        <div className="flex gap-2 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-stone-600' : i < step ? 'w-2 bg-stone-400' : 'w-2 bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* 模式标题 */}
        <div className="flex items-center gap-2 mb-6">
          <ModeIcon size={20} className="text-stone-400" />
          <span className="text-sm text-stone-400">{subtitle}</span>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Step 0: 一句话总结 */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-5xl mb-4">
                {modeId === 'standard' ? '🌹' : modeId === 'dual' ? '🌹🎵' : modeId === 'spatial' ? '📍🌸' : '📸'}
              </div>
              <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'var(--font-family-serif)' }}>
                {title}
              </h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                {oneLiner}
              </p>
            </div>
          )}

          {/* Steps 1-3: 三步教学 */}
          {step >= 1 && step <= 3 && (
            <div className="space-y-6 animate-fade-in" key={step}>
              <div className="text-6xl mb-2">
                {steps[step - 1].emoji}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'var(--font-family-serif)' }}>
                  {steps[step - 1].title}
                </h2>
                <p className="text-lg text-stone-600 leading-relaxed">
                  {steps[step - 1].desc}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: 动画演示 */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-stone-700">来看看怎么玩：</h3>
              <Demo />
            </div>
          )}
        </div>

        {/* 导航按钮 */}
        <div className="w-full flex justify-between mt-6 pt-4 border-t border-stone-100">
          <button
            onClick={handlePrev}
            className={`text-stone-400 px-4 py-3 hover:text-stone-600 transition-colors flex items-center gap-1 ${
              step === 0 ? 'opacity-0 pointer-events-none' : ''
            }`}
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <ArrowLeft size={16} />
            <span>上一步</span>
          </button>
          <button
            onClick={handleNext}
            className="bg-stone-700 text-white px-6 py-3 rounded-full hover:bg-stone-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <span>{step === totalSteps - 1 ? '开始游戏' : '下一步'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
