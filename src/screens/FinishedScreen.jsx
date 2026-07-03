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
import { RefreshCw, Flower2, Leaf, ChevronDown, ChevronUp, Wind, TrendingUp, Clock, Brain } from 'lucide-react';
import useGameStore from '@stores/useGameStore';
import useStatsStore from '@stores/useStatsStore';
import useGardenStore from '@stores/useGardenStore';
import useAchievementStore from '@stores/useAchievementStore';
import { getCollectibleById, getNarrativeTier } from '@engine/narratives';
import AudioService from '@services/AudioService';
import { calculateSDT, interpretDPrime, interpretBeta } from '@engine/SignalDetection';

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
function getGardenFeedback(accuracy) {
  if (accuracy >= 0.80) {
    return {
      title: '花园今天很安静，也很明亮。',
      body: '你认出了几朵回来的花，也耐心看着新花走过。花园多开了一朵小花。',
      reward: '一朵小花',
      rewardIcon: '🌸',
    };
  }
  if (accuracy >= 0.60) {
    return {
      title: '今天的花园多了一片新叶。',
      body: '有些花你认出来了，有些花走得很轻。每一次散步，花园都会更熟悉你一点。',
      reward: '一片新叶',
      rewardIcon: '🍃',
    };
  }
  return {
    title: '今天你还是完成了一次散步。',
    body: '花园里多了一颗种子。下一次可以走慢一点，只看一朵花就好。',
    reward: '一颗种子',
    rewardIcon: '🌱',
  };
}

export default function FinishedScreen() {
  const navigate = useNavigate();
  const score = useGameStore((s) => s.score);
  const hits = useGameStore((s) => s.hits);
  const misses = useGameStore((s) => s.misses);
  const falseAlarms = useGameStore((s) => s.falseAlarms);
  const correctRejections = useGameStore((s) => s.correctRejections);
  const reactionTimes = useGameStore((s) => s.reactionTimes);
  const sessions = useStatsStore((s) => s.sessions);

  // 详细数据折叠状态
  const [showDetails, setShowDetails] = useState(false);

  // 解锁队列展示状态
  const [unlockQueueIndex, setUnlockQueueIndex] = useState(0);
  const [storyExpanded, setStoryExpanded] = useState(false);

  // 从 store 获取解锁队列
  const unlockQueue = useAchievementStore((s) => s.recentUnlockQueue);
  const markNarrativeRead = useAchievementStore((s) => s.markNarrativeRead);
  const clearUnlockQueue = useAchievementStore((s) => s.clearUnlockQueue);

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

  /** 进步趋势：最近10轮的准确率 */
  const recentAccuracy = useMemo(() => {
    return sessions
      .slice(-10)
      .map((s) => {
        const total = (s.hits || 0) + (s.misses || 0) + (s.falseAlarms || 0) + (s.correctRejections || 0);
        return total > 0 ? ((s.hits || 0) + (s.correctRejections || 0)) / total : 0;
      });
  }, [sessions]);

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
  const feedback = useMemo(() => getGardenFeedback(metrics.memoryAccuracy), [metrics.memoryAccuracy]);

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
    <div className="flex flex-col items-center justify-start h-full animate-fade-in px-6 py-8 text-center bg-white/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl max-w-sm w-full border-4 border-white relative">
        {/* 花园成长图标 */}
        <div className="text-5xl mb-4">{feedback.rewardIcon}</div>

        {/* 叙事标题 */}
        <h2
          className="text-xl sm:text-2xl text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-family-serif)' }}
        >
          {feedback.title}
        </h2>

        {/* 叙事正文 */}
        <p className="text-[var(--color-text-secondary)] font-light mb-6 text-sm leading-relaxed">
          {feedback.body}
        </p>

        {/* 反脆弱辅助：连续困难时显示温和提示 */}
        {metrics.memoryAccuracy < 0.50 && (
          <div className="bg-amber-50 rounded-xl p-3 mb-4 text-center">
            <p className="text-sm text-amber-700 leading-relaxed">
              可以慢一点。只要看到真的回来过的花，再按就好。
            </p>
            {isConsecutiveDifficult && (
              <p className="text-xs text-amber-500 mt-2">
                最近几次有些吃力，要不要先休息一下？
              </p>
            )}
          </div>
        )}

        {/* 核心指标展示 */}
        <div className="bg-stone-50 rounded-2xl p-4 mb-4">
          {/* 记忆准确率 */}
          <div className="text-center mb-4">
            <div className="text-xs text-[var(--color-text-muted)] mb-1">记忆准确率</div>
            <div className="text-4xl font-bold text-[var(--color-text-primary)]">
              {Math.round(metrics.memoryAccuracy * 100)}%
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              {metrics.totalTurns} 个刺激项中正确判断 {Math.round(metrics.memoryAccuracy * metrics.totalTurns)} 个
            </div>
          </div>

          {/* 目标识别率和误判率 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">目标识别率</div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(metrics.target识别率 * 100)}%
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {metrics.targetCount} 个重复项中记住 {hits} 个
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">误判率</div>
              <div className="text-2xl font-bold text-red-500">
                {Math.round(metrics.falseAlarmRate * 100)}%
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {metrics.nonTargetCount} 个非重复项中误标 {falseAlarms} 个
              </div>
            </div>
          </div>

          {/* 记忆辨别力 */}
          <div className="mt-3 bg-blue-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Brain size={14} className="text-blue-600" />
              <span className="text-xs text-blue-700">记忆辨别力 d'</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">{metrics.dPrime}</span>
              <span className="text-xs text-blue-400 ml-1">{metrics.dPrimeInterpretation.level}</span>
            </div>
          </div>

          {/* 反应时间 */}
          {metrics.avgRT > 0 && (
            <div className="mt-2 bg-purple-50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-purple-600" />
                <span className="text-xs text-purple-700">平均反应</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{metrics.avgRT}ms</span>
            </div>
          )}

          {/* 进步趋势（最近10轮） */}
          {recentAccuracy.length > 1 && (
            <div className="mt-3 bg-green-50 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">进步趋势</span>
              </div>
              <div className="flex items-end gap-1 h-12">
                {recentAccuracy.map((acc, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-200 rounded-t"
                    style={{ height: `${Math.max(acc * 100, 5)}%` }}
                    title={`第${i + 1}轮: ${Math.round(acc * 100)}%`}
                  />
                ))}
              </div>
              <div className="text-xs text-green-500 mt-1 text-center">
                最近 {recentAccuracy.length} 轮准确率
              </div>
            </div>
          )}
        </div>

        {/* 花园成长卡片 */}
        {(() => {
          const gardenLevel = useGardenStore.getState().getGardenLevel();
          const totalWalks = useGardenStore.getState().totalWalks;
          const growthPoints = useGardenStore.getState().growthPoints;
          const streakDays = useGardenStore.getState().streakDays;
          return (
            <div className="bg-green-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{gardenLevel.icon}</span>
                <span className="text-sm font-medium text-green-700">花园 · {gardenLevel.name}</span>
              </div>
              <p className="text-sm text-green-600">
                花园里多了{feedback.reward}。
              </p>
              <p className="text-xs text-green-500 mt-1">
                这是你第 {totalWalks} 次来散步。
                {streakDays > 1 && <span> 已连续 {streakDays} 天。</span>}
              </p>
              {/* 成长进度条 */}
              {gardenLevel.level < 6 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-green-500 mb-1">
                    <span>成长进度</span>
                    <span>{growthPoints} / {gardenLevel.nextThreshold} 点</span>
                  </div>
                  <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(gardenLevel.progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {gardenLevel.level >= 6 && (
                <p className="text-xs text-green-400 mt-2 text-center">花园已盛开，继续守护它吧。</p>
              )}
              {/* 新解锁的收藏品：短卡片 + 展开故事 + 多解锁队列 */}
              {unlockQueue.length > 0 && (() => {
                const current = unlockQueue[Math.min(unlockQueueIndex, unlockQueue.length - 1)];
                const collectible = getCollectibleById(current.collectibleId);
                const tier = getNarrativeTier(current.collectibleId, current.tierId);
                if (!collectible || !tier) return null;

                const isLast = unlockQueueIndex >= unlockQueue.length - 1;
                const tierName = { sprout: '初芽', leaf: '翠叶', bloom: '繁花', fullBloom: '盛放' }[current.tierId] || current.tierId;

                const handleNext = () => {
                  markNarrativeRead(current.collectibleId, current.tierId);
                  if (isLast) {
                    clearUnlockQueue();
                  } else {
                    setUnlockQueueIndex(unlockQueueIndex + 1);
                    setStoryExpanded(false);
                  }
                };

                return (
                  <div className="mt-3 pt-3 border-t border-green-100">
                    <p className="text-xs text-green-500 mb-2">
                      新收藏（{unlockQueueIndex + 1}/{unlockQueue.length}）
                    </p>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{collectible.icon}</span>
                        <div>
                          <span className="text-sm font-medium text-green-700">{collectible.name}</span>
                          <span className="text-[10px] text-green-500 ml-1">· {tierName}</span>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 leading-relaxed">{tier.shortText}</p>

                      {/* 展开/收起故事 */}
                      <button
                        onClick={() => setStoryExpanded(!storyExpanded)}
                        className="mt-2 text-[10px] text-green-400 hover:text-green-600 transition-colors"
                      >
                        {storyExpanded ? '收起故事' : '展开看看'}
                      </button>
                      {storyExpanded && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-700 leading-relaxed whitespace-pre-line">{tier.story}</p>
                        </div>
                      )}

                      {/* 操作按钮：对齐文档 §7.1 */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleNext}
                          className="flex-1 bg-green-500 text-white text-xs py-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          收进花园日记
                        </button>
                        {!isLast && (
                          <button
                            onClick={() => {
                              // 先标记队列中所有解锁为已读，再清空
                              unlockQueue.forEach((u) => markNarrativeRead(u.collectibleId, u.tierId));
                              clearUnlockQueue();
                            }}
                            className="px-3 bg-stone-100 text-stone-500 text-xs py-2 rounded-lg hover:bg-stone-200 transition-colors"
                          >
                            继续散步
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
            className="flex items-center justify-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mx-auto"
          >
            {showDetails ? (
              <>
                <ChevronUp size={14} /> 收起详细数据
              </>
            ) : (
              <>
                <ChevronDown size={14} /> 查看详细数据
              </>
            )}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {/* 综合评分 */}
              <div className="bg-stone-50 rounded-xl p-3">
                <div className="text-xs text-[var(--color-text-muted)] mb-1">综合评分</div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {score}
                  <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">分</span>
                </div>
              </div>

              {/* 信号检测论指标 */}
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-2">
                  <Brain size={14} className="text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">记忆辨别力</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{metrics.dPrime}</div>
                    <div className="text-xs text-blue-500">d'（灵敏度）</div>
                    <div className="text-xs text-blue-400">{metrics.dPrimeInterpretation.level}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{metrics.beta}</div>
                    <div className="text-xs text-blue-500">β（反应偏向）</div>
                    <div className="text-xs text-blue-400">{metrics.betaInterpretation.type}</div>
                  </div>
                </div>
              </div>

              {/* 反应时间 */}
              {metrics.avgRT > 0 && (
                <div className="bg-purple-50 rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock size={14} className="text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">平均反应时间</span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{metrics.avgRT}ms</div>
                  </div>
                </div>
              )}

              {/* 四分类 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <div className="text-green-600 font-bold text-lg">{hits}</div>
                  <div className="text-green-500">命中</div>
                  <div className="text-xs text-green-400">记住并标对</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <div className="text-amber-600 font-bold text-lg">{misses}</div>
                  <div className="text-amber-500">遗漏</div>
                  <div className="text-xs text-amber-400">没记住漏掉</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <div className="text-red-500 font-bold text-lg">{falseAlarms}</div>
                  <div className="text-red-400">误判</div>
                  <div className="text-xs text-red-300">记错多标了</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <div className="text-blue-600 font-bold text-lg">{correctRejections}</div>
                  <div className="text-blue-500">正确排除</div>
                  <div className="text-xs text-blue-400">正确不标记</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleRestart}
            aria-label="再走一次"
            className="w-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)] text-white py-4 rounded-full text-lg transition-all flex items-center justify-center gap-2 shadow-xl"
            style={{
              fontFamily: 'var(--font-family-serif)',
              minHeight: '56px',
              fontSize: '20px',
              touchAction: 'manipulation',
            }}
          >
            <Wind size={20} />
            再走一次
          </button>

          <button
            onClick={handleBackToGarden}
            aria-label="回到花园"
            className="w-full bg-white hover:bg-stone-50 text-[var(--color-text-secondary)] py-3 rounded-full text-sm transition-all flex items-center justify-center gap-2 border border-stone-200"
            style={{ minHeight: '48px', touchAction: 'manipulation' }}
          >
            <Flower2 size={16} />
            回到花园
          </button>
        </div>
      </div>
    </div>
  );
}
