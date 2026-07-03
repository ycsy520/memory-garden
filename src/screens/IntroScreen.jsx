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
    <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden animate-fade-in px-4">
      {/* 语言切换按钮 */}
      <button
        onClick={handleLangSwitch}
        className="absolute top-6 right-6 z-20 bg-white/50 backdrop-blur-md p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-white transition-all flex items-center gap-2 px-4 shadow-sm"
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

      <div className="z-10 text-center flex flex-col items-center max-w-md w-full">
        {/* 花朵图标 */}
        <div className="mb-6 relative">
          <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-tr from-green-100 to-yellow-50 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.8)] animate-breathe-slow relative">
            <span className="text-8xl sm:text-9xl filter drop-shadow-sm transform -translate-y-2">🌻</span>
            <div className="absolute inset-0 animate-spin-slow opacity-60">
              <div className="absolute top-0 left-1/2 w-3 h-3 bg-yellow-300 rounded-full blur-[2px]"></div>
              <div className="absolute bottom-4 right-8 w-2 h-2 bg-green-300 rounded-full blur-[1px]"></div>
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
            className="mb-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm py-3 px-8 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center"
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <Download size={16} />
            <span>下载记忆小花园</span>
          </button>
        )}

        <button
          onClick={handleStart}
          className="group relative bg-[var(--color-brand)] text-white text-lg sm:text-xl py-4 px-12 sm:px-16 rounded-full shadow-xl transition-all duration-300 hover:bg-[var(--color-brand-hover)] hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden w-full sm:w-auto justify-center"
          style={{ minHeight: 'var(--touch-min-size)' }}
        >
          <span className="relative z-10" style={{ fontFamily: 'var(--font-family-serif)' }}>
            {t('startBtn')}
          </span>
          <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </button>

        {/* 设备支持提示 */}
        <div className="mt-8 flex gap-4 text-[var(--color-text-muted)] opacity-60 text-xs">
          <span className="flex items-center gap-1"><Smartphone size={12} /> {t('deviceSupport.mobile')}</span>
          <span className="flex items-center gap-1"><Monitor size={12} /> {t('deviceSupport.pc')}</span>
          <span className="flex items-center gap-1"><Heart size={12} /> {t('deviceSupport.tablet')}</span>
        </div>
      </div>

      {/* 底部版权 + 医疗声明 */}
      <div className="absolute bottom-4 w-full flex flex-col items-center gap-1 text-[var(--color-text-muted)] font-light">
        <div className="text-sm">{t('dedication')}</div>
        <div className="text-[10px] opacity-60 text-center leading-relaxed max-w-xs" style={{ fontFamily: 'var(--font-family-sans)' }}>
          记忆花园是注意力和工作记忆练习小游戏，不能用于医疗诊断，也不能替代专业评估。
        </div>
        <div className="text-[10px] opacity-60" style={{ fontFamily: 'var(--font-family-sans)' }}>
          © Memory Garden | ycsy520@gmail.com
        </div>
      </div>
    </div>
  );
}
