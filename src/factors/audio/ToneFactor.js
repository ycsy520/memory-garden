/**
 * 纯音音调因子插件 — 听觉记忆
 * 使用不同频率的纯音作为听觉刺激素材
 * 通过Web Audio API生成和播放音调
 * 视觉展示: 显示音符图标 + 频率名称
 */
import FactorRegistry from '../FactorRegistry.js';
import AudioService from '@services/AudioService.js';

/** 音调池: 4个差异明显的音调，使用跳跃八度+不同音色增强辨识度 */
const TONE_POOL = [
  { freq: 261.63, name: 'Do', icon: '/img/bell_ico.png', waveType: 'sine' },       // C4 - 低音
  { freq: 392.00, name: 'Sol', icon: '/img/voice_ico.png', waveType: 'triangle' },   // G4 - 中音
  { freq: 523.25, name: 'Do⁺', icon: '/img/bell_ico.png', waveType: 'sine' },      // C5 - 高音
  { freq: 783.99, name: 'Sol⁺', icon: '/img/voice_ico.png', waveType: 'triangle' },  // G5 - 超高音
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
  id: 'tone',
  name: '音调',
  type: 'audio',
  pool: TONE_POOL,

  /**
   * 生成随机音调因子
   * @returns {import('../types').Factor}
   */
  generate() {
    const tone = randomPick(TONE_POOL);
    return {
      id: FactorRegistry.generateId(),
      type: 'tone',
      value: tone.freq,
      meta: { name: tone.name, icon: tone.icon, waveType: tone.waveType },
    };
  },

  /**
   * 比较两个音调因子是否相同 (精确匹配频率)
   * @param {import('../types').Factor} a
   * @param {import('../types').Factor} b
   * @returns {boolean}
   */
  compare(a, b) {
    return a.value === b.value;
  },

  /**
   * 渲染音调因子 — 返回音符图标
   * @param {import('../types').Factor} factor
   * @returns {string}
   */
  render(factor) {
    return factor.meta?.icon || '🎵';
  },

  /**
   * 播放音调 — 通过AudioService播放指定频率的音
   * @param {import('../types').Factor} factor
   */
  play(factor) {
    if (!AudioService.ctx) return;
    try {
      const osc = AudioService.ctx.createOscillator();
      const gain = AudioService.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(factor.value, AudioService.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, AudioService.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, AudioService.ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(AudioService.ctx.destination);
      osc.start();
      osc.stop(AudioService.ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('[ToneFactor] 播放失败', e);
    }
  },
});
