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
import { ArrowLeft, Trophy, Medal, Star, Filter } from 'lucide-react';
import useStatsStore from '@stores/useStatsStore';
import LeaderboardService from '@services/LeaderboardService';

/** 模式选项 */
const MODE_OPTIONS = [
  { id: null, name: '全部模式' },
  { id: 'standard', name: '标准模式' },
  { id: 'dual', name: '双通道' },
  { id: 'spatial', name: '空间模式' },
  { id: 'grid', name: '栅格模式' },
];

/** 难度选项 */
const DIFFICULTY_OPTIONS = [
  { value: null, name: '全部难度' },
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
    <div className="flex flex-col h-full animate-fade-in">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          style={{ minHeight: 'var(--touch-min-size)' }}
        >
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </button>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-family-serif)' }}>
          {t('leaderboard.title')}
        </h1>
        <div style={{ width: 60 }} /> {/* 占位 */}
      </div>

      {/* 总体摘要 */}
      <div className="px-6 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--color-brand)]">{summary.totalGames}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{t('leaderboard.totalGames')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-500">{summary.bestScore}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{t('leaderboard.bestScore')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{Math.round(summary.avgAccuracy * 100)}%</div>
              <div className="text-xs text-[var(--color-text-muted)]">{t('leaderboard.avgAccuracy')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 模式最佳成绩 */}
      <div className="px-6 mb-4">
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">{t('leaderboard.modeBest')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {MODE_OPTIONS.filter((m) => m.id).map((mode) => {
            const best = bestByMode[mode.id];
            return (
              <div
                key={mode.id}
                className="bg-white/60 rounded-xl p-3 flex items-center gap-2"
              >
                <Star size={16} className="text-amber-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[var(--color-text-muted)]">{mode.name}</div>
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">
                    {best ? best.score : '-'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 筛选器 */}
      <div className="px-6 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={14} className="text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-muted)]">{t('leaderboard.filter')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map((mode) => (
            <button
              key={mode.id || 'all'}
              onClick={() => setSelectedMode(mode.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                selectedMode === mode.id
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-white/60 text-[var(--color-text-muted)] hover:bg-white/80'
              }`}
              style={{ minHeight: 'var(--touch-min-size)' }}
            >
              {mode.name}
            </button>
          ))}
          <div className="w-px h-6 bg-stone-200 mx-1" />
          {DIFFICULTY_OPTIONS.map((diff) => (
            <button
              key={diff.value || 'all'}
              onClick={() => setSelectedDifficulty(diff.value)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                selectedDifficulty === diff.value
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-white/60 text-[var(--color-text-muted)] hover:bg-white/80'
              }`}
              style={{ minHeight: 'var(--touch-min-size)' }}
            >
              {diff.name}
            </button>
          ))}
        </div>
      </div>

      {/* 排行榜列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" />
            <p>{t('leaderboard.noData')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  entry.rank <= 3
                    ? 'bg-white shadow-sm border-2 border-amber-100'
                    : 'bg-white/60'
                }`}
              >
                {/* 排名 */}
                <div className="w-8 flex-shrink-0 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {LeaderboardService.getModeName(entry.modeId || entry.mode)}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      N={entry.difficulty}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {LeaderboardService.getFactorName(entry.factorId)} ·{' '}
                    {entry.endedAt ? new Date(entry.endedAt).toLocaleDateString() : ''}
                  </div>
                </div>

                {/* 分数 */}
                <div className="text-right">
                  <div className="text-lg font-bold text-[var(--color-brand)]">{entry.score}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {Math.round((entry.accuracy || 0) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
