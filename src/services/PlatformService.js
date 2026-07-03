/**
 * 平台检测服务 — 检测运行环境和设备类型
 * v3.1: 新增 Capacitor 原生环境检测 + 原生功能桥接
 * 
 * @version 3.1
 * @author Memory Garden Team
 */

/**
 * 检测是否运行在 Capacitor 原生壳中
 * @returns {boolean}
 */
function isCapacitor() {
  return typeof window !== 'undefined' && 
         window.Capacitor !== undefined && 
         window.Capacitor.isNativePlatform?.() === true;
}

const PlatformService = {
  _info: null,

  /**
   * 检测当前平台信息
   * @returns {{ os: string, isTouch: boolean, isMobile: boolean, isTablet: boolean, isDesktop: boolean, isCapacitor: boolean, isPWA: boolean }}
   */
  detect() {
    if (this._info) return this._info;

    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const width = window.innerWidth;

    let os = 'unknown';
    if (/iPad|iPhone|iPod/.test(ua)) os = 'ios';
    else if (/Android/.test(ua)) os = 'android';
    else if (/Windows/.test(ua)) os = 'windows';
    else if (/Mac/.test(ua)) os = 'macos';
    else if (/Linux/.test(ua)) os = 'linux';

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = !isMobile && !isTablet;
    const _isCapacitor = isCapacitor();
    // PWA: standalone 模式或 Capacitor 原生壳
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || _isCapacitor;

    this._info = { os, isTouch, isMobile, isTablet, isDesktop, isCapacitor: _isCapacitor, isPWA };
    return this._info;
  },

  /**
   * 触发振动反馈
   * 优先使用 Capacitor Haptics，降级到 Web Vibration API
   * @param {number} duration - 振动时长(ms)，仅 Web API 使用
   */
  async vibrate(duration = 50) {
    try {
      if (isCapacitor()) {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.vibrate({ duration });
      } else if (navigator.vibrate) {
        navigator.vibrate(duration);
      }
    } catch {
      // 振动失败静默忽略
    }
  },

  /**
   * 触发触觉反馈（轻击）
   * Capacitor 专用，Web 环境降级为短振动
   */
  async impact() {
    try {
      if (isCapacitor()) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    } catch {
      // 静默忽略
    }
  },

  /**
   * 原生分享
   * 优先使用 Capacitor Share plugin，降级到 Web Share API
   * @param {{ title: string, text: string, url?: string }} data
   * @returns {Promise<boolean>} 是否成功
   */
  async share(data) {
    try {
      if (isCapacitor()) {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: data.title,
          text: data.text,
          url: data.url,
          dialogTitle: '分享成绩',
        });
        return true;
      }
      if (navigator.share) {
        await navigator.share(data);
        return true;
      }
      return false;
    } catch {
      // 用户取消分享不算失败
      return false;
    }
  },

  /**
   * 设置状态栏样式
   * 仅 Capacitor 环境生效
   * @param {{ style?: 'LIGHT' | 'DARK', backgroundColor?: string }} options
   */
  async setStatusBar(options = {}) {
    try {
      if (isCapacitor()) {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({
          style: options.style === 'DARK' ? Style.Dark : Style.Light,
        });
        if (options.backgroundColor) {
          await StatusBar.setBackgroundColor({ color: options.backgroundColor });
        }
      }
    } catch {
      // 静默忽略
    }
  },

  /**
   * 隐藏启动画面
   * 仅 Capacitor 环境生效
   */
  async hideSplash() {
    try {
      if (isCapacitor()) {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      }
    } catch {
      // 静默忽略
    }
  },
};

export default PlatformService;
