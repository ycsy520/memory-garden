/**
 * 双通道布局 — 双通道模式
 * 上下分层布局，上方显示视觉刺激，下方显示听觉刺激
 *
 * @param {Object} props
 * @param {Object} props.stimulus - 刺激对象
 * @param {boolean} props.showStimulus - 是否显示刺激
 * @param {boolean} props.isWarmupPhase - 是否热身阶段
 */
import React from 'react';
import WarmupFlowerTimer from '@components/WarmupFlowerTimer';
import MandalaLoader from '@components/MandalaLoader';

export default function DualLayout({
  stimulus,
  showStimulus,
  isWarmupPhase,
  showFlowerTimer,
  flowerCount,
  visibleDuration,
  proceedWarmup,
  warmupText,
}) {
  const visualValue = stimulus?.value?.visual?.value || '?';
  // 显示音符名（如 'Do'），而不是频率数字（如 261.63）
  const audioName = stimulus?.value?.audio?.meta?.name || '?';
  const audioIcon = stimulus?.value?.audio?.meta?.icon || '🎵';

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
      {/* 暖身提示 */}
      <div className={`mb-6 text-center ${isWarmupPhase && showStimulus ? '' : 'invisible'}`}>
        <p className="text-sm text-[var(--color-text-muted)] bg-white/60 px-4 py-2 rounded-full">
          {warmupText || '看看+听听'}
        </p>
      </div>

      {/* 刺激容器 */}
      <div className="flex flex-col items-center gap-8">
        {/* 视觉刺激 */}
        <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-white/60 rounded-3xl shadow-lg backdrop-blur-sm">
          {showStimulus && (
            <span className="text-8xl sm:text-9xl filter drop-shadow-md select-none leading-none animate-bloom">
              {visualValue}
            </span>
          )}
        </div>

        {/* 听觉刺激 */}
        <div className="flex items-center gap-3 px-6 py-3 bg-white/60 rounded-full shadow-md backdrop-blur-sm">
          <span className="text-2xl">{audioIcon}</span>
          <span className="text-lg font-medium text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-family-mono)' }}>
            {showStimulus ? audioName : <MandalaLoader size={24} />}
          </span>
        </div>
      </div>

      {/* 小花倒计时 */}
      <div className="mt-8">
        <WarmupFlowerTimer
          isActive={showFlowerTimer}
          flowerCount={flowerCount}
          durationMs={visibleDuration}
          onComplete={isWarmupPhase ? proceedWarmup : undefined}
        />
      </div>
    </div>
  );
}
