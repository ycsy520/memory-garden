# 12 — 全站视觉系统执行清单 (VISUAL SYSTEM TASKS)

> 版本: v1.0
> 更新: 2026-07-15
> 状态: 已完成收口
> 依赖蓝图: [09-VISUAL-SYSTEM.md](./09-VISUAL-SYSTEM.md)

---

## 1. 目标

将 `09-VISUAL-SYSTEM.md` 中定义的全站视觉系统蓝图拆解为可执行、可验收、可逐步回归的任务清单。

原则：

1. 先系统层，后页面层。
2. 先高频页面，后低频页面。
3. 每个阶段都能独立回归，不做一次性大爆改。

---

## 2. 总体执行顺序

```text
T0 系统审计与 token 统一
  ↓
T1 全局页面壳与响应式升级
  ↓
T2 按钮与圆角系统回收
  ↓
T3 高频页面重构（Game / Menu / Finished）
  ↓
T4 数据页重构（Stats / Achievements / Leaderboard）
  ↓
T5 阅读页重构（Guide / ModeGuide / About）
  ↓
T6 全站视觉回归与清理
```

---

## 3. 任务分解

## T0 — 系统审计与 token 统一

### 目标

建立统一的版心、栅格、圆角、按钮设计 token，清点现有混用项。

### 涉及文件

- `src/styles/design-tokens.css`
- `src/App.jsx`
- 全站 `src/**/*.jsx`

### 交付物

1. 页面壳宽度 / 边距 / gap token
2. 圆角 token：`R1 / R2 / R3 / R4 / RPill`
3. 按钮半径与状态 token
4. 圆角混用清单

### 验收标准

- 代码里不再新增随意 `rounded-[...]`
- token 命名能够覆盖按钮、卡片、子块、chip
- 新系统与现有 Safe Area 变量兼容

### 风险

- token 命名如果过于抽象，后续页面落地会再次各自发挥

---

## T1 — 全局页面壳与响应式升级

### 目标

把现有页面从“各自容器”升级成统一页面壳，并同步更新响应式规则。

### 涉及文件

- `src/App.jsx`
- `docs/10-RESPONSIVE.md`

### 交付物

1. 全局统一版心
2. 桌面 12 列 / 平板 8 列 / 手机 4 列的骨架说明
3. 页面分类策略与断点规则

### 验收标准

- 主页面共享统一外层容器逻辑
- 桌面端不再同时存在 `1152px` 和 `1440px` 两套主标准
- 文档与代码一致

### 风险

- 改动全局页面壳后，所有页面都可能产生布局连锁变化

---

## T2 — 按钮与圆角系统回收

### 目标

统一全站按钮圆角、图标按钮尺寸、卡片圆角与子块圆角。

### 涉及文件

- `src/styles/design-tokens.css`
- `src/screens/GameScreen.jsx`
- `src/screens/MenuScreen.jsx`
- `src/screens/FinishedScreen.jsx`
- `src/screens/SettingsScreen.jsx`
- 其他含主要按钮的 screen / component

### 交付物

1. 主按钮统一 `R4`
2. 标准卡片统一 `R3`
3. 子块统一 `R2`
4. 图标按钮统一小尺寸规范

### 验收标准

- 主要 CTA 不再混用 `rounded-full` / `rounded-2xl` / `rounded-[2rem]`
- 同一页面内同层级组件圆角一致
- 按钮 hover / active / disabled 的状态强度统一

### 风险

- 某些旧页面会因为圆角统一而暴露更多 spacing 问题

---

## T3 — 高频页面重构

### 目标

先完成用户感知最强的三页统一，建立新系统的“样板页”。

### 页面与重点

#### T3-1 `GameScreen`

- 固化沉浸式页面骨架
- 稳定主舞台与操作区的列关系
- 统一主判断按钮与图标按钮

#### T3-2 `MenuScreen`

- 从零散单列容器升级为沉浸式首页骨架
- 统一导航、主入口、底部花园构图与操作区秩序

#### T3-3 `FinishedScreen`

- 统一本局结果、过往记录、成长区、操作区的版心逻辑
- 收掉因模块样式不同造成的“拼接感”

### 验收标准

- 三页都服从同一套版心和圆角系统
- 用户能明显感知“属于同一个产品”
- 不破坏现有玩法与流程

### 风险

- `MenuScreen` 与 `FinishedScreen` 都存在较强叙事表达，重构时需防止“过度系统化”后变冷

---

## T4 — 数据页重构

### 目标

让数据页更整洁、更克制，但不变成后台。

### 页面

- `StatsScreen`
- `AchievementsScreen`
- `LeaderboardScreen`

### 重点

1. 中轴型 10 列内容区
2. 统一指标卡与列表卡的圆角等级
3. 减少随意堆卡，提升留白与对齐秩序

### 验收标准

- 数据页阅读节奏稳定
- 列表页与统计页不再各自使用不同卡片语言
- 保留花园语气，不出现强后台感

---

## T5 — 阅读页重构

### 目标

将说明、协议、帮助类页面纳入同一阅读版心系统。

### 页面

- `GuideScreen`
- `ModeGuideScreen`
- `src/screens/about/*`

### 重点

1. 统一阅读宽度
2. 统一页头、正文、底部操作节奏
3. About 页面与主应用壳层对齐

### 验收标准

- 阅读页不再使用独立“另一套世界”的容器逻辑
- 桌面宽度适合长文本阅读
- 手机端依然保持舒服的触达和留白

---

## T6 — 全站视觉回归与清理

### 目标

在主要页面都接入新系统后，完成统一回归、清理残留样式与文档对齐。

### 内容

1. 清理旧 `max-w-*` 与旧圆角残留
2. 清理不再使用的局部容器策略
3. 对齐 `00-INDEX.md`、`10-RESPONSIVE.md`、`ROADMAP.md`
4. 完成关键页面跨设备回归检查

### 验收标准

- 旧系统残留点可列清单并收尾
- 文档描述与真实代码一致
- 关键路径在手机、平板、桌面下均可用

### 完成说明

1. 已清理高频残留页面中的旧 `max-w-*`、旧圆角、旧卡片和旧按钮语法，重点收口：
   - `IntroScreen`
   - `SettingsScreen`
   - `MenuScreen`
   - `FinishedScreen`
   - `GuideScreen`
   - `ModeGuideScreen`
2. 已补齐阅读页回归用例，并保留主链路回归：
   - `e2e/reading-pages.spec.js`
   - `e2e/smoke.spec.js`
   - `e2e/navigation.spec.js`
   - `e2e/walk-finish.spec.js`
3. 文档已同步到当前实现，不再保留“待实施”状态。
4. 当前仍保留的少量非系统化圆角/阴影主要位于局内刺激舞台与演示组件，用于表达纸卡、胶带、演示高亮等具象舞台感，视为刻意保留的表现层样式，而非系统债。

---

## 4. 文件级优先级

### P0 文件

- `src/App.jsx`
- `src/styles/design-tokens.css`
- `docs/10-RESPONSIVE.md`
- `src/screens/GameScreen.jsx`
- `src/screens/MenuScreen.jsx`
- `src/screens/FinishedScreen.jsx`

### P1 文件

- `src/screens/StatsScreen.jsx`
- `src/screens/AchievementsScreen.jsx`
- `src/screens/LeaderboardScreen.jsx`

### P2 文件

- `src/screens/GuideScreen.jsx`
- `src/screens/ModeGuideScreen.jsx`
- `src/screens/about/AboutLayout.jsx`
- `src/screens/about/*`

---

## 5. 建议实施批次

### 批次 A

- T0
- T1

目标：先让系统层成立

### 批次 B

- T2
- T3

目标：先把用户感知最强的页面做成新标准

### 批次 C

- T4
- T5
- T6

目标：完成全站统一和回归

---

## 6. 回归检查清单

每完成一个批次，至少检查以下内容：

1. 手机竖屏
2. 平板竖屏
3. 平板横屏
4. 桌面宽屏
5. PWA Safe Area
6. 主按钮点击安全区
7. 页面滚动与 overscroll
8. 关键路径跳转

---

## 7. 完成定义

当以下条件全部成立，可判定全站视觉系统升级完成：

1. 全站主页面都服从统一页面壳与响应式骨架
2. 主按钮、图标按钮、卡片、子块的圆角语言统一
3. 页面之间的版心、留白、间距、信息节奏趋于一致
4. 没有明显“旧系统页面”和“新系统页面”并存的割裂感
5. 用户主观感受从“页面各自为战”升级到“同一座花园里的不同区域”
