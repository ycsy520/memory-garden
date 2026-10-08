import { test, expect } from '@playwright/test';
import {
  resetClientState,
  enterMenuFromIntro,
  selectMode,
  selectRhythm,
  selectDifficultyAndStart,
  startStrollInGame,
} from './flows';

/**
 * 进入散步模式首局暖身阶段
 * 方便复用同一段开局路径去验证局内布局与暂停行为。
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
async function enterWarmupGame(page) {
  await resetClientState(page);
  await enterMenuFromIntro(page);
  await selectMode(page, '散步');
  await selectRhythm(page, '午后');
  await selectDifficultyAndStart(page, 1);
  await startStrollInGame(page);
}

/**
 * 进入非 walk 模式首局
 * 用来锁住旧版引擎路径的失焦暂停能力。
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
async function enterLegacyModeGame(page) {
  await resetClientState(page);
  await enterMenuFromIntro(page);
  await selectMode(page, '花坛');
  await selectRhythm(page, '午后');
  await selectDifficultyAndStart(page, 1);
  await startStrollInGame(page);
}

/**
 * 进入非 walk + 晨跑限时模式。
 * 用来锁住旧版引擎恢复后倒计时仍会继续推进。
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
async function enterLegacyTimedGame(page) {
  await resetClientState(page);
  await enterMenuFromIntro(page);
  await selectMode(page, '花坛');
  await selectRhythm(page, '晨跑');
  await selectDifficultyAndStart(page, 1);
  await startStrollInGame(page);
}

/**
 * 解析 mm:ss 文本为总秒数。
 * @param {string | null} value
 * @returns {number}
 */
function parseElapsedSeconds(value) {
  const [minutes = '0', seconds = '0'] = String(value ?? '0:0').split(':');
  return Number(minutes) * 60 + Number(seconds);
}

/**
 * 解析 xxs 文本为剩余秒数。
 * @param {string | null} value
 * @returns {number}
 */
function parseRemainingSeconds(value) {
  return Number(String(value ?? '0').replace(/[^0-9]/g, ''));
}

test('暖身三朵花固定在暖身文案上方', async ({ page }) => {
  await enterWarmupGame(page);

  const timer = page.locator('[data-testid="warmup-flower-timer"]');
  const warmupText = page.locator('p').filter({ hasText: '先看看，熟悉一下' }).first();

  await expect(timer).toBeVisible();
  await expect(warmupText).toBeVisible();

  const timerBox = await timer.boundingBox();
  const warmupTextBox = await warmupText.boundingBox();

  expect(timerBox).not.toBeNull();
  expect(warmupTextBox).not.toBeNull();
  expect(timerBox.y + timerBox.height).toBeLessThan(warmupTextBox.y);
});

test('窗口失焦后进入暂停遮罩并等待手动恢复', async ({ page }) => {
  await enterWarmupGame(page);

  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
  });

  const continueButton = page.getByTestId('resume-game-button');
  await expect(continueButton).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(continueButton).toBeVisible();

  await continueButton.click();
  await expect(continueButton).toBeHidden();
});

test('非 walk 模式失焦后也进入暂停遮罩', async ({ page }) => {
  await enterLegacyModeGame(page);

  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
  });

  const continueButton = page.getByTestId('resume-game-button');
  await expect(continueButton).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(continueButton).toBeVisible();

  await continueButton.click();
  await expect(continueButton).toBeHidden();
});

test('普通模式恢复后已用时间不会从 0 重新开始', async ({ page }) => {
  await enterWarmupGame(page);

  const elapsedTimer = page.getByTestId('elapsed-timer');
  await expect(elapsedTimer).toBeVisible();
  await page.waitForTimeout(3500);

  const beforeSeconds = parseElapsedSeconds(await elapsedTimer.textContent());

  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
  });

  const continueButton = page.getByTestId('resume-game-button');
  await expect(continueButton).toBeVisible();
  await page.waitForTimeout(1500);
  await continueButton.click();
  await expect(continueButton).toBeHidden();

  await expect(elapsedTimer).toBeVisible();
  await page.waitForTimeout(1500);

  const afterSeconds = parseElapsedSeconds(await elapsedTimer.textContent());
  expect(afterSeconds).toBeGreaterThanOrEqual(beforeSeconds);
});

test('非 walk 限时模式恢复后倒计时继续递减', async ({ page }) => {
  await enterLegacyTimedGame(page);

  const countdownChip = page.getByTestId('timed-countdown-chip');
  await expect(countdownChip).toBeVisible();
  await page.waitForTimeout(6500);

  const beforeSeconds = parseRemainingSeconds(await countdownChip.textContent());

  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
  });

  const continueButton = page.getByTestId('resume-game-button');
  await expect(continueButton).toBeVisible();
  await page.waitForTimeout(1500);
  await continueButton.click();
  await expect(continueButton).toBeHidden();

  await expect(countdownChip).toBeVisible();
  await page.waitForTimeout(2500);

  const afterSeconds = parseRemainingSeconds(await countdownChip.textContent());
  expect(afterSeconds).toBeLessThan(beforeSeconds);
});
