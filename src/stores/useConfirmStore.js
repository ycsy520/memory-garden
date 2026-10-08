/**
 * 全局确认弹窗状态管理 — Zustand Store
 * 用于替代 window.confirm，统一 UI 与交互语义。
 */
import { create } from 'zustand';

const DEFAULT_CONFIRM_LABEL = '确定';
const DEFAULT_CANCEL_LABEL = '取消';

/**
 * 触发全局确认弹窗，并以 Promise 形式返回用户选择结果。
 * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string }} options
 * @returns {Promise<boolean>} true=确认，false=取消
 */
export function confirmDialog(options) {
  return useConfirmStore.getState().open(options);
}

const useConfirmStore = create((set, get) => ({
  /** @type {boolean} */
  isOpen: false,
  /** @type {string} */
  title: '',
  /** @type {string} */
  message: '',
  /** @type {string} */
  confirmLabel: DEFAULT_CONFIRM_LABEL,
  /** @type {string} */
  cancelLabel: DEFAULT_CANCEL_LABEL,
  /** @type {null | ((value: boolean) => void)} */
  _resolve: null,

  /**
   * 打开确认弹窗并挂起一个 Promise，等待用户选择。
   * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string }} options
   * @returns {Promise<boolean>}
   */
  open: (options) => new Promise((resolve) => {
    set({
      isOpen: true,
      title: options.title || '',
      message: options.message,
      confirmLabel: options.confirmLabel || DEFAULT_CONFIRM_LABEL,
      cancelLabel: options.cancelLabel || DEFAULT_CANCEL_LABEL,
      _resolve: resolve,
    });
  }),

  /**
   * 关闭弹窗并完成 Promise。
   * @param {boolean} value
   * @returns {void}
   */
  close: (value) => {
    const resolve = get()._resolve;
    if (resolve) resolve(value);
    set({
      isOpen: false,
      title: '',
      message: '',
      confirmLabel: DEFAULT_CONFIRM_LABEL,
      cancelLabel: DEFAULT_CANCEL_LABEL,
      _resolve: null,
    });
  },
}));

export default useConfirmStore;

