/**
 * 花园日记面板 — 展示已解锁的日记碎片
 *
 * 从 narratives.js 派生碎片文本
 * 从 useAchievementStore 读取已读状态
 * 按时间倒序展示，点击可跳转到完整故事
 *
 * @version 1.0
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import useAchievementStore from '@stores/useAchievementStore';
import { getCollectibleById } from '@engine/narratives';

/**
 * 花园日记面板组件
 * 展示所有已解锁的日记碎片，按时间倒序
 */
export default function GardenJournalPanel() {
  const navigate = useNavigate();
  const unlockedNarratives = useAchievementStore((s) => s.unlockedNarratives);
  const diaryEntries = useAchievementStore((s) => s.diaryEntries);
  const markDiaryFragmentRead = useAchievementStore((s) => s.markDiaryFragmentRead);
  const hasViewedGardenDiary = useAchievementStore((s) => s.hasViewedGardenDiary);
  const markGardenDiaryViewed = useAchievementStore((s) => s.markGardenDiaryViewed);

  /**
   * 从已解锁的收藏品中提取所有日记碎片
   * 按解锁时间倒序排列
   */
  const fragments = useMemo(() => {
    const result = [];
    const tierOrder = { sprout: 0, leaf: 1, bloom: 2, fullBloom: 3 };

    for (const [collectibleId, highestTierId] of Object.entries(unlockedNarratives)) {
      const collectible = getCollectibleById(collectibleId);
      if (!collectible) continue;

      const highestOrder = tierOrder[highestTierId] ?? -1;

      for (const tier of collectible.tiers) {
        const tierMeta = tierOrder[tier.tierId];
        if (tierMeta === undefined || tierMeta > highestOrder) continue;
        if (!tier.diaryFragments || tier.diaryFragments.length === 0) continue;

        tier.diaryFragments.forEach((text, index) => {
          const readEntry = diaryEntries.find(
            (e) => e.collectibleId === collectibleId && e.tierId === tier.tierId && e.fragmentIndex === index
          );
          result.push({
            collectibleId,
            collectibleName: collectible.name,
            collectibleIcon: collectible.icon,
            tierId: tier.tierId,
            tierName: tier.tierName,
            fragmentIndex: index,
            text,
            readAt: readEntry?.readAt || null,
            isRead: !!readEntry,
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
  }, [unlockedNarratives, diaryEntries]);

  /**
   * 标记花园日记入口已查看
   */
  const handleViewDiary = () => {
    if (!hasViewedGardenDiary) {
      markGardenDiaryViewed();
    }
  };

  /**
   * 点击碎片，标记已读并跳转到收藏页
   * @param {Object} fragment
   */
  const handleFragmentClick = (fragment) => {
    if (!fragment.isRead) {
      markDiaryFragmentRead(fragment.collectibleId, fragment.tierId, fragment.fragmentIndex);
    }
    navigate('/achievements');
  };

  if (fragments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-[var(--color-text-muted)]" />
          <span className="font-bold text-[var(--color-text-primary)]">花园日记</span>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
          完成散步后，花园会记住一些碎片。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-5" onClick={handleViewDiary}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-[var(--color-brand)]" />
          <span className="font-bold text-[var(--color-text-primary)]">花园日记</span>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          {fragments.filter((f) => f.isRead).length}/{fragments.length} 条
        </span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {fragments.slice(0, 10).map((fragment, i) => (
          <button
            key={`${fragment.collectibleId}-${fragment.tierId}-${fragment.fragmentIndex}`}
            onClick={() => handleFragmentClick(fragment)}
            className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-stone-50 transition-colors text-left"
            style={{ touchAction: 'manipulation' }}
          >
            <span className="text-sm flex-shrink-0 mt-0.5">{fragment.collectibleIcon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs leading-relaxed ${
                fragment.isRead ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)] font-medium'
              }`}>
                {fragment.text}
              </p>
              <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 inline-block">
                {fragment.collectibleName} · {fragment.tierName}
              </span>
            </div>
            {!fragment.isRead && (
              <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-1" />
            )}
            <ChevronRight size={14} className="text-stone-300 flex-shrink-0 mt-0.5" />
          </button>
        ))}
      </div>

      {fragments.length > 10 && (
        <button
          onClick={() => navigate('/achievements')}
          className="mt-3 text-xs text-[var(--color-brand)] hover:underline text-center w-full"
        >
          查看全部 {fragments.length} 条
        </button>
      )}
    </div>
  );
}
