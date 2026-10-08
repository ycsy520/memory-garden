/**
 * 本局游戏耗时计时器组件
 * 固定在页面右下角，显示 mm:ss 格式的游戏时间
 *
 * @param {Object} props
 * @param {boolean} props.isRunning - 是否计时（游戏进行中）
 */
import { useState, useEffect, useRef, startTransition } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 格式化毫秒为 mm:ss
 * @param {number} ms - 毫秒数
 * @returns {string}
 */
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ElapsedTimer({ isRunning }) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    if (!isRunning) {
      // 停止计时
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // 如果从未运行过，保持 00:00
      return;
    }

    // 开始或恢复计时：新局从 0 起，恢复则接着此前累计耗时继续。
    startTimeRef.current = Date.now() - elapsedRef.current;
    startTransition(() => setElapsed(Date.now() - startTimeRef.current));

    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // 不运行时隐藏
  if (!isRunning) return null;

  return (
    <div
      data-testid="elapsed-timer"
      className="fixed bottom-4 right-4 text-xs text-stone-400 z-30 select-none"
      style={{ fontFamily: 'var(--font-family-mono)' }}
      aria-label={t('stats.timed')}
    >
      {formatTime(elapsed)}
    </div>
  );
}
