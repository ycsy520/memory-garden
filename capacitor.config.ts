import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memorygarden.app',
  appName: '记忆小花园',
  webDir: 'dist',
  server: {
    // 开发时可指向 Vite dev server
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      // 使用透明沉浸式状态栏，让页面背景自然延伸到系统栏区域。
      style: 'LIGHT',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#F7F5EF',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    // 允许混合内容（如果需要加载 http 资源）
    allowMixedContent: false,
  },
  ios: {
    // iOS 相关配置
    scheme: 'Memory Garden',
    contentInset: 'automatic',
  },
};

export default config;
