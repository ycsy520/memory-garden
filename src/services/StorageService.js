/**
 * 分层存储服务 — 三层降级策略
 * L1: localStorage (用户偏好，< 10KB)
 * L2: IndexedDB (游戏数据，< 50MB)
 * L3: 内存 (降级兜底)
 *
 * @todo v2.0: 升级到 IndexedDB (idb + idb-keyval)，参考 ADR-003。
 *             当前 v1.0 仅使用 localStorage，session 数据存储上限约 5MB。
 *             IndexedDB 限额通常 ≥50MB，且支持索引查询。
 */
const StorageService = {
  /** 内存降级存储 */
  _memoryStore: {},
  _useMemory: false,

  /**
   * 检测localStorage是否可用
   * @returns {boolean}
   */
  isAvailable() {
    if (this._useMemory) return false;
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn('[StorageService] localStorage不可用，降级到内存存储');
      this._useMemory = true;
      return false;
    }
  },

  /**
   * 读取数据
   * @param {string} key - 存储键名
   * @param {*} defaultValue - 默认值
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      if (!this.isAvailable()) {
        return this._memoryStore[key] ?? defaultValue;
      }
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[StorageService] 读取"${key}"失败，返回默认值`, e);
      return defaultValue;
    }
  },

  /**
   * 写入数据
   * @param {string} key - 存储键名
   * @param {*} value - 要存储的值
   * @returns {boolean} 是否写入成功
   */
  set(key, value) {
    try {
      if (!this.isAvailable()) {
        this._memoryStore[key] = value;
        return true;
      }
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[StorageService] 写入"${key}"失败`, e);
      // 降级到内存
      this._memoryStore[key] = value;
      return false;
    }
  },

  /**
   * 删除数据
   * @param {string} key - 存储键名
   */
  remove(key) {
    try {
      if (!this.isAvailable()) {
        delete this._memoryStore[key];
        return;
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[StorageService] 删除"${key}"失败`, e);
    }
  },

  /**
   * 从旧版v0格式迁移数据
   * 旧格式: memory-garden-scores = { [levelIndex]: bestScore }
   * 新格式: memory-garden:scores = { [modeId]: { best: score, sessions: [] } }
   */
  migrateFromV0() {
    try {
      const oldKey = 'memory-garden-scores';
      const newKey = 'memory-garden:scores';
      const existing = this.get(newKey);
      if (existing) return; // 已迁移

      const oldData = this.get(oldKey);
      if (!oldData) return;

      const newData = {};
      Object.entries(oldData).forEach(([idx, score]) => {
        const modeId = `standard-n${parseInt(idx) + 1}`;
        newData[modeId] = { best: score };
      });
      this.set(newKey, newData);

      // 保留旧数据7天保护期，之后删除
      console.info('[StorageService] v0数据迁移完成');
    } catch (e) {
      console.warn('[StorageService] v0数据迁移失败', e);
    }
  },
};

export default StorageService;
