/**
 * 栅格布局 — 栅格模式
 * 全屏栅格布局，格子之间有线条分隔
 *
 * @param {Object} props
 * @param {Object} props.stimulus - 刺激对象
 * @param {boolean} props.showStimulus - 是否显示刺激
 * @param {boolean} props.isWarmupPhase - 是否热身阶段
 */
import React from 'react';
import WarmupFlowerTimer from '@components/WarmupFlowerTimer';

export default function GridLayout({
  stimulus,
  showStimulus,
  isWarmupPhase,
  showFlowerTimer,
  flowerCount,
  visibleDuration,
  proceedWarmup,
  warmupText,
}) {
  const grid = stimulus?.value;
  const cols = stimulus?.meta?.cols || 2;
  const rows = stimulus?.meta?.rows || 2;

  // 生成栅格单元格
  const cells = [];
  if (Array.isArray(grid)) {
    grid.forEach((cell, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const isLastRow = row === rows - 1;
      const isLastCol = col === cols - 1;

      cells.push(
        <div
          key={index}
          className={`
            flex items-center justify-center p-4
            ${!isLastRow ? 'border-b-2 border-stone-200' : ''}
            ${!isLastCol ? 'border-r-2 border-stone-200' : ''}
          `}
          style={{
            aspectRatio: '1',
          }}
        >
          {showStimulus && (
            <span className="text-5xl sm:text-6xl filter drop-shadow-md select-none leading-none">
              {cell.value}
            </span>
          )}
        </div>
      );
    });
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
      {/* 暖身提示 */}
      <div className={`mb-6 text-center ${isWarmupPhase && showStimulus ? '' : 'invisible'}`}>
        <p className="text-sm text-[var(--color-text-muted)] bg-white/60 px-4 py-2 rounded-full">
          {warmupText || '记住图案'}
        </p>
      </div>

      {/* 栅格容器 */}
      <div className="w-full max-w-xs sm:max-w-sm">
        <div className="bg-white/60 rounded-2xl shadow-lg p-3 backdrop-blur-sm">
          <div
            className="grid bg-white rounded-xl overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {cells}
          </div>
        </div>
      </div>

      {/* 小花倒计时 */}
      <div className="mt-6">
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
