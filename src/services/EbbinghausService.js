/**
 * 艾宾浩斯复习提醒服务 — 基于遗忘曲线的训练提醒
 * 
 * 艾宾浩斯遗忘曲线表明，记忆在以下时间点衰退最快:
 *   20分钟后: 42%遗忘
 *   1小时后:  56%遗忘
 *   1天后:    66%遗忘
 *   1周后:    75%遗忘
 * 
 * 最佳复习时间点:
 *   1天后、3天后、7天后、14天后、30天后
 * 
 * 本服务根据用户的训练历史，计算最佳复习时间并给出提醒
 */

/** 复习间隔(毫秒) */
const REVIEW_INTERVALS = [
  { days: 1,  ms: 1 * 24 * 60 * 60 * 1000 },
  { days: 3,  ms: 3 * 24 * 60 * 60 * 1000 },
  { days: 7,  ms: 7 * 24 * 60 * 60 * 1000 },
  { days: 14, ms: 14 * 24 * 60 * 60 * 1000 },
  { days: 30, ms: 30 * 24 * 60 * 60 * 1000 },
];

const EbbinghausService = {
  /**
   * 计算下次复习提醒
   * @param {Array} sessions - 所有会话记录
   * @returns {{ shouldRemind: boolean, message: string, daysSinceLastPlay: number }}
   */
  getReminder(sessions) {
    if (!sessions || sessions.length === 0) {
      return {
        shouldRemind: false,
        message: '还没有训练记录',
        daysSinceLastPlay: 0,
      };
    }

    // 找到最近一次训练时间
    const lastSession = sessions[sessions.length - 1];
    const lastPlayTime = new Date(lastSession.endedAt || lastSession.startedAt).getTime();
    const now = Date.now();
    const daysSinceLastPlay = Math.floor((now - lastPlayTime) / (24 * 60 * 60 * 1000));

    // 当天训练过，不需要提醒
    if (daysSinceLastPlay < 1) {
      return {
        shouldRemind: false,
        message: '今天已经训练过了，继续保持！',
        daysSinceLastPlay,
      };
    }

    // 找到当前应该处于的复习间隔
    const currentInterval = REVIEW_INTERVALS.find((interval) => {
      return daysSinceLastPlay >= interval.days;
    });

    if (!currentInterval) {
      return {
        shouldRemind: false,
        message: '训练间隔正常',
        daysSinceLastPlay,
      };
    }

    // 检查是否在该间隔内已经训练过
    const intervalStart = now - currentInterval.ms;
    const hasPlayedInInterval = sessions.some((s) => {
      const playTime = new Date(s.endedAt || s.startedAt).getTime();
      return playTime >= intervalStart;
    });

    if (hasPlayedInInterval) {
      return {
        shouldRemind: false,
        message: '训练间隔正常',
        daysSinceLastPlay,
      };
    }

    // 需要提醒
    const messages = {
      1: '已经1天没训练了，记忆正在衰退，来花园散步吧！',
      3: '已经3天了，花儿想你了，快来浇灌记忆之花！',
      7: '一周没来了，花园起了雾，来驱散它吧！',
      14: '两周了... 记忆之花需要你的呵护。',
      30: '一个月了！花园想念你的脚步声。',
    };

    return {
      shouldRemind: true,
      message: messages[currentInterval.days] || `已经${daysSinceLastPlay}天没训练了`,
      daysSinceLastPlay,
    };
  },

  /**
   * 获取训练连续天数
   * @param {Array} sessions - 所有会话记录
   * @returns {number}
   */
  getStreak(sessions) {
    if (!sessions || sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const playDays = new Set();
    sessions.forEach((s) => {
      const d = new Date(s.startedAt);
      d.setHours(0, 0, 0, 0);
      playDays.add(d.getTime());
    });

    let streak = 0;
    let checkDate = today.getTime();

    // 今天没训练的话，从昨天开始算
    if (!playDays.has(checkDate)) {
      checkDate -= 24 * 60 * 60 * 1000;
    }

    while (playDays.has(checkDate)) {
      streak++;
      checkDate -= 24 * 60 * 60 * 1000;
    }

    return streak;
  },
};

export default EbbinghausService;
