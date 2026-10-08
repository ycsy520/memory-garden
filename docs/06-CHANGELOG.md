# 06 — 版本迭代日志 (CHANGELOG)

> 版本: v5.2
> 更新: 2026-07-08
> 格式: Keep a Changelog (<https://keepachangelog.com/zh-CN/1.0.0/>)

---

## [v5.2.0] — 2026-07-08 (后端集成 P0 — Supabase 云端同步)

### Added

- **Supabase 客户端集成**: `@supabase/supabase-js` SDK 接入，单例初始化
- **匿名登录**: 应用启动时自动创建匿名账户，无需用户操作
- **邮箱 OTP 登录**: 设置页输入邮箱 → 收到验证链接 → 点击完成登录
- **云端同步服务 (SyncService)**: 游戏结束时自动上传 session + 花园状态
- **离线队列**: 网络不可用时暂存数据，联网后自动批量上传
- **叙事解锁同步**: 叙事收藏品解锁时上传到 `narrative_unlocks` 表
- **日记碎片同步**: 花园日记新增时上传到 `diary_entries` 表
- **设置页账号卡片**: 游客模式显示登录入口，已登录显示同步状态
- **账户注销**: Edge Function `delete-account` 级联删除云端数据
- **免责声明**: 设置页底部展示合规声明
- **数据库迁移**: profiles 表扩展花园字段 + RLS 策略禁止匿名写入
- **文档**: 后端 PRD + 技术架构文档 (`.trae/documents/`)

### Changed

- **App.jsx**: 启动时初始化 AuthService + SyncService
- **useGameEngine.js**: handleGameEnd 结束后触发云端同步
- **useAchievementStore.js**: applyUnlocks / markDiaryFragmentRead 触发同步
- **SettingsScreen.jsx**: 新增账号状态卡片 + 邮箱登录 + 注销流程
- **i18n**: zh-CN / en-US / zh-TW 新增 15 个 settings 账号相关翻译 key

### Architecture

- **本地优先**: 所有数据先写 localStorage，同步在后台异步执行
- **登录才同步**: 匿名用户不触发任何云端操作
- **离线可用**: 网络不可用时写入离线队列，联网后自动 flush
- **不阻塞 UI**: 所有 Supabase 调用都是 fire-and-forget

---

## [v5.1.0] — 2026-07-04 (响应式布局 + UI动效)

### Added

- **响应式布局**: 手机全宽/平板全宽/PC限宽三级容器策略
- **Safe Area**: PWA模式刘海/Home Indicator自动适配
- **横屏锁定**: 手机横屏显示"请竖起手机"提示并暂停游戏
- **iPad横屏分栏**: GameScreen横屏时刺激区+按钮区左右分栏
- **Double-Bezel**: StimulusStage卡片嵌套架构（外壳+内核）
- **渐显渐隐**: 所有刺激项使用opacity过渡替代条件渲染
- **页面切换动画**: AnimatedRoutes路由切换淡入动画
- **按钮光晕**: MenuScreen"开始散步"按钮glow-pulse动画
- **触摸反馈**: 统一active:scale-[0.97]按钮回弹效果
- **滚动优化**: 所有列表页添加overscroll-contain
- **useMediaQuery Hook**: 媒体查询响应式检测
- **useOrientationGuard Hook**: 手机横屏锁定检测
- **文档**: 新增10-RESPONSIVE.md响应式设计文档

### Changed

- **容器宽度**: `max-w-lg` → `sm:max-w-none xl:max-w-6xl`（平板全宽）
- **刺激卡片**: StimulusStage添加lg:断点响应式尺寸
- **按钮区**: GameScreen按钮容器响应式宽度+横屏垂直排列
- **统计卡片**: StatsScreen grid-cols-2 → sm:grid-cols-4
- **花园收藏**: StatsScreen grid-cols-4 → sm:grid-cols-6 lg:grid-cols-8
- **动画曲线**: 统一使用cubic-bezier(0.32,0.72,0,1)
- **废弃因子清理**: 删除TextZhFactor、TextEnFactor、SymbolFactor

### Fixed

- **DualMode双通道目标不对齐**: 重写_ensureSequences共享统一目标索引
- **warmup轮数bug**: warmup从n+1改为n
- **限时模式倒计时失效**: 旧版引擎路径添加倒计时逻辑
- **跳过刺激不计入统计**: recordNoResponse分类+syncModeResult同步
- **一局解锁多个花园收集**: 统一候选队列+每局只取1个

### Removed

- 废弃因子: TextZhFactor.js、TextEnFactor.js、SymbolFactor.js
- 废弃文档: 09-NARRATIVE-IMPLEMENTATION-PLAN.md（已完成）

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
