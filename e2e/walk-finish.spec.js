import { test, expect } from '@playwright/test';
import {
  resetClientState,
  enterMenuFromIntro,
  selectMode,
  selectRhythm,
  selectDifficultyAndStart,
  startStrollInGame,
  autoplayUntilFinished,
} from './flows';

test('完整路径：散步模式可自动走到结算页并回到花园', async ({ page }) => {
  test.setTimeout(180_000);
  await resetClientState(page);
  await enterMenuFromIntro(page);
  await selectMode(page, '散步');
  await selectRhythm(page, '午后');
  await selectDifficultyAndStart(page, 1);

  await expect(page).toHaveURL(/\/#\/game/);
  await startStrollInGame(page);

  await autoplayUntilFinished(page, 60);
  await expect(page).toHaveURL(/\/#\/finished/);

  await expect(page.getByText('记忆准确率')).toBeVisible();
  await expect(page.getByRole('button', { name: '回到花园', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '回到花园', exact: true }).click();
  await expect(page).toHaveURL(/\/#\/menu/);
});
