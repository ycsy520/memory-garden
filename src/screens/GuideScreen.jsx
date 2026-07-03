/**
 * 引导页 — 分步教程，教玩家如何玩N-back游戏
 * 共4步，每步展示不同的引导内容和图标
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CloudFog, BookOpen, ArrowRight } from 'lucide-react';
import AudioService from '@services/AudioService';

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
    <div key="2" className="flex gap-2 items-center bg-white/50 p-4 rounded-xl border border-stone-200">
      <span className="text-4xl opacity-50 grayscale">🌹</span>
      <ArrowRight size={20} className="text-stone-400" />
      <span className="text-5xl border-2 border-green-400 rounded-lg p-1 bg-white">🌹</span>
    </div>,
    <div key="3" className="bg-[var(--color-brand)] text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
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
    <div className="flex flex-col items-center justify-center h-full w-full p-6 animate-fade-in bg-white/40 backdrop-blur-sm">
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl max-w-sm w-full min-h-[420px] flex flex-col items-center text-center relative border-4 border-white">
        {/* 步骤指示器 */}
        <div className="flex gap-2 mb-6 sm:mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-green-500 w-6' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6">
          <div className="h-24 flex items-center justify-center transition-all duration-500 transform hover:scale-110">
            {guideIcons[step]}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3"
                style={{ fontFamily: 'var(--font-family-serif)' }}>
              {steps[step].title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed">
              {steps[step].text}
            </p>
          </div>

          <p className="text-green-600/70 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
            {steps[step].sub}
          </p>
        </div>

        {/* 导航按钮 */}
        <div className="w-full flex justify-between mt-8 pt-6 border-t border-stone-100">
          <button
            onClick={prevStep}
            className={`text-[var(--color-text-muted)] px-4 py-2 hover:text-[var(--color-text-secondary)] transition-colors ${
              step === 0 ? 'opacity-0 pointer-events-none' : ''
            }`}
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            {t('guide.prev')}
          </button>
          <button
            onClick={nextStep}
            className="bg-stone-700 text-white px-6 sm:px-8 py-3 rounded-full hover:bg-stone-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            {step === steps.length - 1 ? t('guide.done') : t('guide.next')}
            {step < steps.length - 1 && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
