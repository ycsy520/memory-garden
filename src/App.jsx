/**
 * 应用入口 — 路由配置 + 全局布局
 * 包裹ErrorBoundary保证永远可玩
 * 使用HashRouter兼容PWA和Capacitor
 */
import React, { Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import APP_FEATURES from './appFeatures';
import IntroScreen from '@screens/IntroScreen';
import MenuScreen from '@screens/MenuScreen';
import GameScreen from '@screens/GameScreen';
import FinishedScreen from '@screens/FinishedScreen';
import ConfirmDialog from '@components/ConfirmDialog';
import ToastCenter from '@components/ToastCenter';
import AudioService from '@services/AudioService';
import AuthService from '@services/AuthService';
import NativeAppService from '@services/NativeAppService';
import PlatformService from '@services/PlatformService';
import SyncService from '@services/SyncService';
import i18n from '@i18n/index';
import useAuthStore from '@stores/useAuthStore';
import useSettingsStore from '@stores/useSettingsStore';

const GuideScreen = React.lazy(() => import('@screens/GuideScreen'));
const StatsScreen = React.lazy(() => import('@screens/StatsScreen'));
const AchievementsScreen = React.lazy(() => import('@screens/AchievementsScreen'));
const LeaderboardScreen = React.lazy(() => import('@screens/LeaderboardScreen'));
const SettingsScreen = React.lazy(() => import('@screens/SettingsScreen'));
const DisclaimerPage = React.lazy(() => import('@screens/about/DisclaimerPage'));
const PrivacyPage = React.lazy(() => import('@screens/about/PrivacyPage'));
const TermsPage = React.lazy(() => import('@screens/about/TermsPage'));
const NbackPage = React.lazy(() => import('@screens/about/NbackPage'));

function RouteFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="ui-chip bg-white/60 px-4 py-2 text-sm text-[var(--color-text-muted)] shadow-[0_18px_40px_rgba(0,0,0,0.10)]">
        加载中…
      </div>
    </div>
  );
}

/**
 * 带页面切换动画的路由容器
 * 通过 location.pathname 作为 key 强制重新挂载，触发 CSS 进入动画
 */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="h-full animate-page-enter">
      <Routes location={location}>
        <Route path="/" element={<IntroScreen />} />
        <Route
          path="/guide"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <GuideScreen />
            </Suspense>
          )}
        />
        <Route path="/menu" element={<MenuScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/finished" element={<FinishedScreen />} />
        <Route
          path="/stats"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <StatsScreen />
            </Suspense>
          )}
        />
        <Route
          path="/achievements"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AchievementsScreen />
            </Suspense>
          )}
        />
        <Route
          path="/leaderboard"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <LeaderboardScreen />
            </Suspense>
          )}
        />
        <Route
          path="/settings"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <SettingsScreen />
            </Suspense>
          )}
        />
        {/* 法律声明与关于页面 */}
        <Route
          path="/about/disclaimer"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <DisclaimerPage />
            </Suspense>
          )}
        />
        <Route
          path="/about/privacy"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <PrivacyPage />
            </Suspense>
          )}
        />
        <Route
          path="/about/terms"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <TermsPage />
            </Suspense>
          )}
        />
        <Route
          path="/about/nback"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <NbackPage />
            </Suspense>
          )}
        />
      </Routes>
    </div>
  );
}

/**
 * 检测当前是否需要沉浸式安全区适配
 * PWA 独立模式与 Capacitor 原生壳都需要给系统栏区域留出内容缓冲。
 *
 * @returns {{ isStandalone: boolean, isCapacitor: boolean, os: string }}
 */
function getShellEnvironment() {
  if (typeof window === 'undefined') {
    return { isStandalone: false, isCapacitor: false, os: 'unknown' };
  }

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  const platform = PlatformService.detect();

  return {
    isStandalone,
    isCapacitor: platform.isCapacitor,
    os: platform.os,
  };
}

/**
 * 生成全局页面壳样式
 * 统一控制 Safe Area、最大版心与响应式内边距，避免各页面自行定义根容器标准。
 * Android 原生壳在透明状态栏下补一个 24px 兜底，避免内容顶到时间、电量区域。
 *
 * @param {{ isStandalone: boolean, isCapacitor: boolean, os: string }} env
 * @returns {{ appStyle: React.CSSProperties, shellStyle: React.CSSProperties }}
 */
function getAppShellStyles(env) {
  const topInset = env.isCapacitor && env.os === 'android'
    ? 'max(var(--safe-area-top), 24px)'
    : 'var(--safe-area-top)';
  const usesSafeArea = env.isStandalone || env.isCapacitor;

  return {
    appStyle: {
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-family-sans)',
      paddingTop: usesSafeArea ? topInset : '0',
      paddingBottom: usesSafeArea ? 'var(--safe-area-bottom)' : '0',
    },
    shellStyle: {
      maxWidth: 'var(--layout-max-width)',
      borderRadius: 'var(--radius-r4)',
    },
  };
}

/**
 * 应用入口 — 路由配置 + 全局布局
 * 启动时初始化认证和同步服务
 * 包裹ErrorBoundary保证永远可玩
 * 使用HashRouter兼容PWA和Capacitor
 */
export default function App() {
  const shellEnv = getShellEnvironment();
  const isE2E = import.meta.env.VITE_E2E === '1';
  const lang = useSettingsStore((s) => s.lang);
  const isMuted = useSettingsStore((s) => s.isMuted);
  const setAuthLoadingDone = useAuthStore((s) => s.setLoadingDone);
  const { appStyle, shellStyle } = getAppShellStyles(shellEnv);

  /**
   * 启动时根据功能开关初始化后端能力。
   * 当前版本关闭云同步时，仅把认证仓库标记为初始化完成，避免本地模式残留加载态。
   */
  useEffect(() => {
    if (isE2E) return;
    if (!APP_FEATURES.cloudSyncEnabled) {
      setAuthLoadingDone();
      SyncService.clearPendingQueue();
      SyncService.resetHydrationState();
      return;
    }

    AuthService.init();
    SyncService.init();
  }, [isE2E, setAuthLoadingDone]);

  /**
   * 初始化原生返回键与 App 生命周期桥接
   * 仅在 Capacitor 环境生效，Web/PWA 会自动跳过。
   */
  useEffect(() => {
    if (isE2E) return undefined;

    let dispose = () => {};
    let isDisposed = false;

    NativeAppService.init()
      .then((cleanup) => {
        if (isDisposed) {
          cleanup();
          return;
        }
        dispose = cleanup;
      })
      .catch((error) => {
        console.warn('[App] 原生导航桥接初始化失败', error);
      });

    return () => {
      isDisposed = true;
      dispose();
    };
  }, [isE2E]);

  /**
   * 将已持久化的语言偏好再次同步给 i18n。
   * 线上环境中即使 store rehydrate 晚于 i18n 初始化，这里也会把最终语言校正回来。
   */
  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  /**
   * 将持久化的背景音乐静音状态同步给 AudioService。
   * 这样即使用户重启 App，进入游戏前没有手动点过开关，音频服务也不会和 store 脱节。
   */
  useEffect(() => {
    AudioService.setMuted(isMuted);
  }, [isMuted]);

  return (
    <ErrorBoundary>
      <div
        className="app-container w-full min-h-screen h-[100dvh] font-sans overflow-hidden relative"
        style={appStyle}
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

        {/* 路由容器 — 统一页面壳：手机 4 列 / 平板 8 列 / 桌面 12 列 */}
        <div className="relative z-10 h-full px-4 sm:px-6 lg:px-8">
          <div
            className="mx-auto h-full w-full overflow-hidden bg-white/30 transition-all duration-300 sm:border-x sm:border-stone-200/20 sm:shadow-2xl"
            style={shellStyle}
          >
            <HashRouter>
              <AnimatedRoutes />
            </HashRouter>
          </div>
        </div>

        <ConfirmDialog />
        <ToastCenter />
      </div>
    </ErrorBoundary>
  );
}
