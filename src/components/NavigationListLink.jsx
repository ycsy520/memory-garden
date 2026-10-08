import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * 导航列表链接
 * 统一设置页等列表入口的排版与右侧引导图标，避免使用裸文本箭头。
 *
 * @param {{
 *   to: string,
 *   label: string,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function NavigationListLink({
  to,
  label,
  className = '',
}) {
  return (
    <Link
      to={to}
      className={`ui-list-row flex w-full items-center justify-between p-4 text-left ${className}`.trim()}
      style={{ minHeight: 'var(--touch-min-size)' }}
    >
      <span className="text-[var(--color-text-primary)]">{label}</span>
      <ChevronRight size={18} className="text-[var(--color-text-muted)]" aria-hidden="true" />
    </Link>
  );
}
