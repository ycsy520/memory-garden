# [OPEN] loading-black-border

## 症状
- 首屏 loading 即将消失时，Firefox 中出现黑色边框/黑色描边
- 不仅遮罩外缘有黑边，loading 中的文字边缘也会发黑

## 目标
- 找到导致黑色描边的真实渲染根因
- 给出可验证、可长期稳定的修复方向

## 可证伪假设
1. 退场阶段对父层做 `opacity` 动画时，Firefox 将整块内容提升为合成层，文字抗锯齿模式切换，导致黑色描边伪影。
2. `.loader-halo` 的持续 `filter: blur(10px)` 在父层透明退场时仍参与合成，污染了文字与图形边缘。
3. loading 与 `#root` 的交叉淡入淡出造成底层内容穿透，和浅底叠加后在 Firefox 中表现成黑边。
4. 首屏 SVG 与文字位于同一个退场父层中，父层透明度变化导致整块被栅格化，文字与 SVG 同时出现发黑描边。
5. 问题不是边框，而是 Firefox 对“动画中的文本/滤镜/透明层”进行灰度重采样时的已知视觉副作用；真正稳定的方案应避免对含文字层做动画。

## 当前观察点
- `#initial-loader` 在退场时做 `opacity`
- `.loader-shell` 当前也做 `opacity`
- `.loader-halo` 持续带 `filter: blur(10px)` 和动画
- `#root` 在 `body.app-ready` 后开始淡入

## 当前结论
- 已基本排除“真实边框样式”的可能。因为连 `.loader-caption` 文字边缘都会发黑，问题发生在整棵 loading 子树的合成/重采样阶段。
- 已基本排除“仅由 transform 引起”的单一假设。即使去掉退场 `transform`，黑框仍然出现。
- 当前最强根因链路是三者叠加：
  1. loading 子树内部仍有持续动画（文字 opacity、叶片/花朵 transform、光晕 blur）
  2. 父层 `#initial-loader` 在退场时做 `opacity`
  3. `#root` 在 loading 尚未移除时提前淡入
- 这会让 Firefox 在退出窗口中反复栅格化“文本 + SVG + blur + 透明层 + 底层变化”的复合场景，导致文字和图形共同出现黑色描边伪影。

## 外部证据
- GitHub Issue：Firefox 在 transition 后文本/SVG 会模糊，直到外部 relayout 才恢复清晰  
  https://github.com/vasturiano/icicle-chart/issues/18
- GitHub PR：Firefox 对 blur + 动画组合会持续重栅格化，行业做法是改为更稳定的 CSS/compositor 路径，或减少动画复杂度  
  https://github.com/getarcaneapp/arcane/pull/2317
