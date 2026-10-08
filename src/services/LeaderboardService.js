/**
 * 排行榜服务 — 本地排行榜数据管理
 * 按游戏模式、难度、因子等维度排行
 * 
 * @version 2.0
 * @author Memory Garden Team
 */

/**
 * 排行榜服务类
 */
export default class LeaderboardService {
  /**
   * 获取排行榜数据
   * @param {Array} sessions - 所有会话记录
   * @param {Object} filters - 筛选条件
   * @param {string} [filters.modeId] - 游戏模式ID
   * @param {number} [filters.difficulty] - 难度N值
   * @param {string} [filters.factorId] - 因子ID
   * @param {string} [filters.sortBy='score'] - 排序字段: score/accuracy/streakBest
   * @param {number} [filters.limit=10] - 返回数量
   * @returns {Array} 排行榜条目
   */
  static getLeaderboard(sessions, filters = {}) {
    const {
      modeId,
      difficulty,
      factorId,
      sortBy = 'score',
      limit = 10,
    } = filters;

    // 筛选
    let filtered = [...sessions];

    if (modeId) {
      filtered = filtered.filter((s) => s.modeId === modeId || s.mode === modeId);
    }
    if (difficulty !== undefined && difficulty !== null) {
      filtered = filtered.filter((s) => s.difficulty === difficulty);
    }
    if (factorId) {
      filtered = filtered.filter((s) => s.factorId === factorId);
    }

    // 排序
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return bVal - aVal; // 降序
    });

    // 取前N条
    return filtered.slice(0, limit).map((session, index) => ({
      rank: index + 1,
      ...session,
    }));
  }

  /**
   * 获取各模式的最佳成绩
   * @param {Array} sessions - 所有会话记录
   * @returns {Object} 按模式ID索引的最佳成绩
   */
  static getBestByMode(sessions) {
    const bestByMode = {};

    sessions.forEach((session) => {
      const modeId = session.modeId || session.mode || 'standard';
      if (!bestByMode[modeId] || session.score > bestByMode[modeId].score) {
        bestByMode[modeId] = session;
      }
    });

    return bestByMode;
  }

  /**
   * 获取各难度的最佳成绩
   * @param {Array} sessions - 所有会话记录
   * @returns {Object} 按难度N值索引的最佳成绩
   */
  static getBestByDifficulty(sessions) {
    const bestByDiff = {};

    sessions.forEach((session) => {
      const n = session.difficulty;
      if (!bestByDiff[n] || session.score > bestByDiff[n].score) {
        bestByDiff[n] = session;
      }
    });

    return bestByDiff;
  }

  /**
   * 获取各因子的最佳成绩
   * @param {Array} sessions - 所有会话记录
   * @returns {Object} 按因子ID索引的最佳成绩
   */
  static getBestByFactor(sessions) {
    const bestByFactor = {};

    sessions.forEach((session) => {
      const factorId = session.factorId || 'unknown';
      if (!bestByFactor[factorId] || session.score > bestByFactor[factorId].score) {
        bestByFactor[factorId] = session;
      }
    });

    return bestByFactor;
  }

  /**
   * 获取总体排行榜摘要
   * @param {Array} sessions - 所有会话记录
   * @returns {Object} 摘要数据
   */
  static getSummary(sessions) {
    if (sessions.length === 0) {
      return {
        totalGames: 0,
        totalScore: 0,
        avgAccuracy: 0,
        bestScore: 0,
        bestStreak: 0,
        favoriteMode: null,
        favoriteFactor: null,
      };
    }

    // 总分
    const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);

    // 平均准确率
    const accuracies = sessions.map((s) => s.accuracy || 0).filter((a) => a > 0);
    const avgAccuracy = accuracies.length > 0
      ? accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
      : 0;

    // 最高分
    const bestScore = Math.max(...sessions.map((s) => s.score || 0));

    // 最佳连胜
    const bestStreak = Math.max(...sessions.map((s) => s.streakBest || 0));

    // 最常玩的模式
    const modeCounts = {};
    sessions.forEach((s) => {
      const modeId = s.modeId || s.mode || 'standard';
      modeCounts[modeId] = (modeCounts[modeId] || 0) + 1;
    });
    const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // 最常玩的因子
    const factorCounts = {};
    sessions.forEach((s) => {
      if (s.factorId) {
        factorCounts[s.factorId] = (factorCounts[s.factorId] || 0) + 1;
      }
    });
    const favoriteFactor = Object.entries(factorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalGames: sessions.length,
      totalScore,
      avgAccuracy,
      bestScore,
      bestStreak,
      favoriteMode,
      favoriteFactor,
    };
  }
}
