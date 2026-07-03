/**
 * 刺激渲染器组件 — 根据刺激类型渲染不同的 UI
 *
 * @param {Object} props
 * @param {Object} props.stimulus - 刺激对象
 * @param {boolean} props.showStimulus - 是否显示刺激
 */
import React from 'react';

/**
 * 空间模式 — 网格渲染器
 * @param {Object} props
 * @param {Object} props.position - {row, col}
 * @param {number} props.gridSize - 网格大小
 * @param {string} props.value - 刺激值（emoji）
 */
function SpatialGrid({ position, gridSize, value }) {
  const cells = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isActive = position && position.row === row && position.col === col;
      cells.push(
        <div
          key={`${row}-${col}`}
          className={`
            flex items-center justify-center rounded-lg transition-all duration-200
            ${isActive
              ? 'bg-[var(--color-brand-light)] scale-110 shadow-md'
              : 'bg-stone-100/50'
            }
          `}
          style={{
            width: `${100 / gridSize}%`,
            height: `${100 / gridSize}%`,
          }}
        >
          {isActive && (
            <span className="text-4xl sm:text-5xl filter drop-shadow-md select-none leading-none">
              {value}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div
      className="grid gap-1 w-full h-full"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {cells}
    </div>
  );
}

/**
 * 栅格模式 — 栅格渲染器
 * @param {Object} props
 * @param {Array} props.grid - 栅格数组
 * @param {number} props.cols - 列数
 * @param {number} props.rows - 行数
 */
function GridRenderer({ grid, cols, rows }) {
  if (!grid || !Array.isArray(grid)) return null;

  const cells = grid.map((cell, index) => (
    <div
      key={index}
      className="flex items-center justify-center rounded-lg bg-stone-100/50"
      style={{
        width: `${100 / cols}%`,
        height: `${100 / rows}%`,
      }}
    >
      <span className="text-3xl sm:text-4xl filter drop-shadow-md select-none leading-none">
        {cell.value}
      </span>
    </div>
  ));

  return (
    <div
      className="grid gap-1 w-full h-full"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {cells}
    </div>
  );
}

/**
 * 双通道模式 — 视觉+听觉渲染器
 * @param {Object} props
 * @param {Object} props.visual - 视觉刺激
 * @param {Object} props.audio - 听觉刺激
 */
function DualRenderer({ visual, audio }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
      <div className="flex items-center justify-center">
        <span className="text-7xl sm:text-8xl filter drop-shadow-md select-none leading-none">
          {visual?.value || '?'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <span className="text-lg">🎵</span>
        <span>{audio?.value || '...'}</span>
      </div>
    </div>
  );
}

/**
 * 默认渲染器 — 单个刺激
 * @param {Object} props
 * @param {string} props.value - 刺激值
 */
function DefaultRenderer({ value }) {
  return (
    <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
      <span className="text-8xl sm:text-9xl filter drop-shadow-md select-none leading-none">
        {value}
      </span>
    </div>
  );
}

/**
 * 刺激渲染器主组件
 * @param {Object} props
 * @param {Object} props.stimulus - 刺激对象
 * @param {boolean} props.showStimulus - 是否显示刺激
 */
export default function StimulusRenderer({ stimulus, showStimulus }) {
  if (!showStimulus || !stimulus) {
    return null;
  }

  const { type, value, position, meta } = stimulus;

  switch (type) {
    case 'spatial':
      return (
        <div className="w-40 h-40 sm:w-48 sm:h-48">
          <SpatialGrid
            position={position}
            gridSize={meta?.gridSize || 3}
            value={value}
          />
        </div>
      );

    case 'grid':
      return (
        <div className="w-40 h-40 sm:w-48 sm:h-48">
          <GridRenderer
            grid={value}
            cols={meta?.cols || 2}
            rows={meta?.rows || 2}
          />
        </div>
      );

    case 'dual':
      return (
        <DualRenderer
          visual={value?.visual}
          audio={value?.audio}
        />
      );

    default:
      // visual, emoji-flower 等
      return <DefaultRenderer value={value} />;
  }
}
