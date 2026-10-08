/**
 * 玩家反馈服务 — 复盘分析 + 训练建议
 * 基于游戏结果生成详细的分析报告和个性化建议
 * 
 * @version 2.0
 * @author Memory Garden Team
 */

import i18n from '@i18n/index';

/**
 * 信号检测论 Z 值近似计算
 * 使用 Abramowitz & Stegun 近似公式
 * @param {number} p - 概率值 (0-1)
 * @returns {number} Z 值
 */
function inverseNormal(p) {
  // 限制范围避免无穷大
  const clamped = Math.max(0.001, Math.min(0.999, p));
  
  // Abramowitz & Stegun 近似
  const t = Math.sqrt(-2 * Math.log(1 - clamped));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  
  return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}

/**
 * 玩家反馈服务类
 */
export default class FeedbackService {
  /**
   * 生成游戏结果的详细分析
   * @param {Object} session - 当前会话数据
   * @param {Array} allSessions - 所有历史会话
   * @returns {Object} 分析结果
   */
  static analyze(session, allSessions = []) {
    const analysis = {
      // 基础指标
      score: session.score || 0,
      accuracy: session.accuracy || 0,
      totalTurns: session.totalTurns || 0,
      
      // 信号检测指标
      dPrime: FeedbackService.calculateDPrime(session),
      hitRate: session.hits / Math.max(1, session.hits + session.misses),
      falseAlarmRate: session.falseAlarms / Math.max(1, session.falseAlarms + session.correctRejections),
      
      // 反应指标
      avgReactionTime: session.reactionTime || 0,
      
      // 连胜
      streakBest: session.streakBest || 0,
      
      // 与历史对比
      comparedToHistory: FeedbackService.compareWithHistory(session, allSessions),
      
      // 表现等级
      performanceLevel: FeedbackService.getPerformanceLevel(session),
      
      // 训练建议
      suggestions: FeedbackService.generateSuggestions(session, allSessions),
    };

    return analysis;
  }

  /**
   * 计算 d-prime (记忆灵敏度)
   * @param {Object} session - 会话数据
   * @returns {number} d' 值
   */
  static calculateDPrime(session) {
    const { hits = 0, misses = 0, falseAlarms = 0, correctRejections = 0 } = session;
    
    const totalTargets = hits + misses;
    const totalNonTargets = falseAlarms + correctRejections;
    
    // 避免除零
    if (totalTargets === 0 || totalNonTargets === 0) return 0;
    
    const hitRate = hits / totalTargets;
    const falseAlarmRate = falseAlarms / totalNonTargets;
    
    // Z(hit rate) - Z(false alarm rate)
    const dPrime = inverseNormal(hitRate) - inverseNormal(falseAlarmRate);
    
    return Math.round(dPrime * 100) / 100;
  }

  /**
   * 获取表现等级
   * @param {Object} session - 会话数据
   * @returns {Object} 等级信息
   */
  static getPerformanceLevel(session) {
    const accuracy = session.accuracy || 0;
    const dPrime = FeedbackService.calculateDPrime(session);
    
    if (accuracy >= 0.95 && dPrime >= 2.0) {
      return { level: 'S', label: i18n.t('feedback.grades.excellent.label'), color: 'text-purple-500', desc: i18n.t('feedback.grades.excellent.desc') };
    }
    if (accuracy >= 0.85 && dPrime >= 1.5) {
      return { level: 'A', label: i18n.t('feedback.grades.good.label'), color: 'text-green-500', desc: i18n.t('feedback.grades.good.desc') };
    }
    if (accuracy >= 0.70 && dPrime >= 1.0) {
      return { level: 'B', label: i18n.t('feedback.grades.fair.label'), color: 'text-blue-500', desc: i18n.t('feedback.grades.fair.desc') };
    }
    if (accuracy >= 0.50) {
      return { level: 'C', label: i18n.t('feedback.grades.poor.label'), color: 'text-amber-500', desc: i18n.t('feedback.grades.poor.desc') };
    }
    return { level: 'D', label: i18n.t('feedback.grades.weak.label'), color: 'text-red-500', desc: i18n.t('feedback.grades.weak.desc') };
  }

  /**
   * 与历史数据对比
   * @param {Object} session - 当前会话
   * @param {Array} allSessions - 所有历史会话
   * @returns {Object} 对比结果
   */
  static compareWithHistory(session, allSessions) {
    if (allSessions.length <= 1) {
      return { isNew: true };
    }

    // 排除当前会话的历史数据
    const history = allSessions.filter((s) => s.id !== session.id);
    
    // 历史平均值
    const avgScore = history.reduce((sum, s) => sum + (s.score || 0), 0) / history.length;
    const avgAccuracy = history.reduce((sum, s) => sum + (s.accuracy || 0), 0) / history.length;
    
    // 与平均值比较
    const scoreDiff = (session.score || 0) - avgScore;
    const accuracyDiff = (session.accuracy || 0) - avgAccuracy;
    
    // 是否新纪录
    const isBestScore = !history.some((s) => (s.score || 0) >= (session.score || 0));
    const isBestAccuracy = !history.some((s) => (s.accuracy || 0) >= (session.accuracy || 0));
    
    return {
      isNew: false,
      avgScore: Math.round(avgScore),
      avgAccuracy: Math.round(avgAccuracy * 100),
      scoreDiff: Math.round(scoreDiff),
      accuracyDiff: Math.round(accuracyDiff * 100),
      isBestScore,
      isBestAccuracy,
    };
  }

  /**
   * 生成训练建议
   * @param {Object} session - 当前会话
   * @param {Array} allSessions - 所有历史会话
   * @returns {Array} 建议列表
   */
  static generateSuggestions(session, allSessions) {
    const suggestions = [];
    const accuracy = session.accuracy || 0;
    const dPrime = FeedbackService.calculateDPrime(session);
    const hitRate = session.hits / Math.max(1, session.hits + session.misses);
    const falseAlarmRate = session.falseAlarms / Math.max(1, session.falseAlarms + session.correctRejections);
    
    // 1. 基于准确率的建议
    if (accuracy < 0.50) {
      suggestions.push({
        type: 'difficulty',
        icon: '🎯',
        title: i18n.t('feedback.suggestions.lowerDifficulty.title'),
        desc: i18n.t('feedback.suggestions.lowerDifficulty.desc'),
      });
    } else if (accuracy > 0.90 && session.difficulty < 3) {
      suggestions.push({
        type: 'difficulty',
        icon: '⬆️',
        title: i18n.t('feedback.suggestions.higherDifficulty.title'),
        desc: i18n.t('feedback.suggestions.higherDifficulty.desc'),
      });
    }
    
    // 2. 基于命中率和误判率的建议
    if (hitRate < 0.50) {
      suggestions.push({
        type: 'strategy',
        icon: '👀',
        title: i18n.t('feedback.suggestions.improveAccuracy.title'),
        desc: i18n.t('feedback.suggestions.improveAccuracy.desc'),
      });
    }
    
    if (falseAlarmRate > 0.40) {
      suggestions.push({
        type: 'strategy',
        icon: '🛑',
        title: i18n.t('feedback.suggestions.reduceFalseAlarms.title'),
        desc: i18n.t('feedback.suggestions.reduceFalseAlarms.desc'),
      });
    }
    
    // 3. 基于连胜的建议
    if (session.streakBest >= 5) {
      suggestions.push({
        type: 'positive',
        icon: '🔥',
        title: i18n.t('feedback.suggestions.stayFocused.title'),
        desc: i18n.t('feedback.suggestions.stayFocused.desc'),
      });
    }
    
    // 4. 基于训练频率的建议
    const recentSessions = allSessions.filter((s) => {
      const daysDiff = (Date.now() - new Date(s.startedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    if (recentSessions.length >= 5) {
      suggestions.push({
        type: 'positive',
        icon: '📅',
        title: i18n.t('feedback.suggestions.keepTraining.title'),
        desc: i18n.t('feedback.suggestions.keepTraining.desc'),
      });
    } else if (recentSessions.length <= 1) {
      suggestions.push({
        type: 'habit',
        icon: '⏰',
        title: i18n.t('feedback.suggestions.buildHabit.title'),
        desc: i18n.t('feedback.suggestions.buildHabit.desc'),
      });
    }
    
    // 5. 基于 d-prime 的建议
    if (dPrime < 0.5) {
      suggestions.push({
        type: 'strategy',
        icon: '🧠',
        title: i18n.t('feedback.suggestions.improveStrategy.title'),
        desc: i18n.t('feedback.suggestions.improveStrategy.desc'),
      });
    }
    
    // 默认建议
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'positive',
        icon: '💪',
        title: i18n.t('feedback.suggestions.keepGoing.title'),
        desc: i18n.t('feedback.suggestions.keepGoing.desc'),
      });
    }
    
    return suggestions;
  }

  /**
   * 获取建议类型的样式
   * @param {string} type - 建议类型
   * @returns {Object} 样式信息
   */
  static getSuggestionStyle(type) {
    const styles = {
      difficulty: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      strategy: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      positive: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      habit: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    };
    return styles[type] || styles.positive;
  }
}
