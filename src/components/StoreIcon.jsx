/**
 * 收藏/成就图标统一渲染组件
 * 数字值 = store.png 精灵图格子索引；字符串值 = 旧数据/回退 → 原样文本渲染。
 *
 * @param {Object} props
 * @param {number|string} props.value - 图标值（数字走精灵图，字符串走文本）
 * @param {string} [props.className] - 文本形态的类名（或精灵图回退类名）
 * @param {string} [props.spriteClass] - 精灵图形态的类名（宽/圆角）
 * @param {string} [props.backgroundSize] - 精灵图专属 background-size（透传给 StoreSprite）
 */
import { memo } from 'react';
import StoreSprite from './StoreSprite';

const StoreIcon = memo(function StoreIcon({ value, className = '', spriteClass = '', backgroundSize }) {
  if (typeof value === 'number') {
    return <StoreSprite index={value} className={spriteClass || className} backgroundSize={backgroundSize} />;
  }
  return <span className={className}>{typeof value === 'string' ? value : '?'}</span>;
});

export default StoreIcon;
