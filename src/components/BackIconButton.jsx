import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * 通用返回图标按钮
 * 统一顶层返回入口的图标、点击区与交互反馈，避免各页面手写出不同版本。
 *
 * @param {{
 *   onClick: () => void,
 *   ariaLabel: string,
 *   className?: string,
 *   iconSize?: number
 * }} props
 * @returns {JSX.Element}
 */
export default function BackIconButton({
  onClick,
  ariaLabel,
  className = '',
  iconSize = 20,
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`ui-icon-btn ui-icon-btn-soft flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] ${className}`.trim()}
    >
      <ArrowLeft size={iconSize} />
    </button>
  );
}
