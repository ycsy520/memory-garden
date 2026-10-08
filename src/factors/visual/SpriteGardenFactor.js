/**
 * 花园精灵图因子插件 — 唯一视觉因子池
 * 使用 6×6 精灵图（31 个有效格）作为刺激素材，
 * 替代跨平台不稳定的 Emoji（原花朵/动物/食物三池已整合）。
 *
 * value = 精灵图格子索引（number），由 FactorSprite 组件裁切渲染。
 */
import FactorRegistry from '../FactorRegistry.js';
import { getAllStimuli } from '../../engine/stimuli/GardenStimuli.js';

/** 单一因子池：31 个花园素材 */
const SPRITE_POOL = getAllStimuli();

/**
 * 从池中随机选取一个素材
 * @param {any[]} pool
 * @returns {any}
 */
function randomPick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

FactorRegistry.register({
  id: 'sprite-garden',
  name: '花园',
  type: 'visual',
  pool: SPRITE_POOL,

  /**
   * 生成随机花园因子（value 为精灵图格子索引）
   * @returns {import('../types').Factor}
   */
  generate() {
    const stimulus = randomPick(SPRITE_POOL);
    return {
      id: FactorRegistry.generateId(),
      type: 'sprite-garden',
      value: stimulus.display,
      meta: { stimulusId: stimulus.id, label: stimulus.label },
    };
  },

  /**
   * 比较两个因子是否相同（按格子索引）
   * @param {import('../types').Factor} a
   * @param {import('../types').Factor} b
   * @returns {boolean}
   */
  compare(a, b) {
    return a.value === b.value;
  },

  /**
   * 渲染因子值（返回格子索引，由上层组件裁切渲染）
   * @param {import('../types').Factor} factor
   * @returns {number}
   */
  render(factor) {
    return factor.value;
  },
});
