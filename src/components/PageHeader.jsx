import React from 'react';
import BackIconButton from '@components/BackIconButton';

/**
 * 页面顶部头部
 * 统一“返回图标 + 副标题 + 页面标题”的排列与视觉节奏，供顶层页面复用。
 *
 * @param {{
 *   onBack: () => void,
 *   backLabel: string,
 *   eyebrow?: string,
 *   title: string,
 *   titleAs?: 'h1' | 'h2',
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function PageHeader({
  onBack,
  backLabel,
  eyebrow = '',
  title,
  titleAs = 'h1',
  className = '',
}) {
  const HeadingTag = titleAs;

  return (
    <div className={`flex items-start gap-4 sm:items-center ${className}`.trim()}>
      <BackIconButton onClick={onBack} ariaLabel={backLabel} />
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-sm text-[var(--color-text-muted)]">{eyebrow}</p> : null}
        <HeadingTag
          className="text-2xl text-[var(--color-text-primary)] sm:text-[1.75rem]"
          style={{ fontFamily: 'var(--font-family-serif)' }}
        >
          {title}
        </HeadingTag>
      </div>
    </div>
  );
}
