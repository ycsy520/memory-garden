/**
 * 双通道布局 — 双通道模式
 * 上下分层布局，上方显示视觉刺激，下方显示听觉刺激
 *
 * @param {Object} props
 * @param {Object} props.stimulus - 刺激对象
 * @param {boolean} props.showStimulus - 是否显示刺激
 * @param {boolean} props.isWarmupPhase - 是否热身阶段
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import MandalaLoader from '@components/MandalaLoader';
import FactorValue from '@components/FactorValue';

export default function DualLayout({
  stimulus,
  showStimulus,
  isWarmupPhase,
  warmupText,
}) {
  const { t } = useTranslation();
  // 精灵图索引为 number（含 0），必须用 ?? 保留，交由 FactorValue 按类型分流渲染
  const visualValue = stimulus?.value?.visual?.value ?? null;
  // 显示音符名（如 'Do'），而不是频率数字（如 261.63）
  const audioName = stimulus?.value?.audio?.meta?.name || '?';
  const audioIcon = stimulus?.value?.audio?.meta?.icon || '🎵';

  return (
    <div className="w-full flex flex-col items-center justify-center relative z-10 px-6">
      {/* 暖身提示 */}
      <div className={`mb-6 text-center ${isWarmupPhase && showStimulus ? '' : 'invisible'}`}>
        <p className="text-sm text-[var(--color-text-muted)] bg-white/60 px-4 py-2 rounded-full">
          {warmupText || t('game.warmupDual')}
        </p>
      </div>

      {/* 刺激容器 — 响应式 */}
      <div className="flex flex-col items-center gap-6 sm:gap-8 mb-8 sm:mb-12">
        {/* 视觉刺激 — Double-Bezel + 渐显渐隐 */}
        <div className="bg-stone-100/50 p-1.5 sm:p-2 rounded-[1.5rem] ring-1 ring-black/5">
          <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 flex items-center justify-center bg-[var(--color-sprite-bg)] rounded-[calc(1.5rem_-_0.375rem)] sm:rounded-[calc(1.5rem_-_0.5rem)] shadow-lg relative">
            {/* 视觉刺激内容层：与经典模式一致，1rem 圆角 + overflow-hidden，确保精灵图直角被裁剪成圆角 */}
            <div className={`w-full h-full flex items-center justify-center overflow-hidden rounded-[1rem] transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showStimulus ? 'opacity-100' : 'opacity-0'}`}>
              <FactorValue
                value={visualValue}
                spriteClass="w-full h-full"
                textClass="text-8xl sm:text-9xl lg:text-[10rem] select-none leading-none"
              />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showStimulus ? 'opacity-0' : 'opacity-100'}`}>
              <MandalaLoader size={40} />
            </div>
          </div>
        </div>

        {/* 听觉刺激 */}
        <div className={`flex items-center gap-3 px-6 py-3 bg-white/60 rounded-full shadow-md transition-opacity duration-300 ${showStimulus ? 'opacity-100' : 'opacity-30'}`}>
          {audioIcon.startsWith('/')
            ? <img src={audioIcon} alt="" className="h-5 w-auto" aria-hidden="true" />
            : <span className="text-2xl">{audioIcon}</span>}
          <span className="text-lg font-medium text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-family-mono)' }}>
            {showStimulus ? audioName : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
