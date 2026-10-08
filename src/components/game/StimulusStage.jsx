/**
 * StimulusStage — 主舞台刺激展示组件 (v5.0)
 * 卡片式布局，刺激在卡片内居中显示。
 * 原 ClassicLayout，移动到此以对齐 SDD 目录结构。
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

export default function StimulusStage({
  stimulus,
  showStimulus,
  isWarmupPhase,
  warmupText,
}) {
  const { t } = useTranslation();
  // 精灵图索引为 number（含 0），必须用 ?? 保留，交由 FactorValue 按类型分流渲染
  const displayValue = stimulus?.value ?? null;

  return (
    <div className="w-full flex flex-col items-center justify-center relative z-10 px-4">
      {/* 暖身提示 */}
      <div className={`mb-4 text-center ${isWarmupPhase && showStimulus ? '' : 'invisible'}`}>
        <p className="text-sm text-[var(--color-text-muted)] bg-white/60 px-4 py-2 rounded-full">
          {warmupText || t('game.warmupDefault')}
        </p>
      </div>

      {/* 卡片容器 — Double-Bezel 嵌套架构 */}
      <div className="relative mb-8 sm:mb-12">
        {/* 外壳：铝制托盘 */}
        <div className="bg-stone-100/50 p-1.5 sm:p-2 rounded-[2rem] ring-1 ring-black/5">
          {/* 内核：玻璃板（正方形卡片，刺激区占满整卡） */}
          <div className="w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-white rounded-[calc(2rem_-_0.375rem)] sm:rounded-[calc(2rem_-_0.5rem)] shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center border-8 border-white">
            {/* 等待态遮罩 — 渐隐 */}
            <div className={`absolute inset-4 bg-stone-100/80 z-20 flex items-center justify-center transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showStimulus ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <MandalaLoader size={40} />
            </div>

            {/* 刺激内容 — 内层正方形铺满卡片，因子填满刺激区 */}
            <div className="flex-1 flex items-center justify-center w-full relative">
              <div className="aspect-square rounded-[1rem] w-full max-w-full max-h-full bg-[var(--color-sprite-bg)] overflow-hidden relative">
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showStimulus ? 'opacity-100' : 'opacity-0'}`}>
                  <FactorValue
                    value={displayValue}
                    spriteClass="w-full h-full"
                    textClass="text-8xl sm:text-9xl lg:text-[10rem] filter drop-shadow-md select-none leading-none"
                  />
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-stone-900/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
