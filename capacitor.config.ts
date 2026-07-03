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
      // 与主题色一致
      backgroundColor: '#7C9A6E',
      style: 'LIGHT', // 浅色内容（深色状态栏文字）
      overlaysWebView: false,
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
