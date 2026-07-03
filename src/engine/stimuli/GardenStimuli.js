/**
 * 花园素材定义 — MVP 高区分度素材集
 * P0-A 阶段使用 Emoji 作为临时展示，数据结构按 SVG 未来形态设计。
 * 替换 SVG 时只需修改 display 或 assetUrl 字段。
 *
 * 每个素材包含：
 * - id: 唯一标识（后续替换 SVG 时不变）
 * - label: 中文名称
 * - display: 当前展示内容（Emoji 或 SVG 路径）
 * - type: 'emoji' | 'svg'
 * - category: 素材分类
 * - similarityGroup: 相似组（用于 similarStimulus lure）
 * - visualComplexity: 视觉复杂度
 * - suitableForChildren / suitableForOlderAdults: 适用人群
 *
 * @version 5.0
 */

/**
 * @typedef {Object} StimulusDef
 * @property {string} id - 唯一标识
 * @property {string} label - 中文名称
 * @property {string} display - 展示内容（emoji 或 SVG 路径）
 * @property {'emoji'|'svg'} type - 素材类型
 * @property {'flower'|'leaf'|'creature'|'decoration'|'nature'} category - 分类
 * @property {string} similarityGroup - 相似组 ID，同组内素材可用于 lure
 * @property {'low'|'medium'|'high'} visualComplexity - 视觉复杂度
 * @property {boolean} suitableForChildren - 是否适合儿童
 * @property {boolean} suitableForOlderAdults - 是否适合老人
 */

/** MVP 花园素材集：12 个高区分度素材 */
const GARDEN_STIMULI = [
  // === 花卉 ===
  {
    id: 'rose',
    label: '玫瑰',
    display: '🌹',
    type: 'emoji',
    category: 'flower',
    similarityGroup: 'flower-red',
    visualComplexity: 'medium',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
  {
    id: 'sunflower',
    label: '向日葵',
    display: '🌻',
    type: 'emoji',
    category: 'flower',
    similarityGroup: 'flower-yellow',
    visualComplexity: 'medium',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
  {
    id: 'tulip',
    label: '郁金香',
    display: '🌷',
    type: 'emoji',
    category: 'flower',
    similarityGroup: 'flower-red',
    visualComplexity: 'medium',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
  {
    id: 'blossom',
    label: '樱花',
    display: '🌸',
    type: 'emoji',
    category: 'flower',
    similarityGroup: 'flower-pink',
    visualComplexity: 'medium',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
  {
    id: 'hibiscus',
    label: '木槿',
    display: '🌺',
    type: 'emoji',
    category: 'flower',
    similarityGroup: 'flower-red',
    visualComplexity: 'medium',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },

  // === 叶子 ===
  {
    id: 'clover',
    label: '三叶草',
    display: '🍀',
    type: 'emoji',
    category: 'leaf',
    similarityGroup: 'leaf-green',
    visualComplexity: 'low',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
  {
    id: 'herb',
    label: '香草',
    display: '🌿',
    type: 'emoji',
    category: 'leaf',
    similarityGroup: 'leaf-green',
    visualComplexity: 'low',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },

  // === 小动物 ===
  {
    id: 'butterfly',
    label: '蝴蝶',
    display: '🦋',
    type: 'emoji',
    category: 'creature',
    similarityGroup: 'creature-fly',
    visualComplexity: 'medium',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
  {
    id: 'ladybug',
    label: '瓢虫',
    display: '🐞',
    type: 'emoji',
    category: 'creature',
    similarityGroup: 'creature-small',
    visualComplexity: 'low',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
  {
    id: 'bee',
    label: '蜜蜂',
    display: '🐝',
    type: 'emoji',
    category: 'creature',
    similarityGroup: 'creature-fly',
    visualComplexity: 'medium',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },

  // === 水果 ===
  {
    id: 'strawberry',
    label: '草莓',
    display: '🍓',
    type: 'emoji',
    category: 'decoration',
    similarityGroup: 'fruit-red',
    visualComplexity: 'low',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
  {
    id: 'apple',
    label: '苹果',
    display: '🍎',
    type: 'emoji',
    category: 'decoration',
    similarityGroup: 'fruit-red',
    visualComplexity: 'low',
    suitableForChildren: true,
    suitableForOlderAdults: true,
  },
];

/**
 * 按相似组索引素材
 * @type {Map<string, StimulusDef[]>}
 */
const similarityGroupIndex = new Map();
GARDEN_STIMULI.forEach((s) => {
  if (!similarityGroupIndex.has(s.similarityGroup)) {
    similarityGroupIndex.set(s.similarityGroup, []);
  }
  similarityGroupIndex.get(s.similarityGroup).push(s);
});

/**
 * 获取所有花园素材
 * @returns {StimulusDef[]}
 */
export function getAllStimuli() {
  return GARDEN_STIMULI;
}

/**
 * 根据 ID 获取素材定义
 * @param {string} id
 * @returns {StimulusDef|undefined}
 */
export function getStimulusById(id) {
  return GARDEN_STIMULI.find((s) => s.id === id);
}

/**
 * 获取指定素材的相似素材（同 similarityGroup，排除自身）
 * 用于 similarStimulus lure 生成
 * @param {string} stimulusId
 * @returns {StimulusDef[]}
 */
export function getSimilarStimuli(stimulusId) {
  const target = getStimulusById(stimulusId);
  if (!target) return [];
  const group = similarityGroupIndex.get(target.similarityGroup) || [];
  return group.filter((s) => s.id !== stimulusId);
}

/**
 * 获取所有相似组 ID
 * @returns {string[]}
 */
export function getSimilarityGroups() {
  return Array.from(similarityGroupIndex.keys());
}

export { GARDEN_STIMULI, similarityGroupIndex };
