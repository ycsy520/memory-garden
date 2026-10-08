# 10 — 响应式设计文档 (RESPONSIVE)

> 版本: v1.1
> 更新: 2026-07-14
> 状态: 已实施
> 定位: 多端适配策略、断点定义、Safe Area、横屏锁定的唯一权威依据

---

## 1. 设计目标

### 1.1 核心原则

- **移动优先**: 手机端体验是第一优先级，平板和PC渐进增强
- **系统优先**: 页面响应式基于统一页面壳，而不是每个页面单独定义容器
- **重排优先**: 响应式不是简单缩放，而是按页面类型进行内容重排
- **桌面统一版心**: PC端使用统一 `1440px` 版心，避免不同页面限宽不一致
- **横屏锁定**: 手机横屏强制提示竖屏，平板与桌面按页面骨架正常展开

### 1.2 设备分类

| 类型 | 宽度范围 | 栅格思维 | 布局策略 |
|------|----------|----------|----------|
| 手机 | <640px | 4 列 | 近满宽，上下堆叠 |
| 平板 | 640-1023px | 8 列 | 全宽 + 固定内边距 |
| 桌面 | ≥1024px | 12 列 | 统一版心 1440px |

---

## 2. 断点策略

### 2.1 Tailwind 断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| 默认 | <640px | 手机竖屏 |
| `sm:` | ≥640px | 平板竖屏与小横屏设备 |
| `lg:` | ≥1024px | 平板横屏 / 桌面起点 |
| `xl:` | ≥1280px | 宽屏桌面扩展 |

### 2.2 容器宽度

```jsx
// App.jsx 路由容器
<div className="relative z-10 h-full px-4 sm:px-6 lg:px-8">
  <div className="mx-auto h-full w-full ..."
       style={{ maxWidth: 'var(--layout-max-width)' }}>
  </div>
</div>
```

**效果**:

| 设备 | 宽度 | 容器宽度 | 两侧留白 |
|------|------|----------|----------|
| iPhone SE | 375px | 343px | 16px/侧 |
| iPhone 15 Pro | 393px | 361px | 16px/侧 |
| iPad mini 竖屏 | 768px | 720px | 24px/侧 |
| iPad Air 竖屏 | 820px | 772px | 24px/侧 |
| iPad Pro 横屏 | 1024px | 960px | 32px/侧 |
| PC 笔记本 | 1440px | 1376px | 32px/侧 |
| 宽屏桌面 | 1680px | 1440px | 自动居中 |

### 2.3 页面分类骨架

| 页面类型 | 典型页面 | 手机 | 平板 | 桌面 |
|----------|----------|------|------|------|
| 沉浸式 | Menu / Game / Finished | 单列堆叠 | 8 列重排 | 12 列主骨架 |
| 数据页 | Stats / Achievements / Leaderboard | 单列流 | 中轴内容列 | `1 / 10 / 1` |
| 阅读页 | Guide / ModeGuide / About | 单列阅读 | 收窄正文 | `2 / 8 / 2` 或 `3 / 6 / 3` |

---

## 3. Safe Area 适配

### 3.1 CSS 变量

```css
/* design-tokens.css */
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}
```

### 3.2 PWA 模式检测

```jsx
// App.jsx
function useStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

// 应用 Safe Area
<div style={{
  paddingTop: isStandalone ? 'var(--safe-area-top)' : '0',
  paddingBottom: isStandalone ? 'var(--safe-area-bottom)' : '0',
}}>
```

### 3.3 覆盖场景

| 场景 | 处理方式 |
|------|----------|
| PWA 独立模式 | `env(safe-area-inset-*)` 自动适配刘海/Home Indicator |
| Safari 浏览器 | 使用 `h-[100dvh]` 处理地址栏收起/展开 |
| 安卓 Chrome | `env()` 降级为 0px，无副作用 |

---

## 4. 横屏处理

### 4.1 手机横屏锁定

**策略**: 手机（宽度 <640px）在横屏时显示全屏提示，强制竖屏

**实现**:

```jsx
// hooks/useOrientationGuard.js
const isLandscape = window.matchMedia('(orientation: landscape)').matches;
const isMobileWidth = window.matchMedia('(max-width: 639px)').matches;
return isLandscape && isMobileWidth;
```

**UI**:

```
┌─────────────────────────────────┐
│                                 │
│        ↻ 旋转图标（缓慢旋转）     │
│                                 │
│     请竖起手机继续散步            │
│                                 │
└─────────────────────────────────┘
```

- 背景：`bg-stone-100/95 backdrop-blur-sm`
- 图标：Lucide `RotateCw`，`animate-spin` 3秒一圈
- 文字：`text-lg font-light text-stone-500`
- z-index: 50（覆盖游戏内容）

### 4.2 平板横屏与桌面布局

**策略**: 平板横屏与桌面不再默认使用“固定右侧工具栏”，而是按页面类型进入统一骨架。

**实现**:

```jsx
// GameScreen.jsx
const isLandscape = useMediaQuery('(orientation: landscape)');
const isTabletOrLarger = useMediaQuery('(min-width: 640px)');
const useLandscapeLayout = isLandscape && isTabletOrLarger;
```

**布局**:

```
┌────────────────────────────────────────────────────────────┐
│  统一页面壳（桌面 12 列 / 平板 8 列）                        │
├────┬──────────────────┬────┬──────────────┬────┤
│留白│     主内容区      │沟槽│  操作/辅助区  │留白│
│ 1  │        6         │ 1  │      3       │ 1  │
└────┴──────────────────┴────┴──────────────┴────┘
```

### 4.3 边界情况

| 场景 | 处理 |
|------|------|
| 游戏中手机横屏 | 显示锁定遮罩，暂停游戏 |
| 菜单页手机横屏 | 当前保持可用，按普通页面壳正常展示 |
| 结果页手机横屏 | 当前保持可用，按普通页面壳正常展示 |
| iPad 横屏 | 按页面类型进入统一 8/12 列骨架 |
| PC 浏览器缩小窗口 | 不触发（非移动设备） |
| 安卓 WebView 横屏 | 兼容（额外监听 resize 事件） |

---

## 5. 组件响应式规范

### 5.1 刺激区

| 组件 | 手机 | 平板 | iPad横屏 |
|------|------|------|----------|
| StimulusStage 卡片 | w-56 h-72 | w-64 h-80 | w-80 h-96 |
| 刺激 emoji | text-8xl | text-9xl | text-[10rem] |
| DualLayout 视觉区 | w-40 h-40 | w-48 h-48 | w-56 h-56 |
| GridLayout 容器 | max-w-xs | max-w-sm | max-w-md |
| SpatialLayout 容器 | max-w-xs | max-w-sm | max-w-md |

### 5.2 按钮区

| 属性 | 手机 | 平板 | iPad横屏 |
|------|------|------|----------|
| 容器宽度 | max-w-md | max-w-lg | max-w-xl |
| 按钮内边距 | py-5 | py-6 | py-7 |
| 按钮字号 | text-lg | text-xl | text-2xl |
| 最小高度 | 56px | 64px | 72px |
| 横屏排列 | 水平 | 水平 | 垂直 |

### 5.3 列表页面

| 页面 | 手机 | 平板 |
|------|------|------|
| StatsScreen 统计卡片 | 2列 | 4列 |
| StatsScreen 花园收藏 | 4列 | 6-8列 |
| AchievementsScreen 间距 | space-y-3 | space-y-4 |

### 5.4 滚动容器

所有可滚动区域添加 `overscroll-contain`，防止滚动边界穿透：

- StatsScreen
- AchievementsScreen
- LeaderboardScreen
- SettingsScreen

---

## 6. 触摸反馈规范

### 6.1 Token 定义

```css
/* design-tokens.css */
:root {
  --touch-min-size: 44px;
  --touch-feedback-scale: 0.97;
  --touch-feedback-duration: 100ms;
}
```

### 6.2 按钮触摸反馈

```jsx
<button className="transition-transform duration-100 
                    ease-[cubic-bezier(0.32,0.72,0,1)]
                    active:scale-[0.97]
                    min-h-[var(--touch-min-size)]">
```

### 6.3 合规检查

所有可点击元素必须满足：
- 最小尺寸 ≥ 44px × 44px
- 有 `touch-action: manipulation`（禁用双击缩放）
- 有 `active:scale-[0.97]` 触摸反馈

---

## 7. 动画性能

### 7.1 GPU 安全属性

仅使用 `transform` 和 `opacity` 进行动画，禁止动画 `width`、`height`、`top`、`left`。

### 7.2 过渡曲线

```css
/* 统一使用 */
ease-[cubic-bezier(0.32,0.72,0,1)]
```

### 7.3 减弱动画

```css
/* accessibility.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. 测试矩阵

| 设备 | 尺寸 | 测试重点 |
|------|------|----------|
| iPhone SE | 375×667 | 最小手机，按钮不溢出 |
| iPhone 15 Pro | 393×852 | 主流手机，布局正常 |
| iPhone 15 Pro Max | 430×932 | 大手机，留白均匀 |
| iPad mini 竖屏 | 768×1024 | 全宽布局，内容充实 |
| iPad Air 竖屏 | 820×1180 | 全宽布局，统计卡片4列 |
| iPad Pro 11" 横屏 | 1194×834 | 左右分栏，刺激区不溢出 |
| iPad Pro 12.9" 横屏 | 1366×1024 | 左右分栏，充分利用空间 |
| PC 笔记本 | 1440×900 | 限宽1440px，留白均匀 |
| PC 桌面 | 1920×1080 | 限宽1440px，内容居中 |

---

## 9. 关联文件

| 文件 | 用途 |
|------|------|
| `src/App.jsx` | 全局容器、Safe Area、PWA检测 |
| `src/hooks/useMediaQuery.js` | 媒体查询 Hook |
| `src/hooks/useOrientationGuard.js` | 手机横屏锁定 Hook |
| `src/screens/GameScreen.jsx` | 横屏分栏布局 |
| `src/styles/design-tokens.css` | Safe Area 变量、触摸反馈 Token |
| `src/styles/accessibility.css` | 减弱动画支持 |
