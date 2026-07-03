/**
 * 素材文案工具 — 用户界面文案统一为跨素材自然语言
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

// ============================================================
// 按钮文案（双按钮：一样 / 不一样）
// ============================================================

/** 按钮"一样"默认文案 */
export function getSameButtonText() {
  return '一样';
}

/** 按钮"不一样"默认文案 */
export function getDiffButtonText() {
  return '不一样';
}

/** 按钮正确反馈（用户点了"一样"且确实是目标） */
export function getSameButtonCorrectText() {
  return '✓ 一样';
}

/** 按钮正确反馈（用户点了"不一样"且确实不是目标） */
export function getDiffButtonCorrectText() {
  return '✓ 不一样';
}

/** 按钮错误反馈（用户点了"一样"但不是目标） */
export function getSameButtonWrongText() {
  return '✗ 这是新来的';
}

/** 按钮错误反馈（用户点了"不一样"但其实是目标） */
export function getDiffButtonWrongText() {
  return '✗ 其实是一样的';
}

// ============================================================
// 卡片底部文字（随 N 变化）
// ============================================================

/**
 * 卡片底部提示文字
 * N=1: "和刚才出现的一样吗？"
 * N=2: "和上上次出现的一样吗？"
 * N=3: "和更早前出现的那个一样吗？"
 *
 * @param {number} n
 * @returns {string}
 */
export function getSeenText(n = 1) {
  switch (n) {
    case 1:
      return '和刚才出现的一样吗？';
    case 2:
      return '和上上次出现的一样吗？';
    case 3:
      return '和更早前出现的那个一样吗？';
    default:
      return `和 ${n} 次前出现的一样吗？`;
  }
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
      return '这个和刚才出现的一样吗？';
    case 2:
      return '这个和上上次出现的一样吗？';
    case 3:
      return '这个和更早前出现的那个一样吗？';
    default:
      return `这个和 ${n} 次前出现的一样吗？`;
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
      return '记住刚出现的';
    case 2:
      return '记住最近两个';
    case 3:
      return '记住最近三个';
    default:
      return '记住它们';
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
      return '如果看到和刚才一样的，就按"一样"。不一样就按"不一样"。';
    case 2:
      return '如果看到和两个之前那个一样的，就按"一样"。慢慢看，想好了再选。';
    case 3:
      return '如果看到和三个之前那个一样的，就按"一样"。慢慢看，想好了再选。';
    default:
      return '如果看到和之前一样的，就按"一样"。不一样就按"不一样"。';
  }
}

/**
 * 通用暖身提示
 * @param {number} n
 * @returns {string}
 */
export function getGenericWarmupText(n = 1) {
  return `前 ${n} 个是热身，你只需要看看，不需要操作。`;
}

/**
 * 暖身结束提示
 * @param {number} n
 * @returns {string}
 */
export function getWarmupEndText(n = 1) {
  switch (n) {
    case 1:
      return '现在开始，记住刚才出现的';
    case 2:
      return '现在开始，记住最近两个';
    case 3:
      return '现在开始，记住最近三个';
    default:
      return '现在开始，记住刚出现的';
  }
}

// ============================================================
// 菜单页文案
// ============================================================

/**
 * 菜单页 N 值选项的描述
 * @param {number} n
 * @returns {{ label: string, desc: string }}
 */
export function getNDesc(n) {
  switch (n) {
    case 1:
      return { label: '刚刚出现', desc: '记住上一个' };
    case 2:
      return { label: '上上次', desc: '记住最近两个' };
    case 3:
      return { label: '更早前', desc: '记住最近三个' };
    default:
      return { label: `${n} 次前`, desc: `记住最近 ${n} 个` };
  }
}

// ============================================================
// 等待态 / 超时文案
// ============================================================

/** 等待态 */
export function getWaitText() {
  return '等待...';
}

/** 超时/未作答反馈 */
export function getTimeoutText() {
  return '还没来得及回答';
}

// ============================================================
// 结算页四分类标签（通用化）
// ============================================================

/**
 * 结算页四分类花园化文案
 * @returns {{ hits: string, misses: string, falseAlarms: string, correctRejections: string, timeouts: string }}
 */
export function getFeedbackLabels() {
  return {
    hits: '认对',
    misses: '漏掉了',
    falseAlarms: '认错',
    correctRejections: '安静看过',
    timeouts: '没来得及',
  };
}
