/**
 * 花园收藏页 — 展示 8 件收藏品及四档品质
 *
 * 从 narratives.js 派生所有展示文本
 * 支持已读/未读状态，未解锁不露全文
 *
 * @version 3.0
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import useAchievementStore from '@stores/useAchievementStore';
import { NARRATIVE_COLLECTIBLES } from '@engine/narratives';

/**
 * 格式化 ISO 日期为中文短格式
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** 品质档位排序和名称 */
const TIER_META = {
  sprout: { order: 0, name: '初芽' },
  leaf: { order: 1, name: '翠叶' },
  bloom: { order: 2, name: '繁花' },
  fullBloom: { order: 3, name: '盛放' },
};

/**
 * 花园收藏页主组件
 * 展示所有收藏品及其品质档位，支持已读/未读状态
 */
export default function AchievementsScreen() {
  const navigate = useNavigate();

  // 用 JSON.stringify 序列化为稳定字符串，避免对象引用变化导致无限循环
  const unlockedJson = useAchievementStore((s) => JSON.stringify(s.unlockedNarratives));
  const unlockedNarratives = useMemo(() => JSON.parse(unlockedJson), [unlockedJson]);
  const readNarratives = useAchievementStore((s) => s.readNarratives);
  const markNarrativeRead = useAchievementStore((s) => s.markNarrativeRead);
  const unlockTimestamps = useAchievementStore((s) => s.unlockTimestamps);

  const [expandedId, setExpandedId] = useState(null);
  const [expandedTier, setExpandedTier] = useState(null);

  const unlockedCount = Object.keys(unlockedNarratives).length;
  const totalCount = NARRATIVE_COLLECTIBLES.length;

  /**
   * 处理收藏品展开/收起
   * @param {string} collectibleId
   */
  const handleToggle = (collectibleId) => {
    if (expandedId === collectibleId) {
      setExpandedId(null);
      setExpandedTier(null);
    } else {
      setExpandedId(collectibleId);
      setExpandedTier(null);
    }
  };

  /**
   * 处理品质档位点击，展示故事并标记已读
   * @param {string} collectibleId
   * @param {string} tierId
   */
  const handleTierClick = (collectibleId, tierId) => {
    const key = `${collectibleId}:${tierId}`;
    if (expandedTier === key) {
      setExpandedTier(null);
    } else {
      setExpandedTier(key);
      // 标记已读
      if (!readNarratives.includes(key)) {
        markNarrativeRead(collectibleId, tierId);
      }
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <button
          onClick={() => navigate('/menu')}
          className="p-2 rounded-full bg-white/50 hover:bg-white transition-colors"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ArrowLeft size={20} className="text-[var(--color-text-secondary)]" />
        </button>
        <h1 className="text-2xl text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-family-serif)' }}>
          花园收藏
        </h1>
      </div>

      {/* 进度条 */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--color-text-muted)]">已收集</span>
          <span className="text-sm font-bold text-[var(--color-text-primary)]">
            {unlockedCount}/{totalCount} 件
          </span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-brand)] transition-all duration-500 rounded-full"
            style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 收藏品列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-3">
          {NARRATIVE_COLLECTIBLES.map((collectible) => {
            const highestTierId = unlockedNarratives[collectible.id];
            const highestOrder = highestTierId ? (TIER_META[highestTierId]?.order ?? -1) : -1;
            const isUnlocked = highestOrder >= 0;
            const isExpanded = expandedId === collectible.id;
            const highestTierName = highestTierId ? TIER_META[highestTierId]?.name : '';

            return (
              <div
                key={collectible.id}
                className={`rounded-2xl transition-all overflow-hidden ${
                  isUnlocked
                    ? 'bg-white shadow-md border-2 border-[var(--color-brand)]/20'
                    : 'bg-white/40 border-2 border-transparent'
                }`}
              >
                {/* 主行 */}
                <button
                  onClick={() => handleToggle(collectible.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className={`text-3xl flex-shrink-0 ${isUnlocked ? '' : 'grayscale opacity-40'}`}>
                    {collectible.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base ${
                      isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                    }`}>
                      {collectible.name}
                    </h3>
                    <p className={`text-sm ${
                      isUnlocked ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'
                    }`}>
                      {collectible.description}
                    </p>
                    {isUnlocked && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-green-600">
                          当前品质：{highestTierName}
                        </span>
                        {unlockTimestamps[collectible.id] && (
                          <span className="text-[10px] text-green-400">
                            发现于 {formatDate(unlockTimestamps[collectible.id])}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-stone-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-stone-400 flex-shrink-0" />
                  )}
                </button>

                {/* 展开详情：四档品质 */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-2">
                    {collectible.tiers.map((tier) => {
                      const tierMeta = TIER_META[tier.tierId];
                      const isTierUnlocked = tierMeta && tierMeta.order <= highestOrder;
                      const isCurrent = highestTierId === tier.tierId;
                      const readKey = `${collectible.id}:${tier.tierId}`;
                      const isRead = readNarratives.includes(readKey);
                      const isTierExpanded = expandedTier === readKey;

                      return (
                        <div key={tier.tierId}>
                          {/* 品质档位行 */}
                          <button
                            onClick={() => isTierUnlocked && handleTierClick(collectible.id, tier.tierId)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                              isCurrent
                                ? 'bg-green-100 border border-green-300'
                                : isTierUnlocked
                                  ? 'bg-green-50 hover:bg-green-100'
                                  : 'bg-stone-50 opacity-50'
                            }`}
                            style={{ touchAction: 'manipulation' }}
                            disabled={!isTierUnlocked}
                          >
                            <span className={`text-xl flex-shrink-0 ${isTierUnlocked ? '' : 'grayscale'}`}>
                              {isTierUnlocked ? collectible.icon : '🔒'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${
                                  isTierUnlocked ? 'text-green-700' : 'text-stone-400'
                                }`}>
                                  {tierMeta?.name || tier.tierId}
                                </span>
                                {isTierUnlocked && !isRead && (
                                  <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" title="未读" />
                                )}
                                {isTierUnlocked && isRead && (
                                  <BookOpen size={10} className="text-green-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className={`text-xs mt-0.5 ${
                                isTierUnlocked ? 'text-green-600' : 'text-stone-400'
                              }`}>
                                {isTierUnlocked ? tier.shortText : tier.unlockConditionText}
                              </p>
                            </div>
                            {isTierUnlocked && (
                              isTierExpanded ? (
                                <ChevronUp size={14} className="text-green-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown size={14} className="text-green-300 flex-shrink-0" />
                              )
                            )}
                          </button>

                          {/* 展开故事 */}
                          {isTierExpanded && isTierUnlocked && (
                            <div className="mt-1 p-3 bg-green-50 rounded-xl animate-fade-in">
                              <p className="text-xs text-green-700 leading-relaxed whitespace-pre-line">
                                {tier.story}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
