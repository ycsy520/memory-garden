/**
 * ToastCenter — 全局轻提示容器
 * 统一替代 alert，尽量不打断用户操作。
 */
import React, { useCallback, useEffect } from 'react';
import useToastStore from '@stores/useToastStore';

export default function ToastCenter() {
  const isOpen = useToastStore((s) => s.isOpen);
  const message = useToastStore((s) => s.message);
  const variant = useToastStore((s) => s.variant);
  const hide = useToastStore((s) => s.hide);

  /**
   * 关闭 toast。
   * @returns {void}
   */
  const handleClose = useCallback(() => {
    hide();
  }, [hide]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  const variantClasses = variant === 'success'
    ? 'bg-green-700/90 text-white'
    : variant === 'error'
      ? 'bg-red-700/90 text-white'
      : 'bg-stone-900/85 text-white';

  return (
    <div className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-6">
      <button
        type="button"
        onClick={handleClose}
        className={`ui-chip inline-flex items-center gap-2 px-4 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm ${variantClasses}`}
        style={{ fontFamily: 'var(--font-family-sans)' }}
        aria-label={message}
      >
        <span className="text-sm">{message}</span>
      </button>
    </div>
  );
}

