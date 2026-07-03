/**
 * 轻量 Analytics 服务 — 基于 localStorage 的自托管统计
 * 无需外部依赖，数据完全留在本地
 * 可选接入 Umami 自托管实例
 * 
 * @version 3.3
 * @author Memory Garden Team
 */

const STORAGE_KEY = 'mg_analytics';
const MAX_EVENTS = 500;

/**
 * Analytics 服务
 */
const AnalyticsService = {
  _events: [],
  _loaded: false,

  /**
   * 加载历史事件
   */
  _load() {
    if (this._loaded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._events = raw ? JSON.parse(raw) : [];
    } catch {
      this._events = [];
    }
    this._loaded = true;
  },

  /**
   * 保存事件到 localStorage
   */
  _save() {
    try {
      // 限制事件数量，丢弃最旧的
      if (this._events.length > MAX_EVENTS) {
        this._events = this._events.slice(-MAX_EVENTS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._events));
    } catch {
      // localStorage 满或不可用，静默忽略
    }
  },

  /**
   * 追踪事件
   * @param {string} category - 事件分类 (game/settings/page)
   * @param {string} action - 动作 (start/finish/share)
   * @param {Object} [data] - 附加数据
   */
  track(category, action, data = {}) {
    this._load();
    const event = {
      ts: Date.now(),
      cat: category,
      act: action,
      ...data,
    };
    this._events.push(event);
    this._save();

    // 可选: 发送到 Umami 自托管实例
    this._sendToUmami(event);
  },

  /**
   * 追踪游戏会话
   * @param {Object} session - 会话数据
   */
  trackSession(session) {
    this.track('game', 'finish', {
      mode: session.modeId || session.mode,
      difficulty: session.difficulty,
      factor: session.factorId,
      score: session.score,
      accuracy: Math.round((session.accuracy || 0) * 100),
      turns: session.totalTurns,
    });
  },

  /**
   * 追踪页面访问
   * @param {string} page - 页面路径
   */
  trackPage(page) {
    this.track('page', 'view', { page });
  },

  /**
   * 追踪功能使用
   * @param {string} feature - 功能名称
   */
  trackFeature(feature) {
    this.track('feature', 'use', { feature });
  },

  /**
   * 获取统计摘要
   * @returns {Object} 摘要数据
   */
  getSummary() {
    this._load();
    const total = this._events.length;
    const sessions = this._events.filter((e) => e.cat === 'game' && e.act === 'finish');
    const avgScore = sessions.length > 0
      ? Math.round(sessions.reduce((s, e) => s + (e.score || 0), 0) / sessions.length)
      : 0;
    const avgAccuracy = sessions.length > 0
      ? Math.round(sessions.reduce((s, e) => s + (e.accuracy || 0), 0) / sessions.length)
      : 0;

    return {
      totalEvents: total,
      totalSessions: sessions.length,
      avgScore,
      avgAccuracy,
      firstEvent: this._events[0]?.ts || null,
      lastEvent: this._events[total - 1]?.ts || null,
    };
  },

  /**
   * 清除所有分析数据
   */
  clear() {
    this._events = [];
    this._loaded = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 静默忽略
    }
  },

  /**
   * 可选: 发送到 Umami 自托管实例
   * 设置 VITE_UMAMI_URL 和 VITE_UMAMI_WEBSITE_ID 环境变量启用
   * @param {Object} event
   */
  _sendToUmami(event) {
    const umamiUrl = import.meta.env.VITE_UMAMI_URL;
    const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
    if (!umamiUrl || !websiteId) return;

    try {
      fetch(`${umamiUrl}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event',
          payload: {
            website: websiteId,
            url: `/${event.cat}/${event.act}`,
            name: `${event.cat}:${event.act}`,
          },
        }),
      }).catch(() => {
        // 发送失败静默忽略
      });
    } catch {
      // 静默忽略
    }
  },
};

export default AnalyticsService;
