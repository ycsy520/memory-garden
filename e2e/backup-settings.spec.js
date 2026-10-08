import fs from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { resetClientState, enterMenuFromIntro } from './flows';

/**
 * 在设置页点击“导出花园数据”并读取下载内容
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
async function exportBackupText(page) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出花园数据', exact: true }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  return fs.readFile(filePath, 'utf-8');
}

/**
 * 在应用内确认弹窗中点击“确定”。
 * 用于替代旧版原生 dialog 的测试假设。
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
async function confirmInDialog(page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
}

/**
 * 等待导入结果真正落盘到 localStorage。
 * 避免把 Zustand persist 的异步写盘时机误判为功能失败。
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{stats: any, settings: any, garden: any, achievements: any}>}
 */
async function waitForPersistedBackup(page) {
  await expect.poll(async () => page.evaluate(() => ({
    stats: localStorage.getItem('memory-garden:stats'),
    settings: localStorage.getItem('memory-garden:settings'),
    garden: localStorage.getItem('memory-garden:garden'),
    achievements: localStorage.getItem('memory-garden:achievements'),
  })), {
    message: '等待导入后的持久化数据写入 localStorage',
  }).toMatchObject({
    stats: expect.any(String),
    settings: expect.any(String),
    garden: expect.any(String),
    achievements: expect.any(String),
  });

  return page.evaluate(() => ({
    stats: JSON.parse(localStorage.getItem('memory-garden:stats') || '{}'),
    settings: JSON.parse(localStorage.getItem('memory-garden:settings') || '{}'),
    garden: JSON.parse(localStorage.getItem('memory-garden:garden') || '{}'),
    achievements: JSON.parse(localStorage.getItem('memory-garden:achievements') || '{}'),
  }));
}

test('设置页导出的备份不包含完整故事文本缓存', async ({ page }) => {
  await resetClientState(page);
  await page.addInitScript(() => {
    localStorage.setItem('memory-garden:achievements', JSON.stringify({
      state: {
        achievementSchemaVersion: 2,
        unlockedNarratives: { dew: 'fullBloom' },
        unlockTimestamps: { dew: '2026-07-14T11:58:00.612Z' },
        recentUnlockQueue: [],
        readNarratives: ['dew:fullBloom'],
        diaryEntries: [],
        fullTextEntries: {
          dew: {
            text: '这段完整故事文本不应该进入导出备份。',
            savedAt: '2026-07-14T11:58:10.804Z',
          },
        },
        hasViewedGardenDiary: false,
        hiddenAchievements: {},
      },
      version: 0,
    }));
  });

  await enterMenuFromIntro(page);
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await expect(page).toHaveURL(/\/#\/settings/);

  const backupText = await exportBackupText(page);
  const backupJson = JSON.parse(backupText);

  expect(backupJson.achievements.state.fullTextEntries).toBeUndefined();
  expect(backupText).not.toContain('这段完整故事文本不应该进入导出备份');
});

test('设置页可导入旧格式备份并恢复精简后的本地状态', async ({ page }) => {
  await resetClientState(page);
  await enterMenuFromIntro(page);
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await expect(page).toHaveURL(/\/#\/settings/);

  const backupPath = path.resolve(process.cwd(), 'docs', 'memory-garden-backup-example.json');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '导入花园备份', exact: true }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(backupPath);
  await confirmInDialog(page);
  await expect(page.getByText('备份已导入。本地花园状态已恢复。')).toBeVisible();

  const restored = await waitForPersistedBackup(page);

  expect(restored.stats.state.warmupSessionsUsed).toBe(1);
  expect(restored.settings.state.lang).toBe('zh-CN');
  expect(restored.garden.state.growthPoints).toBe(24);
  expect(restored.achievements.state.unlockedNarratives.dew).toBeUndefined();
  expect(restored.achievements.state.fullTextEntries).toBeUndefined();
});
