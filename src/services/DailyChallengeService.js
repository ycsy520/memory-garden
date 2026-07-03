/**
 * 每日挑战服务 — 生成每天固定的随机挑战配置
 * 使用日期作为随机种子，确保所有用户每天看到相同的挑战
 * 
 * @version 2.0
 * @author Memory Garden Team
 */

/**
 * 简单的伪随机数生成器 (Mulberry32)
 * 使用种子生成可重复的随机序列
 * @param {number} seed - 随机种子
 * @returns {Function} 返回0-1之间的随机数
 */
function mulberry32(seed) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 从数组中基于随机函数选择元素
 * @param {Array} arr - 源数组
 * @param {Function} random - 随机函数
 * @returns {*} 选中的元素
 */
function randomPick(arr, random) {
  return arr[Math.floor(random() * arr.length)];
}

/** 可选的游戏模式 */
const GAME_MODES = ['standard', 'dual', 'spatial', 'grid'];

/** 可选的视觉因子 */
const VISUAL_FACTORS = ['emoji-flower', 'emoji-animal', 'emoji-food', 'text-zh', 'text-en', 'symbol'];

/** 每日挑战的难度范围 */
const DIFFICULTY_LEVELS = [
  { n: 1, speed: 3500, totalTurns: 15 },
  { n: 2, speed: 3200, totalTurns: 20 },
  { n: 2, speed: 3000, totalTurns: 20 },
  { n: 3, speed: 3000, totalTurns: 25 },
];

/**
 * 每日挑战服务类
 */
export default class DailyChallengeService {
  /**
   * 获取今天的日期字符串 (YYYY-MM-DD)
   * @returns {string}
   */
  static getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * 从日期字符串生成数字种子
   * @param {string} dateStr - YYYY-MM-DD 格式日期
   * @returns {number}
   */
  static dateToSeed(dateStr) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    // 简单哈希: 年*10000 + 月*100 + 日
    return year * 10000 + month * 100 + day;
  }

  /**
   * 获取指定日期的每日挑战配置
   * @param {string} [dateStr] - YYYY-MM-DD 格式日期，默认今天
   * @returns {Object} 挑战配置
   */
  static getChallenge(dateStr) {
    const date = dateStr || DailyChallengeService.getTodayString();
    const seed = DailyChallengeService.dateToSeed(date);
    const random = mulberry32(seed);

    // 选择游戏模式 (标准模式概率更高)
    const modeWeights = [0.4, 0.2, 0.2, 0.2]; // standard, dual, spatial, grid
    let modeRandom = random();
    let modeIndex = 0;
    let cumulative = 0;
    for (let i = 0; i < modeWeights.length; i++) {
      cumulative += modeWeights[i];
      if (modeRandom < cumulative) {
        modeIndex = i;
        break;
      }
    }
    const modeId = GAME_MODES[modeIndex];

    // 选择视觉因子
    const factorId = randomPick(VISUAL_FACTORS, random);

    // 选择难度 (偏向中等难度)
    const diffWeights = [0.2, 0.35, 0.3, 0.15]; // n1, n2-slow, n2-fast, n3
    let diffRandom = random();
    let diffIndex = 0;
    cumulative = 0;
    for (let i = 0; i < diffWeights.length; i++) {
      cumulative += diffWeights[i];
      if (diffRandom < cumulative) {
        diffIndex = i;
        break;
      }
    }
    const difficulty = DIFFICULTY_LEVELS[diffIndex];

    // 构建配置
    const config = {
      id: `daily-${date}`,
      modeId,
      factorId,
      factorIds: [factorId],
      ...difficulty,
      isDaily: true,
      dailyDate: date,
    };

    // 双通道模式添加音频因子
    if (modeId === 'dual') {
      config.factorIds = [factorId, 'tone'];
    }

    // 空间模式配置
    if (modeId === 'spatial') {
      config.spatial = true;
      config.gridSize = 3;
    }

    // 栅格模式配置
    if (modeId === 'grid') {
      config.spatial = true;
      config.gridSize = 2 + Math.floor(random() * 2); // 2×2 或 3×3
      config.cols = config.gridSize;
      config.rows = config.gridSize;
    }

    return config;
  }

  /**
   * 检查今天是否已完成每日挑战
   * @param {Array} sessions - 所有会话记录
   * @returns {boolean}
   */
  static isCompletedToday(sessions) {
    const today = DailyChallengeService.getTodayString();
    return sessions.some((s) => s.dailyDate === today && s.isDaily);
  }

  /**
   * 获取今天的每日挑战成绩
   * @param {Array} sessions - 所有会话记录
   * @returns {Object|null} 今天的挑战session或null
   */
  static getTodayResult(sessions) {
    const today = DailyChallengeService.getTodayString();
    return sessions.find((s) => s.dailyDate === today && s.isDaily) || null;
  }

  /**
   * 获取每日挑战的连续完成天数
   * @param {Array} sessions - 所有会话记录
   * @returns {number} 连续天数
   */
  static getStreak(sessions) {
    const dailySessions = sessions.filter((s) => s.isDaily);
    if (dailySessions.length === 0) return 0;

    // 提取所有完成日期并去重
    const completedDates = new Set(
      dailySessions.map((s) => s.dailyDate || DailyChallengeService.getTodayString())
    );

    // 从今天开始往前数
    let streak = 0;
    let currentDate = new Date();

    while (true) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      if (completedDates.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 获取挑战配置的可读描述
   * @param {Object} config - 挑战配置
   * @returns {string}
   */
  static getDescription(config) {
    const modeNames = {
      standard: '标准模式',
      dual: '双通道模式',
      spatial: '空间模式',
      grid: '栅格模式',
    };
    const factorNames = {
      'emoji-flower': '花朵',
      'emoji-animal': '动物',
      'emoji-food': '食物',
      'text-zh': '中文词',
      'text-en': '英文词',
      'symbol': '符号',
    };

    const modeName = modeNames[config.modeId] || config.modeId;
    const factorName = factorNames[config.factorId] || config.factorId;

    return `${modeName} · ${factorName} · N=${config.n}`;
  }
}
