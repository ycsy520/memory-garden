/**
 * 中文双字词因子插件 — 中文文字记忆
 * 使用常见双字词作为视觉刺激素材
 * 渲染为较大字号的文字
 */
import FactorRegistry from '../FactorRegistry.js';

const TEXT_ZH_POOL = [
  '春风', '秋月', '山河', '星海', '云朵', '雨滴', '雪花', '彩虹',
  '森林', '湖泊', '沙漠', '草原', '晚霞', '朝阳', '明月', '清风',
  '花香', '鸟鸣', '流水', '落日', '晨曦', '暮色', '微光', '暖阳',
  '思念', '回忆', '期待', '希望', '勇气', '温暖', '宁静', '自由',
];

/**
 * 从池中随机选取一个元素
 * @param {any[]} pool
 * @returns {any}
 */
function randomPick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

FactorRegistry.register({
  id: 'text-zh',
  name: '中文词',
  type: 'visual',
  pool: TEXT_ZH_POOL,

  /**
   * 生成随机中文词因子
   * @returns {import('../types').Factor}
   */
  generate() {
    return {
      id: FactorRegistry.generateId(),
      type: 'text-zh',
      value: randomPick(TEXT_ZH_POOL),
    };
  },

  /**
   * 比较两个中文词因子是否相同
   * @param {import('../types').Factor} a
   * @param {import('../types').Factor} b
   * @returns {boolean}
   */
  compare(a, b) {
    return a.value === b.value;
  },

  /**
   * 渲染中文词因子值
   * @param {import('../types').Factor} factor
   * @returns {string}
   */
  render(factor) {
    return factor.value;
  },
});
