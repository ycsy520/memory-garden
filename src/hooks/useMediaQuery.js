/**
 * useMediaQuery — 响应式媒体查询 Hook
 * 监听 CSS 媒体查询变化，返回是否匹配
 * 用于横屏检测、设备特性判断等
 *
 * @param {string} query - CSS 媒体查询字符串
 * @returns {boolean} 是否匹配
 */
import { useState, useEffect } from 'react';

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // 监听变化
    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
