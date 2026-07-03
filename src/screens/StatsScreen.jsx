/**
 * 统计页 — 展示游戏统计数据和历史记录
 * v1.1新增: 统计面板、历史记录、d-prime计算
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, Zap, Clock, TrendingUp, Calendar, Flower2, Leaf } from 'lucide-react';
import useStatsStore from '@stores/useStatsStore';
import useGardenStore from '@stores/useGardenStore';
import useAchievementStore, { COLLECTION_DEFS, TIERS } from '@stores/useAchievementStore';
import { calculateSDT } from '@engine/SignalDetection';
import GardenJournalPanel from '@components/GardenJournalPanel';
import { HIDDEN_ACHIEVEMENTS } from '@engine/narrativeUnlockEngine';

/** 模式 ID 到中文名的映射 */
const MODE_NAMES = {
  standard: '散步',
  walk: '散步',
  dual: '花与歌',
  spatial: '花坛',
  grid: '花圃',
};

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

export default function StatsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sessions = useStatsStore((s) => s.sessions);
  const bestScores = useStatsStore((s) => s.bestScores);
  const hiddenAchievements = useAchievementStore((s) => s.hiddenAchievements);

  /** 总体统计 */
  const overallStats = useMemo(() => {
    if (sessions.length === 0) {
      return { totalGames: 0, avgAccuracy: 0, avgDPrime: 0, bestStreak: 0, totalDuration: 0 };
    }

    let totalHits = 0;
    let totalMisses = 0;
    let totalFA = 0;
    let totalCR = 0;
    let bestStreak = 0;
    let totalDuration = 0;

    sessions.forEach((s) => {
      totalHits += s.hits || 0;
      totalMisses += s.misses || 0;
      totalFA += s.falseAlarms || 0;
      totalCR += s.correctRejections || 0;
      bestStreak = Math.max(bestStreak, s.streakBest || 0);
      totalDuration += s.duration || 0;
    });

    return {
      totalGames: sessions.length,
      avgAccuracy: (totalHits + totalMisses + totalFA + totalCR) > 0 ? (totalHits + totalCR) / (totalHits + totalMisses + totalFA + totalCR) : 0,
      avgDPrime: calculateSDT({ hits: totalHits, misses: totalMisses, falseAlarms: totalFA, correctRejections: totalCR }).dPrime,
      bestStreak,
      totalDuration,
    };
  }, [sessions]);

  /** 最近10场记录 (倒序) */
  const recentSessions = useMemo(() => {
    return [...sessions].reverse().slice(0, 10);
  }, [sessions]);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <button
          onClick={() => navigate('/menu')}
          className="p-2 rounded-full bg-white/50 hover:bg-white transition-colors"
          style={{ minHeight: 'var(--touch-min-size)', minWidth: 'var(--touch-min-size)' }}
        >
          <ArrowLeft size={20} className="text-[var(--color-text-secondary)]" />
        </button>
        <h1 className="text-2xl text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-family-serif)' }}>
          {t('stats.title')}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        {/* 花园日记卡片 */}
        {(() => {
          const gardenLevel = useGardenStore.getState().getGardenLevel();
          const totalWalks = useGardenStore.getState().totalWalks;
          const streakDays = useGardenStore.getState().streakDays;
          const discovered = useGardenStore.getState().discovered;
          return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flower2 size={18} className="text-green-600" />
                <span className="font-bold text-green-800">花园日记</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{gardenLevel.icon}</span>
                <div>
                  <div className="text-lg font-bold text-green-800">花园 · {gardenLevel.name}</div>
                  <div className="text-sm text-green-600">
                    {totalWalks} 次散步
                    {streakDays > 1 && <span> · 连续 {streakDays} 天</span>}
                  </div>
                </div>
              </div>
              {/* 成长进度 */}
              {gardenLevel.level < 6 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-green-600 mb-1">
                    <span>成长进度</span>
                    <span>{useGardenStore.getState().growthPoints} / {gardenLevel.nextThreshold} 点</span>
                  </div>
                  <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(gardenLevel.progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {/* 已发现元素 */}
              {discovered.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <Leaf size={12} />
                  <span>已发现 {discovered.length} 个花园元素</span>
                </div>
              )}
              {discovered.length === 0 && (
                <p className="text-xs text-green-400">完成散步，花园会慢慢生长。</p>
              )}
            </div>
          );
        })()}

        {/* 花园收藏 */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-[var(--color-brand)]" />
              <span className="font-bold text-[var(--color-text-primary)]">花园收藏</span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {Object.keys(useAchievementStore.getState().unlockedNarratives).length} / {COLLECTION_DEFS.length} 件
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {COLLECTION_DEFS.map((def) => {
              const currentTierId = useAchievementStore.getState().unlockedNarratives[def.id];
              const currentTier = currentTierId
                ? def.tiers.find((t) => t.tier === currentTierId)
                : null;
              const tierName = currentTierId
                ? TIERS.find((t) => t.id === currentTierId)?.name || ''
                : '';
              return (
                <div
                  key={def.id}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    currentTier ? 'bg-green-50' : 'bg-stone-50 opacity-50'
                  }`}
                  title={currentTier ? `${def.name} · ${tierName}` : `${def.name} · 未解锁`}
                >
                  <span className={`text-2xl ${currentTier ? '' : 'grayscale'}`}>
                    {currentTier ? currentTier.icon : '❓'}
                  </span>
                  <span className={`text-[10px] leading-tight text-center ${currentTier ? 'text-green-700' : 'text-stone-400'}`}>
                    {currentTier ? `${def.name}` : '???'}
                  </span>
                  {currentTier && (
                    <span className="text-[9px] text-green-500">{tierName}</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* 品质档位说明 */}
          <div className="flex justify-center gap-3 mt-3 pt-3 border-t border-stone-100">
            {TIERS.map((tier) => (
              <span key={tier.id} className="text-[10px] text-[var(--color-text-muted)]">
                {tier.name}
              </span>
            ))}
          </div>
        </div>

        {/* 花园日记 */}
        <GardenJournalPanel />

        {/* 花园秘密 — 隐藏成就 */}
        {(() => {
          const hiddenIds = Object.keys(HIDDEN_ACHIEVEMENTS);
          const unlockedIds = hiddenIds.filter((id) => hiddenAchievements[id]);
          if (unlockedIds.length === 0 && Object.keys(useStatsStore.getState().perModeCounts).length === 0) return null;
          return (
            <div className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤫</span>
                <span className="font-bold text-[var(--color-text-primary)]">花园秘密</span>
                {unlockedIds.length > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)] ml-auto">
                    {unlockedIds.length}/{hiddenIds.length}
                  </span>
                )}
              </div>
              {unlockedIds.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-2">
                  花园里藏着一些秘密。也许多走走就会发现。
                </p>
              ) : (
                <div className="space-y-2">
                  {unlockedIds.map((id) => {
                    const achievement = HIDDEN_ACHIEVEMENTS[id];
                    const unlockedAt = hiddenAchievements[id];
                    const date = unlockedAt ? new Date(unlockedAt) : null;
                    return (
                      <div key={id} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                        <span className="text-sm">❤️</span>
                        <div className="flex-1">
                          <p className="text-xs text-amber-700 leading-relaxed">{achievement.text}</p>
                          {date && (
                            <span className="text-[10px] text-amber-400 mt-0.5 inline-block">
                              {date.getFullYear()}.{String(date.getMonth() + 1).padStart(2, '0')}.{String(date.getDate()).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* 未解锁的显示占位 */}
                  {hiddenIds.filter((id) => !hiddenAchievements[id]).map((id) => (
                    <div key={id} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg opacity-40">
                      <span className="text-sm">❓</span>
                      <span className="text-xs text-stone-400">尚未发现的秘密</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* 总体统计卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-[var(--color-brand)]" />
            <span className="font-bold text-[var(--color-text-primary)]">{t('stats.overview')}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 总场次 */}
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <Calendar size={18} className="mx-auto text-[var(--color-text-muted)] mb-1" />
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{overallStats.totalGames}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{t('stats.totalGames')}</div>
            </div>

            {/* 平均准确率 */}
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <Target size={18} className="mx-auto text-[var(--color-text-muted)] mb-1" />
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {Math.round(overallStats.avgAccuracy * 100)}%
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">{t('stats.avgAccuracy')}</div>
            </div>

            {/* d-prime */}
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <Zap size={18} className="mx-auto text-[var(--color-text-muted)] mb-1" />
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {overallStats.avgDPrime.toFixed(1)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">{t('stats.dPrime')}</div>
            </div>

            {/* 最佳连胜 */}
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <Trophy size={18} className="mx-auto text-[var(--color-text-muted)] mb-1" />
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{overallStats.bestStreak}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{t('stats.bestStreak')}</div>
            </div>
          </div>

          {/* 总训练时长 */}
          <div className="flex items-center justify-between bg-stone-50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-text-muted)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">{t('stats.totalTime')}</span>
            </div>
            <span className="font-bold text-[var(--color-text-primary)]">
              {formatDuration(overallStats.totalDuration)}
            </span>
          </div>
        </div>

        {/* 最高分面板 */}
        {Object.keys(bestScores).length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={18} className="text-amber-500" />
              <span className="font-bold text-[var(--color-text-primary)]">{t('stats.bestScores')}</span>
            </div>
            <div className="space-y-2">
              {Object.entries(bestScores).map(([modeId, score]) => (
                <div key={modeId} className="flex justify-between items-center bg-stone-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">{MODE_NAMES[modeId] || modeId}</span>
                  <span className="font-bold text-amber-600">{score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 历史记录 */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-[var(--color-text-secondary)]" />
            <span className="font-bold text-[var(--color-text-primary)]">{t('stats.history')}</span>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-center py-8">
              {t('stats.noHistory')}
            </p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {MODE_NAMES[session.modeId] || session.modeId || `N${session.difficulty}`}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDate(session.startedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {t('stats.accuracy')}: {Math.round((session.accuracy || 0) * 100)}%
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDuration(session.duration || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[var(--color-text-primary)]">{session.score}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{t('stats.score')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
