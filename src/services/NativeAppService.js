import PlatformService from '@services/PlatformService';
import i18n from '@i18n/index';
import useConfirmStore from '@stores/useConfirmStore';

export const NATIVE_BACK_REQUEST_EVENT = 'memory-garden:native-back-request';
export const NATIVE_PAUSE_REQUEST_EVENT = 'memory-garden:native-pause-request';

/**
 * 读取当前 HashRouter 路径
 * @returns {string}
 */
function getCurrentHashPath() {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash || '#/';
  const path = hash.replace(/^#/, '');
  return path || '/';
}

/**
 * 以 replace 方式切换 hash 路由，避免硬件返回制造额外历史栈。
 *
 * @param {string} path
 * @returns {void}
 */
function replaceHashPath(path) {
  if (typeof window === 'undefined') return;
  const nextUrl = `${window.location.pathname}${window.location.search}#${path}`;
  window.location.replace(nextUrl);
}

/**
 * 关闭当前确认弹窗
 * 原生返回键再次按下时，优先视为“取消当前确认”。
 *
 * @returns {boolean}
 */
function closeConfirmIfOpen() {
  const { isOpen, close } = useConfirmStore.getState();
  if (!isOpen) return false;
  close(false);
  return true;
}

/**
 * 把原生返回键转成当前应用路由能理解的动作。
 * 游戏中的返回交给 GameScreen 自己处理，其余页面统一在这里兜底。
 *
 * @returns {Promise<void>}
 */
async function handleNativeBackButton() {
  if (closeConfirmIfOpen()) return;

  const path = getCurrentHashPath();
  if (path === '/game') {
    window.dispatchEvent(new CustomEvent(NATIVE_BACK_REQUEST_EVENT));
    return;
  }

  if (path.startsWith('/about/')) {
    window.history.back();
    return;
  }

  if (path === '/settings'
    || path === '/stats'
    || path === '/leaderboard'
    || path === '/achievements'
    || path === '/finished') {
    replaceHashPath('/menu');
    return;
  }

  if (path === '/guide') {
    replaceHashPath('/');
    return;
  }

  if (path === '/' || path === '/menu') {
    const { App } = await import('@capacitor/app');
    await App.exitApp();
    return;
  }

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  replaceHashPath('/menu');
}

/**
 * 将原生前后台变化转成页面事件
 * 游戏切到后台时，通知 GameScreen 主动暂停。
 *
 * @param {{ isActive: boolean }} state
 * @returns {void}
 */
function handleAppStateChange(state) {
  if (state.isActive) return;
  if (getCurrentHashPath() !== '/game') return;
  window.dispatchEvent(new CustomEvent(NATIVE_PAUSE_REQUEST_EVENT));
}

const NativeAppService = {
  /**
   * 初始化 Android / iOS 原生返回键与生命周期桥接
   * 仅在 Capacitor 环境中启用。
   *
   * @returns {Promise<() => void>}
   */
  async init() {
    if (!PlatformService.detect().isCapacitor || typeof window === 'undefined') {
      return () => {};
    }

    const { App } = await import('@capacitor/app');

    const backListener = await App.addListener('backButton', () => {
      handleNativeBackButton().catch((error) => {
        console.warn('[NativeAppService] backButton 处理失败', error);
      });
    });

    const appStateListener = await App.addListener('appStateChange', (state) => {
      try {
        handleAppStateChange(state);
      } catch (error) {
        console.warn('[NativeAppService] appStateChange 处理失败', error);
      }
    });

    console.info('[NativeAppService] 原生导航桥接已启用', {
      platform: PlatformService.detect().os,
      language: i18n.language,
    });

    return () => {
      backListener.remove();
      appStateListener.remove();
    };
  },
};

export default NativeAppService;
