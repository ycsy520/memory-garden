/**
 * 数据同步调度中心
 * 职责：
 * 1. 游戏结束时将 session 数据上传到 Supabase
 * 2. 管理离线队列（网络不可用时暂存，联网后批量上传）
 * 3. 从云端拉取数据（登录新设备时）
 * 4. 同步花园状态、叙事解锁、日记碎片
 *
 * 核心原则：
 * - 本地优先：localStorage 写入始终先于云端同步
 * - 登录才同步：匿名用户不触发任何云端操作
 * - 异步不阻塞：所有同步操作在后台执行，不阻塞 UI
 *
 * @module SyncService
 */
import { supabase, isSupabaseConfigured, supabaseConfigError } from './supabaseClient';
import APP_FEATURES from '../appFeatures';
import useAuthStore from '@stores/useAuthStore';
import useStatsStore, { buildStatsSnapshot, ensureSessionId } from '@stores/useStatsStore';
import useGardenStore from '@stores/useGardenStore';
import useAchievementStore from '@stores/useAchievementStore';

let hasLoggedSyncUnavailable = false;

/** 离线队列 localStorage key */
const PENDING_QUEUE_KEY = 'memory-garden:sync-pending';
/** 离线队列最大长度 */
const MAX_QUEUE_SIZE = 100;
/** 最大重试次数 */
const MAX_RETRIES = 3;

const SyncService = {
  /** online 事件监听器引用（用于 cleanup） */
  _onlineHandler: null,
  /** 最近一次已完成云端落地的用户 ID */
  _hydratedUserId: null,
  /** 当前进行中的云端落地 Promise */
  _hydratePromise: null,

  /**
   * 判断当前是否允许使用云同步链路。
   * 环境变量缺失时保持本地可用，不触发任何 Supabase 请求。
   *
   * @returns {boolean}
   */
  _isAvailable() {
    if (!APP_FEATURES.cloudSyncEnabled) {
      return false;
    }

    if (isSupabaseConfigured) return true;
    if (!hasLoggedSyncUnavailable) {
      console.warn('[SyncService] Supabase 未配置，跳过云同步流程:', supabaseConfigError);
      hasLoggedSyncUnavailable = true;
    }
    return false;
  },

  /**
   * 初始化同步服务
   * 注册 online/offline 事件监听，处理遗留的离线队列
   */
  init() {
    if (!this._isAvailable()) return;

    // 监听网络恢复事件
    this._onlineHandler = () => {
      this.flushPendingQueue();
    };
    window.addEventListener('online', this._onlineHandler);
  },

  /**
   * 清理事件监听（测试用）
   */
  destroy() {
    if (this._onlineHandler) {
      window.removeEventListener('online', this._onlineHandler);
      this._onlineHandler = null;
    }
    this._hydratedUserId = null;
    this._hydratePromise = null;
  },

  /**
   * 检查当前用户是否已登录（非匿名）
   * 只有已登录用户才执行云端同步
   * @returns {boolean}
   */
  _isLoggedIn() {
    return useAuthStore.getState().isLoggedIn;
  },

  /**
   * 获取当前用户 ID
   * @returns {string|null}
   */
  _getUserId() {
    return useAuthStore.getState().user?.id ?? null;
  },

  /**
   * 同步单局游戏记录到云端
   * 游戏结束时由 useGameEngine.handleGameEnd 调用
   *
   * @param {Object} session - 前端 session 对象（useStatsStore.addSession 的入参格式）
   * @returns {Promise<void>}
   */
  async syncSession(session) {
    if (!this._isAvailable()) return;
    if (!this._isLoggedIn()) return;

    const userId = this._getUserId();
    if (!userId) return;

    const row = {
      id: ensureSessionId(session).id,
      user_id: userId,
      mode: session.modeId || session.mode || 'walk',
      n_value: session.difficulty || 1,
      speed_profile: session.speedProfile || 'normal',
      score: session.score ?? 0,
      hit_rate: session.accuracy ?? 0,
      false_alarm_rate: session.falseAlarmRate ?? 0,
      timeout_count: session.timeoutCount ?? 0,
      lure_false_alarm_count: session.lureFalseAlarmCount ?? 0,
      valid_for_adaptation: session.validForAdaptation ?? true,
      schema_version: 5,
      device_info: {
        platform: navigator.platform,
        userAgent: navigator.userAgent.slice(0, 100),
      },
      created_at: session.startedAt ? new Date(session.startedAt).toISOString() : new Date().toISOString(),
    };

    try {
      useAuthStore.getState().setSyncStatus({ isSyncing: true, syncError: null });

      const { error } = await supabase
        .from('sessions')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        console.warn('[SyncService] syncSession 失败:', error.message);
        this._enqueue({ type: 'session', data: row });
        useAuthStore.getState().setSyncStatus({ isSyncing: false, syncError: error.message });
        return;
      }

      useAuthStore.getState().setSyncStatus({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        syncError: null,
      });
    } catch (e) {
      console.warn('[SyncService] syncSession 异常:', e.message);
      this._enqueue({ type: 'session', data: row });
      useAuthStore.getState().setSyncStatus({ isSyncing: false, syncError: e.message });
    }
  },

  /**
   * 同步花园状态到云端（profiles 表扩展字段）
   * 花园成长点变化时调用
   *
   * @param {Object} gardenState - 花园状态快照（useGardenStore 的部分状态）
   * @returns {Promise<void>}
   */
  async syncGardenState(gardenState) {
    if (!this._isAvailable()) return;
    if (!this._isLoggedIn()) return;

    const userId = this._getUserId();
    if (!userId) return;

    const updates = {
      growth_points: gardenState.growthPoints ?? 0,
      total_walks: gardenState.totalWalks ?? 0,
      streak_days: gardenState.streakDays ?? 0,
      best_accuracy: gardenState.bestAccuracy ?? 0,
      discovered_elements: gardenState.discovered ?? [],
      last_walk_date: gardenState.lastWalkDate ?? null,
      updated_at: new Date().toISOString(),
    };

    try {
      useAuthStore.getState().setSyncStatus({ isSyncing: true, syncError: null });

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.warn('[SyncService] syncGardenState 失败:', error.message);
        this._enqueue({ type: 'garden', data: updates });
        useAuthStore.getState().setSyncStatus({ isSyncing: false, syncError: error.message });
        return;
      }

      useAuthStore.getState().setSyncStatus({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        syncError: null,
      });
    } catch (e) {
      console.warn('[SyncService] syncGardenState 异常:', e.message);
      this._enqueue({ type: 'garden', data: updates });
      useAuthStore.getState().setSyncStatus({ isSyncing: false, syncError: e.message });
    }
  },

  /**
   * 同步叙事解锁状态到云端
   * 解锁发生时由 useAchievementStore 调用
   *
   * @param {Array<{collectibleId: string, tierId: string, unlockedAt: string}>} unlocks
   * @returns {Promise<void>}
   */
  async syncNarrativeUnlocks(unlocks) {
    if (!this._isAvailable()) return;
    if (!this._isLoggedIn() || !unlocks || unlocks.length === 0) return;

    const userId = this._getUserId();
    if (!userId) return;

    const rows = unlocks.map((u) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      collectible_id: u.collectibleId,
      tier_id: u.tierId,
      unlocked_at: u.unlockedAt || new Date().toISOString(),
    }));

    try {
      useAuthStore.getState().setSyncStatus({ isSyncing: true, syncError: null });

      const { error } = await supabase
        .from('narrative_unlocks')
        .upsert(rows, { onConflict: 'user_id,collectible_id,tier_id' });

      if (error) {
        console.warn('[SyncService] syncNarrativeUnlocks 失败:', error.message);
        rows.forEach((r) => this._enqueue({ type: 'unlock', data: r }));
        useAuthStore.getState().setSyncStatus({ isSyncing: false, syncError: error.message });
        return;
      }

      useAuthStore.getState().setSyncStatus({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        syncError: null,
      });
    } catch (e) {
      console.warn('[SyncService] syncNarrativeUnlocks 异常:', e.message);
      rows.forEach((r) => this._enqueue({ type: 'unlock', data: r }));
      useAuthStore.getState().setSyncStatus({ isSyncing: false, syncError: e.message });
    }
  },

  /**
   * 同步日记碎片到云端
   *
   * @param {Object} entry - { collectibleId, tierId, fragmentIndex, readAt }
   * @returns {Promise<void>}
   */
  async syncDiaryEntry(entry) {
    if (!this._isAvailable()) return;
    if (!this._isLoggedIn()) return;

    const userId = this._getUserId();
    if (!userId) return;

    const row = {
      id: crypto.randomUUID(),
      user_id: userId,
      fragment_text: `${entry.collectibleId}:${entry.tierId}:${entry.fragmentIndex}`,
      source_collectible_id: entry.collectibleId,
      created_at: entry.readAt || new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('diary_entries')
        .insert(row);

      if (error) {
        console.warn('[SyncService] syncDiaryEntry 失败:', error.message);
        this._enqueue({ type: 'diary', data: row });
      }
    } catch (e) {
      console.warn('[SyncService] syncDiaryEntry 异常:', e.message);
      this._enqueue({ type: 'diary', data: row });
    }
  },

  /**
   * 上报分析 Attempt（写入 analytics_attempts）
   * 匿名用户也可上报（服务端会自动写入 user_id=null），用于快速验证链路与后续聚合。
   * 失败时进入离线队列重试。
   *
   * @param {Object} attempt - attempt payload（camelCase 字段）
   * @returns {Promise<void>}
   */
  async syncAnalyticsAttempt(attempt) {
    if (!this._isAvailable()) return;
    const userId = this._getUserId();
    if (!userId) return;

    try {
      const response = await supabase.functions.invoke('analytics-ingest', {
        body: { attempt },
      });

      if (response.error) {
        this._enqueue({ type: 'analytics_attempt', data: attempt });
      }
    } catch {
      this._enqueue({ type: 'analytics_attempt', data: attempt });
    }
  },

  /**
   * 从云端拉取全部数据（登录新设备时调用）
   * 拉取 sessions、narrative_unlocks、diary_entries、profiles
   *
   * @returns {Promise<Object|null>} 云端数据快照，失败返回 null
   */
  async pullFromCloud() {
    if (!this._isAvailable()) return null;
    if (!this._isLoggedIn()) return null;

    const userId = this._getUserId();
    if (!userId) return null;

    try {
      useAuthStore.getState().setSyncStatus({ isSyncing: true, syncError: null });

      // 并行拉取所有数据
      const [sessionsRes, unlocksRes, diariesRes, profileRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('narrative_unlocks').select('*').eq('user_id', userId),
        supabase.from('diary_entries').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      ]);

      // 检查是否有错误
      const errors = [sessionsRes, unlocksRes, diariesRes, profileRes]
        .filter((r) => r.error)
        .map((r) => r.error.message);

      if (errors.length > 0) {
        console.warn('[SyncService] pullFromCloud 部分失败:', errors);
        useAuthStore.getState().setSyncStatus({ isSyncing: false, syncError: errors.join('; ') });
        return null;
      }

      const result = {
        sessions: sessionsRes.data || [],
        narrativeUnlocks: unlocksRes.data || [],
        diaryEntries: diariesRes.data || [],
        profile: profileRes.data || null,
      };

      useAuthStore.getState().setSyncStatus({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        syncError: null,
      });

      return result;
    } catch (e) {
      console.warn('[SyncService] pullFromCloud 异常:', e.message);
      useAuthStore.getState().setSyncStatus({ isSyncing: false, syncError: e.message });
      return null;
    }
  },

  /**
   * 将云端数据应用到本地 Store
   * 登录新设备时调用，云端数据覆盖本地
   *
   * @param {Object} cloudData - pullFromCloud 返回的数据快照
   */
  applyCloudData(cloudData) {
    if (!cloudData) return;

    // 应用 sessions 到 useStatsStore
    if (Array.isArray(cloudData.sessions)) {
      try {
        const cloudSessions = cloudData.sessions.map((s) => ({
          id: s.id,
          modeId: s.mode,
          difficulty: s.n_value,
          speedProfile: s.speed_profile,
          score: s.score,
          accuracy: s.hit_rate,
          falseAlarmRate: s.false_alarm_rate,
          timeoutCount: s.timeout_count,
          lureFalseAlarmCount: s.lure_false_alarm_count,
          validForAdaptation: s.valid_for_adaptation,
          schemaVersion: s.schema_version,
          startedAt: s.created_at ? new Date(s.created_at).getTime() : Date.now(),
          completed: true,
        }));

        // 合并：云端 + 本地，按 id 去重后按时间排序取最新 100 条
        const localSessions = useStatsStore.getState().sessions || [];
        const dedupedMap = new Map();
        [...localSessions, ...cloudSessions].forEach((session) => {
          const normalized = ensureSessionId(session);
          dedupedMap.set(normalized.id, normalized);
        });
        const merged = Array.from(dedupedMap.values())
          .sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0))
          .slice(-100);

        useStatsStore.setState(
          buildStatsSnapshot(merged, useStatsStore.getState().warmupSessionsUsed)
        );
      } catch (e) {
        console.warn('[SyncService] 应用云端 sessions 失败:', e);
      }
    }

    // 应用花园状态
    if (cloudData.profile) {
      try {
        const p = cloudData.profile;
        useGardenStore.setState({
          growthPoints: p.growth_points ?? 0,
          totalWalks: p.total_walks ?? 0,
          streakDays: p.streak_days ?? 0,
          bestAccuracy: p.best_accuracy ?? 0,
          discovered: p.discovered_elements ?? [],
          lastWalkDate: p.last_walk_date ?? null,
        });
      } catch (e) {
        console.warn('[SyncService] 应用云端花园状态失败:', e);
      }
    }

    // 应用叙事解锁与日记碎片
    if (Array.isArray(cloudData.narrativeUnlocks) || Array.isArray(cloudData.diaryEntries)) {
      try {
        const current = useAchievementStore.getState();
        const mergedUnlocked = { ...current.unlockedNarratives };
        const mergedTimestamps = { ...current.unlockTimestamps };

        (cloudData.narrativeUnlocks || []).forEach((item) => {
          if (!item?.collectible_id || !item?.tier_id) return;
          const currentTier = mergedUnlocked[item.collectible_id];
          if (!currentTier) {
            mergedUnlocked[item.collectible_id] = item.tier_id;
          } else {
            const order = { sprout: 0, leaf: 1, bloom: 2, fullBloom: 3 };
            if ((order[item.tier_id] ?? -1) > (order[currentTier] ?? -1)) {
              mergedUnlocked[item.collectible_id] = item.tier_id;
            }
          }
          if (!mergedTimestamps[item.collectible_id] && item.unlocked_at) {
            mergedTimestamps[item.collectible_id] = item.unlocked_at;
          }
        });

        const diaryMap = new Map();
        current.diaryEntries.forEach((entry) => {
          const key = `${entry.collectibleId}:${entry.tierId}:${entry.fragmentIndex}`;
          diaryMap.set(key, entry);
        });
        (cloudData.diaryEntries || []).forEach((entry) => {
          const parts = typeof entry.fragment_text === 'string' ? entry.fragment_text.split(':') : [];
          if (parts.length !== 3) return;
          const [collectibleId, tierId, fragmentIndexRaw] = parts;
          const fragmentIndex = Number(fragmentIndexRaw);
          if (!collectibleId || !tierId || !Number.isFinite(fragmentIndex)) return;
          const key = `${collectibleId}:${tierId}:${fragmentIndex}`;
          diaryMap.set(key, {
            collectibleId,
            tierId,
            fragmentIndex,
            readAt: entry.created_at || new Date().toISOString(),
          });
        });

        useAchievementStore.setState({
          unlockedNarratives: mergedUnlocked,
          unlockTimestamps: mergedTimestamps,
          diaryEntries: Array.from(diaryMap.values()).sort(
            (a, b) => new Date(a.readAt) - new Date(b.readAt)
          ),
        });
      } catch (e) {
        console.warn('[SyncService] 应用云端成就/日记失败:', e);
      }
    }
  },

  /**
   * 登录后从云端拉取并应用数据。
   * 默认对同一用户只执行一次，避免 auth 状态多次抖动时重复覆盖本地。
   * @param {{ force?: boolean }} [options]
   * @returns {Promise<Object|null>}
   */
  async hydrateFromCloud(options = {}) {
    if (!this._isAvailable()) return null;
    if (!this._isLoggedIn()) return null;
    const userId = this._getUserId();
    if (!userId) return null;

    if (!options.force && this._hydratedUserId === userId) {
      return null;
    }

    if (this._hydratePromise) {
      return this._hydratePromise;
    }

    this._hydratePromise = (async () => {
      const cloudData = await this.pullFromCloud();
      if (cloudData) {
        this.applyCloudData(cloudData);
        this._hydratedUserId = userId;
      }
      return cloudData;
    })();

    try {
      return await this._hydratePromise;
    } finally {
      this._hydratePromise = null;
    }
  },

  /**
   * 重置云端落地状态。
   * 在登出或账号切换后调用，避免把上一位用户的 hydration 状态复用到下一位用户。
   */
  resetHydrationState() {
    this._hydratedUserId = null;
    this._hydratePromise = null;
  },

  // ── 离线队列管理 ──

  /**
   * 将操作写入待同步队列
   * 网络不可用时调用，联网后批量上传
   *
   * @param {Object} action - { type: string, data: Object }
   */
  _enqueue(action) {
    try {
      const queue = this._getQueue();
      queue.push({
        ...action,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        retries: 0,
      });
      // 超出上限时丢弃最旧的
      while (queue.length > MAX_QUEUE_SIZE) {
        queue.shift();
      }
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
      useAuthStore.getState().setSyncStatus({ pendingSyncCount: queue.length });
    } catch (e) {
      console.warn('[SyncService] enqueue 失败:', e);
    }
  },

  /**
   * 读取待同步队列
   * @returns {Array}
   */
  _getQueue() {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * 清空待同步队列
   */
  _clearQueue() {
    localStorage.removeItem(PENDING_QUEUE_KEY);
    useAuthStore.getState().setSyncStatus({ pendingSyncCount: 0 });
  },

  /**
   * 对外暴露的离线队列清理入口
   * 用于导入备份、清空数据、注销账户等需要切断回灌链路的场景。
   */
  clearPendingQueue() {
    this._clearQueue();
  },

  /**
   * 处理离线队列 — 联网后批量上传待同步数据
   * 由 online 事件触发，也可手动调用
   *
   * @returns {Promise<void>}
   */
  async flushPendingQueue() {
    if (!this._isAvailable()) return;
    const isLoggedIn = this._isLoggedIn();
    const userId = this._getUserId();
    if (!userId) return;

    const queue = this._getQueue();
    if (queue.length === 0) return;

    // 检查网络
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    useAuthStore.getState().setSyncStatus({ isSyncing: true });

    const failedItems = [];
    /** 因重试耗尽或类型未知而被丢弃的条数（仅作日志与状态暴露，不影响主流程） */
    let droppedCount = 0;

    for (const item of queue) {
      if (!isLoggedIn && item.type !== 'analytics_attempt') {
        failedItems.push(item);
        continue;
      }

      try {
        let success = false;

        switch (item.type) {
          case 'session': {
            const { error } = await supabase.from('sessions').upsert(item.data, { onConflict: 'id' });
            success = !error;
            break;
          }
          case 'unlock': {
            const { error } = await supabase.from('narrative_unlocks').upsert(item.data, {
              onConflict: 'user_id,collectible_id,tier_id',
            });
            success = !error;
            break;
          }
          case 'diary': {
            const { error } = await supabase.from('diary_entries').insert(item.data);
            success = !error;
            break;
          }
          case 'garden': {
            const userId = this._getUserId();
            if (userId) {
              const { error } = await supabase.from('profiles').update(item.data).eq('id', userId);
              success = !error;
            }
            break;
          }
          case 'analytics_attempt': {
            const response = await supabase.functions.invoke('analytics-ingest', {
              body: { attempt: item.data },
            });
            success = !response.error && response.data?.success === true;
            break;
          }
          default:
            // 未知类型：静默丢弃并记录日志，便于排查脏数据
            droppedCount++;
            console.warn('[SyncService] 丢弃未知类型的队列项:', { type: item.type, id: item.id });
            success = true;
        }

        if (!success && item.retries < MAX_RETRIES) {
          failedItems.push({ ...item, retries: item.retries + 1 });
        } else if (!success) {
          // 重试次数耗尽：丢弃该条，避免无限重试；本地数据不受影响，仅记录日志
          droppedCount++;
          console.warn(`[SyncService] 队列项重试 ${MAX_RETRIES} 次仍失败，已丢弃:`, { type: item.type, id: item.id });
        }
      } catch (e) {
        if (item.retries < MAX_RETRIES) {
          failedItems.push({ ...item, retries: item.retries + 1 });
        } else {
          droppedCount++;
          console.warn(`[SyncService] 队列项重试 ${MAX_RETRIES} 次仍异常，已丢弃:`, {
            type: item.type,
            id: item.id,
            error: String(e?.message || e),
          });
        }
      }
    }

    // 更新队列（只保留失败的）
    if (failedItems.length > 0) {
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(failedItems));
      useAuthStore.getState().setSyncStatus({
        isSyncing: false,
        pendingSyncCount: failedItems.length,
        ...(droppedCount > 0 ? { droppedSyncCount: droppedCount } : {}),
      });
    } else {
      this._clearQueue();
      useAuthStore.getState().setSyncStatus({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        syncError: null,
        ...(droppedCount > 0 ? { droppedSyncCount: droppedCount } : {}),
      });
    }
  },
};

export default SyncService;
