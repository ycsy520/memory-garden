/**
 * 小花倒计时组件
 * 显示 N 朵小花，每秒消失一朵，最后一朵消失后触发 onComplete
 *
 * 视觉效果：小花消失时向上飘落 + 淡出
 *
 * @param {Object} props
 * @param {boolean} props.isActive - 是否激活
 * @param {boolean} props.isPaused - 是否暂停
 * @param {number} props.flowerCount - 显示的花朵数量（默认 3）
 * @param {number} props.durationMs - 当前回合总可见时长 (ms)，默认 2500
 * @param {Function} props.onComplete - 所有花消失后的回调
 */
import { useState, useEffect, useRef, startTransition } from 'react';

/**
 * 调度下一朵花的消失
 * 使用剩余时间而不是固定 interval，确保暂停恢复后仍能与当前回合节奏对齐。
 * @param {Object} refs
 */
function scheduleNextFlower(refs) {
  const {
    timeoutRef,
    remainingStepMsRef,
    lastScheduledAtRef,
    visibleFlowersRef,
    setVisibleFlowers,
    stepDurationRef,
    completedRef,
    onCompleteRef,
  } = refs;

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  if (visibleFlowersRef.current <= 0) return;

  lastScheduledAtRef.current = Date.now();
  timeoutRef.current = setTimeout(() => {
    visibleFlowersRef.current -= 1;
    startTransition(() => setVisibleFlowers(visibleFlowersRef.current));

    if (visibleFlowersRef.current <= 0) {
      timeoutRef.current = null;
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    remainingStepMsRef.current = stepDurationRef.current;
    scheduleNextFlower(refs);
  }, Math.max(remainingStepMsRef.current, 0));
}

export default function WarmupFlowerTimer({
  isActive,
  isPaused = false,
  flowerCount = 3,
  durationMs = 2500,
  onComplete,
}) {
  const initialStepDuration = Math.max(durationMs / flowerCount, 100);
  const [visibleFlowers, setVisibleFlowers] = useState(flowerCount);
  const timeoutRef = useRef(null);
  const completedRef = useRef(false);
  const visibleFlowersRef = useRef(flowerCount);
  const stepDurationRef = useRef(initialStepDuration);
  const remainingStepMsRef = useRef(initialStepDuration);
  const lastScheduledAtRef = useRef(0);

  // 稳定 onComplete 引用，避免 effect 频繁重置
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isActive) {
      startTransition(() => setVisibleFlowers(flowerCount));
      visibleFlowersRef.current = flowerCount;
      completedRef.current = false;
      stepDurationRef.current = Math.max(durationMs / flowerCount, 100);
      remainingStepMsRef.current = stepDurationRef.current;
      lastScheduledAtRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    startTransition(() => setVisibleFlowers(flowerCount));
    visibleFlowersRef.current = flowerCount;
    completedRef.current = false;
    stepDurationRef.current = Math.max(durationMs / flowerCount, 100);
    remainingStepMsRef.current = stepDurationRef.current;
    scheduleNextFlower({
      timeoutRef,
      remainingStepMsRef,
      lastScheduledAtRef,
      visibleFlowersRef,
      setVisibleFlowers,
      stepDurationRef,
      completedRef,
      onCompleteRef,
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, flowerCount, durationMs]);

  useEffect(() => {
    if (!isActive || !isPaused) {
      return;
    }

    if (timeoutRef.current) {
      const elapsed = Date.now() - lastScheduledAtRef.current;
      remainingStepMsRef.current = Math.max(remainingStepMsRef.current - elapsed, 0);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, isPaused]);

  useEffect(() => {
    if (!isActive || isPaused || completedRef.current || visibleFlowersRef.current <= 0) {
      return;
    }

    if (timeoutRef.current) {
      return;
    }

    scheduleNextFlower({
      timeoutRef,
      remainingStepMsRef,
      lastScheduledAtRef,
      visibleFlowersRef,
      setVisibleFlowers,
      stepDurationRef,
      completedRef,
      onCompleteRef,
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, isPaused, visibleFlowers]);

  // 不激活时隐藏，但保持占位避免抖动
  if (!isActive) {
    return <div className="h-6 min-w-[4.5rem]" data-testid="warmup-flower-timer" aria-hidden="true" />;
  }

  return (
    <div className="flex h-6 min-w-[4.5rem] items-center justify-center gap-2" data-testid="warmup-flower-timer">
      {Array.from({ length: flowerCount }).map((_, i) => (
        <img
          key={i}
          src="/img/flower_ico.png"
          alt=""
          className={`
            w-5 h-5 object-contain transition-all duration-300 ease-out
            ${i < visibleFlowers
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-75'
            }
          `}
          style={{ display: 'inline-block' }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
