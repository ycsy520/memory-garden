import { test, expect } from '@playwright/test';
import { completeGuide, resetClientState } from './flows';

/**
 * 阅读页回归
 * 验证引导页、模式引导页与关于页在统一骨架改造后仍可正常访问和流转
 */

test('阅读页：基础引导可完成并进入菜单', async ({ page }) => {
  await resetClientState(page);
  await page.goto('/#/guide');

  await expect(page.getByText('花园起了雾')).toBeVisible();
  await completeGuide(page);

  await expect(page).toHaveURL(/\/#\/menu/);
  await expect(page.getByText('选记忆模式')).toBeVisible();
});

test('阅读页：模式引导可进入最终演示步骤', async ({ page }) => {
  await resetClientState(page);
  await page.goto('/#/mode-guide?mode=standard');

  await expect(page.getByText('似曾相识')).toBeVisible();

  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await page.getByRole('button', { name: '下一步', exact: true }).click();

  await expect(page.getByText('怎么玩')).toBeVisible();
  await expect(page.getByRole('button', { name: '开始游戏', exact: true })).toBeVisible();
});

test('阅读页：隐私页面可正常渲染正文', async ({ page }) => {
  await resetClientState(page);
  await page.goto('/#/about/privacy');

  await expect(page).toHaveURL(/\/#\/about\/privacy/);
  await expect(page.getByRole('heading', { name: '隐私政策', exact: true })).toBeVisible();
  await expect(page.getByText('生效日期')).toBeVisible();
});
