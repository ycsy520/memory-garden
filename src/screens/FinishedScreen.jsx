/**
 * 结果页 — 花园叙事反馈 + N-back 数据展示
 *
 * 数据指标设计（基于第一性原理）：
 * - 记忆准确率 = (命中 + 正确排除) / 总回合数
 * - 目标识别率 = 命中 / 目标总数
 * - 误判率 = 误判 / 非目标总数
 * - d'（灵敏度）= Z(Hit Rate) - Z(False Alarm Rate)
 * - β（反应偏向）= exp(-(zHit² - zFA²) / 2)
 * - 平均反应时间
 *
 * @version 7.0
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flower2, ChevronDown, ChevronUp, Wind, Clock, Brain } from 'lucide-react';
import useGameStore from '@stores/useGameStore';
import useStatsStore from '@stores/useStatsStore';
import useGardenStore from '@stores/useGardenStore';
import useAchievementStore from '@stores/useAchievementStore';
import { getCollectibleById, getNarrativeTier } from '@engine/narratives';
import AudioService from '@services/AudioService';
import { calculateSDT, interpretDPrime, interpretBeta } from '@engine/SignalDetection';
import StoreIcon from '@components/StoreIcon';
import MODE_I18N_KEYS from '@i18n/modeKeys';

/**
 * 计算单局准确率，兼容旧 session 数据。
 * @param {Object} session - 历史会话对象
 * @returns {number}
 */
function getSessionAccuracy(session) {
  if (typeof session?.accuracy === 'number' && session.accuracy > 0) {
    return session.accuracy;
  }

  const total = (session?.hits || 0) + (session?.misses || 0) + (session?.falseAlarms || 0) + (session?.correctRejections || 0);
  return total > 0 ? ((session?.hits || 0) + (session?.correctRejections || 0)) / total : 0;
}

/**
 * 将秒数格式化为适合结算页显示的中文时长。
 * @param {number} seconds - 秒数
 * @returns {string}
 */
function formatSessionDuration(seconds) {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainSeconds = safeSeconds % 60;

  if (minutes <= 0) return `${safeSeconds}秒`;
  if (remainSeconds === 0) return `${minutes}分钟`;
  return `${minutes}分${remainSeconds}秒`;
}

/**
 * 将会话时间格式化为简洁的月/日 时:分。
 * @param {number|string} value - 时间戳或可解析日期
 * @returns {string}
 */
function formatSessionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * 格式化历史记录卡片的副信息。
 * @param {Object} session - 历史会话对象
 * @param {(key: string, options?: Object) => string} t - i18n 翻译函数
 * @returns {string}
 */
function formatSessionMeta(session, t) {
  const modeLabel = MODE_I18N_KEYS[session?.modeId]
    ? t(MODE_I18N_KEYS[session.modeId])
    : (session?.modeId || t('common.modeWalk'));
  const difficultyLabel = `N${session?.difficulty || 1}`;
  const durationLabel = formatSessionDuration(session?.duration || 0);
  const timedLabel = session?.timed ? t('finished.timedTag') : null;

  return [modeLabel, difficultyLabel, durationLabel, timedLabel].filter(Boolean).join(' · ');
}

/**
 * 根据记忆准确率选择反馈文案
 * @param {number} accuracy - 记忆准确率 (0-1)
 * @returns {{ title: string, body: string, reward: string, rewardIcon: string }}
 */
/**
 * 根据记忆准确率选择花园叙事反馈
 * 文案对齐 07-GARDEN-DESIGN.md §9.5：
 * - 不使用"完美""加油"等强刺激/羞辱性语言
 * - 高稳定/中等/较困难三档分别对应花园生长意象
 *
 * @param {number} accuracy - 记忆准确率 (0-1)
 * @returns {{ title: string, body: string, reward: string, rewardIcon: string }}
 */
function getGardenFeedback(accuracy, t) {
  if (accuracy >= 0.80) {
    return {
      title: t('finished.narrativeExcellent.title'),
      body: t('finished.narrativeExcellent.body'),
      reward: t('finished.narrativeExcellent.reward'),
      rewardIcon: 17, // store.png 樱花
    };
  }
  if (accuracy >= 0.60) {
    return {
      title: t('finished.narrativeGood.title'),
      body: t('finished.narrativeGood.body'),
      reward: t('finished.narrativeGood.reward'),
      rewardIcon: 13, // store.png 飘叶
    };
  }
  return {
    title: t('finished.narrativePoor.title'),
    body: t('finished.narrativePoor.body'),
    reward: t('finished.narrativePoor.reward'),
    rewardIcon: 10, // store.png 幼苗
  };
}

export default function FinishedScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const score = useGameStore((s) => s.score);
  const hits = useGameStore((s) => s.hits);
  const misses = useGameStore((s) => s.misses);
  const falseAlarms = useGameStore((s) => s.falseAlarms);
  const correctRejections = useGameStore((s) => s.correctRejections);
  const reactionTimes = useGameStore((s) => s.reactionTimes);
  const startedAt = useGameStore((s) => s.startedAt);
  const sessions = useStatsStore((s) => s.sessions);

  // 详细数据折叠状态
  const [showDetails, setShowDetails] = useState(false);

  // 解锁队列展示状态
  const [unlockQueueIndex, setUnlockQueueIndex] = useState(0);
  const [storyExpanded, setStoryExpanded] = useState(false);
  /** R10: 消费锁，防止连点导致重复操作 */
  const [isProcessing, setIsProcessing] = useState(false);

  // 从 store 获取解锁队列
  const unlockQueue = useAchievementStore((s) => s.recentUnlockQueue);
  const markNarrativeRead = useAchievementStore((s) => s.markNarrativeRead);
  const clearUnlockQueue = useAchievementStore((s) => s.clearUnlockQueue);
  const saveFullText = useAchievementStore((s) => s.saveFullText);

  /** 计算核心指标 */
  const metrics = useMemo(() => {
    const totalTurns = hits + misses + falseAlarms + correctRejections;
    const targetCount = hits + misses;
    const nonTargetCount = falseAlarms + correctRejections;

    const memoryAccuracy = totalTurns > 0 ? (hits + correctRejections) / totalTurns : 0;
    const target识别率 = targetCount > 0 ? hits / targetCount : 0;
    const falseAlarmRate = nonTargetCount > 0 ? falseAlarms / nonTargetCount : 0;

    // 信号检测论指标
    const sdt = calculateSDT({ hits, misses, falseAlarms, correctRejections });
    const dPrimeInterpretation = interpretDPrime(sdt.dPrime);
    const betaInterpretation = interpretBeta(sdt.beta);

    // 反应时间
    const avgRT = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    return {
      totalTurns,
      targetCount,
      nonTargetCount,
      memoryAccuracy,
      target识别率,
      falseAlarmRate,
      dPrime: sdt.dPrime,
      dPrimeInterpretation,
      beta: sdt.beta,
      betaInterpretation,
      avgRT,
    };
  }, [hits, misses, falseAlarms, correctRejections, reactionTimes]);

  /** 过往记录：排除当前这一局，仅展示最近 5 局 */
  const pastSessions = useMemo(() => {
    return [...sessions]
      .filter((session) => session && typeof session.score === 'number' && session.startedAt)
      .filter((session) => session.startedAt !== startedAt)
      .reverse()
      .slice(0, 5)
      .map((session, index) => ({
        ...session,
        accuracyValue: getSessionAccuracy(session),
        metaLabel: formatSessionMeta(session, t),
        modeLabel: MODE_I18N_KEYS[session.modeId]
          ? t(MODE_I18N_KEYS[session.modeId])
          : (session.modeId || t('common.modeWalk')),
        dateLabel: formatSessionDate(session.endedAt || session.startedAt),
        isLatest: index === 0,
      }));
  }, [sessions, startedAt, t]);

  /** 反脆弱：检测连续困难（最近3局命中率均<50%） */
  const isConsecutiveDifficult = useMemo(() => {
    const recent3 = sessions.slice(-3);
    if (recent3.length < 3) return false;
    return recent3.every((s) => {
      const total = (s.hits || 0) + (s.misses || 0) + (s.falseAlarms || 0) + (s.correctRejections || 0);
      const accuracy = total > 0 ? ((s.hits || 0) + (s.correctRejections || 0)) / total : 0;
      return accuracy < 0.50;
    });
  }, [sessions]);

  /** 花园叙事反馈 */
  const feedback = useMemo(() => getGardenFeedback(metrics.memoryAccuracy, t), [metrics.memoryAccuracy, t]);

  /** 再来一局 */
  const handleRestart = () => {
    AudioService.stopAmbience();
    useGameStore.getState().reset();
    navigate('/menu');
  };

  /**
   * 回到花园
   */
  const handleBackToGarden = () => {
    AudioService.stopAmbience();
    useGameStore.getState().reset();
    navigate('/menu');
  };

  return (
    <div className="ui-page-shell animate-fade-in text-center bg-white/35 backdrop-blur-sm">
      <div className="ui-page-frame">
        <div className="ui-page-narrow">
      <div className="ui-card-primary bg-white p-6 sm:p-8 shadow-2xl w-full border-4 border-white relative">
        {/* 花园成长图标 + 叙事文案（限宽防拉伸） */}
        <div className="ui-heading-block">
          <div className="mb-4 flex items-center justify-center">
            <StoreIcon
              value={feedback.rewardIcon}
              className="text-5xl"
              spriteClass="sprite-frame w-24 sm:w-28"
            />
          </div>

          {/* 叙事标题 */}
          <h2
            className="text-xl sm:text-2xl text-[var(--color-text-primary)] mb-3"
            style={{ fontFamily: 'var(--font-family-serif)' }}
          >
            {feedback.title}
          </h2>

          {/* 叙事正文 */}
          <p className="text-[var(--color-text-secondary)] font-light mb-8 text-sm leading-relaxed">
            {feedback.body}
          </p>
        </div>

        {/* 反脆弱辅助：连续困难时显示温和提示 */}
        {metrics.memoryAccuracy < 0.50 && (
          <div className="ui-card-secondary bg-amber-50 p-3 mb-4 text-center">
            <p className="text-sm text-amber-700 leading-relaxed">
              {t('finished.slowDown')}
            </p>
            {isConsecutiveDifficult && (
              <p className="text-sm text-amber-500 mt-2">
                {t('finished.takeBreak')}
              </p>
            )}
          </div>
        )}

        <div className="ui-section-stack mb-4">
          {/* 本局表现 */}
          <section className="ui-card-primary bg-stone-50 p-4">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="h-px w-8 bg-stone-300/80" />
                <div className="text-sm tracking-[0.14em] text-[var(--color-text-muted)]">
                  {t('finished.currentRun')}
                </div>
                <span className="h-px w-8 bg-stone-300/80" />
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mb-1">{t('finished.accuracyRate')}</div>
              <div className="text-4xl font-semibold text-[var(--color-text-primary)] tabular-nums">
                {Math.round(metrics.memoryAccuracy * 100)}%
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mt-1">
                {t('finished.accuracyDesc', { total: metrics.totalTurns, correct: Math.round(metrics.memoryAccuracy * metrics.totalTurns) })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="ui-card-secondary bg-white p-3 text-center">
                <div className="text-sm text-[var(--color-text-muted)] mb-1">{t('finished.targetRecognition')}</div>
                <div className="text-2xl font-semibold text-green-600 tabular-nums">
                  {Math.round(metrics.target识别率 * 100)}%
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {t('finished.targetDesc', { total: metrics.targetCount, hits })}
                </div>
              </div>
              <div className="ui-card-secondary bg-white p-3 text-center">
                <div className="text-sm text-[var(--color-text-muted)] mb-1">{t('finished.falseAlarmRate')}</div>
                <div className="text-2xl font-semibold text-red-500 tabular-nums">
                  {Math.round(metrics.falseAlarmRate * 100)}%
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {t('finished.falseAlarmDesc', { total: metrics.nonTargetCount, fa: falseAlarms })}
                </div>
              </div>
            </div>

            <div className="ui-card-secondary mt-3 bg-blue-50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Brain size={14} className="text-blue-600" />
                <span className="text-sm text-blue-700">{t('finished.sensitivity')} d'</span>
              </div>
              <div className="text-right">
                  <span className="text-lg font-semibold text-blue-600 tabular-nums">{metrics.dPrime}</span>
                <span className="text-sm text-blue-400 ml-1">{metrics.dPrimeInterpretation.level}</span>
              </div>
            </div>

            {metrics.avgRT > 0 && (
              <div className="ui-card-secondary mt-2 bg-purple-50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-purple-600" />
                  <span className="text-sm text-purple-700">{t('finished.avgReaction')}</span>
                </div>
                <span className="text-lg font-semibold text-purple-600 tabular-nums">{metrics.avgRT}ms</span>
              </div>
            )}
          </section>

          {/* 过往记录 */}
          <section className="ui-card-primary bg-stone-50 p-4 text-left">
            <div className="mb-3 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="h-px w-8 bg-stone-300/80" />
                <div className="text-sm tracking-[0.14em] text-[var(--color-text-muted)]">
                  {t('finished.pastRecords')}
                </div>
                <span className="h-px w-8 bg-stone-300/80" />
              </div>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {t('finished.pastRecordsHint')}
              </p>
            </div>

            {pastSessions.length === 0 ? (
              <div className="ui-card-secondary bg-white/80 border border-stone-200/80 px-4 py-5 text-center">
                <div className="text-sm text-[var(--color-text-secondary)] mb-1">
                  {t('finished.firstRecordTitle')}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {t('finished.firstRecordBody')}
                </p>
              </div>
            ) : (
              <div className="relative ml-1 space-y-1.5 before:absolute before:left-[6px] before:top-2 before:bottom-2 before:w-px before:bg-stone-200/90">
                {pastSessions.map((session) => (
                  <div
                    key={session.id}
                    className="group relative pl-5"
                  >
                    <span className="ui-dot absolute left-[1px] top-5 h-[11px] w-[11px] border border-stone-300 bg-stone-50 shadow-[0_0_0_3px_rgba(245,245,244,0.95)]" />
                    <div className="ui-card-primary flex items-start justify-between gap-3 bg-white/75 px-4 py-3 border border-stone-200/70 transition-colors duration-200 group-hover:bg-white">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-sm text-[var(--color-text-primary)] font-medium truncate">
                            {session.modeLabel}
                          </div>
                          {session.isLatest && (
                            <span className="ui-chip shrink-0 bg-stone-100 px-2 py-0.5 text-sm tracking-[0.08em] text-[var(--color-text-muted)]">
                              {t('finished.latestRecord')}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-[var(--color-text-muted)] mt-1 break-words">
                          {session.metaLabel}
                        </div>
                        <div className="text-sm text-stone-400 mt-2">
                          {session.dateLabel}
                        </div>
                      </div>
                      <div className="shrink-0 text-right pt-0.5">
                        <div className="text-[28px] leading-none font-semibold text-green-600 tabular-nums">
                          {Math.round(session.accuracyValue * 100)}%
                        </div>
                        <div className="text-sm text-stone-400 mt-1">
                          {t('finished.recordAccuracyLabel')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 花园成长卡片 */}
        {(() => {
          const gardenLevel = useGardenStore.getState().getGardenLevel();
          const totalWalks = useGardenStore.getState().totalWalks;
          const growthPoints = useGardenStore.getState().growthPoints;
          const streakDays = useGardenStore.getState().streakDays;
          return (
            <div className="ui-card-primary bg-green-50 p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <StoreIcon
                  value={gardenLevel.icon}
                  className="text-2xl"
                  spriteClass="sprite-frame w-10"
                />
                <span className="text-sm font-medium text-green-700">{t('finished.gardenLevel', { level: gardenLevel.name })}</span>
              </div>
              <p className="text-sm text-green-600">
                {t('finished.gardenReward', { reward: feedback.reward })}
              </p>
              <p className="text-sm text-green-500 mt-1">
                {t('finished.walkCount', { count: totalWalks })}
                {streakDays > 1 && <span> {t('finished.streakCount', { days: streakDays })}</span>}
              </p>
              {/* 成长进度条 */}
              {gardenLevel.level < 6 && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-green-500 mb-1">
                    <span>{t('finished.growthProgress')}</span>
                    <span>{t('finished.progressPoints', { current: growthPoints, total: gardenLevel.nextThreshold })}</span>
                  </div>
                  <div className="ui-progress-track h-2 w-full bg-green-100">
                    <div
                      className="ui-progress-fill bg-green-400"
                      style={{ width: `${Math.round(gardenLevel.progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {gardenLevel.level >= 6 && (
                <p className="text-sm text-green-400 mt-2 text-center">{t('finished.gardenFullBloom')}</p>
              )}
              {/* 新解锁的收藏品：短卡片 + 展开故事 + 多解锁队列 */}
              {unlockQueue.length > 0 && (() => {
                const current = unlockQueue[Math.min(unlockQueueIndex, unlockQueue.length - 1)];
                const collectible = getCollectibleById(current.collectibleId, i18n.language);
                const tier = getNarrativeTier(current.collectibleId, current.tierId, i18n.language);
                if (!collectible || !tier) return null;

                const isLast = unlockQueueIndex >= unlockQueue.length - 1;
                const tierName = t('garden.tiers.' + current.tierId) || current.tierId;

                const handleNext = () => {
                  // R10: 消费锁，防止连点重复操作
                  if (isProcessing) return;
                  setIsProcessing(true);
                  markNarrativeRead(current.collectibleId, current.tierId);
                  saveFullText(current.collectibleId, tier.story || tier.shortText);
                  if (isLast) {
                    clearUnlockQueue();
                    setIsProcessing(false);
                  } else {
                    setUnlockQueueIndex(unlockQueueIndex + 1);
                    setStoryExpanded(false);
                    setIsProcessing(false);
                  }
                };

                return (
                  <div className="mt-3 pt-3 border-t border-green-100">
                    <p className="text-sm text-green-500 mb-2">
                      {t('finished.newCollection', { current: unlockQueueIndex + 1, total: unlockQueue.length })}
                    </p>
                    <div className="ui-card-secondary bg-white p-3 shadow-[0_10px_20px_rgba(120,113,108,0.06)]">
                      <div className="flex items-center gap-2 mb-2">
                        <StoreIcon
                          value={collectible.icon}
                          className="text-2xl"
                          spriteClass="sprite-frame w-10"
                        />
                        <div>
                          <span className="break-words text-sm font-medium text-green-700">{collectible.name}</span>
                          <span className="text-sm text-green-500 ml-1">· {tierName}</span>
                        </div>
                      </div>
                      <p className="break-words text-sm leading-relaxed text-green-600">{tier.shortText}</p>

                      {/* 展开/收起故事 */}
                      <button
                        onClick={() => setStoryExpanded(!storyExpanded)}
                        className="mt-2 text-sm text-green-400 hover:text-green-600 transition-colors"
                      >
                        {storyExpanded ? t('finished.collapseStory') : t('finished.expandStory')}
                      </button>
                      {storyExpanded && (
                        <div className="ui-card-tertiary mt-2 p-2 bg-green-50 animate-expand">
                          <p className="break-words whitespace-pre-line text-sm leading-relaxed text-green-700">{tier.story}</p>
                        </div>
                      )}

                      {/* 操作按钮：对齐文档 §7.1 */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleNext}
                          className="ui-btn-base ui-btn-primary flex-1 py-2 text-sm hover:bg-green-600 transition-colors"
                          style={{ minHeight: '40px' }}
                        >
                          {t('finished.saveToJournal')}
                        </button>
                        {!isLast && (
                          <button
                            onClick={() => {
                              // 先标记队列中所有解锁为已读，再清空
                              unlockQueue.forEach((u) => markNarrativeRead(u.collectibleId, u.tierId));
                              clearUnlockQueue();
                            }}
                            className="ui-btn-base ui-btn-neutral px-3 py-2 text-sm hover:bg-stone-200 transition-colors"
                            style={{ minHeight: '40px' }}
                          >
                            {t('finished.continueWalk')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* 折叠详细数据 */}
        <div className="mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mx-auto"
          >
            {showDetails ? (
              <>
                <ChevronUp size={14} /> {t('finished.hideDetailedData')}
              </>
            ) : (
              <>
                <ChevronDown size={14} /> {t('finished.detailedData')}
              </>
            )}
          </button>

          {showDetails && (
            <div className="ui-section-stack mt-3 animate-expand">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 综合评分 */}
                <div className="ui-card-secondary bg-stone-50 p-3">
                  <div className="text-sm text-[var(--color-text-muted)] mb-1">{t('finished.score')}</div>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {score}
                    <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">{t('finished.points')}</span>
                  </div>
                </div>

                {/* 深层分析：只保留上半区未直接显示的 β */}
                <div className="ui-card-secondary bg-blue-50 p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Brain size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{t('finished.analysisReading')}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{metrics.beta}</div>
                  <div className="text-sm text-blue-500 mt-1">{t('finished.beta')}</div>
                  <div className="text-sm text-blue-400">{metrics.betaInterpretation.type}</div>
                </div>
              </div>

              {/* 四分类 */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="ui-card-tertiary bg-green-50 p-2 text-center">
                  <div className="text-green-600 font-bold text-lg">{hits}</div>
                  <div className="text-green-500">{t('finished.hits')}</div>
                  <div className="text-sm text-green-400">{t('finished.hitDesc')}</div>
                </div>
                <div className="ui-card-tertiary bg-amber-50 p-2 text-center">
                  <div className="text-amber-600 font-bold text-lg">{misses}</div>
                  <div className="text-amber-500">{t('finished.misses')}</div>
                  <div className="text-sm text-amber-400">{t('finished.missDesc')}</div>
                </div>
                <div className="ui-card-tertiary bg-red-50 p-2 text-center">
                  <div className="text-red-500 font-bold text-lg">{falseAlarms}</div>
                  <div className="text-red-400">{t('finished.falseAlarms')}</div>
                  <div className="text-sm text-red-300">{t('finished.falseAlarmLabel')}</div>
                </div>
                <div className="ui-card-tertiary bg-blue-50 p-2 text-center">
                  <div className="text-blue-600 font-bold text-lg">{correctRejections}</div>
                  <div className="text-blue-500">{t('finished.correctRejection')}</div>
                  <div className="text-sm text-blue-400">{t('finished.correctRejectionDesc')}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleRestart}
            aria-label={t('finished.walkAgain')}
            className="ui-btn-base ui-btn-primary w-full py-4 text-lg transition-all flex items-center justify-center gap-2"
            style={{
              fontFamily: 'var(--font-family-serif)',
              minHeight: '56px',
              fontSize: '20px',
              touchAction: 'manipulation',
            }}
          >
            <Wind size={20} />
            {t('finished.walkAgain')}
          </button>

          <button
            onClick={handleBackToGarden}
            aria-label={t('finished.backToGarden')}
            className="ui-btn-base ui-btn-secondary w-full py-3 text-sm transition-all flex items-center justify-center gap-2"
            style={{ minHeight: '48px' }}
          >
            <Flower2 size={16} />
            {t('finished.backToGarden')}
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
