/**
 * 统计页 — 展示游戏统计数据和历史记录
 * v1.1新增: 统计面板、历史记录、d-prime计算
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Zap, Clock, TrendingUp, Calendar, Flower2, Leaf } from 'lucide-react';
import PageHeader from '@components/PageHeader';
import useStatsStore from '@stores/useStatsStore';
import useGardenStore from '@stores/useGardenStore';
import useAchievementStore from '@stores/useAchievementStore';
import { calculateSDT } from '@engine/SignalDetection';
import { getLocalizedNarrativeCollectibles } from '@engine/narratives';
import GardenJournalPanel from '@components/GardenJournalPanel';
import StoreIcon from '@components/StoreIcon';
import { HIDDEN_ACHIEVEMENTS } from '@engine/narrativeUnlockEngine';
import MODE_I18N_KEYS from '@i18n/modeKeys';

/** 格式化秒数为 分:秒 */
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 格式化日期为 月/日 时:分 */
function formatDate(isoString) {
  const d = new Date(isoString);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 统计页组件
 * 统一展示成长摘要、收藏进度、历史记录与关键统计
 * @returns {JSX.Element}
 */
export default function StatsScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const sessions = useStatsStore((s) => s.sessions);
  const bestScores = useStatsStore((s) => s.bestScores);
  const perModeCounts = useStatsStore((s) => s.perModeCounts);
  const hiddenAchievements = useAchievementStore((s) => s.hiddenAchievements);
  const unlockedNarratives = useAchievementStore((s) => s.unlockedNarratives);
  const totalWalks = useGardenStore((s) => s.totalWalks);
  const streakDays = useGardenStore((s) => s.streakDays);
  const discovered = useGardenStore((s) => s.discovered);
  const growthPoints = useGardenStore((s) => s.growthPoints);
  const gardenLevel = useMemo(
    // 避免在 selector 中返回新对象，防止 React 19 下进入快照循环更新。
    () => {
      void growthPoints;
      return useGardenStore.getState().getGardenLevel();
    },
    [growthPoints]
  );
  const localizedCollectibles = useMemo(
    () => getLocalizedNarrativeCollectibles(i18n.language),
    [i18n.language]
  );

  /** 总体统计 */
  const overallStats = useMemo(() => {
    // R8: 防御性过滤旧 session，丢弃缺少关键字段的数据防止统计页崩溃
    const validSessions = sessions.filter(
      (s) => s && typeof s.score === 'number' && s.startedAt
    );
    if (validSessions.length === 0) {
      return { totalGames: 0, avgAccuracy: 0, avgDPrime: 0, bestStreak: 0, totalDuration: 0 };
    }

    let totalHits = 0;
    let totalMisses = 0;
    let totalFA = 0;
    let totalCR = 0;
    let bestStreak = 0;
    let totalDuration = 0;

    validSessions.forEach((s) => {
      totalHits += s.hits || 0;
      totalMisses += s.misses || 0;
      totalFA += s.falseAlarms || 0;
      totalCR += s.correctRejections || 0;
      bestStreak = Math.max(bestStreak, s.streakBest || 0);
      totalDuration += s.duration || 0;
    });

    return {
      totalGames: validSessions.length,
      avgAccuracy: (totalHits + totalMisses + totalFA + totalCR) > 0 ? (totalHits + totalCR) / (totalHits + totalMisses + totalFA + totalCR) : 0,
      avgDPrime: calculateSDT({ hits: totalHits, misses: totalMisses, falseAlarms: totalFA, correctRejections: totalCR }).dPrime,
      bestStreak,
      totalDuration,
    };
  }, [sessions]);

  /** 最近10场记录 (倒序) */
  const recentSessions = useMemo(() => {
    // R8: 防御性过滤旧 session，丢弃缺少关键字段的数据
    return [...sessions]
      .filter((s) => s && typeof s.score === 'number' && s.startedAt)
      .reverse()
      .slice(0, 10);
  }, [sessions]);

  return (
    <div className="ui-page-shell animate-fade-in">
      <div className="ui-page-frame ui-section-stack">
        <PageHeader
          onBack={() => navigate('/menu')}
          backLabel={t('common.back')}
          eyebrow={t('stats.overview')}
          title={t('stats.title')}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* 花园成长摘要 — 方案2：改名"花园成长"，删大花图避免重复，纯文字排版 */}
          <section className="ui-card-primary border border-green-200/60 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-5 shadow-[0_16px_32px_rgba(125,150,131,0.10)] sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-green-800">
              <Leaf size={18} />
              <span className="font-medium">{t('gardenJournal.growthTitle')}</span>
            </div>
            <div className="min-w-0 mb-4">
              <div className="text-lg font-semibold text-green-900 sm:text-xl">
                {t('stats.gardenLabel', { level: gardenLevel.name })}
              </div>
              <div className="text-sm text-green-700">
                {t('stats.walkCount', { count: totalWalks })}
                {streakDays > 1 && <span> · {t('stats.streakDays', { days: streakDays })}</span>}
              </div>
            </div>
            {gardenLevel.level < 6 && (
              <div className="ui-card-secondary mb-4 border border-green-100/80 bg-white/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm text-green-700">
                  <span>{t('stats.growthProgress')}</span>
                  <span className="tabular-nums">
                    {t('stats.growthPoints', { current: growthPoints, total: gardenLevel.nextThreshold })}
                  </span>
                </div>
                <div className="ui-progress-track h-2 bg-green-100">
                  <div
                    className="ui-progress-fill bg-green-400"
                    style={{ width: `${Math.round(gardenLevel.progress * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {discovered.length > 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Leaf size={14} />
                <span>{t('stats.discoveredCount', { count: discovered.length })}</span>
              </div>
            ) : (
              <p className="text-sm text-green-600">{t('stats.keepWalking')}</p>
            )}
          </section>

          {/* 总体统计概览 */}
          <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--color-brand)]" />
              <span className="font-medium text-[var(--color-text-primary)]">{t('stats.overview')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="ui-card-secondary bg-stone-50 px-3 py-4 text-center">
                <Calendar size={18} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                <div className="tabular-nums text-2xl font-semibold text-[var(--color-text-primary)]">{overallStats.totalGames}</div>
                <div className="mt-1 text-sm text-[var(--color-text-muted)]">{t('stats.totalGames')}</div>
              </div>
              <div className="ui-card-secondary bg-stone-50 px-3 py-4 text-center">
                <Target size={18} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                <div className="tabular-nums text-2xl font-semibold text-[var(--color-text-primary)]">
                  {Math.round(overallStats.avgAccuracy * 100)}%
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-muted)]">{t('stats.avgAccuracy')}</div>
              </div>
              <div className="ui-card-secondary bg-stone-50 px-3 py-4 text-center">
                <Zap size={18} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                <div className="tabular-nums text-2xl font-semibold text-[var(--color-text-primary)]">
                  {overallStats.avgDPrime.toFixed(1)}
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-muted)]">{t('stats.dPrime')}</div>
              </div>
              <div className="ui-card-secondary bg-stone-50 px-3 py-4 text-center">
                <Trophy size={18} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                <div className="tabular-nums text-2xl font-semibold text-[var(--color-text-primary)]">{overallStats.bestStreak}</div>
                <div className="mt-1 text-sm text-[var(--color-text-muted)]">{t('stats.bestStreak')}</div>
              </div>
            </div>
            <div className="ui-card-secondary mt-4 flex items-center justify-between gap-3 bg-stone-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">{t('stats.totalTime')}</span>
              </div>
              <span className="tabular-nums text-lg font-semibold text-[var(--color-text-primary)]">
                {formatDuration(overallStats.totalDuration)}
              </span>
            </div>
          </section>
        </div>

        {/* 花园收藏 — 方案2：统一白底，已解锁白/未解锁石灰；删底部档位图例冗余 */}
        <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-[var(--color-brand)]" />
              <span className="font-medium text-[var(--color-text-primary)]">{t('menu.gardenCollection')}</span>
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">
              {t('stats.collectionProgress', { current: Object.keys(unlockedNarratives).length, total: localizedCollectibles.length })}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {localizedCollectibles.map((def) => {
              const currentTierId = unlockedNarratives[def.id];
              const currentTier = currentTierId
                ? def.tiers.find((tier) => tier.tierId === currentTierId)
                : null;
              const tierName = currentTierId ? t(`garden.tiers.${currentTierId}`) : '';

              return (
                <div
                  key={def.id}
                  className={`ui-card-secondary flex flex-col items-center gap-1 border px-2 py-3 text-center transition-all ${
                    currentTier
                      ? 'border-stone-200/60 bg-white shadow-sm'
                      : 'border-stone-200/70 bg-stone-50/60 opacity-60'
                  }`}
                  title={currentTier ? `${def.name} · ${tierName}` : `${def.name} · ${t('achievements.hiddenSecret')}`}
                >
                  <span className={`flex w-full items-center justify-center ${currentTier ? '' : 'grayscale'}`}>
                    <StoreIcon
                      value={currentTier ? currentTier.icon : '❓'}
                      className="text-2xl"
                      spriteClass="sprite-frame w-full"
                      backgroundSize="500% 500%"
                    />
                  </span>
                  <span className={`break-words text-sm leading-tight ${currentTier ? 'text-[var(--color-text-primary)]' : 'text-stone-400'}`}>
                    {currentTier ? def.name : '???'}
                  </span>
                  {currentTier && <span className="text-sm text-[var(--color-text-muted)]">{tierName}</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* 花园日记 */}
        <GardenJournalPanel />

        {/* 花园秘密 — 隐藏成就 */}
        {(() => {
          const hiddenIds = Object.keys(HIDDEN_ACHIEVEMENTS);
          const unlockedIds = hiddenIds.filter((id) => hiddenAchievements[id]);

          if (unlockedIds.length === 0 && Object.keys(perModeCounts).length === 0) return null;

          return (
            <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-lg">🤫</span>
                <span className="font-medium text-[var(--color-text-primary)]">{t('achievements.gardenSecrets')}</span>
                {unlockedIds.length > 0 && (
                  <span className="ml-auto text-sm text-[var(--color-text-muted)]">
                    {unlockedIds.length}/{hiddenIds.length}
                  </span>
                )}
              </div>
              {unlockedIds.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
                  {t('achievements.secretsHint')}
                </p>
              ) : (
                <div className="space-y-2">
                  {unlockedIds.map((id) => {
                    const achievement = HIDDEN_ACHIEVEMENTS[id];
                    const unlockedAt = hiddenAchievements[id];
                    const date = unlockedAt ? new Date(unlockedAt) : null;

                    return (
                      <div key={id} className="ui-card-secondary flex items-start gap-3 border border-amber-100/80 bg-amber-50/80 p-3">
                        <span className="text-sm">❤️</span>
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed text-amber-700">{achievement.text()}</p>
                          {date && (
                            <span className="mt-1 inline-block text-sm text-amber-500">
                              {date.getFullYear()}.{String(date.getMonth() + 1).padStart(2, '0')}.{String(date.getDate()).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {hiddenIds.filter((id) => !hiddenAchievements[id]).map((id) => (
                    <div key={id} className="ui-card-secondary flex items-center gap-3 border border-stone-200/70 bg-stone-50/70 p-3 opacity-50">
                      <span className="text-sm">❓</span>
                      <span className="text-sm text-stone-400">{t('achievements.undiscoveredSecrets')}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {/* 最高分面板 */}
        {Object.keys(bestScores).length > 0 && (
          <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              <span className="font-medium text-[var(--color-text-primary)]">{t('stats.bestScores')}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(bestScores).map(([modeId, score]) => (
                <div key={modeId} className="ui-card-secondary flex items-center justify-between bg-stone-50 px-4 py-3">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {MODE_I18N_KEYS[modeId] ? t(MODE_I18N_KEYS[modeId]) : modeId}
                  </span>
                  <span className="tabular-nums text-lg font-semibold text-amber-600">{score}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 历史记录 */}
        <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={18} className="text-[var(--color-text-secondary)]" />
            <span className="font-medium text-[var(--color-text-primary)]">{t('stats.history')}</span>
          </div>
          {recentSessions.length === 0 ? (
            <p className="py-10 text-center text-[var(--color-text-muted)]">{t('stats.noHistory')}</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div key={session.id} className="ui-card-secondary flex items-center justify-between gap-3 bg-stone-50 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {MODE_I18N_KEYS[session.modeId] ? t(MODE_I18N_KEYS[session.modeId]) : (session.modeId || `N${session.difficulty}`)}
                      </span>
                      <span className="text-sm text-[var(--color-text-muted)]">{formatDate(session.startedAt)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-muted)]">
                      <span className="tabular-nums">
                        {t('stats.accuracy')}: {Math.round((session.accuracy || 0) * 100)}%
                      </span>
                      <span className="tabular-nums">{formatDuration(session.duration || 0)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular-nums text-lg font-semibold text-[var(--color-text-primary)]">{session.score}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">{t('stats.score')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
