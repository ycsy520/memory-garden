/**
 * 动物Emoji因子插件 — 可爱动物
 * 使用动物emoji作为视觉刺激素材
 */
import FactorRegistry from '../FactorRegistry.js';

const ANIMAL_POOL = ['🐱', '🐶', '🐰', '🐼', '🐨', '🦊', '🐸', '🐵', '🦁', '🐯', '🐮', '🐷'];

/**
 * 从池中随机选取一个元素
 * @param {any[]} pool
 * @returns {any}
 */
function randomPick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

FactorRegistry.register({
  id: 'emoji-animal',
  name: '动物',
  type: 'visual',
  pool: ANIMAL_POOL,

  /**
   * 生成随机动物因子
   * @returns {import('../types').Factor}
   */
  generate() {
    return {
      id: FactorRegistry.generateId(),
      type: 'emoji-animal',
      value: randomPick(ANIMAL_POOL),
    };
  },

  /**
   * 比较两个动物因子是否相同
   * @param {import('../types').Factor} a
   * @param {import('../types').Factor} b
   * @returns {boolean}
   */
  compare(a, b) {
    return a.value === b.value;
  },

  /**
   * 渲染动物因子值
   * @param {import('../types').Factor} factor
   * @returns {string}
   */
  render(factor) {
    return factor.value;
  },
});
