/**
 * 排行榜页 — 本地排行榜展示
 * 按模式、难度、因子等维度展示最佳成绩
 * 
 * @version 2.0
 * @author Memory Garden Team
 */
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Star, Filter } from 'lucide-react';
import PageHeader from '@components/PageHeader';
import useStatsStore from '@stores/useStatsStore';
import LeaderboardService from '@services/LeaderboardService';
import MODE_I18N_KEYS from '@i18n/modeKeys';

/** 模式选项（nameKey 走 i18n，避免硬编码中文） */
const MODE_OPTIONS = [
  { id: null, nameKey: 'leaderboard.allModes' },
  { id: 'walk', nameKey: 'common.modeWalk' },
  { id: 'standard', nameKey: 'common.modeStandard' },
  { id: 'dual', nameKey: 'common.modeDual' },
  { id: 'spatial', nameKey: 'common.modeSpatial' },
  { id: 'grid', nameKey: 'common.modeGrid' },
];

/** 难度选项 */
const DIFFICULTY_OPTIONS = [
  { value: null, nameKey: 'leaderboard.allDifficulty' },
  { value: 1, name: 'N=1' },
  { value: 2, name: 'N=2' },
  { value: 3, name: 'N=3' },
];

/**
 * 排行榜页面组件
 */
export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sessions = useStatsStore((s) => s.sessions);

  // 筛选状态
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  // 获取排行榜数据
  const leaderboard = useMemo(() =>
    LeaderboardService.getLeaderboard(sessions, {
      modeId: selectedMode,
      difficulty: selectedDifficulty,
      sortBy: 'score',
      limit: 20,
    }),
    [sessions, selectedMode, selectedDifficulty]
  );

  // 获取各模式最佳成绩
  const bestByMode = useMemo(() => LeaderboardService.getBestByMode(sessions), [sessions]);

  // 获取总体摘要
  const summary = useMemo(() => LeaderboardService.getSummary(sessions), [sessions]);

  /**
   * 获取排名对应的奖牌图标
   * @param {number} rank - 排名
   * @returns {JSX.Element|null}
   */
  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={20} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={20} className="text-gray-400" />;
    if (rank === 3) return <Medal size={20} className="text-amber-600" />;
    return <span className="text-sm text-[var(--color-text-muted)] w-5 text-center">{rank}</span>;
  };

  return (
    <div className="ui-page-shell animate-fade-in">
      <div className="ui-page-frame ui-section-stack">
        <PageHeader
          onBack={() => navigate('/menu')}
          backLabel={t('common.back')}
          eyebrow={t('leaderboard.filter')}
          title={t('leaderboard.title')}
        />

        {/* 总体摘要 */}
        <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="ui-card-secondary bg-stone-50 px-3 py-4">
              <div className="tabular-nums text-2xl font-semibold text-[var(--color-brand)]">{summary.totalGames}</div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">{t('leaderboard.totalGames')}</div>
            </div>
            <div className="ui-card-secondary bg-stone-50 px-3 py-4">
              <div className="tabular-nums text-2xl font-semibold text-amber-500">{summary.bestScore}</div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">{t('leaderboard.bestScore')}</div>
            </div>
            <div className="ui-card-secondary bg-stone-50 px-3 py-4">
              <div className="tabular-nums text-2xl font-semibold text-green-500">{Math.round(summary.avgAccuracy * 100)}%</div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">{t('leaderboard.avgAccuracy')}</div>
            </div>
          </div>
        </section>

        {/* 模式最佳成绩 */}
        <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" />
            <h2 className="text-sm font-medium text-[var(--color-text-muted)]">{t('leaderboard.modeBest')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {MODE_OPTIONS.filter((m) => m.id).map((mode) => {
              const best = bestByMode[mode.id];
              return (
                <div
                  key={mode.id}
                  className="ui-card-secondary flex items-center gap-3 border border-stone-200/60 bg-stone-50 px-3 py-3"
                >
                  <Star size={16} className="text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[var(--color-text-muted)]">{t(mode.nameKey)}</div>
                    <div className="tabular-nums text-sm font-semibold text-[var(--color-text-primary)]">
                      {best ? best.score : '-'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 筛选器 */}
        <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-sm text-[var(--color-text-muted)]">{t('leaderboard.filter')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MODE_OPTIONS.map((mode) => (
              <button
                key={mode.id || 'all'}
                onClick={() => setSelectedMode(mode.id)}
                className={`ui-chip px-3 py-1.5 text-xs transition-all ${
                  selectedMode === mode.id
                    ? 'bg-[var(--color-brand)] text-white shadow-[0_12px_24px_rgba(125,150,131,0.20)]'
                    : 'border border-stone-200/80 bg-white/75 text-[var(--color-text-muted)] hover:bg-white'
                }`}
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                {mode.nameKey ? t(mode.nameKey) : mode.name}
              </button>
            ))}
            <div className="mx-1 h-6 w-px self-center bg-stone-200" />
            {DIFFICULTY_OPTIONS.map((diff) => (
              <button
                key={diff.value || 'all'}
                onClick={() => setSelectedDifficulty(diff.value)}
                className={`ui-chip px-3 py-1.5 text-xs transition-all ${
                  selectedDifficulty === diff.value
                    ? 'bg-[var(--color-brand)] text-white shadow-[0_12px_24px_rgba(125,150,131,0.20)]'
                    : 'border border-stone-200/80 bg-white/75 text-[var(--color-text-muted)] hover:bg-white'
                }`}
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                {diff.nameKey ? t(diff.nameKey) : diff.name}
              </button>
            ))}
          </div>
        </section>

        {/* 排行榜列表 */}
        <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-muted)]">
              <Trophy size={48} className="mx-auto mb-4 opacity-30" />
              <p>{t('leaderboard.noData')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`ui-card-secondary flex items-center gap-3 border p-3 transition-all ${
                    entry.rank <= 3
                      ? 'border-amber-100 bg-white shadow-[0_12px_24px_rgba(217,119,6,0.08)]'
                      : 'border-stone-200/60 bg-stone-50/80'
                  }`}
                >
                  {/* 排名 */}
                  <div className="flex w-8 flex-shrink-0 justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* 信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {t(MODE_I18N_KEYS[entry.modeId || entry.mode] ?? (entry.modeId || entry.mode))}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        N={entry.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {entry.factorId ? t(`services.factorNames.${entry.factorId}`) : ''} ·{' '}
                      {entry.endedAt ? new Date(entry.endedAt).toLocaleDateString() : ''}
                    </div>
                  </div>

                  {/* 分数 */}
                  <div className="text-right">
                    <div className="tabular-nums text-lg font-semibold text-[var(--color-brand)]">{entry.score}</div>
                    <div className="tabular-nums text-xs text-[var(--color-text-muted)]">
                      {Math.round((entry.accuracy || 0) * 100)}%
                    </div>
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
