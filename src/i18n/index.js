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

/**
 * 检测运行平台的语言环境
 * 精确匹配优先（zh-CN / zh-TW / en-US），其次前缀匹配（zh-* 归 zh-CN），托底为英文
 * @returns {'zh-CN'|'zh-TW'|'en-US'} 检测到的语言代码
 */
function detectPlatformLanguage() {
  // 优先取用户在系统中配置的首选语言列表（更准确）
  const candidates = [
    ...(typeof navigator !== 'undefined' && navigator.languages ? Array.from(navigator.languages) : []),
    typeof navigator !== 'undefined' ? navigator.language : null,
  ].filter(Boolean);

  const supportedExact = ['zh-CN', 'zh-TW', 'en-US'];
  for (const lang of candidates) {
    if (supportedExact.includes(lang)) {
      return lang;
    }
  }

  // 前缀匹配：zh-* 统一归到简体中文
  for (const lang of candidates) {
    if (lang && lang.toLowerCase().startsWith('zh')) {
      return 'zh-CN';
    }
  }

  // 托底语言：英文
  return 'en-US';
}

// 从本地存储读取用户语言偏好
// useSettingsStore 使用 zustand persist，落盘格式为 { state: { lang, hasLangSetByUser }, version }，需解包兼容
const savedLang = StorageService.get('memory-garden:settings');
const savedLangValue = savedLang?.state?.lang ?? savedLang?.lang;
const hasLangSetByUser = savedLang?.state?.hasLangSetByUser; // false/true/undefined
// 仅当 hasLangSetByUser 明确为 false 时（全新首次启动），走平台语言自动匹配
// hasLangSetByUser === true → 用户主动设置，优先用户值
// hasLangSetByUser === undefined → 老用户升级，视为已主动设置，保留原有值
const isAutoMatched = (hasLangSetByUser === false);
const defaultLang = isAutoMatched
  ? detectPlatformLanguage()
  : (savedLangValue || detectPlatformLanguage());

/**
 * 首次启动自动匹配完成后，将匹配结果同步回写 storage settings.lang
 * 确保 zustand persist rehydrate 时 settings.lang 与 i18n 语言一致
 * 仅同步 lang 字段，不覆盖其他设置
 */
if (isAutoMatched && typeof window !== 'undefined') {
  try {
    const existing = StorageService.get('memory-garden:settings');
    StorageService.set('memory-garden:settings', {
      ...(existing || {}),
      state: {
        ...(existing?.state || {}),
        lang: defaultLang,
        // 保持 hasLangSetByUser=false，标记仍为"用户未主动设置"
        hasLangSetByUser: false,
      },
      version: existing?.version ?? 0,
    });
  } catch (e) {
    console.warn('[i18n] 同步自动匹配语言到storage失败', e);
  }
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
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * 语言变化时同步到 <html lang="..."> 属性（无障碍 + 测试读取用）
 */
function syncHtmlLang(lng) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('lang', lng);
  }
}
syncHtmlLang(i18n.language || defaultLang);
i18n.on('languageChanged', syncHtmlLang);

// 测试辅助：将 i18n 暴露到全局（便于冒烟测试读取 resolvedLanguage）
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}

export default i18n;
