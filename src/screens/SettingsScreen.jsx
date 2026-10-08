/**
 * 设置页 — 用户偏好管理
 *
 * 功能：语言切换、静音控制、按钮模式、数据管理
 *
 * @version 1.1
 */
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Volume2, ToggleLeft, Database, Trash2, Download, Upload, HardDrive } from 'lucide-react';
import APP_FEATURES from '@/appFeatures';
import PageHeader from '@components/PageHeader';
import NavigationListLink from '@components/NavigationListLink';
import useSettingsStore from '@stores/useSettingsStore';
import useStatsStore from '@stores/useStatsStore';
import useGardenStore from '@stores/useGardenStore';
import useAchievementStore from '@stores/useAchievementStore';
import AudioService from '@services/AudioService';
import BackupService from '@services/BackupService';
import SyncService from '@services/SyncService';
import PlatformService from '@services/PlatformService';
import { confirmDialog } from '@stores/useConfirmStore';
import { toast } from '@stores/useToastStore';

/** 语言列表 */
const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en-US', label: 'English' },
];

const MAX_BACKUP_FILE_SIZE_BYTES = 1024 * 1024 * 2;

/**
 * 判断用户选择的文件是否像 JSON 备份
 * Android 文件选择器的 MIME 可能不稳定，因此同时检查扩展名与 type。
 *
 * @param {File} file
 * @returns {boolean}
 */
function isLikelyJsonBackupFile(file) {
  const name = typeof file.name === 'string' ? file.name.toLowerCase() : '';
  const type = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  return name.endsWith('.json') || type === 'application/json' || type === 'text/json';
}

/**
 * 清空本地业务数据并重置内存态
 * 确保删除 localStorage 后，当前会话内的 Zustand store 也立即回到新用户初始态
 */
function clearLocalBusinessState() {
  SyncService.clearPendingQueue();
  localStorage.removeItem('memory-garden:stats');
  localStorage.removeItem('memory-garden:garden');
  localStorage.removeItem('memory-garden:achievements');

  useStatsStore.getState().reset();
  useGardenStore.getState().reset();
  useAchievementStore.getState().reset();
}

/**
 * 设置页组件
 * 统一承载账号、语言、音频、数据与关于信息的配置入口
 * @returns {JSX.Element}
 */
export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const importInputRef = useRef(null);

  const lang = useSettingsStore((s) => s.lang);
  const isMuted = useSettingsStore((s) => s.isMuted);
  const setLang = useSettingsStore((s) => s.setLang);
  const setMuted = useSettingsStore((s) => s.setMuted);

  /** 切换语言 */
  const handleChangeLang = (code) => {
    setLang(code);
    i18n.changeLanguage(code);
  };

  /** 切换静音 */
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setMuted(nextMuted);
    AudioService.setMuted(nextMuted);
  };

  /** 导出数据 */
  const handleExportData = async () => {
    try {
      const { filename, text } = BackupService.exportBackup();
      const result = await PlatformService.exportTextFile({
        filename,
        text,
        mimeType: 'application/json',
        dialogTitle: t('settings.exportDialogTitle'),
      });

      if (result.cancelled) {
        return;
      }

      if (!result.ok) {
        throw new Error('export-not-supported');
      }

      const messageKey = result.mode === 'download'
        ? 'settings.exportStarted'
        : 'settings.exportReady';
      toast({ message: t(messageKey), variant: 'success' });
    } catch (e) {
      console.warn('[Settings] 数据导出失败', e);
      toast({ message: t('settings.exportFailed'), variant: 'error' });
    }
  };

  /**
   * 打开本地备份文件选择器
   */
  const handleOpenImport = () => {
    importInputRef.current?.click();
  };

  /**
   * 导入本地备份文件
   * 导入前先做格式校验，再由用户二次确认是否覆盖当前本地数据。
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  const handleImportData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isLikelyJsonBackupFile(file)) {
      toast({ message: t('settings.importUnsupportedFile'), variant: 'error' });
      return;
    }

    if (typeof file.size === 'number' && file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
      toast({ message: t('settings.importFileTooLarge'), variant: 'error' });
      return;
    }

    let text;
    try {
      text = await file.text();
      BackupService.validateBackupText(text);
    } catch (e) {
      console.warn('[Settings] 备份预校验失败', e);
      const messageKey = e instanceof Error && e.message === 'invalid-json'
        ? 'settings.importInvalidJson'
        : e instanceof Error && e.message === 'invalid-structure'
          ? 'settings.importInvalidStructure'
          : 'settings.importFailed';
      toast({ message: t(messageKey), variant: 'error' });
      return;
    }

    const accepted = await confirmDialog({
      title: t('common.confirm'),
      message: t('settings.importConfirm'),
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
    });
    if (!accepted) return;

    try {
      SyncService.clearPendingQueue();
      const result = BackupService.importBackupText(text);
      i18n.changeLanguage(result.settings.lang);
      AudioService.setMuted(result.settings.isMuted);
      toast({ message: t('settings.imported'), variant: 'success' });
    } catch (e) {
      console.warn('[Settings] 数据导入失败', e);
      const messageKey = e instanceof Error && e.message === 'invalid-json'
        ? 'settings.importInvalidJson'
        : e instanceof Error && e.message === 'invalid-structure'
          ? 'settings.importInvalidStructure'
          : 'settings.importFailed';
      toast({ message: t(messageKey), variant: 'error' });
    }
  };

  /** 清除数据 */
  const handleClearData = async () => {
    const accepted = await confirmDialog({
      title: t('common.confirm'),
      message: t('settings.clearConfirm'),
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
    });
    if (!accepted) return;
    try {
      clearLocalBusinessState();
      toast({ message: t('settings.cleared'), variant: 'success' });
    } catch (e) {
      console.warn('[Settings] 数据清除失败', e);
    }
  };

  return (
    <div className="ui-page-shell animate-fade-in overflow-y-auto overscroll-contain">
      <div className="ui-page-frame ui-page-narrow ui-section-stack">
        <PageHeader
          onBack={() => navigate('/menu')}
          backLabel={t('settings.backToMenu')}
          eyebrow={t('settings.about')}
          title={t('settings.title')}
          titleAs="h2"
        />

        <div className="ui-section-stack">
          {/* 本地存储说明 */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
              <HardDrive size={14} /> {t('settings.storageModeTitle')}
            </h3>
            <div className="ui-card-secondary space-y-3 border border-stone-200/50 bg-white/60 p-4">
              <p className="text-sm text-[var(--color-text-primary)]">
                {APP_FEATURES.cloudSyncEnabled ? t('settings.guestMode') : t('settings.storageModeBody')}
              </p>
              <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                {t('settings.storageModeHint')}
              </p>
            </div>
          </section>

          {/* 语言选择 */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
              <Globe size={14} /> {t('settings.language')}
            </h3>
            <div className="space-y-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleChangeLang(l.code)}
                  className={`ui-list-row w-full flex items-center justify-between border-2 p-4 text-left ${
                    lang === l.code
                      ? 'border-[var(--color-brand)] bg-white shadow-[0_12px_24px_rgba(120,113,108,0.08)]'
                      : 'border-transparent'
                  }`}
                  style={{ minHeight: 'var(--touch-min-size)' }}
                >
                  <span className="text-[var(--color-text-primary)]">{l.label}</span>
                  {lang === l.code && (
                    <div className="ui-chip flex h-5 w-5 items-center justify-center bg-[var(--color-brand)]">
                      <div className="ui-dot h-2 w-2 bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 音频设置 */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
              <Volume2 size={14} /> {t('settings.audio')}
            </h3>
            <button
              onClick={handleToggleMute}
              className={`ui-list-row w-full flex items-center justify-between border-2 p-4 ${
                isMuted
                  ? 'bg-amber-50 border-amber-200'
                  : 'border-transparent'
              }`}
              style={{ minHeight: 'var(--touch-min-size)' }}
            >
              <span className="text-[var(--color-text-primary)]">
                {isMuted ? t('settings.muted') : t('settings.unmuted')}
              </span>
              <ToggleLeft
                size={24}
                className={isMuted ? 'text-amber-500 rotate-180 transition-transform duration-300' : 'text-green-500 transition-transform duration-300'}
              />
            </button>
          </section>

          {/* 数据管理 */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
              <Database size={14} /> {t('settings.dataManagement')}
            </h3>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportData}
            />
            <div className="space-y-2">
              <button
                onClick={handleExportData}
                className="ui-list-row w-full flex items-center gap-3 p-4 text-left"
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                <Download size={18} className="text-blue-500" />
                <span className="text-[var(--color-text-primary)]">{t('settings.exportData')}</span>
              </button>
              <button
                onClick={handleOpenImport}
                className="ui-list-row w-full flex items-center gap-3 p-4 text-left"
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                <Upload size={18} className="text-emerald-500" />
                <span className="text-[var(--color-text-primary)]">{t('settings.importData')}</span>
              </button>
              <button
                onClick={handleClearData}
                className="ui-list-row w-full flex items-center gap-3 border border-red-100 bg-red-50 p-4 text-left hover:bg-red-100"
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                <Trash2 size={18} className="text-red-400" />
                <span className="text-red-600">{t('settings.clearData')}</span>
              </button>
            </div>
          </section>

          {/* 关于 */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
              {t('settings.about')}
            </h3>
            <div className="space-y-1">
              <NavigationListLink to="/about/disclaimer" label={t('about.disclaimerTitle')} />
              <NavigationListLink to="/about/privacy" label={t('about.privacyTitle')} />
              <NavigationListLink to="/about/terms" label={t('about.termsTitle')} />
              <NavigationListLink to="/about/nback" label={t('about.nbackTitle')} />
            </div>
          </section>

          {/* 版本信息 */}
          <div className="pt-4 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('settings.version', {
                appName: t('title'),
                version: import.meta.env.VITE_APP_VERSION || 'dev',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
