/**
 * 因子精灵图渲染组件
 * 从 public/img/g.png（6×6 精灵图）中裁切对应格子渲染因子图案。
 *
 * 背景协调策略：
 * 精灵图每格自带 rgb(241,240,236) 轻微纹理暖纸色背景（见 --color-sprite-bg），
 * 主舞台展示区内衬使用该同色，使方形边界融入背景；
 * 小尺寸场景（空间/栅格/双通道）使用圆角小卡形态，呈现为刻意的"纸片小卡"。
 *
 * @version 6.0
 */
import React, { memo } from 'react';

/** 精灵图资源路径（public 目录，PWA 预缓存） */
const SPRITE_SHEET_SRC = '/img/g.png';
/** 精灵图列数 */
const SPRITE_COLS = 6;
/** 精灵图行数 */
const SPRITE_ROWS = 6;

/**
 * 裁切渲染精灵图单个格子
 * @param {{ index: number, className?: string, style?: React.CSSProperties }} props
 * @returns {JSX.Element}
 */
const FactorSprite = memo(function FactorSprite({ index, className = '', style }) {
  const col = index % SPRITE_COLS;
  const row = Math.floor(index / SPRITE_COLS);
  // CSS 背景百分比定位公式：pos = cell / (cells - 1) * 100
  const posX = (col / (SPRITE_COLS - 1)) * 100;
  const posY = (row / (SPRITE_ROWS - 1)) * 100;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: `url(${SPRITE_SHEET_SRC})`,
        backgroundSize: `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    />
  );
});

export default FactorSprite;
