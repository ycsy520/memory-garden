/**
 * 因子值统一渲染组件
 * 数字值 = 精灵图格子索引 → 裁切渲染；字符串值 = 旧数据/文本 → 原样文本渲染。
 *
 * @version 6.0
 */
import React, { memo } from 'react';
import FactorSprite from '@components/FactorSprite';

/**
 * 根据因子值类型选择渲染形态
 * @param {{ value: number|string, spriteClass: string, textClass: string }} props
 * @returns {JSX.Element}
 */
const FactorValue = memo(function FactorValue({ value, spriteClass, textClass }) {
  if (typeof value === 'number') {
    return <FactorSprite index={value} className={spriteClass} />;
  }
  return <span className={textClass}>{typeof value === 'string' ? value : '?'}</span>;
});

export default FactorValue;
