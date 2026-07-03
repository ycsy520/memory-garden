/**
 * 页面可见性检测Hook — 用于暂停/恢复游戏
 * 当用户切换标签页或锁屏时自动暂停游戏
 */
import { useEffect, useRef } from 'react';

/**
 * 当页面不可见时调用onHide，可见时调用onShow
 * @param {Function} onHide - 页面隐藏回调
 * @param {Function} onShow - 页面显示回调
 */
export default function useVisibilityChange(onHide, onShow) {
  const callbacksRef = useRef({ onHide, onShow });

  // 在 effect 中同步最新的回调，避免渲染期间更新 ref
  useEffect(() => {
    callbacksRef.current = { onHide, onShow };
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        callbacksRef.current.onHide?.();
      } else {
        callbacksRef.current.onShow?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // 空依赖数组，只在挂载时注册一次
}
