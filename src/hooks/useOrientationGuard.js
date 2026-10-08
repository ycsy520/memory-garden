/**
 * useOrientationGuard — 手机横屏锁定 Hook
 * 检测手机设备横屏状态，返回是否需要显示竖屏提示
 * 仅在屏幕宽度 <640px（手机）时生效，iPad/PC 不受影响
 *
 * @returns {boolean} true = 需要显示"请竖起手机"提示
 */
import { useState, useEffect } from 'react';

export default function useOrientationGuard() {
  const [shouldBlock, setShouldBlock] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /**
     * 检测是否处于"手机横屏"状态
     * 条件：横屏 AND 视口宽度 <640px
     */
    const check = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const isMobileWidth = window.matchMedia('(max-width: 639px)').matches;
      setShouldBlock(isLandscape && isMobileWidth);
    };

    // 初始化检测
    check();

    // 监听方向变化
    const mqlOrientation = window.matchMedia('(orientation: landscape)');
    const mqlWidth = window.matchMedia('(max-width: 639px)');

    mqlOrientation.addEventListener('change', check);
    mqlWidth.addEventListener('change', check);

    // 也监听 resize 作为兜底（部分安卓 WebView 不触发 orientation change）
    window.addEventListener('resize', check);

    return () => {
      mqlOrientation.removeEventListener('change', check);
      mqlWidth.removeEventListener('change', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return shouldBlock;
}
