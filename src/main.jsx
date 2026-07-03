/**
 * 渲染入口 — 初始化React应用
 * v3.0: PWA Service Worker 自动注册
 * v3.1: Capacitor 原生初始化（状态栏、启动画面）
 * v3.3: Sentry 错误监控 + Analytics 初始化
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/design-tokens.css'
import './styles/accessibility.css'
import './styles/animations.css'
import './styles/mandala.css'
import './index.css'
import './factors/index.js'  // 注册所有因子插件
import App from './App.jsx'
import PlatformService from '@services/PlatformService'
import AnalyticsService from '@services/AnalyticsService'
import { initSentry } from './sentry.client.config'

// Sentry 错误监控初始化（仅生产环境 + 有 DSN）
initSentry();

// 追踪应用启动
AnalyticsService.track('app', 'launch', {
  platform: PlatformService.detect().os,
  isPWA: PlatformService.detect().isPWA,
});

// Capacitor 原生初始化
const platform = PlatformService.detect();
if (platform.isCapacitor) {
  // 设置状态栏颜色与主题一致
  PlatformService.setStatusBar({ style: 'LIGHT', backgroundColor: '#7C9A6E' });
  // 延迟隐藏启动画面，等待 React 挂载
  window.addEventListener('load', () => {
    setTimeout(() => PlatformService.hideSplash(), 300);
  });
}

// PWA Service Worker 注册 — 仅在非 Capacitor 环境下注册
// Capacitor 使用原生应用更新机制，不需要 Service Worker
if (!platform.isCapacitor) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('有新版本可用，是否立即更新？')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('[PWA] 应用已可离线使用');
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-4 py-2 rounded-full text-sm z-50 animate-fade-in shadow-lg';
        toast.textContent = '🌿 记忆小花园已可离线使用';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      },
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
