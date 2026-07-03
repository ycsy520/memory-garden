/**
 * 平台检测Hook — 获取当前设备信息
 * 用于自适应UI (触摸尺寸、交互方式等)
 */
import { useState, useEffect } from 'react';
import PlatformService from '@services/PlatformService';

/**
 * @returns {{ os: string, isTouch: boolean, isMobile: boolean, isTablet: boolean, isDesktop: boolean }}
 */
export default function usePlatform() {
  const [platform, setPlatform] = useState(() => PlatformService.detect());

  useEffect(() => {
    const handleResize = () => {
      PlatformService._info = null; // 清除缓存
      setPlatform(PlatformService.detect());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return platform;
}
