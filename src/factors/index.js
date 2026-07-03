/**
 * 因子注册入口 — 导入所有因子插件以触发注册
 * 在应用启动时导入此文件，确保所有因子都已注册到 FactorRegistry
 */

// 视觉因子
import './visual/EmojiFactor.js';
import './visual/TextZhFactor.js';
import './visual/TextEnFactor.js';
import './visual/SymbolFactor.js';
import './visual/FoodEmojiFactor.js';
import './visual/AnimalEmojiFactor.js';

// 音频因子
import './audio/ToneFactor.js';
