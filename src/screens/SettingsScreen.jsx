/**
 * 设置页 — 用户偏好管理
 *
 * 功能：语言切换、静音控制、按钮模式、数据管理
 *
 * @version 1.0
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Globe, Volume2, ToggleLeft, Database, Trash2, Download } from 'lucide-react';
import useSettingsStore from '@stores/useSettingsStore';
import useStatsStore from '@stores/useStatsStore';
import useGardenStore from '@stores/useGardenStore';
import AudioService from '@services/AudioService';

/** 语言列表 */
const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en-US', label: 'English' },
];

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const lang = useSettingsStore((s) => s.lang);
  const isMuted = useSettingsStore((s) => s.isMuted);
  const setLang = useSettingsStore((s) => s.setLang);
  const toggleMute = useSettingsStore((s) => s.toggleMute);

  /** 切换语言 */
  const handleChangeLang = (code) => {
    setLang(code);
    i18n.changeLanguage(code);
  };

  /** 切换静音 */
  const handleToggleMute = () => {
    toggleMute();
    AudioService.toggleMute();
  };

  /** 导出数据 */
  const handleExportData = () => {
    try {
      const data = {
        version: '5.0.0-p0a',
        exportedAt: new Date().toISOString(),
        stats: JSON.parse(localStorage.getItem('memory-garden:stats') || '{}'),
        settings: JSON.parse(localStorage.getItem('memory-garden:settings') || '{}'),
        garden: JSON.parse(localStorage.getItem('memory-garden:garden') || '{}'),
        achievements: JSON.parse(localStorage.getItem('memory-garden:achievements') || '{}'),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memory-garden-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('[Settings] 数据导出失败', e);
      alert('导出失败，请稍后重试。');
    }
  };

  /** 清除数据 */
  const handleClearData = () => {
    if (!window.confirm('确定要删除所有花园数据吗？此操作不可撤销，包括散步记录、花园成长和收藏。')) return;
    try {
      localStorage.removeItem('memory-garden:stats');
      localStorage.removeItem('memory-garden:garden');
      localStorage.removeItem('memory-garden:achievements');
      useStatsStore.getState().reset?.() || useStatsStore.setState({ bestScores: {}, sessions: [], perModeCounts: {}, perNCounts: {} });
      useGardenStore.getState().reset();
      alert('数据已清除。花园会重新生长。');
    } catch (e) {
      console.warn('[Settings] 数据清除失败', e);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in overflow-y-auto">
      {/* 顶部导航栏 */}
      <div className="flex items-center gap-4 p-4">
        <button
          onClick={() => navigate('/menu')}
          aria-label="返回菜单"
          className="p-2 rounded-full bg-white/50 text-[var(--color-text-secondary)] hover:bg-white transition-colors"
          style={{ minHeight: 'var(--touch-min-size)', minWidth: 'var(--touch-min-size)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2
          className="text-xl text-[var(--color-text-primary)]"
          style={{ fontFamily: 'var(--font-family-serif)' }}
        >
          花园设置
        </h2>
      </div>

      <div className="flex-1 px-6 pb-8 space-y-6">
        {/* 语言选择 */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] mb-3">
            <Globe size={14} /> 语言
          </h3>
          <div className="space-y-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleChangeLang(l.code)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 text-left ${
                  lang === l.code
                    ? 'bg-white border-[var(--color-brand)] shadow-sm'
                    : 'bg-white/40 border-transparent hover:bg-white/60'
                }`}
                style={{ minHeight: 'var(--touch-min-size)' }}
              >
                <span className="text-[var(--color-text-primary)]">{l.label}</span>
                {lang === l.code && (
                  <div className="w-5 h-5 rounded-full bg-[var(--color-brand)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 音频设置 */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] mb-3">
            <Volume2 size={14} /> 音频
          </h3>
          <button
            onClick={handleToggleMute}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 ${
              isMuted
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white/40 border-transparent hover:bg-white/60'
            }`}
            style={{ minHeight: 'var(--touch-min-size)' }}
          >
            <span className="text-[var(--color-text-primary)]">
              {isMuted ? '已静音' : '声音已开启'}
            </span>
            <ToggleLeft
              size={24}
              className={isMuted ? 'text-amber-500 rotate-180' : 'text-green-500'}
            />
          </button>
        </section>

        {/* 数据管理 */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] mb-3">
            <Database size={14} /> 数据管理
          </h3>
          <div className="space-y-2">
            <button
              onClick={handleExportData}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/40 border border-transparent hover:bg-white/60 transition-all text-left"
              style={{ minHeight: 'var(--touch-min-size)' }}
            >
              <Download size={18} className="text-blue-500" />
              <span className="text-[var(--color-text-primary)]">导出花园数据</span>
            </button>
            <button
              onClick={handleClearData}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-all text-left"
              style={{ minHeight: 'var(--touch-min-size)' }}
            >
              <Trash2 size={18} className="text-red-400" />
              <span className="text-red-600">清除所有数据</span>
            </button>
          </div>
        </section>

        {/* 版本信息 */}
        <div className="text-center pt-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            记忆小花园 v5.0.0-p0a
          </p>
        </div>
      </div>
    </div>
  );
}
