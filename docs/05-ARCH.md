# 05 — 架构约束文档 (ARCH)

> 版本: v2.0
> 更新: 2026-06-26
> 用途: Code Review 和架构决策的唯一依据
> 规则: 本文档中的所有约束均为强制要求，违反即拒绝合并

---

## 1. 设计原则 (五大铁律)

### P1: 永远可玩
>
> 任何情况下核心游戏不崩溃、不白屏

**要求**:

- 根组件必须包裹 `<ErrorBoundary>`
- 所有 `try-catch` 必须有降级UI，不能空catch
- `localStorage` / `IndexedDB` 操作必须有降级方案
- 定时器必须在 `useEffect` cleanup中清除

### P2: 老年友好
>
> 所有交互满足 WCAG 2.1 AA 标准

**要求**:

- 所有可点击元素最小尺寸 ≥ 44px × 44px
- 正文最小字号 ≥ 16px (clamp最小值)
- 文本对比度 ≥ 4.5:1 (使用 Design Token，禁止硬编码颜色)
- 所有交互元素有 focus-visible 样式
- 所有非装饰性图片有 alt 文本
- 支持 prefers-reduced-motion

### P3: 渐进增强
>
> 基础功能离线可用，高级功能在线增量

**要求**:

- 核心游戏逻辑不依赖网络
- 存储操作必须先检测可用性，不可用则降级
- 新功能必须有功能开关 (feature flag)
- PWA 离线时核心功能必须可用

### P4: 数据安全
>
> 用户数据永远不丢，跨版本兼容迁移

**要求**:

- 所有数据迁移必须向后兼容
- 旧数据格式保留7天保护期 (不删除)
- 提供数据导出功能 (JSON格式)
- 数据模型变更必须递增版本号

### P5: 可扩展
>
> 新因子、新模式、新语言无需改核心代码

**要求**:

- 记忆因子通过 FactorRegistry 注册，不硬编码
- 游戏模式通过 BaseGameMode 继承，引擎不感知具体模式
- 语言资源通过 i18n JSON 文件添加，不修改组件代码
- 配置文件允许覆盖 (默认配置 → 环境配置 → 用户配置)

---

## 2. 目录约束

### 2.1 强制目录结构

```
src/
├── components/     # ✅ UI组件 (仅展示层)
├── screens/        # ✅ 页面组件 (路由绑定)
├── engine/         # ✅ 游戏逻辑 (纯函数，禁止JSX)
├── factors/        # ✅ 因子插件
├── stores/         # ✅ 状态管理
├── services/       # ✅ 基础服务
├── hooks/          # ✅ 适配Hook
├── i18n/           # ✅ 翻译资源
└── styles/         # ✅ 全局样式 + Design Token
```

### 2.2 禁止的目录

```
src/
├── utils/          # ❌ 合并到 engine/utils/ 或 services/
├── pages/          # ❌ 使用 screens/
├── layouts/        # ❌ 合并到 components/basic/
├── constants/      # ❌ 就近定义，不放独立文件
├── types/          # ❌ 类型定义与模块同文件或同目录 types.ts
└── helpers/        # ❌ 合并到对应 engine/ 或 services/
```

---

## 3. 依赖约束

### 3.1 允许的依赖方向

```
screens → hooks → stores ← engine
  ↓        ↓        ↓
components    services → 第三方库
```

### 3.2 明确禁止的依赖

| 从 | 禁止依赖 | 原因 |
|----|----------|------|
| engine/ | React, JSX, useState, useEffect | 保持纯逻辑，可单元测试 |
| services/ | React, JSX, hooks/ | 保持纯服务，可脱离React使用 |
| factors/ | React (除render函数外) | 核心逻辑不依赖UI |
| components/basic/ | stores/, screens/, engine/ | 基础组件不应有业务耦合 |
| stores/ | components/, screens/ | Store不应知道UI存在 |

### 3.3 import路径别名

```typescript
// tsconfig.json paths
{
  "@/*":       ["./src/*"],
  "@components/*": ["./src/components/*"],
  "@screens/*":    ["./src/screens/*"],
  "@engine/*":     ["./src/engine/*"],
  "@factors/*":    ["./src/factors/*"],
  "@stores/*":     ["./src/stores/*"],
  "@services/*":   ["./src/services/*"],
  "@hooks/*":      ["./src/hooks/*"],
  "@i18n/*":       ["./src/i18n/*"],
  "@styles/*":     ["./src/styles/*"]
}

// 使用
import { GameEngine } from '@engine/GameEngine';
import { useGameStore } from '@stores/useGameStore';
```

### 3.4 禁止的import

```typescript
// ❌ 禁止: 相对路径回溯超过2层
import { something } from '../../../utils/thing';

// ❌ 禁止: 跨层级直接引用
// screens/GameScreen.tsx
import { AudioService } from '../services/AudioService'; // 应通过 hook

// ❌ 禁止: 循环依赖
// A.ts → B.ts → A.ts
```

---

## 4. 函数约束

### 4.1 函数长度

```
maxLinesPerFunction = 60
```

超过60行的函数必须拆分。以下类型除外:

- React组件中纯JSX的render部分
- 翻译对象定义
- switch/case 大量分支 (应重构为查找表)

### 4.2 参数数量

```
maxParams = 4
```

超过4个参数必须使用对象参数:

```typescript
// ❌ 错误
function startGame(mode, level, speed, turns, factorId, callback) {}

// ✅ 正确
function startGame(config: GameConfig) {}
```

### 4.3 注意复杂度

- 禁止嵌套三元表达式
- 禁止超过3层的 if-else 嵌套
- 禁止在 useEffect 中执行无依赖的副作用

---

## 5. 错误处理约束

### 5.1 必须处理

| 场景 | 处理方式 |
|------|----------|
| localStorage 不可用 | 降级到内存存储 |
| IndexedDB 不可用 | 降级到 localStorage |
| AudioContext 创建失败 | 静默，关闭音频功能 |
| 定时器异常 | 捕获 + 清理 + 恢复 |
| JSON.parse 失败 | 返回默认值 + console.warn |
| 网络请求失败 | 显示错误提示 + 重试按钮 |
| React渲染错误 | ErrorBoundary 捕获 |

### 5.2 禁止的错误处理

```typescript
// ❌ 禁止: 空的catch块
try { something(); } catch(e) {}

// ❌ 禁止: 仅console.error
try { something(); } catch(e) { console.error(e); }

// ✅ 正确: 降级 + 日志 + 可选上报
try {
  return JSON.parse(data);
} catch (e) {
  console.warn('[StorageService] 解析失败，使用默认值', e);
  return defaultValue;
}
```

---

## 6. 状态约束

### 6.1 Zustand Store规则

- 每个Store必须有明确的持久化策略注释
- 运行时状态不持久化 (GameStore)
- 持久化Store的 key 必须有统一前缀 `memory-garden:`
- Store的action不能包含副作用 (fetch/定时器等→放hook)

### 6.2 useState使用限制

```
maxUseStatePerComponent = 5
```

超过5个useState的组件考虑:

- 提取为自定义Hook
- 合并到Zustand Store
- 使用useReducer

---

## 7. 样式约束

### 7.1 强制Design Token

所有颜色、字号、间距必须使用CSS变量（Design Token），禁止硬编码:

```css
/* ❌ 禁止 */
.button { color: #8FA895; font-size: 16px; padding: 8px; }

/* ✅ 正确 */
.button {
  color: var(--color-brand);
  font-size: var(--font-size-base);
  padding: var(--space-sm);
}
```

### 7.2 禁止的样式写法

```tsx
// ❌ 禁止: 内联style对象
<div style={{ color: 'red', fontSize: '20px' }}>

// ❌ 禁止: 组件内 <style> 标签 (全局污染)
<style>{'.my-class { color: red; }'}</style>

// ✅ 正确: Tailwind类名 + Design Token
<div className="text-[var(--color-error)] text-[var(--font-size-lg)]">
```

---

## 8. Code Review 检查清单

以下检查项每一项都必须通过:

### 架构检查

- [ ] 文件位于正确的目录下
- [ ] 无禁止的跨层依赖
- [ ] 无循环依赖
- [ ] 无超过2层的相对路径import

### 函数检查

- [ ] 函数不超过60行
- [ ] 参数不超过4个
- [ ] 无嵌套三元表达式
- [ ] 无超过3层嵌套if-else

### 错误处理

- [ ] try-catch有降级处理
- [ ] 定时器在cleanup中清除
- [ ] 无空catch块

### 样式检查

- [ ] 无硬编码颜色值
- [ ] 无组件内style标签
- [ ] 使用Design Token变量

### 可访问性

- [ ] 可点击元素 ≥ 44px
- [ ] 有focus-visible样式
- [ ] 图片有alt文本
- [ ] 支持prefers-reduced-motion

### 测试

- [ ] engine/和services/中的纯函数有测试
- [ ] 关键用户流程有集成测试 (v1.2+)
