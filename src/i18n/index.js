/**
 * i18n 国际化初始化
 * 使用i18next + react-i18next
 * 支持语言: zh-CN, zh-TW, en-US
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './zh-CN.json';
import zhTW from './zh-TW.json';
import enUS from './en-US.json';
import StorageService from '@services/StorageService';

// 从本地存储读取用户语言偏好
const savedLang = StorageService.get('memory-garden:settings');
let defaultLang = 'zh-CN';
if (savedLang && savedLang.lang) {
  defaultLang = savedLang.lang;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      'en-US': { translation: enUS },
    },
    lng: defaultLang,
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
