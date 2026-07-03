/**
 * 食物Emoji因子插件 — 美味食物
 * 使用食物emoji作为视觉刺激素材
 */
import FactorRegistry from '../FactorRegistry.js';

const FOOD_POOL = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🥑', '🌽', '🥕'];

/**
 * 从池中随机选取一个元素
 * @param {any[]} pool
 * @returns {any}
 */
function randomPick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

FactorRegistry.register({
  id: 'emoji-food',
  name: '食物',
  type: 'visual',
  pool: FOOD_POOL,

  /**
   * 生成随机食物因子
   * @returns {import('../types').Factor}
   */
  generate() {
    return {
      id: FactorRegistry.generateId(),
      type: 'emoji-food',
      value: randomPick(FOOD_POOL),
    };
  },

  /**
   * 比较两个食物因子是否相同
   * @param {import('../types').Factor} a
   * @param {import('../types').Factor} b
   * @returns {boolean}
   */
  compare(a, b) {
    return a.value === b.value;
  },

  /**
   * 渲染食物因子值
   * @param {import('../types').Factor} factor
   * @returns {string}
   */
  render(factor) {
    return factor.value;
  },
});
