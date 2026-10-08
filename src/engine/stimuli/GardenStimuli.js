/**
 * 花园刺激素材库 — 精灵图版（单一池）
 *
 * 素材来源：public/img/g.png（6×6 精灵图，31 个有效格，每格约 299px）
 * 背景为 rgb(241, 240, 236) 轻微纹理暖纸色，渲染时与 UI 暖白色系协调。
 *
 * display 字段为精灵图格子索引（0~30），由 FactorSprite 组件裁切渲染，
 * 不再使用跨平台不稳定的 Emoji。
 *
 * similarityGroup 用于 TrialGenerator 的 lure（相似干扰）逻辑，
 * 按"易混淆的视觉家族"分组（同色系/同类别）。
 *
 * @version 6.0
 */

/**
 * 精灵图元数据表（顺序 = 精灵图格子索引，逐行逐列）
 * 字段：id / label / category / similarityGroup / visualComplexity
 */
const SPRITE_DEFS = [
  { id: 'fern',       label: '蕨叶',   category: 'leaf',      similarityGroup: 'green-leaf',    visualComplexity: 'medium' },
  { id: 'clover',     label: '四叶草', category: 'leaf',      similarityGroup: 'green-leaf',    visualComplexity: 'low' },
  { id: 'mint',       label: '薄荷',   category: 'leaf',      similarityGroup: 'green-leaf',    visualComplexity: 'low' },
  { id: 'lettuce',    label: '生菜',   category: 'vegetable', similarityGroup: 'green-veg',     visualComplexity: 'low' },
  { id: 'viola',      label: '角堇',   category: 'flower',    similarityGroup: 'purple-flower', visualComplexity: 'medium' },
  { id: 'peony',      label: '牡丹',   category: 'flower',    similarityGroup: 'pink-flower',   visualComplexity: 'medium' },

  { id: 'fiveleaf',   label: '五叶草', category: 'leaf',      similarityGroup: 'green-leaf',    visualComplexity: 'low' },
  { id: 'rosemary',   label: '迷迭香', category: 'leaf',      similarityGroup: 'green-leaf',    visualComplexity: 'medium' },
  { id: 'blueberry',  label: '蓝莓',   category: 'fruit',     similarityGroup: 'blue',          visualComplexity: 'low' },
  { id: 'eggplant',   label: '茄子',   category: 'vegetable', similarityGroup: 'purple-veg',    visualComplexity: 'low' },
  { id: 'gerbera',    label: '非洲菊', category: 'flower',    similarityGroup: 'warm-flower',   visualComplexity: 'medium' },
  { id: 'lavender',   label: '薰衣草', category: 'flower',    similarityGroup: 'purple-flower', visualComplexity: 'medium' },

  { id: 'strawberry', label: '草莓',   category: 'fruit',     similarityGroup: 'red-fruit-veg', visualComplexity: 'low' },
  { id: 'pumpkin',    label: '南瓜',   category: 'vegetable', similarityGroup: 'orange-veg',    visualComplexity: 'low' },
  { id: 'carrot',     label: '胡萝卜', category: 'vegetable', similarityGroup: 'orange-veg',    visualComplexity: 'low' },
  { id: 'pea',        label: '豌豆荚', category: 'vegetable', similarityGroup: 'green-veg',     visualComplexity: 'low' },
  { id: 'cosmos',     label: '波斯菊', category: 'flower',    similarityGroup: 'pink-flower',   visualComplexity: 'medium' },
  { id: 'daisy',      label: '雏菊',   category: 'flower',    similarityGroup: 'white-flower',  visualComplexity: 'low' },

  { id: 'cucumber',   label: '黄瓜',   category: 'vegetable', similarityGroup: 'green-veg',     visualComplexity: 'low' },
  { id: 'pepper',     label: '红甜椒', category: 'vegetable', similarityGroup: 'red-fruit-veg', visualComplexity: 'low' },
  { id: 'tomato',     label: '番茄',   category: 'vegetable', similarityGroup: 'red-fruit-veg', visualComplexity: 'low' },
  { id: 'narcissus',  label: '水仙',   category: 'flower',    similarityGroup: 'white-flower',  visualComplexity: 'medium' },
  { id: 'violet',     label: '紫罗兰', category: 'flower',    similarityGroup: 'purple-flower', visualComplexity: 'medium' },
  { id: 'tulip',      label: '郁金香', category: 'flower',    similarityGroup: 'pink-flower',   visualComplexity: 'low' },

  { id: 'lilyvalley', label: '铃兰',   category: 'flower',    similarityGroup: 'white-flower',  visualComplexity: 'medium' },
  { id: 'lily',       label: '百合',   category: 'flower',    similarityGroup: 'white-flower',  visualComplexity: 'medium' },
  { id: 'carnation',  label: '康乃馨', category: 'flower',    similarityGroup: 'red-flower',    visualComplexity: 'medium' },
  { id: 'hydrangea',  label: '绣球花', category: 'flower',    similarityGroup: 'blue',          visualComplexity: 'medium' },
  { id: 'pansy',      label: '三色堇', category: 'flower',    similarityGroup: 'purple-flower', visualComplexity: 'medium' },
  { id: 'sunflower',  label: '向日葵', category: 'flower',    similarityGroup: 'warm-flower',   visualComplexity: 'low' },

  { id: 'rose',       label: '玫瑰',   category: 'flower',    similarityGroup: 'pink-flower',   visualComplexity: 'medium' },
];

/**
 * 完整素材定义（display = 精灵图格子索引，type = 'sprite'）
 * @type {import('../types').StimulusDef[]}
 */
const GARDEN_STIMULI = SPRITE_DEFS.map((def, index) => ({
  ...def,
  display: index,
  type: 'sprite',
  suitableForChildren: true,
  suitableForOlderAdults: true,
}));

/**
 * 获取全部刺激素材
 * @returns {import('../types').StimulusDef[]}
 */
export function getAllStimuli() {
  return GARDEN_STIMULI;
}

/**
 * 按ID获取素材
 * @param {string} id
 * @returns {import('../types').StimulusDef|undefined}
 */
export function getStimulusById(id) {
  return GARDEN_STIMULI.find((s) => s.id === id);
}

/**
 * 获取与指定素材相似的其他素材（同 similarityGroup，用于 lure）
 * @param {string} stimulusId
 * @returns {import('../types').StimulusDef[]}
 */
export function getSimilarStimuli(stimulusId) {
  const target = getStimulusById(stimulusId);
  if (!target) return [];
  return GARDEN_STIMULI.filter(
    (s) => s.id !== stimulusId && s.similarityGroup === target.similarityGroup
  );
}

/**
 * 获取所有相似组ID
 * @returns {string[]}
 */
export function getSimilarityGroups() {
  return [...new Set(GARDEN_STIMULI.map((s) => s.similarityGroup))];
}
