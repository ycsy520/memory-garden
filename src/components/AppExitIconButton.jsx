import React from 'react';
import { Power } from 'lucide-react';

/**
 * 通用退出应用图标按钮
 * 统一 Android 原生环境中的退出入口样式，避免菜单页自行拼接出不一致的按钮风格。
 *
 * @param {{
 *   onClick: () => void,
 *   ariaLabel: string,
 *   className?: string,
 *   iconSize?: number
 * }} props
 * @returns {JSX.Element}
 */
export default function AppExitIconButton({
  onClick,
  ariaLabel,
  className = '',
  iconSize = 18,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`ui-icon-btn ui-icon-btn-soft flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] ${className}`.trim()}
    >
      <Power size={iconSize} />
    </button>
  );
}
