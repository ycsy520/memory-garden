/**
 * 小花倒计时组件
 * 显示 N 朵小花，每秒消失一朵，最后一朵消失后触发 onComplete
 *
 * 视觉效果：小花消失时向上飘落 + 淡出
 *
 * @param {Object} props
 * @param {boolean} props.isActive - 是否激活
 * @param {number} props.flowerCount - 显示的花朵数量（默认 3）
 * @param {number} props.durationMs - 当前回合总可见时长 (ms)，默认 2500
 * @param {Function} props.onComplete - 所有花消失后的回调
 */
import { useState, useEffect, useRef, startTransition } from 'react';

export default function WarmupFlowerTimer({ isActive, flowerCount = 3, durationMs = 2500, onComplete }) {
  const [visibleFlowers, setVisibleFlowers] = useState(flowerCount);
  const intervalRef = useRef(null);
  const completedRef = useRef(false);

  // 稳定 onComplete 引用，避免 effect 频繁重置
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // 不激活时重置状态
    if (!isActive) {
      startTransition(() => setVisibleFlowers(flowerCount));
      completedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 激活时重置并启动倒计时
    startTransition(() => setVisibleFlowers(flowerCount));
    completedRef.current = false;

    const interval = Math.max(durationMs / flowerCount, 100); // 每朵花的间隔，最少 100ms
    let count = flowerCount;

    intervalRef.current = setInterval(() => {
      count--;
      setVisibleFlowers(count);

      if (count <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        // 防止重复调用 onComplete
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
      }
    }, interval);

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, flowerCount, durationMs]);

  // 不激活时隐藏，但保持占位避免抖动
  if (!isActive) {
    return <div className="h-6 w-full" />;
  }

  return (
    <div className="flex items-center justify-center gap-2 h-6 w-full">
      {Array.from({ length: flowerCount }).map((_, i) => (
        <span
          key={i}
          className={`
            text-xl transition-all duration-300 ease-out
            ${i < visibleFlowers
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-75'
            }
          `}
          style={{ display: 'inline-block' }}
          aria-hidden="true"
        >
          🌸
        </span>
      ))}
    </div>
  );
}
