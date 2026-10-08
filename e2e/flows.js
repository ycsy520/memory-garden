import { expect } from '@playwright/test';

/**
 * 在每条 e2e 用例开始前清理关键 localStorage，保证流程可重复、可预测
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function resetClientState(page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('memory-garden:settings');
      localStorage.removeItem('memory-garden:stats');
      localStorage.removeItem('memory-garden:garden');
      localStorage.removeItem('memory-garden:achievements');
      localStorage.removeItem('memory-garden:sync-pending');
      localStorage.removeItem('memory-garden:sel-gameMode');
      localStorage.removeItem('memory-garden:sel-timeMode');
      localStorage.removeItem('memory-garden:sel-n');
    } catch {}
  });
}

/**
 * 从首页进入到菜单页（兼容：首次用户会先经过 Guide；回归用户可能直接到 Menu）
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function enterMenuFromIntro(page) {
  await page.goto('/#/');

  const enter = page.getByRole('button', { name: '推开花园的门', exact: true });
  await expect(enter).toBeVisible();
  await enter.click();

  const guideNext = page.getByRole('button', { name: '下一步', exact: true });
  const menuTitle = page.getByText('选记忆模式');

  const state = await Promise.race([
    guideNext.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'guide').catch(() => null),
    menuTitle.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'menu').catch(() => null),
  ]);

  if (state === 'guide') {
    await completeGuide(page);
    await expect(menuTitle).toBeVisible();
  }
}

/**
 * 跑完引导页并进入菜单页
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function completeGuide(page) {
  const next = page.getByRole('button', { name: '下一步', exact: true });
  const done = page.getByRole('button', { name: '明白了', exact: true });

  await expect(next).toBeVisible();
  await next.click();
  await next.click();
  await next.click();
  await expect(done).toBeVisible();
  await done.click();
}

/**
 * 在菜单页选择模式（散步/花与歌/花坛/花圃）
 * @param {import('@playwright/test').Page} page
 * @param {string} modeLabel
 * @returns {Promise<void>}
 */
export async function selectMode(page, modeLabel) {
  await expect(page.getByText('选记忆模式')).toBeVisible();
  const option = page.getByRole('button').filter({ hasText: modeLabel }).first();
  await expect(option).toBeVisible();
  await option.click();
  await page.getByRole('button', { name: '下一步：选时间节奏', exact: true }).click();
}

/**
 * 在时间节奏页选择节奏（初晨/晨曦/午后/暮色/晨跑）
 * @param {import('@playwright/test').Page} page
 * @param {string} rhythmLabel
 * @returns {Promise<void>}
 */
export async function selectRhythm(page, rhythmLabel) {
  await expect(page.getByText('选时间节奏')).toBeVisible();
  const option = page.getByRole('button').filter({ hasText: rhythmLabel }).first();
  await expect(option).toBeVisible();
  await option.click();
  await page.getByRole('button', { name: '下一步：选难度', exact: true }).click();
}

/**
 * 在难度页选择 N 值并开始散步
 * @param {import('@playwright/test').Page} page
 * @param {number} n
 * @returns {Promise<void>}
 */
export async function selectDifficultyAndStart(page, n) {
  await expect(page.getByText('选记忆难度')).toBeVisible();
  const nBtn = page.getByRole('button').filter({ hasText: String(n) }).first();
  await expect(nBtn).toBeVisible();
  await nBtn.click();
  await page.getByTestId('menu-start-button').click();
}

/**
 * 进入游戏页并确认“开始散步”引导，启动引擎
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function startStrollInGame(page) {
  const startBtn = page.getByTestId('game-start-button');
  await expect(startBtn).toBeVisible();
  await startBtn.click();
}

/**
 * 在局内点击一次输入（等按钮可用后点“不一样”）
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function answerOnce(page) {
  const sameBtn = page.getByRole('button', { name: '一样', exact: true });
  const diffBtn = page.getByRole('button', { name: '不一样', exact: true });

  await expect(sameBtn).toBeVisible();
  await expect(diffBtn).toBeVisible();

  await expect(diffBtn).toBeEnabled({ timeout: 20_000 });
  await diffBtn.click();

  await expect(diffBtn).toBeDisabled();
  await expect(sameBtn).toBeDisabled();
}

/**
 * 自动完成一局直到进入结算页（只适用于按钮输入的模式）
 * @param {import('@playwright/test').Page} page
 * @param {number} maxAnswers
 * @returns {Promise<void>}
 */
export async function autoplayUntilFinished(page, maxAnswers = 40) {
  const diffBtn = page.getByRole('button', { name: '不一样', exact: true });
  const finishedRe = /\/#\/finished/;

  for (let i = 0; i < maxAnswers; i += 1) {
    if (finishedRe.test(page.url())) return;

    await expect(diffBtn).toBeEnabled({ timeout: 15_000 });
    await diffBtn.click();
    await expect(diffBtn).toBeDisabled({ timeout: 10_000 });

    const progressed = await Promise.race([
      page.waitForURL(finishedRe, { timeout: 15_000 }).then(() => 'finished').catch(() => null),
      expect(diffBtn).toBeEnabled({ timeout: 15_000 }).then(() => 'next').catch(() => null),
    ]);

    if (progressed === 'finished') return;
    if (progressed === 'next') continue;

    throw new Error('autoplayUntilFinished did not progress to next turn nor finished within timeout');
  }

  await expect(page).toHaveURL(finishedRe);
}
