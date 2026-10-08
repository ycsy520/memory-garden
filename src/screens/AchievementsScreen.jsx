/**
 * 花园收藏页 — 展示 8 件收藏品及四档品质
 *
 * 从 narratives.js 派生所有展示文本
 * 支持已读/未读状态，未解锁不露全文
 * 支持 URL query 精准定位：/achievements?id=collectibleId&tier=tierId
 * 用于花园日记面板点击进来直接展开并滚动到对应收藏品档位
 *
 * @version 3.2
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import PageHeader from '@components/PageHeader';
import useAchievementStore from '@stores/useAchievementStore';
import { getLocalizedNarrativeCollectibles } from '@engine/narratives';
import StoreIcon from '@components/StoreIcon';

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

/** 品质档位排序 */
const TIER_META = {
  sprout: { order: 0 },
  leaf: { order: 1 },
  bloom: { order: 2 },
  fullBloom: { order: 3 },
};

/**
 * 花园收藏页主组件
 * 展示所有收藏品及其品质档位，支持已读/未读状态
 * 响应 URL query 参数 ?id=&tier= 自动展开对应收藏品档位（从花园日记跳转）
 */
export default function AchievementsScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // 用 JSON.stringify 序列化为稳定字符串，避免对象引用变化导致无限循环
  const unlockedJson = useAchievementStore((s) => JSON.stringify(s.unlockedNarratives));
  const unlockedNarratives = useMemo(() => JSON.parse(unlockedJson), [unlockedJson]);
  const readNarratives = useAchievementStore((s) => s.readNarratives);
  const markNarrativeRead = useAchievementStore((s) => s.markNarrativeRead);
  const unlockTimestamps = useAchievementStore((s) => s.unlockTimestamps);

  /**
   * 方案3b：URL query 精准展开 — 用 useState 惰性初始化直接从 location 推导默认值
   * 避免 ESLint: 禁止 setState 在 useEffect/useMemo 中同步调用
   */
  const [initialQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return { id: params.get('id'), tier: params.get('tier') };
  });
  const [expandedId, setExpandedId] = useState(initialQuery.id);
  const [expandedTier, setExpandedTier] = useState(
    initialQuery.id && initialQuery.tier ? `${initialQuery.id}:${initialQuery.tier}` : null
  );

  const localizedCollectibles = useMemo(
    () => getLocalizedNarrativeCollectibles(i18n.language),
    [i18n.language]
  );
  const unlockedCount = Object.keys(unlockedNarratives).length;
  const totalCount = localizedCollectibles.length;

  /**
   * 记录已经做过一次锚点滚动（从花园日记跳转进成就页的定位），避免再次render触发
   */
  const anchorScrolledRef = useRef(false);

  /**
   * 首次渲染DOM出现在页面后：若URL query带id则平滑滚动到对应的收藏品卡片（或档位行）
   * 触发时机：DOM挂载后1帧 → 等React完成commit展开动画布局 → scrollIntoView居中对齐
   * 依赖 expandedId / expandedTier：保证展开后的内容全部插入DOM再滚动，避免滚到错位置
   */
  useEffect(() => {
    if (!initialQuery.id) return;
    if (anchorScrolledRef.current) return;
    const idToScroll = initialQuery.id;
    const tierToScroll = initialQuery.tier;
    // 等 DOM commit 再滚动（避免在 React 渲染中途触发 layout）
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        const tierEl = tierToScroll ? document.getElementById(`tier-${idToScroll}-${tierToScroll}`) : null;
        const targetEl = tierEl || document.getElementById(`collectible-${idToScroll}`);
        if (targetEl) {
          targetEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
          anchorScrolledRef.current = true;
        }
      });
      // 热更新/StrictMode双重挂载兜底，cleanup时清掉第二个raf
      anchorScrolledRef.current = true;
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
    // 仅在 id / tier 变化后且DOM真正展开时才执行
  }, [initialQuery.id, initialQuery.tier, expandedId, expandedTier]);

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
    <div className="ui-page-shell animate-fade-in">
      <div className="ui-page-frame ui-section-stack">
        <PageHeader
          onBack={() => navigate('/menu')}
          backLabel={t('common.back')}
          title={t('menu.gardenCollection')}
        />

        {/* 进度摘要 */}
        <section className="ui-card-primary border border-stone-200/70 bg-white/72 p-5 shadow-[0_16px_32px_rgba(120,113,108,0.08)] backdrop-blur-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--color-text-muted)]">{t('achievements.collected')}</span>
            <span className="tabular-nums text-sm font-semibold text-[var(--color-text-primary)]">
              {t('achievements.items', { count: totalCount })}
            </span>
          </div>
          <div className="ui-progress-track h-2 bg-stone-200">
            <div
              className="ui-progress-fill bg-[var(--color-brand)]"
              style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </section>

        {/* 收藏品列表 */}
        <div className="ui-section-stack">
          {localizedCollectibles.map((collectible) => {
            const highestTierId = unlockedNarratives[collectible.id];
            const highestOrder = highestTierId ? (TIER_META[highestTierId]?.order ?? -1) : -1;
            const isUnlocked = highestOrder >= 0;
            const isExpanded = expandedId === collectible.id;
            const highestTierName = highestTierId ? t(`garden.tiers.${highestTierId}`) : '';

            return (
              <section
                key={collectible.id}
                id={`collectible-${collectible.id}`}
                className={`ui-card-primary border transition-all ${
                  isUnlocked
                    ? 'border-[var(--color-brand)]/20 bg-white/78 shadow-[0_16px_32px_rgba(120,113,108,0.08)]'
                    : 'border-stone-200/60 bg-white/55'
                }`}
              >
                {/* 主行 */}
                <button
                  onClick={() => handleToggle(collectible.id)}
                  className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
                  style={{ touchAction: 'manipulation' }}
                >
                  {/* 方案1：严格按精灵图 18:13 比例（360/260），主图固定宽96px 高自动按aspect比例撑开 + overflow-hidden rounded-2xl + 140% 放大裁掉透明边 */}
                  <div
                    className={`flex-shrink-0 overflow-hidden rounded-2xl ${
                      isUnlocked ? '' : 'grayscale opacity-40'
                    }`}
                    style={{
                      width: '6rem',
                      minWidth: '6rem',
                    }}
                  >
                    <div
                      className="w-full items-center justify-center"
                      style={{
                        aspectRatio: '18 / 13',
                        transform: 'scale(1.4)',
                        display: 'flex',
                      }}
                    >
                      <StoreIcon
                        value={collectible.icon}
                        className="text-3xl"
                        spriteClass="sprite-frame w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`break-words text-base font-semibold ${
                      isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                    }`}>
                      {collectible.name}
                    </h3>
                    <p className={`mt-1 break-words text-sm ${
                      isUnlocked ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'
                    }`}>
                      {collectible.description}
                    </p>
                    {isUnlocked && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="ui-chip bg-green-50 px-2.5 py-1 text-sm text-green-700">
                          {t('achievements.currentQuality', { tier: highestTierName })}
                        </span>
                        {unlockTimestamps[collectible.id] && (
                          <span className="text-sm text-green-500">
                            {t('achievements.discoveredAt', { date: formatDate(unlockTimestamps[collectible.id]) })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} className="flex-shrink-0 text-stone-400" />
                  ) : (
                    <ChevronDown size={18} className="flex-shrink-0 text-stone-400" />
                  )}
                </button>

                {/* 展开详情：四档品质 */}
                {isExpanded && (
                  <div className="space-y-2 border-t border-stone-100/80 px-4 pb-4 pt-3 animate-expand sm:px-5 sm:pb-5">
                    {collectible.tiers.map((tier) => {
                      const tierMeta = TIER_META[tier.tierId];
                      const isTierUnlocked = tierMeta && tierMeta.order <= highestOrder;
                      const isCurrent = highestTierId === tier.tierId;
                      const readKey = `${collectible.id}:${tier.tierId}`;
                      const isRead = readNarratives.includes(readKey);
                      const isTierExpanded = expandedTier === readKey;

                      return (
                        <div key={tier.tierId} id={`tier-${collectible.id}-${tier.tierId}`}>
                          {/* 品质档位行 */}
                          <button
                            onClick={() => isTierUnlocked && handleTierClick(collectible.id, tier.tierId)}
                            className={`ui-card-secondary flex w-full items-center gap-3 border p-3 text-left transition-all ${
                              isCurrent
                                ? 'border-stone-200/70 bg-white shadow-sm'
                                : isTierUnlocked
                                  ? 'border-stone-200/60 bg-white hover:bg-stone-50'
                                  : 'border-stone-200/70 bg-stone-50/60 opacity-50'
                            }`}
                            style={{ touchAction: 'manipulation' }}
                            disabled={!isTierUnlocked}
                          >
                            {/* 方案B：未解锁档放同款花盆图标（灰阶透明）+ 右下角 🔒 角标覆盖；已解锁档不放图标避免重复 */}
                            {!isTierUnlocked && (
                              <span className="relative flex-shrink-0 grayscale opacity-40">
                                <StoreIcon
                                  value={collectible.icon}
                                  className="text-xl"
                                  spriteClass="sprite-frame w-10"
                                />
                                <span className="absolute -bottom-0.5 -right-0.5 text-[10px] leading-none select-none" aria-hidden>🔒</span>
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm font-medium ${
                                  isTierUnlocked
                                    ? (isCurrent ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]')
                                    : 'text-stone-400'
                                }`}>
                                  {tierMeta ? t(`garden.tiers.${tier.tierId}`) : tier.tierId}
                                </span>
                                {isTierUnlocked && !isRead && (
                                  <span className="ui-dot h-2 w-2 flex-shrink-0 bg-red-400" title={t('achievements.unread')} />
                                )}
                                {isTierUnlocked && isRead && (
                                  <BookOpen size={12} className="flex-shrink-0 text-[var(--color-text-muted)]" />
                                )}
                              </div>
                              <p className={`mt-0.5 break-words text-sm ${
                                isTierUnlocked
                                  ? (isCurrent ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]')
                                  : 'text-stone-400'
                              }`}>
                                {isTierUnlocked ? tier.shortText : tier.unlockConditionText}
                              </p>
                            </div>
                            {isTierUnlocked && (
                              isTierExpanded ? (
                                <ChevronUp size={14} className="flex-shrink-0 text-[var(--color-text-muted)]" />
                              ) : (
                                <ChevronDown size={14} className="flex-shrink-0 text-[var(--color-text-muted)]" />
                              )
                            )}
                          </button>

                          {/* 展开故事 — 内容多长显示多长，不裁剪 */}
                          {isTierExpanded && isTierUnlocked && (
                            <div className="ui-card-secondary mt-2 border border-green-100 bg-green-50/80 p-3 animate-fade-in">
                              <p className="break-words whitespace-pre-line text-sm leading-relaxed text-green-700">
                                {tier.story}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
