/**
 * Emoji因子插件 — 世界名花
 * 最基础的视觉记忆因子，使用花朵emoji作为刺激素材
 * 后续可注册更多Emoji因子 (动物、食物等)
 */
import FactorRegistry from '../FactorRegistry.js';

const FLOWER_POOL = ['🌹', '🌻', '🌷', '🌼', '🌸', '🌺', '🪷', '🏵️'];

/**
 * 从池中随机选取一个元素
 * @param {any[]} pool
 * @returns {any}
 */
function randomPick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

FactorRegistry.register({
  id: 'emoji-flower',
  name: '花朵',
  type: 'visual',
  pool: FLOWER_POOL,

  /**
   * 生成随机花朵因子
   * @returns {import('../types').Factor}
   */
  generate() {
    return {
      id: FactorRegistry.generateId(),
      type: 'emoji-flower',
      value: randomPick(FLOWER_POOL),
    };
  },

  /**
   * 比较两个花朵因子是否相同
   * @param {import('../types').Factor} a
   * @param {import('../types').Factor} b
   * @returns {boolean}
   */
  compare(a, b) {
    return a.value === b.value;
  },

  /**
   * 渲染花朵因子为React元素
   * 注意: render函数是唯一允许返回JSX的因子方法
   * @param {import('../types').Factor} factor
   * @returns {string} 返回emoji值，由上层组件负责渲染
   */
  render(factor) {
    return factor.value;
  },
});

export { FLOWER_POOL, randomPick };
