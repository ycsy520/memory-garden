/**
 * 因子注册中心 — 管理所有记忆因子插件
 * 新增因子只需调用 register()，无需修改引擎代码
 */
let _nextId = 1;

const FactorRegistry = {
  /** @type {Map<string, import('./types').FactorPluginConfig>} */
  _plugins: new Map(),

  /**
   * 注册一个新的因子插件
   * @param {import('./types').FactorPluginConfig} config
   * @returns {void}
   */
  register(config) {
    if (!config.id || !config.type || !config.pool) {
      console.error('[FactorRegistry] 注册失败: 缺少必要字段 (id/type/pool)', config);
      return;
    }
    this._plugins.set(config.id, config);
  },

  /**
   * 获取指定ID的因子插件
   * @param {string} id
   * @returns {import('./types').FactorPluginConfig | undefined}
   */
  get(id) {
    return this._plugins.get(id);
  },

  /**
   * 获取所有已注册的因子插件
   * @returns {import('./types').FactorPluginConfig[]}
   */
  getAll() {
    return Array.from(this._plugins.values());
  },

  /**
   * 按类型筛选因子插件
   * @param {'visual'|'audio'|'mixed'} type
   * @returns {import('./types').FactorPluginConfig[]}
   */
  getByType(type) {
    return this.getAll().filter((p) => p.type === type);
  },

  /**
   * 生成一个唯一因子ID
   * @returns {string}
   */
  generateId() {
    return `factor-${_nextId++}`;
  },
};

export default FactorRegistry;
