/**
 * 信号检测论（Signal Detection Theory）工具
 *
 * 核心指标：
 * - d'（灵敏度）：区分信号和噪声的能力
 * - β（反应偏向）：判断标准的严格程度
 * - 准确率：整体判断正确率
 *
 * 参考：
 * - Macmillan & Creelman (2005). Detection Theory: A User's Guide
 * - Green & Swets (1966). Signal Detection Theory and Psychophysics
 */

/**
 * 标准正态分布的逆CDF（近似）
 * 使用 Rational Approximation 方法
 * @param {number} p - 概率 (0-1)
 * @returns {number} Z 分数
 */
function normInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Rational approximation for the normal quantile function
  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
    4.374664141464968e+00, 2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
           ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r + a[1])*r + a[2])*r + a[3])*r + a[4])*r + a[5]) * q /
           (((((b[0]*r + b[1])*r + b[2])*r + b[3])*r + b[4])*r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
            ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
  }
}

/**
 * 计算信号检测论指标
 *
 * @param {Object} params
 * @param {number} params.hits - 命中数
 * @param {number} params.misses - 遗漏数
 * @param {number} params.falseAlarms - 误判数
 * @param {number} params.correctRejections - 正确排除数
 * @returns {{ dPrime: number, beta: number, hitRate: number, falseAlarmRate: number, accuracy: number }}
 */
export function calculateSDT({ hits, misses, falseAlarms, correctRejections }) {
  const totalTargets = hits + misses;
  const totalNonTargets = falseAlarms + correctRejections;

  // 避免除零：使用校正公式 (hits + 0.5) / (totalTargets + 1)
  const hitRate = totalTargets > 0 ? (hits + 0.5) / (totalTargets + 1) : 0.5;
  const falseAlarmRate = totalNonTargets > 0 ? (falseAlarms + 0.5) / (totalNonTargets + 1) : 0.5;

  // Z 分数
  const zHit = normInv(hitRate);
  const zFA = normInv(falseAlarmRate);

  // d' = Z(Hit Rate) - Z(False Alarm Rate)
  const dPrime = zHit - zFA;

  // β = exp(-(zHit² - zFA²) / 2)
  const beta = Math.exp(-(zHit * zHit - zFA * zFA) / 2);

  // 准确率
  const total = hits + misses + falseAlarms + correctRejections;
  const accuracy = total > 0 ? (hits + correctRejections) / total : 0;

  return {
    dPrime: Math.round(dPrime * 100) / 100,
    beta: Math.round(beta * 100) / 100,
    hitRate: Math.round(hitRate * 1000) / 1000,
    falseAlarmRate: Math.round(falseAlarmRate * 1000) / 1000,
    accuracy: Math.round(accuracy * 1000) / 1000,
  };
}

/**
 * 解读 d' 值
 * @param {number} dPrime
 * @returns {{ level: string, description: string }}
 */
export function interpretDPrime(dPrime) {
  if (dPrime >= 3.0) return { level: '优秀', description: '记忆辨别力极强' };
  if (dPrime >= 2.0) return { level: '良好', description: '记忆辨别力较强' };
  if (dPrime >= 1.0) return { level: '中等', description: '记忆辨别力一般' };
  if (dPrime >= 0.5) return { level: '较弱', description: '记忆辨别力较弱' };
  return { level: '需提升', description: '记忆辨别力不足' };
}

/**
 * 解读 β 值
 * @param {number} beta
 * @returns {{ type: string, description: string }}
 */
export function interpretBeta(beta) {
  if (beta > 1.5) return { type: '保守型', description: '倾向于不标记，可能遗漏目标' };
  if (beta > 0.8) return { type: '均衡型', description: '判断标准适中' };
  return { type: '激进型', description: '倾向于标记，可能误判较多' };
}
