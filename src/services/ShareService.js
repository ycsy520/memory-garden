/**
 * 分享服务 — 生成成绩分享内容
 * v3.1: 优先使用 Capacitor 原生分享，降级到 Web Share API，最终降级到复制文本
 * v4.0: 国际化支持
 */

import PlatformService from '@services/PlatformService';
import i18n from '@i18n/index';

const ShareService = {
  /**
   * 检测是否支持分享（原生或 Web Share API）
   * @returns {boolean}
   */
  canShare() {
    return PlatformService.detect().isCapacitor || typeof navigator.share === 'function';
  },

  /**
   * 生成分享文本（使用 i18n 翻译）
   * @param {Object} session - 游戏会话数据
   * @returns {string}
   */
  generateText(session) {
    const accuracy = Math.round((session.accuracy || 0) * 100);
    const score = session.score || 0;
    const mode = session.modeId || `N${session.difficulty || 1}`;

    return i18n.t('services.share.template', { mode, score, accuracy });
  },

  /**
   * 分享成绩
   * @param {Object} session - 游戏会话数据
   * @param {string} lang - 当前语言
   * @returns {Promise<boolean>} 是否分享成功
   */
  async share(session, lang) {
    const text = this.generateText(session, lang);
    const title = 'Memory Garden';

    // 优先: Capacitor 原生分享
    const nativeResult = await PlatformService.share({ title, text });
    if (nativeResult) return true;

    // 降级: Web Share API
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text });
        return true;
      } catch (e) {
        if (e.name === 'AbortError') return false;
        console.warn('[ShareService] Web Share失败，降级到复制', e);
      }
    }

    // 最终降级: 复制到剪贴板
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('[ShareService] 剪贴板写入失败', e);
      this._fallbackCopy(text);
      return false;
    }
  },

  /**
   * 最终降级复制方案
   * @param {string} text
   */
  _fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('[ShareService] 复制失败', e);
    }
    document.body.removeChild(textarea);
  },
};

export default ShareService;
