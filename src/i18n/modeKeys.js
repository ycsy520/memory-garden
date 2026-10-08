/**
 * 游戏模式 ID → i18n 翻译键的公共映射
 * 供各屏幕/组件统一使用，避免多处重复定义导致翻译不一致
 */
const MODE_I18N_KEYS = {
  standard: 'common.modeStandard',
  walk: 'common.modeWalk',
  dual: 'common.modeDual',
  spatial: 'common.modeSpatial',
  grid: 'common.modeGrid',
};

export default MODE_I18N_KEYS;
