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
import { useTranslation } from 'react-i18next';
import FactorValue from '@components/FactorValue';

export default function SpatialLayout({
  stimulus,
  showStimulus,
  isWarmupPhase,
  warmupText,
}) {
  const { t } = useTranslation();
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
      // 注意：精灵图索引为 number，索引 0（蕨叶）也是有效值，不能用 !! 判断
      const hasFlower = flower != null;

      cells.push(
        <div
          key={key}
          className={`
            flex items-center justify-center rounded-xl transition-all duration-300
            min-w-[48px] min-h-[48px]
            ${hasFlower
              ? 'bg-[var(--color-sprite-bg)]'
              : 'bg-white/40'
            }
          `}
          style={{
            aspectRatio: '1',
          }}
        >
          {hasFlower && (
            <div className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showStimulus ? 'opacity-100' : 'opacity-0'}`}>
              <FactorValue
                value={flower}
                spriteClass="w-full h-full rounded-xl"
                textClass="text-4xl sm:text-5xl lg:text-6xl select-none leading-none"
              />
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center relative z-10 px-6">
      {/* 暖身提示 */}
      <div className={`mb-6 text-center ${isWarmupPhase && showStimulus ? '' : 'invisible'}`}>
        <p className="text-sm text-[var(--color-text-muted)] bg-white/60 px-4 py-2 rounded-full">
          {warmupText || t('game.warmupSpatial')}
        </p>
      </div>

      {/* 网格容器 — 响应式 */}
      <div className="w-full max-w-[min(85vw,15rem)] sm:max-w-sm lg:max-w-md mb-8 sm:mb-12">
        <div
          className="grid gap-2 lg:gap-3 p-4 lg:p-6 bg-white/40 rounded-2xl shadow-lg"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {cells}
        </div>
      </div>
    </div>
  );
}
