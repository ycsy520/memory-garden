/**
 * 音频服务 — 管理游戏音频的生命周期
 * 包括音效播放、环境音控制、听觉因子播放
 * 遵循延迟初始化策略：首次用户交互后才创建AudioContext
 */
const AudioService = {
  ctx: null,
  bgmNodes: [],
  isMuted: false,      // BGM 静音状态
  isSfxMuted: false,   // 游戏音效静音状态（独立控制）

  /** 初始化AudioContext (懒加载，仅在首次交互时调用) */
  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('[AudioService] AudioContext创建失败，音频功能已关闭', e);
      }
    }
  },

  /** 恢复被浏览器挂起的AudioContext */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => {
        console.warn('[AudioService] AudioContext恢复失败', e);
      });
    }
  },

  /**
   * 播放正确音效 — 短促的提示音
   * 频率范围: C5-A5，带有柔和的衰减
   */
  playChime() {
    if (this.isSfxMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freqs = [523.25, 587.33, 659.25, 783.99, 880.00];
      const freq = freqs[Math.floor(Math.random() * freqs.length)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('[AudioService] 播放chime失败', e);
    }
  },

  /**
   * 播放错误音效 — 短促的低音
   * 短促的三角波，频率从150Hz降至50Hz
   */
  playWood() {
    if (this.isSfxMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('[AudioService] 播放wood失败', e);
    }
  },

  /**
   * 播放指定频率的音调 — 用于双通道模式的听觉刺激
   * @param {number} frequency - 频率（Hz）
   * @param {number} duration - 持续时间（ms）
   * @param {string} waveType - 波形类型（sine, triangle, square, sawtooth）
   */
  playTone(frequency, duration = 300, waveType = 'sine') {
    if (this.isSfxMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = waveType;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration / 1000);
    } catch (e) {
      console.warn('[AudioService] 播放tone失败', e);
    }
  },

  /**
   * 启动环境背景音 — 柔和的白噪声
   * 使用布朗噪声(低通滤波) + LFO调制，营造花园氛围
   */
  startAmbience() {
    if (this.isMuted || !this.ctx || this.bgmNodes.length > 0) return;
    try {
      let lastOut = 0;
      const bufferSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1;
      const gain = this.ctx.createGain();
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.02;
      gain.gain.value = 0.03;
      noise.connect(filter);
      filter.connect(gain);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      gain.connect(this.ctx.destination);
      noise.start();
      lfo.start();
      this.bgmNodes = [noise, lfo, gain, lfoGain];
    } catch (e) {
      console.warn('[AudioService] 环境音启动失败', e);
      this.bgmNodes = [];
    }
  },

  /** 停止环境背景音并清理节点 */
  stopAmbience() {
    this.bgmNodes.forEach((node) => {
      try {
        node.stop ? node.stop() : node.disconnect();
      } catch {
        // 节点可能已停止，忽略错误
      }
    });
    this.bgmNodes = [];
  },

  /**
   * 切换BGM静音状态
   * @returns {boolean} 切换后的静音状态
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbience();
    } else {
      this.startAmbience();
    }
    return this.isMuted;
  },

  /**
   * 切换游戏音效静音状态
   * @returns {boolean} 切换后的静音状态
   */
  toggleSfxMute() {
    this.isSfxMuted = !this.isSfxMuted;
    return this.isSfxMuted;
  },

  /** 销毁所有音频资源 */
  destroy() {
    this.stopAmbience();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  },
};

export default AudioService;
