/**
 * 首页 — 游戏入口，展示花园主题和"推开花园的门"按钮
 */
import React, { useEffect, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Sun, CloudFog, Wind, Smartphone, Monitor, Globe, Download } from 'lucide-react';
import AudioService from '@services/AudioService';
import useSettingsStore from '@stores/useSettingsStore';
import usePWAInstall from '@hooks/usePWAInstall';
import i18n from '@i18n/index';

/**
 * 首屏入口组件
 * 承担品牌首屏、语言切换与进入引导的入口职责
 * @returns {JSX.Element}
 */
export default function IntroScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = useSettingsStore((s) => s.lang);
  const switchLanguage = useSettingsStore((s) => s.switchLanguage);
  const hasSeenIntro = useSettingsStore((s) => s.hasSeenIntro);
  const markIntroSeen = useSettingsStore((s) => s.markIntroSeen);
  const { isInstallable, install } = usePWAInstall();

  // 已看过引导则直接跳转菜单
  useEffect(() => {
    if (hasSeenIntro) {
      startTransition(() => navigate('/menu', { replace: true }));
    }
  }, [hasSeenIntro, navigate]);

  const handleStart = () => {
    AudioService.init();
    AudioService.resume();
    markIntroSeen();
    navigate('/guide');
  };

  const handleLangSwitch = () => {
    AudioService.init();
    AudioService.resume();
    switchLanguage();
    // i18next语言同步
    const newLang = useSettingsStore.getState().lang;
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="ui-page-shell ui-page-shell-centered relative overflow-hidden">
      {/* 语言切换按钮 */}
      <button
        onClick={handleLangSwitch}
        className="ui-icon-btn ui-icon-btn-soft absolute right-4 top-4 z-20 inline-flex items-center gap-2 px-4 text-[var(--color-text-secondary)] shadow-[0_12px_24px_rgba(120,113,108,0.08)] backdrop-blur-md sm:right-6 sm:top-6"
        style={{ minHeight: 'var(--touch-min-size)' }}
      >
        <Globe size={18} />
        <span className="text-sm font-medium">
          {lang === 'zh-CN' ? '简体' : lang === 'zh-TW' ? '繁體' : 'EN'}
        </span>
      </button>

      {/* 装饰性背景元素 */}
      <div className="absolute top-10 right-10 opacity-30 animate-pulse-slow pointer-events-none">
        <CloudFog size={80} className="text-stone-400" />
      </div>
      <div className="absolute bottom-20 left-10 opacity-20 animate-float pointer-events-none">
        <Wind size={60} className="text-green-300" />
      </div>

      <div className="ui-page-narrow z-10 flex w-full flex-col items-center text-center">
        {/* 花朵图标 */}
        <div className="mb-6 relative">
          <div className="ui-chip relative flex h-40 w-40 items-center justify-center bg-gradient-to-tr from-green-100 to-yellow-50 shadow-[0_0_40px_rgba(255,255,255,0.8)] animate-breathe-slow sm:h-48 sm:w-48">
            <span className="text-8xl sm:text-9xl filter drop-shadow-[0_10px_18px_rgba(120,113,108,0.10)] transform -translate-y-2">🌻</span>
            <div className="absolute inset-0 animate-spin-slow opacity-60">
              <div className="ui-dot absolute left-1/2 top-0 h-3 w-3 bg-yellow-300 blur-[2px]" />
              <div className="ui-dot absolute bottom-4 right-8 h-2 w-2 bg-green-300 blur-[1px]" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl text-[var(--color-text-primary)] font-bold mb-3 tracking-widest"
            style={{ fontFamily: 'var(--font-family-serif)', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
          {t('title')}
        </h1>
        <p className="text-[var(--color-text-secondary)] font-light text-lg sm:text-xl mb-10 tracking-wider">
          {t('subtitle')}
        </p>

        {/* PWA安装按钮 */}
        {isInstallable && (
          <button
            onClick={async () => {
              const success = await install();
              if (success) {
                console.log('[PWA] 用户接受安装');
              }
            }}
            className="ui-btn-base ui-btn-primary mb-3 flex w-full items-center justify-center gap-2 px-8 py-3 text-sm transition-all hover:scale-105 sm:w-auto"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <Download size={16} />
            <span>{t('installBtn')}</span>
          </button>
        )}

        <button
          onClick={handleStart}
          className="ui-btn-base ui-btn-primary group relative flex w-full items-center justify-center gap-3 overflow-hidden px-12 py-4 text-lg transition-all duration-300 hover:scale-105 sm:w-auto sm:px-16 sm:text-xl"
          style={{ minHeight: 'var(--touch-min-size)' }}
        >
          <span className="relative z-10" style={{ fontFamily: 'var(--font-family-serif)' }}>
            {t('startBtn')}
          </span>
          <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </button>

        {/* 设备支持提示 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--color-text-muted)] opacity-70">
          <span className="ui-chip inline-flex items-center gap-1 bg-white/45 px-3 py-1.5"><Smartphone size={12} /> {t('deviceSupport.mobile')}</span>
          <span className="ui-chip inline-flex items-center gap-1 bg-white/45 px-3 py-1.5"><Monitor size={12} /> {t('deviceSupport.pc')}</span>
          <span className="ui-chip inline-flex items-center gap-1 bg-white/45 px-3 py-1.5"><Heart size={12} /> {t('deviceSupport.tablet')}</span>
        </div>
      </div>

      {/* 底部版权 + 医疗声明 */}
      <div className="absolute bottom-4 w-full flex flex-col items-center gap-1 text-[var(--color-text-muted)] font-light">
        <div className="text-sm">{t('dedication')}</div>
        <div className="text-[10px] opacity-60 text-center leading-relaxed" style={{ fontFamily: 'var(--font-family-sans)', maxWidth: '20rem' }}>
          {t('medicalDisclaimer')}
        </div>
        <div className="text-[10px] opacity-60" style={{ fontFamily: 'var(--font-family-sans)' }}>
          © Memory Garden | ycsy520@gmail.com
        </div>
      </div>
    </div>
  );
}
