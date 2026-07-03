/**
 * PWA安装提示Hook — 检测是否可安装并提供安装方法
 * 
 * @version 3.0
 * @author Memory Garden Team
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * PWA安装Hook
 * @returns {{ isInstallable: boolean, install: Function }}
 */
export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    /**
     * 拦截 beforeinstallprompt 事件
     * @param {Event} e
     */
    const handleBeforeInstallPrompt = (e) => {
      // 阻止浏览器默认安装提示
      e.preventDefault();
      // 保存事件以便后续触发
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    /**
     * 应用安装完成后
     */
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * 触发安装提示
   */
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setIsInstallable(false);
    
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return { isInstallable, install };
}
