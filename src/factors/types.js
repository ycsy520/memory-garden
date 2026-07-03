/**
 * 记忆因子类型定义
 * Factor: 单个刺激素材
 * FactorPluginConfig: 因子插件注册配置
 */
// 运行时使用JSDoc代替TypeScript接口
// 未来迁移到TS时转为interface

/** @typedef {{ id: string, type: string, value: any }} Factor */

/**
 * @typedef {Object} FactorPluginConfig
 * @property {string} id - 唯一标识
 * @property {string} name - 显示名称
 * @property {'visual'|'audio'|'mixed'} type - 因子类型
 * @property {any[]} pool - 因子值池
 * @property {function(Factor): any} render - 渲染函数
 * @property {function(Factor, Factor): boolean} compare - 比较函数
 * @property {function(): Factor} generate - 生成随机因子
 */
