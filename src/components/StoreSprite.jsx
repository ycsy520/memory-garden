/**
 * 收藏精灵图组件 — 从 store.png 裁切单个收藏图标
 *
 * store.png 为 5×5 精灵图，每格 360×260（横向矩形，aspect 18/13），
 * 组件内部强制 aspect-ratio，外部只需传宽度类名即可保持比例。
 *
 * @param {Object} props
 * @param {number} props.index - 格子索引（0~24，行优先）
 * @param {string} [props.className] - 外部尺寸/圆角类名
 * @param {string} [props.backgroundSize] - 自定义 background-size（默认 '800% 800%'）；
 *   统计页8宫格大图传 '500% 500%'（颗粒细腻）；花园日记小图传 '1000% 1000%'（清晰锐利）
 */
import { memo } from 'react';

const STORE_SHEET_SRC = '/img/store.png';
const STORE_COLS = 5;
const STORE_ROWS = 5;

/**
 * 渲染 store.png 中指定格子的图片
 * @returns {JSX.Element}
 */
const StoreSprite = memo(function StoreSprite({ index, className = '', backgroundSize = '800% 800%' }) {
  const col = index % STORE_COLS;
  const row = Math.floor(index / STORE_COLS);
  const posX = (col / (STORE_COLS - 1)) * 100;
  const posY = (row / (STORE_ROWS - 1)) * 100;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: `url(${STORE_SHEET_SRC})`,
        backgroundSize,
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: 'no-repeat',
        aspectRatio: '18 / 13',
      }}
    />
  );
});

export default StoreSprite;
