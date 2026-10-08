/**
 * Sentry 错误监控配置
 * 仅在生产环境初始化，开发环境跳过
 * 
 * 使用方式:
 * 1. 注册 https://sentry.io 获取 DSN
 * 2. 将 DSN 设置为环境变量 VITE_SENTRY_DSN
 * 3. 或直接替换下方 SENTRY_DSN 占位符
 * 
 * @version 3.3
 * @author Memory Garden Team
 */
import * as Sentry from '@sentry/react';
import APP_FEATURES from './appFeatures';

// DSN 占位符 — 替换为你的 Sentry 项目 DSN
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

/**
 * 判断当前版本是否允许远程错误上报。
 * Google Play 本地存储版本默认关闭远程上报，避免与 Data safety 口径冲突。
 *
 * @returns {boolean}
 */
export function isSentryEnabled() {
  return APP_FEATURES.remoteReportingEnabled && !import.meta.env.DEV && !!SENTRY_DSN;
}

/**
 * 初始化 Sentry（仅生产环境 + 有 DSN 时）
 */
export function initSentry() {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `memory-garden@${import.meta.env.VITE_APP_VERSION || '3.3.0'}`,
    
    // 采样率
    tracesSampleRate: 0.1, // 性能追踪 10%
    replaysSessionSampleRate: 0, // 关闭 Session Replay
    replaysOnErrorSampleRate: 0, // 关闭错误 Replay
    
    // 过滤噪声
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
    
    // 上下文清理
    beforeSend(event) {
      // 移除敏感信息
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

/**
 * 统一封装异常上报入口。
 * 当当前版本关闭远程上报时，保持本地可玩，不触发任何远程请求。
 *
 * @param {unknown} error - 捕获到的异常
 * @param {import('@sentry/types').CaptureContext} [context] - 附加上下文
 */
export function reportException(error, context) {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.captureException(error, context);
}
