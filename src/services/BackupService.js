/**
 * 备份服务
 * 负责生成最小用户数据备份、校验 JSON 备份文件，并将备份恢复到本地 store。
 */
import useStatsStore from '@stores/useStatsStore';
import useSettingsStore from '@stores/useSettingsStore';
import useGardenStore from '@stores/useGardenStore';
import useAchievementStore from '@stores/useAchievementStore';
import { buildStatsSnapshot } from '@stores/useStatsStore';

const BACKUP_VERSION = '5.2.1';
const BACKUP_SCHEMA = 'memory-garden-backup';
const SUPPORTED_LANGS = new Set(['zh-CN', 'zh-TW', 'en-US']);

/**
 * 判断给定值是否为普通对象
 * @param {unknown} value
 * @returns {boolean}
 */
function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 读取备份分区中的 state 对象
 * 同时兼容旧格式 `{ state, version }` 和直接写 state 的格式。
 * @param {unknown} section
 * @returns {Record<string, any>}
 */
function extractState(section) {
  if (!isRecord(section)) return {};
  return isRecord(section.state) ? section.state : section;
}

/**
 * 过滤对象中的数值字段
 * @param {unknown} value
 * @returns {Record<string, number>}
 */
function sanitizeNumberMap(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))
  );
}

/**
 * 过滤对象中的字符串字段
 * @param {unknown} value
 * @returns {Record<string, string>}
 */
function sanitizeStringMap(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === 'string' && item.length > 0)
  );
}

/**
 * 规范化统计状态
 * @param {Record<string, any>} raw
 * @returns {Record<string, any>}
 */
function sanitizeStatsState(raw) {
  const sessions = Array.isArray(raw.sessions)
    ? raw.sessions.filter((session) => session && typeof session.score === 'number' && session.startedAt)
    : [];

  return {
    bestScores: sanitizeNumberMap(raw.bestScores),
    sessions: sessions.slice(-100),
    perModeCounts: sanitizeNumberMap(raw.perModeCounts),
    perNCounts: sanitizeNumberMap(raw.perNCounts),
    warmupSessionsUsed:
      typeof raw.warmupSessionsUsed === 'number' && Number.isFinite(raw.warmupSessionsUsed)
        ? raw.warmupSessionsUsed
        : 0,
  };
}

/**
 * 规范化设置状态
 * @param {Record<string, any>} raw
 * @returns {Record<string, any>}
 */
function sanitizeSettingsState(raw) {
  return {
    lang: SUPPORTED_LANGS.has(raw.lang) ? raw.lang : 'zh-CN',
    isMuted: typeof raw.isMuted === 'boolean' ? raw.isMuted : false,
    levelIndex:
      typeof raw.levelIndex === 'number' && Number.isFinite(raw.levelIndex) ? raw.levelIndex : 0,
    hasSeenIntro: typeof raw.hasSeenIntro === 'boolean' ? raw.hasSeenIntro : false,
  };
}

/**
 * 规范化花园状态
 * @param {Record<string, any>} raw
 * @returns {Record<string, any>}
 */
function sanitizeGardenState(raw) {
  return {
    growthPoints:
      typeof raw.growthPoints === 'number' && Number.isFinite(raw.growthPoints) ? raw.growthPoints : 0,
    totalWalks:
      typeof raw.totalWalks === 'number' && Number.isFinite(raw.totalWalks) ? raw.totalWalks : 0,
    discovered: Array.isArray(raw.discovered) ? raw.discovered.filter((item) => typeof item === 'string') : [],
    lastWalkDate: typeof raw.lastWalkDate === 'string' ? raw.lastWalkDate : null,
    streakDays:
      typeof raw.streakDays === 'number' && Number.isFinite(raw.streakDays) ? raw.streakDays : 0,
    bestAccuracy:
      typeof raw.bestAccuracy === 'number' && Number.isFinite(raw.bestAccuracy) ? raw.bestAccuracy : 0,
    newlyUnlocked: [],
  };
}

/**
 * 规范化日记碎片记录
 * @param {unknown} value
 * @returns {Array}
 */
function sanitizeDiaryEntries(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) =>
    entry &&
    typeof entry.collectibleId === 'string' &&
    typeof entry.tierId === 'string' &&
    typeof entry.fragmentIndex === 'number' &&
    typeof entry.readAt === 'string'
  );
}

/**
 * 规范化收藏状态
 * 备份只保留用户事实数据，不包含完整故事文本和待展示队列。
 * @param {Record<string, any>} raw
 * @returns {Record<string, any>}
 */
function sanitizeAchievementState(raw) {
  return {
    achievementSchemaVersion:
      typeof raw.achievementSchemaVersion === 'number' && Number.isFinite(raw.achievementSchemaVersion)
        ? raw.achievementSchemaVersion
        : 2,
    unlockedNarratives: sanitizeStringMap(raw.unlockedNarratives),
    unlockTimestamps: sanitizeStringMap(raw.unlockTimestamps),
    readNarratives: Array.isArray(raw.readNarratives)
      ? raw.readNarratives.filter((item) => typeof item === 'string')
      : [],
    diaryEntries: sanitizeDiaryEntries(raw.diaryEntries),
    hasViewedGardenDiary:
      typeof raw.hasViewedGardenDiary === 'boolean' ? raw.hasViewedGardenDiary : false,
    hiddenAchievements: sanitizeStringMap(raw.hiddenAchievements),
  };
}

/**
 * 包装为带 state/version 的分区对象
 * @param {Record<string, any>} state
 * @param {number} version
 * @returns {{state: Record<string, any>, version: number}}
 */
function createSection(state, version = 0) {
  return { state, version };
}

/**
 * 生成当前本地状态的最小备份对象
 * @returns {Record<string, any>}
 */
function buildBackupPayload() {
  return {
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    stats: createSection(sanitizeStatsState(useStatsStore.getState())),
    settings: createSection(sanitizeSettingsState(useSettingsStore.getState())),
    garden: createSection(sanitizeGardenState(useGardenStore.getState())),
    achievements: createSection(sanitizeAchievementState(useAchievementStore.getState()), 2),
  };
}

/**
 * 解析并校验备份文本
 * @param {string} text
 * @returns {Record<string, any>}
 */
function parseBackupText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }

  if (!isRecord(parsed)) {
    throw new Error('invalid-structure');
  }

  const hasKnownSections = ['stats', 'settings', 'garden', 'achievements'].some((key) =>
    isRecord(parsed[key])
  );
  if (!hasKnownSections) {
    throw new Error('invalid-structure');
  }

  return {
    schema: typeof parsed.schema === 'string' ? parsed.schema : null,
    version: typeof parsed.version === 'string' ? parsed.version : 'unknown',
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
    stats: createSection(sanitizeStatsState(extractState(parsed.stats))),
    settings: createSection(sanitizeSettingsState(extractState(parsed.settings))),
    garden: createSection(sanitizeGardenState(extractState(parsed.garden))),
    achievements: createSection(sanitizeAchievementState(extractState(parsed.achievements)), 2),
  };
}

/**
 * 应用备份到本地 store
 * @param {Record<string, any>} payload
 * @returns {{version: string, exportedAt: string|null, settings: Record<string, any>}}
 */
function applyBackupPayload(payload) {
  useStatsStore.getState().reset();
  useGardenStore.getState().reset();
  useAchievementStore.getState().reset();

  useStatsStore.setState(
    buildStatsSnapshot(payload.stats.state.sessions, payload.stats.state.warmupSessionsUsed)
  );
  useGardenStore.setState(payload.garden.state);
  useAchievementStore.setState({
    ...payload.achievements.state,
    recentUnlockQueue: [],
    fullTextEntries: {},
  });
  useSettingsStore.setState(payload.settings.state);

  return {
    version: payload.version,
    exportedAt: payload.exportedAt,
    settings: payload.settings.state,
  };
}

/**
 * 生成可下载的备份 JSON 文本
 * @returns {{filename: string, text: string, payload: Record<string, any>}}
 */
function exportBackup() {
  const payload = buildBackupPayload();
  return {
    filename: `memory-garden-backup-${new Date().toISOString().slice(0, 10)}.json`,
    text: JSON.stringify(payload, null, 2),
    payload,
  };
}

/**
 * 从备份文本恢复本地数据
 * @param {string} text
 * @returns {{version: string, exportedAt: string|null, settings: Record<string, any>}}
 */
function importBackupText(text) {
  const payload = parseBackupText(text);
  return applyBackupPayload(payload);
}

/**
 * 仅校验备份文本，不写入本地状态
 * 用于导入前预检查文件内容是否合法。
 *
 * @param {string} text
 * @returns {{version: string, exportedAt: string|null, settings: Record<string, any>}}
 */
function validateBackupText(text) {
  const payload = parseBackupText(text);
  return {
    version: payload.version,
    exportedAt: payload.exportedAt,
    settings: payload.settings.state,
  };
}

const BackupService = {
  exportBackup,
  validateBackupText,
  importBackupText,
};

export default BackupService;
