/**
 * 全局轻提示（Toast）状态管理 — Zustand Store
 * 用于替代 alert，统一 UI 与提示节奏。
 */
import { create } from 'zustand';

const DEFAULT_DURATION_MS = 2800;

/**
 * 触发 Toast 提示。
 * @param {{ message: string, variant?: 'info'|'success'|'error', durationMs?: number }} options
 * @returns {void}
 */
export function toast(options) {
  useToastStore.getState().show(options);
}

const useToastStore = create((set, get) => ({
  /** @type {boolean} */
  isOpen: false,
  /** @type {string} */
  message: '',
  /** @type {'info'|'success'|'error'} */
  variant: 'info',
  /** @type {number} */
  durationMs: DEFAULT_DURATION_MS,
  /** @type {null | number} */
  _timer: null,

  /**
   * 显示一条 toast，并自动在 durationMs 后关闭。
   * @param {{ message: string, variant?: 'info'|'success'|'error', durationMs?: number }} options
   * @returns {void}
   */
  show: (options) => {
    const prevTimer = get()._timer;
    if (prevTimer) window.clearTimeout(prevTimer);

    const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
    const timer = window.setTimeout(() => {
      get().hide();
    }, durationMs);

    set({
      isOpen: true,
      message: options.message,
      variant: options.variant || 'info',
      durationMs,
      _timer: timer,
    });
  },

  /**
   * 立即关闭 toast。
   * @returns {void}
   */
  hide: () => {
    const prevTimer = get()._timer;
    if (prevTimer) window.clearTimeout(prevTimer);
    set({
      isOpen: false,
      message: '',
      variant: 'info',
      durationMs: DEFAULT_DURATION_MS,
      _timer: null,
    });
  },
}));

export default useToastStore;

