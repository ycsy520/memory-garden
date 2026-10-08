import { test, expect } from '@playwright/test';
import { resetClientState, enterMenuFromIntro } from './flows';

test('菜单页可进入统计页', async ({ page }) => {
  await resetClientState(page);
  await enterMenuFromIntro(page);

  await page.getByRole('button', { name: '花园日记', exact: true }).click();

  await expect(page).toHaveURL(/\/#\/stats/);
  await expect(page.getByText('记忆花园日记')).toBeVisible();
});

test('菜单页可进入成就页', async ({ page }) => {
  await resetClientState(page);
  await enterMenuFromIntro(page);

  await page.getByRole('button', { name: '花园收藏', exact: true }).click();

  await expect(page).toHaveURL(/\/#\/achievements/);
  await expect(page.getByText('花园收藏')).toBeVisible();
});

test('菜单页可进入设置页', async ({ page }) => {
  await resetClientState(page);
  await enterMenuFromIntro(page);

  await page.getByRole('button', { name: '设置', exact: true }).click();

  await expect(page).toHaveURL(/\/#\/settings/);
  await expect(page.getByText('花园设置')).toBeVisible();
});
