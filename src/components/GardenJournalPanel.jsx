/**
 * 花园日记面板 — 展示已解锁的日记碎片
 *
 * 从 narratives.js 派生碎片文本
 * 从 useAchievementStore 读取已读状态和完整故事
 * 按时间倒序展示，点击可跳转到完整故事
 *
 * @version 1.1
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import useAchievementStore from '@stores/useAchievementStore';
import { getCollectibleById } from '@engine/narratives';
import StoreIcon from '@components/StoreIcon';

/**
 * 从静态叙事配置中推导某个收藏品当前可见的完整故事
 * 当本地缓存缺失时，仍可根据最高解锁档位重建全文展示。
 * @param {string} collectibleId
 * @param {string|null|undefined} highestTierId
 * @returns {string}
 */
function getFallbackFullText(collectibleId, highestTierId) {
  if (!collectibleId || !highestTierId) return '';
  const collectible = getCollectibleById(collectibleId);
  const tier = collectible?.tiers?.find((item) => item.tierId === highestTierId);
  return tier?.story || tier?.shortText || '';
}

/**
 * 为当前语言生成可展示的日记碎片列表。
 * 中文/繁中直接沿用原始 diaryFragments；
 * 英文没有独立碎片时，从 shortText + story 段落中提炼 2-3 条，避免页面只显示一条而显得内容缺失。
 * @param {{ shortText?: string, story?: string, diaryFragments?: string[] }} tier
 * @param {string} lang
 * @returns {string[]}
 */
function getLocalizedDiaryFragments(tier, lang) {
  if (lang !== 'en-US') {
    return tier.diaryFragments || [];
  }

  const parts = [];
  if (tier.shortText) {
    parts.push(tier.shortText.trim());
  }

  const storyParagraphs = (tier.story || '')
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter(Boolean);

  for (const paragraph of storyParagraphs) {
    if (parts.length >= 3) break;
    if (!parts.includes(paragraph)) {
      parts.push(paragraph);
    }
  }

  return parts;
}

/**
 * 花园日记面板组件
 * 展示所有已解锁的日记碎片，按时间倒序
 * 支持展开查看完整故事（如果有 fullText）
 */
export default function GardenJournalPanel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const unlockedNarratives = useAchievementStore((s) => s.unlockedNarratives);
  const diaryEntries = useAchievementStore((s) => s.diaryEntries);
  const markDiaryFragmentRead = useAchievementStore((s) => s.markDiaryFragmentRead);
  const hasViewedGardenDiary = useAchievementStore((s) => s.hasViewedGardenDiary);
  const markGardenDiaryViewed = useAchievementStore((s) => s.markGardenDiaryViewed);
  const [expandedId, setExpandedId] = useState(null);

  /**
   * 从已解锁的收藏品中提取所有日记碎片
   * 按解锁时间倒序排列
   * 标记是否有完整故事文本
   */
  const fragments = useMemo(() => {
    const result = [];
    const tierOrder = { sprout: 0, leaf: 1, bloom: 2, fullBloom: 3 };

    for (const [collectibleId, highestTierId] of Object.entries(unlockedNarratives)) {
      const collectible = getCollectibleById(collectibleId, i18n.language);
      if (!collectible) continue;

      const highestOrder = tierOrder[highestTierId] ?? -1;

      for (const tier of collectible.tiers) {
        const tierMeta = tierOrder[tier.tierId];
        if (tierMeta === undefined || tierMeta > highestOrder) continue;
        const localizedFragments = getLocalizedDiaryFragments(tier, i18n.language);
        if (localizedFragments.length === 0) continue;

        localizedFragments.forEach((text, index) => {
          const readEntry = diaryEntries.find(
            (e) => e.collectibleId === collectibleId && e.tierId === tier.tierId && e.fragmentIndex === index
          );
          result.push({
            collectibleId,
            collectibleName: collectible.name,
            collectibleIcon: collectible.icon,
            tierId: tier.tierId,
            tierName: t(`garden.tiers.${tier.tierId}`),
            fragmentIndex: index,
            text,
            readAt: readEntry?.readAt || null,
            isRead: !!readEntry,
            hasFullText: Boolean(tier.story || tier.shortText),
          });
        });
      }
    }

    // 按时间倒序，未读的排在最前
    result.sort((a, b) => {
      if (a.isRead && !b.isRead) return 1;
      if (!a.isRead && b.isRead) return -1;
      if (a.readAt && b.readAt) return new Date(b.readAt) - new Date(a.readAt);
      return 0;
    });

    return result;
  }, [unlockedNarratives, diaryEntries, i18n.language, t]);

  /**
   * 标记花园日记入口已查看
   */
  const handleViewDiary = () => {
    if (!hasViewedGardenDiary) {
      markGardenDiaryViewed();
    }
  };

  /**
   * 点击碎片，标记已读并精确跳转到成就页 + 对应收藏品&档位（query 传参 id / tier）
   * @param {Object} fragment
   */
  const handleFragmentClick = (fragment) => {
    if (!fragment.isRead) {
      markDiaryFragmentRead(fragment.collectibleId, fragment.tierId, fragment.fragmentIndex);
    }
    const query = new URLSearchParams();
    query.set('id', fragment.collectibleId);
    query.set('tier', fragment.tierId);
    navigate(`/achievements?${query.toString()}`);
  };

  if (fragments.length === 0) {
    return (
      <div className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-[var(--color-text-muted)]" />
          <span className="font-medium text-[var(--color-text-primary)]">{t('gardenJournal.title')}</span>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
          {t('gardenJournal.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm" onClick={handleViewDiary}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-[var(--color-brand)]" />
          <span className="font-medium text-[var(--color-text-primary)]">{t('gardenJournal.title')}</span>
        </div>
        <span className="text-sm text-[var(--color-text-muted)]">
          {t('gardenJournal.count', { read: fragments.filter((f) => f.isRead).length, total: fragments.length })}
        </span>
      </div>

      {/* 碎片列表 — 内容多长显示多长，不裁剪 */}
      <div className="space-y-2">
        {fragments.map((fragment) => {
          const entryKey = `${fragment.collectibleId}-${fragment.tierId}-${fragment.fragmentIndex}`;
          const isExpanded = expandedId === fragment.collectibleId && expandedId !== null;
          const fullText = getFallbackFullText(fragment.collectibleId, unlockedNarratives[fragment.collectibleId]);
          
          return (
            <div
              key={entryKey}
              className="ui-card-secondary border border-transparent p-2 transition-colors hover:bg-stone-50"
            >
              <button
                onClick={() => handleFragmentClick(fragment)}
                className="w-full flex items-start gap-2 text-left"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="flex-shrink-0 mt-0.5">
                  <StoreIcon
                    value={fragment.collectibleIcon}
                    className="text-sm"
                    spriteClass="sprite-frame w-10"
                    backgroundSize="1000% 1000%"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`break-words text-sm leading-relaxed ${
                    fragment.isRead ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)] font-medium'
                  }`}>
                    {fragment.text}
                  </p>
                  <span className="mt-0.5 inline-block break-words text-sm text-[var(--color-text-muted)]">
                    {fragment.collectibleName} · {fragment.tierName}
                  </span>
                </div>
                {!fragment.isRead && (
                  <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-1" />
                )}
                <ChevronRight size={14} className="text-stone-300 flex-shrink-0 mt-0.5" />
              </button>
              
              {/* 展开阅读完整故事按钮 */}
              {fragment.hasFullText && fullText && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : fragment.collectibleId);
                  }}
                  className="mt-1 ml-14 flex items-center gap-1 text-sm text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronDown size={10} className="rotate-180" />
                      <span>{t('gardenJournal.collapseFullText')}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={10} />
                      <span>{t('gardenJournal.expandFullText')}</span>
                    </>
                  )}
                </button>
              )}
              
              {/* 展开的完整故事内容 — 内容多长显示多长，不裁剪 */}
              {isExpanded && fullText && (
                <div className="ui-card-secondary mt-2 ml-14 border border-green-100 bg-green-50 p-2 animate-expand">
                  <p className="break-words whitespace-pre-line text-sm leading-relaxed text-green-700">
                    {fullText}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fragments.length > 10 && (
        <button
          onClick={() => navigate('/achievements')}
          className="mt-3 text-sm text-[var(--color-brand)] hover:underline text-center w-full"
        >
          {t('gardenJournal.viewAll', { count: fragments.length })}
        </button>
      )}
    </div>
  );
}
