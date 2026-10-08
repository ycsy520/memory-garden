# Memory Garden

Multi-language README: [简体中文](#简体中文) | [English](#english) | [繁體中文](#繁體中文)

---

## 简体中文

Memory Garden 是一个以花园叙事包装的轻量记忆训练项目，核心训练机制基于 N-back / Go-No-Go 工作记忆任务。它面向希望进行日常注意力与工作记忆练习的用户，强调温和、低压力、可持续的训练体验。

### 项目特点

- 三步式训练配置：选择记忆模式、训练节奏、难度档位
- 回归用户快速开始：首页一键继续训练
- 多种训练模式：`walk`、`dual`、`spatial`、`grid`
- 多种训练节奏：`walk`、`daily`、`challenge`、`timed`
- 花园成长反馈：花园日记、花园收藏、排行榜、结算反馈
- 多语言支持：简体中文、繁體中文、English
- 支持 Web / PWA，并保留 Capacitor 移动端打包能力

### 技术栈

- React 19
- Vite 7
- Zustand
- React Router
- i18next / react-i18next
- Tailwind CSS
- Vitest
- Capacitor

### 本地启动

```bash
npm install
npm run dev
```

默认开发地址通常为 `http://localhost:5173`。

### 常用命令

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:coverage
```

### 移动端相关命令

```bash
npm run build:capacitor
npm run build:android
npm run build:ios
```

### 项目结构

```text
src/
  components/   # 复用组件与视觉部件
  engine/       # 训练逻辑、评分、刺激生成
  hooks/        # 交互与状态辅助 hooks
  i18n/         # 多语言文本
  screens/      # 页面级界面
  services/     # 音频、分享、排行榜等服务
  stores/       # Zustand 状态管理
  styles/       # 设计令牌与动画样式
public/         # 静态资源
docs/           # 项目文档
```

### 适用说明

- 这是一个认知训练产品，不是医疗工具
- 不能替代专业诊断、治疗或康复建议
- 更适合作为日常训练、陪伴式练习或产品原型基础

### 当前状态

当前仓库已包含首页快速开始、训练流程、训练结算、花园日记、花园收藏、多语言与基础 PWA 能力，适合继续做产品化迭代。

---

## English

Memory Garden is a narrative-driven memory training project built around a garden metaphor. Its core gameplay is based on N-back / Go-No-Go working-memory practice, with a calm and low-pressure experience designed for everyday cognitive training.

### Highlights

- Three-step training setup: mode, pace, and difficulty
- Quick start for returning users
- Multiple training modes: `walk`, `dual`, `spatial`, `grid`
- Multiple pace presets: `walk`, `daily`, `challenge`, `timed`
- Garden-based feedback loop: diary, collection, leaderboard, session summary
- Built-in localization: Simplified Chinese, Traditional Chinese, English
- Web / PWA ready, with Capacitor support for mobile packaging

### Tech Stack

- React 19
- Vite 7
- Zustand
- React Router
- i18next / react-i18next
- Tailwind CSS
- Vitest
- Capacitor

### Getting Started

```bash
npm install
npm run dev
```

The default local dev server is usually available at `http://localhost:5173`.

### Useful Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:coverage
```

### Mobile Build Commands

```bash
npm run build:capacitor
npm run build:android
npm run build:ios
```

### Project Structure

```text
src/
  components/   # Reusable UI pieces and visual components
  engine/       # Core training logic, scoring, stimulus generation
  hooks/        # Interaction and state helper hooks
  i18n/         # Localization resources
  screens/      # Route-level screens
  services/     # Audio, sharing, leaderboard, and external services
  stores/       # Zustand state stores
  styles/       # Design tokens and animations
public/         # Static assets
docs/           # Project documentation
```

### Notes

- This project is a cognitive training product, not a medical device
- It does not replace diagnosis, treatment, or professional rehabilitation advice
- It is best suited for daily training, guided practice, or as a product foundation for further development

### Current Status

The repository already includes the quick-start home flow, playable training loop, session summary, garden diary, garden collection, localization, and basic PWA support.

---

## 繁體中文

Memory Garden 是一個以花園敘事為核心包裝的輕量記憶訓練專案，主要訓練機制基於 N-back / Go-No-Go 工作記憶任務。整體體驗偏溫和、低壓力，適合日常練習與持續使用。

### 專案特色

- 三步式訓練設定：選擇記憶模式、訓練節奏、難度檔位
- 回訪使用者可快速開始
- 多種訓練模式：`walk`、`dual`、`spatial`、`grid`
- 多種訓練節奏：`walk`、`daily`、`challenge`、`timed`
- 花園成長回饋：花園日記、花園收藏、排行榜、結算回饋
- 多語系支援：簡體中文、繁體中文、English
- 支援 Web / PWA，並保留 Capacitor 行動端封裝能力

### 技術棧

- React 19
- Vite 7
- Zustand
- React Router
- i18next / react-i18next
- Tailwind CSS
- Vitest
- Capacitor

### 本地啟動

```bash
npm install
npm run dev
```

預設本地開發位址通常為 `http://localhost:5173`。

### 常用指令

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:coverage
```

### 行動端相關指令

```bash
npm run build:capacitor
npm run build:android
npm run build:ios
```

### 專案結構

```text
src/
  components/   # 可重用元件與視覺部件
  engine/       # 訓練邏輯、評分、刺激生成
  hooks/        # 互動與狀態輔助 hooks
  i18n/         # 多語系文字
  screens/      # 頁面層級畫面
  services/     # 音效、分享、排行榜等服務
  stores/       # Zustand 狀態管理
  styles/       # 設計令牌與動畫樣式
public/         # 靜態資源
docs/           # 專案文件
```

### 使用說明

- 這是一個認知訓練產品，不是醫療工具
- 不能取代專業診斷、治療或復健建議
- 更適合作為日常訓練、陪伴式練習或產品原型基礎

### 目前狀態

目前倉庫已包含首頁快速開始、完整訓練流程、結算頁、花園日記、花園收藏、多語系與基礎 PWA 能力，適合繼續做產品化迭代。
