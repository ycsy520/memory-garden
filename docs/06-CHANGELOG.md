# 06 — 版本迭代日志 (CHANGELOG)

> 版本: v3.3
> 更新: 2026-06-28
> 格式: Keep a Changelog (<https://keepachangelog.com/zh-CN/1.0.0/>)

---

## [v5.0.0-p0a] — 2026-07-03 (架构重构 P0 Alpha)

### Changed

- **引擎架构重构**: rAF GameLoop + PhaseMachine 四阶段状态机替代 setTimeout
- **TrialGenerator**: 全新的 Go-No-Go N-back 回合生成器（target/lure/暖身）
- **ScoringEngine**: Hit/Miss/FA/CR + 加权评分 + 反应时 + 有效训练局判定
- **WalkMode**: 统一散步模式，使用新引擎架构
- **目录结构**: components/ 按 basic/game/composite 重组，新增 assets/ 目录
- **动画提取**: 全局 @keyframes 从 App.jsx 移至 styles/animations.css

### Removed

- 旧版引擎: StandardMode, DualMode, SpatialMode, GridMode, SequenceGenerator
- 旧版工具: scoring.js, adaptiveDifficulty.js（被 ScoringEngine 替代）

### Added

- SettingsScreen 设置页面（语言/音频/数据管理）
- SignalDetection（d'/β 信号检测论工具）

---

## [v3.3.0] — 2026-06-28 (监控 + Analytics)

### Added

- Sentry 错误监控集成 (lazy-load, 仅生产环境 + 有 DSN 时初始化)
- `sentry.client.config.js`: DSN 配置 + 采样率 + 过滤噪声
- ErrorBoundary 接入 Sentry `captureException`
- AnalyticsService: localStorage 自托管统计 (最近500事件)
- 游戏会话追踪: 模式/难度/因子/分数/准确率
- 应用启动追踪: 平台/运行环境
- Umami 自托管支持 (可选, 通过环境变量启用)

---

## [v3.2.0] — 2026-06-28 (CI/CD + 质量保障)

### Added

- vitest 单元测试框架 (53 tests, engine/services 覆盖)
- GitHub Actions CI/CD workflow (lint → test → build → bundle check → deploy)
- Bundle size 检查 (gzip < 200KB)
- 测试用例: StandardMode, ModeFactory, scoring, adaptiveDifficulty, DailyChallengeService

---

## [v3.1.0] — 2026-06-28 (Capacitor 移动端封装)

### Added

- Capacitor 初始化 + `capacitor.config.ts`
- PlatformService v3.1: Capacitor 环境检测 + 原生桥接
- Haptics 原生振动反馈 (按钮点击)
- 原生分享: Capacitor Share → Web Share API → 剪贴板降级
- StatusBar 状态栏适配 + SplashScreen 启动画面
- 构建脚本: `build:capacitor`, `build:android`, `build:ios`

---

## [v3.0.0] — 2026-06-28 (PWA 多端发布)

### Added

- PWA Service Worker (vite-plugin-pwa, workbox 预缓存)
- manifest.json + SVG 图标 (192/512)
- 安装提示 (beforeinstallprompt Hook)
- 更新提示 + 离线就绪通知
- main.jsx: SW 仅在非 Capacitor 环境注册

---

## [v2.0.0] — 2026-06-27 (复杂玩法)

### Added

- 游戏模式系统: BaseMode + StandardMode + DualMode + SpatialMode + GridMode
- ModeFactory 模式工厂 + FactorGenerator 因子生成器
- 每日挑战: DailyChallengeService (Mulberry32 PRNG)
- 本地排行榜: LeaderboardService + LeaderboardScreen
- 玩家反馈闭环: FeedbackService (d-prime 分析 + 训练建议)
- MenuScreen 游戏模式选择器 + 每日挑战入口
- GameScreen SpatialGrid + GridReveal 组件
- FinishedScreen 复盘分析 + 表现等级

### Fixed

- useGameEngine 与 useGameStore 数据同步 (syncModeResult)
- useVisibilityChange 在 IDE 预览窗口误触发暂停
- useGameEngine 跨组件实例共享 (模块级变量)
- 暖身提示根据因子类型动态显示

---

## [v1.2.0] — 2026-06-26 (可玩性优化)

### Added

- 自适应难度: adaptiveDifficulty (连续3场准确率)
- 成就系统: AchievementService + 10个成就
- 成绩分享: ShareService (Web Share API + 降级)
- 艾宾浩斯复习提醒: EbbinghausService
- 挑战夜模式 + 11种Emoji因子
- 4个新页面: Intro, Settings, Achievements, Stats

---

## [v1.1.0] — 2026-06-26 (记忆因子 + 统计)

### Added

- 因子插件系统: FactorRegistry
- 7种视觉因子: emoji-flower, emoji-animal, emoji-food, text-zh, text-en, symbol, picture
- 1种听觉因子: tone
- 统计面板: StatsScreen
- 历史记录: StatsStore (最近100场)

---

## [v1.0.0] — 2026-06-26 (基础重构)

### Added

- 状态管理: Zustand (useGameStore, useStatsStore, useSettingsStore)
- 路由系统: React Router (HashRouter)
- 国际化: i18next (zh-CN, zh-TW, en-US)
- 存储服务: StorageService (IndexedDB → localStorage → 内存降级)
- 错误边界: ErrorBoundary
- 设计Token: design-tokens.css + CSS变量
- WCAG-AA: focus-visible + contrast + accessibility.css

---

## [v0.1.0] — 2026-06-26 (初始版本)

### Added

- React 19 + Vite + Tailwind CSS
- 标准N-back游戏 (花朵Emoji)
- 3种难度: 初晨/午后/暮色 (n=1/2/3)
- 5个页面: 首页、引导、菜单、游戏、结果
- 音频引擎: 音效 + 环境音
- localStorage 高分持久化

---

## 版本号规则

格式: `v{MAJOR}.{MINOR}.{PATCH}`

| 类型 | 递增 | 示例 |
|------|------|------|
| 不兼容架构变更 | MAJOR | v1.0 → v2.0 |
| 新功能, 向后兼容 | MINOR | v1.0 → v1.1 |
| Bug修复 | PATCH | v1.0.0 → v1.0.1 |

---

## 分支策略

```
main          ← 生产就绪代码
├── dev       ← 开发分支
│   ├── feat/v1.0-xxx
│   ├── feat/v1.1-xxx
│   └── fix/xxx
└── release/v1.0
```

---

## 提交规范

格式: `{type}({scope}): {message}`

| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug修复 |
| refactor | 重构 (无功能变更) |
| docs | 文档更新 |
| test | 测试 |
| style | 代码格式 |
| perf | 性能优化 |
| chore | 构建/工具 |
