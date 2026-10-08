/**
 * ConfirmDialog — 全局确认弹窗
 * 统一替代 window.confirm，提供一致的视觉与按钮语义。
 */
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useConfirmStore from '@stores/useConfirmStore';

export default function ConfirmDialog() {
  const { t } = useTranslation();
  const isOpen = useConfirmStore((s) => s.isOpen);
  const title = useConfirmStore((s) => s.title);
  const message = useConfirmStore((s) => s.message);
  const confirmLabel = useConfirmStore((s) => s.confirmLabel);
  const cancelLabel = useConfirmStore((s) => s.cancelLabel);
  const close = useConfirmStore((s) => s.close);

  /**
   * 关闭确认弹窗（确认/取消）。
   * @param {boolean} value
   * @returns {void}
   */
  const handleClose = useCallback((value) => {
    close(value);
  }, [close]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose(false);
      if (e.key === 'Enter') handleClose(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label={t('common.cancel')}
        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
        onClick={() => handleClose(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative ui-card-primary w-full max-w-md bg-white/90 border border-stone-200/60 shadow-[0_28px_80px_rgba(0,0,0,0.12)]"
        style={{ borderRadius: 'var(--radius-r4)' }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h3
                className="text-lg text-[var(--color-text-primary)]"
                style={{ fontFamily: 'var(--font-family-serif)' }}
              >
                {title || t('common.confirm')}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {message}
              </p>
            </div>
            <button
              type="button"
              aria-label={t('common.cancel')}
              className="ui-icon-btn ui-icon-btn-soft flex-shrink-0"
              onClick={() => handleClose(false)}
            >
              ✕
            </button>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              className="ui-btn-base ui-btn-neutral px-6 py-3"
              onClick={() => handleClose(false)}
            >
              {cancelLabel || t('common.cancel')}
            </button>
            <button
              type="button"
              className="ui-btn-base ui-btn-primary px-6 py-3"
              onClick={() => handleClose(true)}
            >
              {confirmLabel || t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

