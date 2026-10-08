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
 * 触发局内返回并在自定义确认弹窗中执行操作。
 * @param {import('@playwright/test').Page} page
 * @param {'确定'|'取消'} actionLabel
 * @returns {Promise<void>}
 */
async function actOnExitDialog(page, actionLabel) {
  await page.getByRole('button', { name: '返回', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: actionLabel, exact: true }).last().click();
}

test('对抗路径：游戏中点击回家，取消/确认弹窗行为正确', async ({ page }) => {
  await resetClientState(page);
  await enterMenuFromIntro(page);
  await selectMode(page, '散步');
  await selectRhythm(page, '午后');
  await selectDifficultyAndStart(page, 1);
  await startStrollInGame(page);
  await answerOnce(page);

  await expect(page).toHaveURL(/\/#\/game/);

  await actOnExitDialog(page, '取消');
  await expect(page).toHaveURL(/\/#\/game/);

  await actOnExitDialog(page, '确定');
  await expect(page).toHaveURL(/\/#\/menu/);
});
