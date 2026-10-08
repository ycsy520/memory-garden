import { test } from '@playwright/test';
import {
  resetClientState,
  enterMenuFromIntro,
  selectMode,
  selectRhythm,
  selectDifficultyAndStart,
  startStrollInGame,
  answerOnce,
} from './flows';

test('首屏到开局冒烟', async ({ page }) => {
  await resetClientState(page);
  await enterMenuFromIntro(page);
  await selectMode(page, '散步');
  await selectRhythm(page, '午后');
  await selectDifficultyAndStart(page, 1);
  await startStrollInGame(page);
  await answerOnce(page);
});
