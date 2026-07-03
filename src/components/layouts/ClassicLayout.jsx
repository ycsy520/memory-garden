/**
 * 经典布局 — 散步/标准模式
 * 卡片式布局，刺激在卡片内居中显示
 *
 * @param {Object} props
 * @param {Object} props.stimulus - 刺激对象
 * @param {boolean} props.showStimulus - 是否显示刺激
 * @param {boolean} props.isWarmupPhase - 是否热身阶段
 */
import React from 'react';
import WarmupFlowerTimer from '@components/WarmupFlowerTimer';
import MandalaLoader from '@components/MandalaLoader';

export default function ClassicLayout({
  stimulus,
  showStimulus,
  isWarmupPhase,
  showFlowerTimer,
  flowerCount,
  visibleDuration,
  proceedWarmup,
  warmupText,
}) {
  const value = stimulus?.value || '?';
  const displayValue = typeof value === 'string' ? value : '?';

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
      {/* 暖身提示 */}
      <div className={`mb-4 text-center ${isWarmupPhase && showStimulus ? '' : 'invisible'}`}>
        <p className="text-sm text-[var(--color-text-muted)] bg-white/60 px-4 py-2 rounded-full">
          {warmupText || '先看看，熟悉一下'}
        </p>
      </div>

      {/* 卡片容器 */}
      <div className="relative mb-8 sm:mb-12">
        <div className="w-56 h-72 sm:w-64 sm:h-80 bg-white p-4 pb-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm flex flex-col items-center justify-center border-8 border-white">
          {/* 卡夹装饰 */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-100/80 rotate-2 shadow-sm z-20" />

          {/* 等待态遮罩 */}
          {!showStimulus && (
            <div className="absolute inset-4 bg-stone-100/80 z-20 flex items-center justify-center">
            <MandalaLoader size={40} />
          </div>
          )}

          {/* 刺激内容 */}
          <div className="flex-1 flex items-center justify-center w-full bg-stone-50/50 rounded-sm overflow-hidden relative min-h-28 sm:min-h-32">
            {showStimulus && (
              <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <span className="text-8xl sm:text-9xl filter drop-shadow-md select-none leading-none">
                  {displayValue}
                </span>
              </div>
            )}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-stone-900/5" />
          </div>

          {/* 小花倒计时 */}
          <WarmupFlowerTimer
            isActive={showFlowerTimer}
            flowerCount={flowerCount}
            durationMs={visibleDuration}
            onComplete={isWarmupPhase ? proceedWarmup : undefined}
          />
        </div>
      </div>
    </div>
  );
}
