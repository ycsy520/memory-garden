/**
 * 英文单词因子插件 — 英文文字记忆
 * 使用常见英文单词作为视觉刺激素材
 * 渲染为较大字号的文字
 */
import FactorRegistry from '../FactorRegistry.js';

const TEXT_EN_POOL = [
  'apple', 'house', 'river', 'cloud', 'dream', 'smile', 'heart', 'light',
  'ocean', 'forest', 'garden', 'butterfly', 'rainbow', 'sunrise', 'moonlight',
  'thunder', 'breeze', 'meadow', 'crystal', 'feather', 'diamond', 'velvet',
  'silver', 'golden', 'autumn', 'spring', 'summer', 'winter', 'gentle',
  'brave', 'happy', 'peace',
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
  id: 'text-en',
  name: '英文词',
  type: 'visual',
  pool: TEXT_EN_POOL,

  /**
   * 生成随机英文词因子
   * @returns {import('../types').Factor}
   */
  generate() {
    return {
      id: FactorRegistry.generateId(),
      type: 'text-en',
      value: randomPick(TEXT_EN_POOL),
    };
  },

  /**
   * 比较两个英文词因子是否相同
   * @param {import('../types').Factor} a
   * @param {import('../types').Factor} b
   * @returns {boolean}
   */
  compare(a, b) {
    return a.value === b.value;
  },

  /**
   * 渲染英文词因子值
   * @param {import('../types').Factor} factor
   * @returns {string}
   */
  render(factor) {
    return factor.value;
  },
});
