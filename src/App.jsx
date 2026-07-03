/**
 * 应用入口 — 路由配置 + 全局布局
 * 包裹ErrorBoundary保证永远可玩
 * 使用HashRouter兼容PWA和Capacitor
 */
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import IntroScreen from '@screens/IntroScreen';
import GuideScreen from '@screens/GuideScreen';
import MenuScreen from '@screens/MenuScreen';
import GameScreen from '@screens/GameScreen';
import FinishedScreen from '@screens/FinishedScreen';
import StatsScreen from '@screens/StatsScreen';
import AchievementsScreen from '@screens/AchievementsScreen';
import LeaderboardScreen from '@screens/LeaderboardScreen';
import ModeGuideScreen from '@screens/ModeGuideScreen';
import SettingsScreen from '@screens/SettingsScreen';
import './i18n';

export default function App() {
  return (
    <ErrorBoundary>
      <div
        className="w-full min-h-screen h-[100dvh] font-sans overflow-hidden relative"
        style={{
          background: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family-sans)',
        }}
      >
        {/* 动态背景 */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(to bottom right, var(--color-bg-primary), var(--color-bg-stone-50))`,
          }}
        />
        <div
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[100px] opacity-60 pointer-events-none animate-pulse-slow"
          style={{ background: 'var(--color-garden-green)' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[80px] opacity-40 pointer-events-none"
          style={{ background: 'var(--color-garden-warm)' }}
        />
        {/* 噪点纹理 */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* 路由容器 */}
        <div className="relative z-10 h-full max-w-lg mx-auto shadow-2xl sm:border-x sm:border-stone-200/20 bg-white/30 backdrop-blur-[2px] transition-all duration-300">
          <HashRouter>
            <Routes>
              <Route path="/" element={<IntroScreen />} />
              <Route path="/guide" element={<GuideScreen />} />
              <Route path="/menu" element={<MenuScreen />} />
              <Route path="/game" element={<GameScreen />} />
              <Route path="/finished" element={<FinishedScreen />} />
              <Route path="/stats" element={<StatsScreen />} />
              <Route path="/achievements" element={<AchievementsScreen />} />
              <Route path="/leaderboard" element={<LeaderboardScreen />} />
              <Route path="/mode-guide" element={<ModeGuideScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </HashRouter>
        </div>

      </div>
    </ErrorBoundary>
  );
}
