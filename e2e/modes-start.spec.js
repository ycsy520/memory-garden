import { test, expect } from '@playwright/test';
import {
  resetClientState,
  enterMenuFromIntro,
  selectMode,
  selectRhythm,
  selectDifficultyAndStart,
  startStrollInGame,
  answerOnce,
} from './flows';

/**
 * 进入指定模式并完成一次输入（不追求完整结算，用作模式级冒烟回归）
 * @param {import('@playwright/test').Page} page
 * @param {string} modeLabel
 * @returns {Promise<void>}
 */
async function smokeStartMode(page, modeLabel) {
  await resetClientState(page);
  await enterMenuFromIntro(page);
  await selectMode(page, modeLabel);
  await selectRhythm(page, '午后');
  await selectDifficultyAndStart(page, 1);
  await expect(page).toHaveURL(/\/#\/game/);
  await startStrollInGame(page);
  await answerOnce(page);
}

test('模式冒烟：散步', async ({ page }) => {
  await smokeStartMode(page, '散步');
});

test('模式冒烟：花与歌', async ({ page }) => {
  await smokeStartMode(page, '花与歌');
});

test('模式冒烟：花坛', async ({ page }) => {
  await smokeStartMode(page, '花坛');
});

test('模式冒烟：花圃', async ({ page }) => {
  await smokeStartMode(page, '花圃');
});

