/**
 * 空间布局 — 空间模式
 * 全屏网格布局，多个位置同时显示花朵
 * 支持 1/2/3 个位置-花朵对
 *
 * @param {Object} props
 * @param {Object} props.stimulus - 刺激对象
 * @param {boolean} props.showStimulus - 是否显示刺激
 * @param {boolean} props.isWarmupPhase - 是否热身阶段
 */
import React from 'react';
import WarmupFlowerTimer from '@components/WarmupFlowerTimer';

export default function SpatialLayout({
  stimulus,
  showStimulus,
  isWarmupPhase,
  showFlowerTimer,
  flowerCount,
  visibleDuration,
  proceedWarmup,
  warmupText,
}) {
  const pairs = stimulus?.value || [];
  const gridSize = stimulus?.meta?.gridSize || 3;

  // 构建位置-花朵映射
  const cellMap = {};
  pairs.forEach(pair => {
    const key = `${pair.position.row}-${pair.position.col}`;
    cellMap[key] = pair.flower;
  });

  // 生成网格单元格
  const cells = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const key = `${row}-${col}`;
      const flower = cellMap[key];
      const hasFlower = !!flower;

      cells.push(
        <div
          key={key}
          className={`
            flex items-center justify-center rounded-xl transition-all duration-300
            ${hasFlower
              ? 'bg-white/80'
              : 'bg-white/40'
            }
          `}
          style={{
            aspectRatio: '1',
          }}
        >
          {showStimulus && hasFlower && (
            <span className="text-4xl sm:text-5xl filter drop-shadow-sm select-none leading-none">
              {flower}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
      {/* 暖身提示 */}
      <div className={`mb-6 text-center ${isWarmupPhase && showStimulus ? '' : 'invisible'}`}>
        <p className="text-sm text-[var(--color-text-muted)] bg-white/60 px-4 py-2 rounded-full">
          {warmupText || '记住位置和花朵'}
        </p>
      </div>

      {/* 网格容器 */}
      <div className="w-full max-w-xs sm:max-w-sm">
        <div
          className="grid gap-2 p-4 bg-white/40 rounded-2xl shadow-lg backdrop-blur-sm"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {cells}
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
