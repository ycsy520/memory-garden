/**
 * 引导页 — 分步教程，教玩家如何玩N-back游戏
 * 共4步，每步展示不同的引导内容和图标
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CloudFog, BookOpen, ArrowRight } from 'lucide-react';
import AudioService from '@services/AudioService';

/**
 * 通用引导页组件
 * 通过四步教程帮助用户理解基础玩法
 * @returns {JSX.Element}
 */
export default function GuideScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = t('guide.steps', { returnObjects: true });

  const guideIcons = [
    <CloudFog key="0" size={64} className="text-stone-300" />,
    <div key="1" className="flex gap-4 items-center">
      <span className="text-6xl animate-pulse">🌹</span>
    </div>,
    <div key="2" className="ui-card-secondary flex items-center gap-2 border border-stone-200 bg-white/60 p-4">
      <span className="text-4xl opacity-50 grayscale">🌹</span>
      <ArrowRight size={20} className="text-stone-400" />
      <span className="ui-card-tertiary border-2 border-green-400 bg-white p-1 text-5xl">🌹</span>
    </div>,
    <div key="3" className="ui-chip flex items-center gap-2 bg-[var(--color-brand)] px-6 py-3 text-white shadow-[0_14px_28px_rgba(125,150,131,0.18)]">
      <BookOpen size={24} /> {t('game.button')}
    </div>,
  ];

  const nextStep = () => {
    AudioService.init();
    AudioService.resume();
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      navigate('/menu');
    }
  };

  const prevStep = () => {
    if (step > 0) setStep((prev) => prev - 1);
  };

  return (
    <div className="ui-page-shell ui-page-shell-centered animate-fade-in bg-white/35 backdrop-blur-sm">
      <div className="ui-page-narrow">
        <div className="ui-card-primary border border-white/80 bg-white/78 p-6 shadow-[0_20px_40px_rgba(120,113,108,0.10)] sm:p-8">
        {/* 步骤指示器 */}
        <div className="mb-6 flex justify-center gap-2 sm:mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`ui-dot h-2 w-2 transition-all ${
                i === step ? 'bg-green-500 w-6' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
          <div className="ui-heading-block mb-6">
            <p className="mb-2 text-sm text-[var(--color-text-muted)]">新手引导</p>
            <h1
              className="text-2xl text-[var(--color-text-primary)] sm:text-[1.75rem]"
              style={{ fontFamily: 'var(--font-family-serif)' }}
            >
              {steps[step].title}
            </h1>
          </div>

          <div className="mb-8 flex h-28 items-center justify-center transition-all duration-500 transform hover:scale-105">
            {guideIcons[step]}
          </div>

          <div style={{ maxWidth: '30rem' }}>
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
              {steps[step].text}
            </p>
          </div>

          <p className="ui-chip mt-6 bg-green-50 px-3 py-1 text-sm font-medium text-green-700/80">
            {steps[step].sub}
          </p>
        </div>

        {/* 导航按钮 */}
        <div className="mt-8 flex w-full items-center justify-between gap-3 border-t border-stone-100 pt-6">
          <button
            onClick={prevStep}
            className={`ui-btn-base ui-btn-neutral px-4 py-2 text-sm ${
              step === 0 ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            {t('guide.prev')}
          </button>
          <button
            onClick={nextStep}
            className="ui-btn-base ui-btn-primary flex items-center gap-2 px-6 py-3 sm:px-8"
          >
            {step === steps.length - 1 ? t('guide.done') : t('guide.next')}
            {step < steps.length - 1 && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
