/**
 * 抽象符号因子插件 — 几何符号记忆
 * 使用抽象几何符号作为视觉刺激素材
 * 适合高难度训练，符号间的相似度更高
 */
import FactorRegistry from '../FactorRegistry.js';

const SYMBOL_POOL = ['△', '○', '□', '◇', '☆', '▽', '◎', '▣', '◐', '◑', '⊕', '⊗', '⊙', '⊚', '△', '⬢'];

/**
 * 从池中随机选取一个元素
 * @param {any[]} pool
 * @returns {any}
 */
function randomPick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

FactorRegistry.register({
  id: 'symbol',
  name: '符号',
  type: 'visual',
  pool: SYMBOL_POOL,

  /**
   * 生成随机符号因子
   * @returns {import('../types').Factor}
   */
  generate() {
    return {
      id: FactorRegistry.generateId(),
      type: 'symbol',
      value: randomPick(SYMBOL_POOL),
    };
  },

  /**
   * 比较两个符号因子是否相同
   * @param {import('../types').Factor} a
   * @param {import('../types').Factor} b
   * @returns {boolean}
   */
  compare(a, b) {
    return a.value === b.value;
  },

  /**
   * 渲染符号因子值
   * @param {import('../types').Factor} factor
   * @returns {string}
   */
  render(factor) {
    return factor.value;
  },
});
