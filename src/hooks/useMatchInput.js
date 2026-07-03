/**
 * 匹配输入Hook — 防抖与并发控制
 * 防止快速连点导致的重复判分
 */
import { useRef, useCallback } from 'react';

/**
 * @param {Function} onMatch - 匹配回调
 * @param {Object} options
 * @param {number} options.debounceMs - 防抖间隔(ms)，默认300
 * @returns {{ handleMatch: Function, isProcessing: boolean }}
 */
export default function useMatchInput(onMatch, { debounceMs = 300 } = {}) {
  const lastClickTime = useRef(0);
  const processing = useRef(false);

  const handleMatch = useCallback((...args) => {
    const now = Date.now();

    // 防抖: 两次点击间隔过短则忽略
    if (now - lastClickTime.current < debounceMs) return;
    // 并发锁: 正在处理中则忽略
    if (processing.current) return;

    lastClickTime.current = now;
    processing.current = true;

    try {
      onMatch(...args);
    } finally {
      processing.current = false;
    }
  }, [onMatch, debounceMs]);

  return { handleMatch, isProcessing: processing.current };
}
