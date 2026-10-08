/**
 * 素材文案工具 — 用户界面文案统一为跨素材自然语言
 * v5.1: 所有用户可见文案改为 i18n 国际化
 *
 * 设计原则（方案 §10）：
 * - 面向用户不使用"花/小动物/项"等绑定具体类别的称谓
 * - 统一使用"这个/刚才出现的/上上次出现的"
 * - 按钮使用"一样/不一样"（贴合 N-back 的判断本质）
 * - 超时叫"未作答"，不叫"放弃"
 * - 内部数据结构仍保留 category 字段，但不暴露给用户
 *
 * @version 5.1
 */

import i18n from '@i18n/index';

// ============================================================
// 按钮文案（双按钮：一样 / 不一样）
// ============================================================

/** 按钮"一样"默认文案 */
export function getSameButtonText() {
  return i18n.t('stimulus.same');
}

/** 按钮"不一样"默认文案 */
export function getDiffButtonText() {
  return i18n.t('stimulus.different');
}

// ============================================================
// 底部提示区文字（随 N 变化）
// ============================================================

/**
 * 底部操作提示
 * @param {number} n
 * @returns {string}
 */
export function getHintText(n = 1) {
  switch (n) {
    case 1:
      return i18n.t('stimulus.hintN1');
    case 2:
      return i18n.t('stimulus.hintN2');
    case 3:
      return i18n.t('stimulus.hintN3');
    default:
      return i18n.t('stimulus.hintNx', { n });
  }
}

// ============================================================
// 引导文案（通用，不绑定素材类别）
// ============================================================

/**
 * 通用引导标题
 * @param {number} n
 * @returns {string}
 */
export function getGenericIntroTitle(n = 1) {
  switch (n) {
    case 1:
      return i18n.t('stimulus.rememberRecent1');
    case 2:
      return i18n.t('stimulus.rememberRecent2');
    case 3:
      return i18n.t('stimulus.rememberRecent3');
    default:
      return i18n.t('stimulus.rememberRecentN');
  }
}

/**
 * 通用引导正文
 * @param {number} n
 * @returns {string}
 */
export function getGenericIntroBody(n = 1) {
  switch (n) {
    case 1:
      return i18n.t('stimulusIntro.n1');
    case 2:
      return i18n.t('stimulusIntro.n2');
    case 3:
      return i18n.t('stimulusIntro.n3');
    default:
      return i18n.t('stimulusIntro.nDefault');
  }
}

/**
 * 通用暖身提示
 * @param {number} n
 * @returns {string}
 */
export function getGenericWarmupText(n = 1) {
  return i18n.t('stimulus.warmupCount', { n });
}

/**
 * 暖身结束提示
 * @param {number} n
 * @returns {string}
 */
export function getWarmupEndText(n = 1) {
  switch (n) {
    case 1:
      return i18n.t('stimulus.nowStart1');
    case 2:
      return i18n.t('stimulus.nowStart2');
    case 3:
      return i18n.t('stimulus.nowStart3');
    default:
      return i18n.t('stimulus.nowStartN');
  }
}

// ============================================================
// 引导文案（通用，不绑定素材类别）
// ============================================================
