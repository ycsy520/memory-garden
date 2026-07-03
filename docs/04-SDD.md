# 04 — 软件设计文档 (SDD)

> 版本: v5.0
> 更新: 2026-07-03
> 注: v5.0 重构后目录结构与 v2.0 规划有差异，以下为当前实际结构。
>     差异对照表见 §1.2。

---

## 1. 目录结构 (v5.0 实际结构)

```
src/
├── assets/                       # 静态资源目录 (v5.0 创建)
│   ├── fonts/                    # 字体文件 (待填充)
│   ├── sounds/                   # 音效资源 (待填充)
│   └── images/                   # 图片资源 (待填充)
│
├── components/                   # 共享UI组件
│   ├── basic/                    # 基础组件 (无业务逻辑) — 待建设
│   ├── game/                     # 游戏领域组件
│   │   └── StimulusStage.jsx    # 主舞台刺激展示 (v5.0)
│   ├── composite/                # 复合组件 — 待建设
│   ├── layouts/                  # [遗留] 旧布局组件，逐步迁移到 game/
│   │   ├── ClassicLayout.jsx    # [已迁移] → game/StimulusStage.jsx
│   │   ├── DualLayout.jsx       # [遗留, deprecated]
│   │   ├── SpatialLayout.jsx    # [遗留, deprecated]
│   │   └── GridLayout.jsx       # [遗留, deprecated]
│   ├── StimulusRenderer.jsx     # 刺激分发渲染
│   ├── GardenJournalPanel.jsx   # 花园日记面板 (v2.0)
│   ├── MandalaLoader.jsx        # 曼陀罗加载动画
│   ├── WarmupFlowerTimer.jsx    # 暖身花朵倒计时
│   └── ElapsedTimer.jsx         # 游戏已用时间显示
│
├── screens/                      # 页面级组件
│   ├── IntroScreen.jsx           # 首页 (v1.0)
│   ├── GuideScreen.jsx           # 引导页 (v1.0)
│   ├── MenuScreen.jsx            # 菜单页 — 三步引导式 (v8.0)
│   ├── GameScreen.jsx            # 游戏页 — 散步模式 (v5.0)
│   ├── FinishedScreen.jsx        # 结果页 — 花园叙事反馈 (v7.0)
│   ├── StatsScreen.jsx           # 统计页 (v1.1)
│   ├── AchievementsScreen.jsx    # 花园收藏页 (v2.0)
│   ├── LeaderboardScreen.jsx     # 排行榜 (v2.0)
│   ├── ModeGuideScreen.jsx       # 模式引导 (v2.0)
│   └── SettingsScreen.jsx        # 设置页 (v5.0 新增)
│
├── engine/                       # 游戏引擎 (纯逻辑，不依赖React)
│   ├── GameLoop.js              # rAF 帧级游戏循环 (v5.0)
│   ├── PhaseMachine.js          # 四阶段状态机 (v5.0)
│   ├── TrialGenerator.js        # Go-No-Go N-back 回合生成 (v5.0)
│   ├── ScoringEngine.js         # 评分引擎 (v5.0)
│   ├── SignalDetection.js       # SDT 信号检测论工具 (v3.0)
│   ├── narratives.js            # 叙事数据 — 唯一文本来源 (v2.0)
│   ├── narrativeUnlockEngine.js # 叙事解锁引擎 (v2.1)
│   ├── modes/
│   │   ├── BaseMode.js          # 模式基类 — v5.0 精简版
│   │   ├── WalkMode.js          # 散步模式 — Go-No-Go N-back (v5.0)
│   │   └── ModeFactory.js       # 模式工厂 — v5.0 精简版
│   └── stimuli/
│       ├── GardenStimuli.js     # 花园素材定义 (v5.0)
│       └── StimulusText.js      # 刺激提示文案 (v2.0)
│
├── factors/                      # 记忆因子插件
│   ├── FactorRegistry.js        # 因子注册中心
│   ├── types.js                 # 因子类型定义
│   ├── index.js                 # 因子注册入口
│   ├── visual/                  # 视觉因子
│   │   ├── EmojiFactor.js
│   │   ├── AnimalEmojiFactor.js
│   │   ├── FoodEmojiFactor.js
│   │   ├── TextEnFactor.js
│   │   ├── TextZhFactor.js
│   │   └── SymbolFactor.js
│   └── audio/                   # 音频因子
│       └── ToneFactor.js
│
├── stores/                       # Zustand状态管理
│   ├── useGameStore.js          # 游戏运行时 (内存)
│   ├── useStatsStore.js         # 统计 (localStorage)
│   ├── useSettingsStore.js      # 用户设置 (localStorage)
│   ├── useAchievementStore.js   # 花园收藏/叙事 (localStorage, v2.0)
│   └── useGardenStore.js        # 花园成长 (localStorage, v1.0)
│
├── services/                     # 基础服务 (纯逻辑，不依赖React)
│   ├── AudioService.js          # 音频服务 (Web Audio API)
│   ├── StorageService.js        # 分层存储 (localStorage + 内存降级)
│   ├── PlatformService.js       # 平台检测 (Web/Capacitor/PWA)
│   ├── ShareService.js          # 分享服务
│   ├── AnalyticsService.js      # 埋点统计
│   ├── LeaderboardService.js    # 排行榜
│   ├── DailyChallengeService.js # 每日挑战
│   ├── FeedbackService.js       # 玩家反馈闭环
│   └── EbbinghausService.js     # 艾宾浩斯复习提醒
│
├── hooks/                        # 自定义Hook
│   ├── useGameEngine.js         # 游戏引擎Hook (v5.0)
│   ├── useMatchInput.js         # 匹配输入防抖
│   ├── usePlatform.js           # 平台检测Hook
│   ├── usePWAInstall.js         # PWA安装提示
│   └── useVisibilityChange.js   # 页面可见性监听
│
├── i18n/                         # 国际化资源
│   ├── index.js                 # 初始化配置
│   ├── zh-CN.json               # 简体中文
│   ├── zh-TW.json               # 繁體中文
│   └── en-US.json               # 英文
│
├── styles/
│   ├── design-tokens.css        # 设计Token
│   ├── accessibility.css        # 无障碍样式
│   ├── animations.css           # 全局动画 (v5.0 从App.jsx提取)
│   └── mandala.css              # 曼陀罗加载样式
│
├── ErrorBoundary.jsx             # 全局错误边界
├── App.jsx                       # 应用入口 (路由+ErrorBoundary)
├── main.jsx                      # 渲染入口
└── index.css                     # Tailwind指令
---
│
├── engine/                       # 游戏引擎 (纯逻辑，不依赖React)
│   ├── GameEngine.ts             # 引擎核心
│   ├── GameEngine.test.ts        # 引擎测试
│   ├── modes/
│   │   ├── BaseMode.ts           # 模式基类 (接口+共享逻辑)
│   │   ├── StandardMode.ts       # 标准N-back
│   │   ├── DualMode.ts           # 双N-back (v2.0)
│   │   ├── SpatialMode.ts        # 空间N-back (v2.0)
│   │   └── GridMode.ts           # 栅格N-back (v2.0)
│   └── utils/
│       ├── factorGenerator.ts    # 因子生成算法
│       └── scoring.ts            # 评分算法 (含d-prime计算)
│
├── factors/                      # 记忆因子插件
│   ├── FactorRegistry.ts         # 因子注册中心
│   ├── types.ts                  # 因子类型定义
│   ├── visual/
│   │   ├── EmojiFactor.ts        # Emoji因子 (v1.0)
│   │   ├── ImageFactor.ts        # 图片因子 (v1.1)
│   │   ├── TextFactor.ts         # 文字因子 (v1.1)
│   │   └── SymbolFactor.ts       # 符号因子 (v1.1)
│   └── audio/
│       ├── ToneFactor.ts         # 音调因子 (v1.1)
│       └── WordFactor.ts         # 语音单词因子 (v1.1)
│
├── stores/                       # Zustand状态管理
│   ├── useGameStore.ts           # 游戏运行时 (内存)
│   ├── useUserStore.ts           # 用户偏好 (localStorage)
│   ├── useSettingsStore.ts       # 游戏设置 (localStorage)
│   └── useStatsStore.ts          # 统计 (IndexedDB)
│
├── services/                     # 基础服务 (纯逻辑，不依赖React)
│   ├── AudioService.ts           # 音频服务
│   ├── StorageService.ts         # 分层存储 (IDB+LS+内存降级)
│   ├── I18nService.ts            # 国际化初始化
│   ├── ShareService.ts           # 分享服务 (v1.2)
│   ├── PlatformService.ts        # 平台检测
│   └── AnalyticsService.ts       # 埋点抽象 (v2.0)
│
├── hooks/                        # 自定义Hook
│   ├── useGameEngine.ts
│   ├── useMatchInput.ts
│   ├── useAudio.ts
│   ├── usePlatform.ts
│   ├── useVisibilityChange.ts
│   ├── useReducedMotion.ts
│   └── useKeyboard.ts
│
├── i18n/                         # 国际化资源
│   ├── index.ts                  # 初始化配置
│   ├── zh-CN.json                # 简体中文
│   ├── zh-TW.json                # 繁體中文
│   └── en-US.json                # 英文
│
├── styles/
│   ├── design-tokens.css         # 设计Token (颜色/间距/字体/动画)
│   └── accessibility.css         # 无障碍样式
│
├── ErrorBoundary.tsx             # 全局错误边界
├── App.tsx                       # 应用入口 (路由+ErrorBoundary)
├── App.css                       # 应用级样式 (逐步迁移到Tailwind)
├── main.tsx                      # 渲染入口
└── index.css                     # Tailwind指令 (@tailwind base/components/utilities)
```

---

## 2. 组件清单

### 2.1 基础组件

| 组件 | 文件 | Props | 说明 |
|------|------|-------|------|
| Button | basic/Button.tsx | `variant`, `size`, `disabled`, `loading`, `onClick`, `children` | 统一按钮，自动适配触摸尺寸 |
| Card | basic/Card.tsx | `elevation`, `padding`, `children` | 统一卡片容器 |
| Progress | basic/Progress.tsx | `value`, `max`, `color`, `showLabel` | 进度条 |
| Typography | basic/Typography.tsx | `as`, `size`, `weight`, `color`, `children` | 语义化文字，强制使用Design Token |
| VisuallyHidden | basic/VisuallyHidden.tsx | `children` | sr-only辅助文字 |

### 2.2 游戏组件

| 组件 | 文件 | Props | 说明 |
|------|------|-------|------|
| StimulusCard | game/StimulusCard.tsx | `factor`, `isVisible`, `isMatched`, `isWrong` | 刺激展示卡片，支持不同因子类型 |
| MatchButton | game/MatchButton.tsx | `onClick`, `disabled`, `label` | 似曾相识按钮，含防抖 |
| GameHUD | game/GameHUD.tsx | `score`, `progress`, `mode`, `onPause`, `onBack` | 游戏抬头显示 |
| FeedbackBanner | game/FeedbackBanner.tsx | `type`, `visible`, `onDismiss` | 正确/错误反馈横幅 |
| PauseOverlay | game/PauseOverlay.tsx | `visible`, `onResume`, `onAbandon`, `elapsedSeconds` | 暂停遮罩层 |

### 2.3 复合组件

| 组件 | 文件 | Props | 说明 |
|------|------|-------|------|
| LevelSelector | composite/LevelSelector.tsx | `modes`, `selectedMode`, `onSelect` | 难度选择器 |
| StatsPanel | composite/StatsPanel.tsx | `modeId`, `stats` | 统计面板 |
| ShareCard | composite/ShareCard.tsx | `session`, `onClose` | 分享成绩卡片 |
| AchievementBadge | composite/AchievementBadge.tsx | `achievement`, `unlocked` | 成就徽章 |
| LanguageSwitcher | composite/LanguageSwitcher.tsx | `currentLang`, `onChange` | 语言切换按钮 |

---

## 3. 路由表

| 路径 | 页面组件 | 版本 | 说明 |
|------|----------|------|------|
| `/#/` | IntroScreen | v1.0 | 首页 |
| `/#/guide` | GuideScreen | v1.0 | 引导教程 |
| `/#/menu` | MenuScreen | v1.0 | 模式菜单 |
| `/#/game` | GameScreen | v1.0 | 游戏进行中 |
| `/#/finished` | FinishedScreen | v1.0 | 结果页 |
| `/#/stats` | StatsScreen | v1.1 | 统计面板 |
| `/#/settings` | SettingsScreen | v1.0 | 设置页 |
| `/#/achievements` | AchievementsScreen | v1.2 | 成就页 |

---

## 4. 接口契约

### 4.1 FactorPlugin 接口

```typescript
// src/factors/types.ts
interface Factor {
  id: string;          // 唯一标识
  type: string;        // 对应的因子插件ID
  value: unknown;      // 因子值 (不同插件类型不同)
  render(): ReactNode; // 渲染函数
}

interface FactorPluginConfig {
  id: string;
  name: string;
  type: 'visual' | 'audio' | 'mixed';
  pool: unknown[];
  render: (factor: Factor) => ReactNode;
  compare: (a: Factor, b: Factor) => boolean;
  generate: () => Factor;
}
```

### 4.2 GameMode 接口

```typescript
// src/engine/modes/BaseMode.ts
interface GameModeConfig {
  id: string;
  name: string;
  description: string;
  n: number;
  speed: number;
  totalTurns: number;
  factors: string[];  // 使用的因子插件ID列表
}

interface TurnResult {
  factor: Factor;
  isTarget: boolean;
  turnIndex: number;
}

interface AnswerResult {
  isCorrect: boolean;
  score: number;
  feedback: 'correct' | 'wrong' | 'missed';
  reactionTime: number;
}

abstract class BaseGameMode {
  abstract id: string;
  abstract name: string;
  abstract config: GameModeConfig;
  
  abstract initialize(history: Factor[]): TurnResult;
  abstract nextTurn(history: Factor[], turnIndex: number): TurnResult;
  abstract checkAnswer(history: Factor[], answer: boolean): AnswerResult;
  abstract isWarmup(turnIndex: number): boolean;
}
```

### 4.3 GameEngine 接口

```typescript
// src/engine/GameEngine.ts
type EngineEvent = 'turn' | 'feedback' | 'pause' | 'resume' | 'abandon' | 'finish';

class GameEngine {
  constructor(mode: BaseGameMode);
  
  // 生命周期
  start(): void;
  pause(): void;
  resume(): void;
  abandon(): void;
  
  // 游戏逻辑
  nextTurn(): TurnResult;
  submitAnswer(answer: boolean): AnswerResult;
  
  // 状态查询
  getStatus(): 'idle' | 'active' | 'paused' | 'finished' | 'abandoned';
  getProgress(): { current: number; total: number };
  
  // 事件系统
  on(event: EngineEvent, handler: Function): void;
  off(event: EngineEvent, handler: Function): void;
}
```

### 4.4 GameSession 接口

```typescript
// src/stores/useStatsStore.ts
interface GameSession {
  id: string;
  modeId: string;
  difficulty: number;
  factorId: string;
  score: number;
  totalTurns: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;
  avgReactionTime: number;
  startedAt: string;
  endedAt: string;
  duration: number;
}
```

---

## 5. 编码规范

### 5.1 文件名

- 组件: `PascalCase.tsx` (如 `GameScreen.tsx`)
- Hook: `camelCase.ts` (如 `useGameEngine.ts`)
- Service: `PascalCase.ts` (如 `AudioService.ts`)
- Store: `use` + `PascalCase` + `Store.ts` (如 `useGameStore.ts`)
- 测试: 同源文件 + `.test.ts(x)` (如 `GameEngine.test.ts`)
- 类型定义: `types.ts` 或 `types.d.ts`

### 5.2 组件结构

```tsx
// 标准组件模板
// [组件名称] — [一句话描述]

import React from 'react';
// 外部依赖
import { Something } from 'third-party';
// 内部模块
import { useSomething } from '@/hooks/useSomething';
import { SomeService } from '@/services/SomeService';

// Props 类型
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// 默认Props
const defaultProps: Partial<MyComponentProps> = {};

export function MyComponent(props: MyComponentProps) {
  const { title, onAction } = { ...defaultProps, ...props };
  
  // Hooks 区
  const { data } = useSomething();
  
  // 事件处理
  const handleClick = () => {
    onAction();
  };
  
  // 渲染
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

### 5.3 注释规范

- 所有导出的函数、类、接口必须有 JSDoc 注释
- 函数级注释用中文，描述"做什么"而非"怎么做"
- 复杂算法需内联注释，用中文

```typescript
/**
 * 根据玩家的近期准确率自动调整N-back难度
 * 
 * @param recentAccuracy - 最近5局的准确率数组 [0..1]
 * @param currentN - 当前难度级别
 * @param config - 调整阈值配置
 * @returns 新的难度级别
 */
function adaptiveDifficulty(
  recentAccuracy: number[],
  currentN: number,
  config: DifficultyConfig
): number {
  // 取最近5局的滑动窗口平均
  const avg = recentAccuracy.slice(-5)
    .reduce((s, a) => s + a, 0) / recentAccuracy.length;
  
  // 高于85%升难度，低于50%降难度
  if (avg > config.increaseThreshold && currentN < config.maxN) {
    return currentN + 1;
  }
  if (avg < config.decreaseThreshold && currentN > config.minN) {
    return currentN - 1;
  }
  return currentN;
}
```

### 5.4 样式规范

- 优先使用Tailwind类名
- 必须使用Design Token而非硬编码颜色值
- 禁止在组件中写 `<style>` 标签（全局样式放 `styles/` 目录）
- 复杂动画用 `@keyframes` 定义在 `styles/` 或 Tailwind config

```tsx
// ✅ 正确
<button className="bg-[var(--color-brand)] text-[var(--color-text-primary)]">
  {label}
</button>

// ❌ 错误
<button style={{ background: '#8FA895', color: '#3D352C' }}>
  {label}
</button>
```

---

## 6. 测试规范

### 6.1 测试文件组织

```
src/
├── engine/
│   ├── GameEngine.ts
│   └── GameEngine.test.ts       # 同目录测试
├── stores/
│   ├── useGameStore.ts
│   └── useGameStore.test.ts
└── __tests__/                   # 集成测试
    └── game-flow.test.ts
```

### 6.2 测试命名

```
describe('[模块名]', () => {
  describe('[函数/方法名]', () => {
    it('应该[预期行为] 当 [条件]', () => {
      // ...
    });
  });
});
```

### 6.3 必须测试的场景

- 正常流程 (Happy Path)
- 边界条件 (空值、极限值、0、undefined)
- 错误状态 (网络断开、存储满)
- 用户异常操作 (快速连点、中途退出)
