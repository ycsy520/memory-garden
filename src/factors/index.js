/**
 * 因子注册入口 — 导入所有因子插件以触发注册
 * 在应用启动时导入此文件，确保所有因子都已注册到 FactorRegistry
 */

// 视觉因子（精灵图单一池，替代原 Emoji 三池）
import './visual/SpriteGardenFactor.js';

// 音频因子
import './audio/ToneFactor.js';
