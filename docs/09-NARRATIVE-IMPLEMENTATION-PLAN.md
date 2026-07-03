# **09 — 叙事系统实施计划**

> 版本：v1.0  
> 更新：2026-07-02  
> 锚定文档：`08-GARDEN-NARRATIVE.md` v2.0

---

## 架构原则

```text
narratives.js          = 唯一文本来源
narrativeUnlockEngine  = 唯一解锁逻辑
useAchievementStore    = 只存用户状态（解锁、阅读、日记条目）
UI 层                  = 通过 id 从 narratives.js 派生展示文本
```

---

## 任务清单

| 任务 | 文件 | 依赖 | 验收标准 |
|------|------|------|----------|
| T1 | `src/engine/narratives.js` | 无 | 8×4=32 段故事完整；工具函数可用；dev 校验通过 |
| T2 | `src/engine/narrativeUnlockEngine.js` | T1 | 所有 unlockKey 有对应规则；返回格式正确 |
| T3 | `src/stores/useAchievementStore.js` | T1 | 只存状态；ID 对齐文档；v1→v2 迁移不白屏 |
| T4 | `useGameStore.js` / `useStatsStore.js` | 无 | timeoutCount 字段存在；不影响现有逻辑 |
| T5 | `src/hooks/useGameEngine.js` | T2, T3, T4 | 结算时调用解锁引擎；recentUnlockQueue 正确填充 |
| T6 | `src/screens/FinishedScreen.jsx` | T3, T5 | 短卡片展示；展开故事；多解锁队列；跳过后不丢失 |
| T7 | `src/screens/AchievementsScreen.jsx` | T1, T3 | 四档品质；已读/未读；未解锁不露全文 |
| T8 | `GardenJournalPanel.jsx` + `StatsScreen.jsx` | T1, T3 | 碎片展示；时间倒序；点击可进入完整故事 |
| T9 | 全量 | T1-T8 | `npx vite build` 零错误；浏览器零报错；手动回归 checklist |

---

## 校验 checklist（每个任务完成后）

- [ ] `npx vite build` 零错误
- [ ] 新增变量在使用前定义
- [ ] 新增组件在文件顶部导入
- [ ] 无未声明变量引用
- [ ] 不引入 React Native 专用组件
- [ ] Zustand selector 不返回新对象
- [ ] 故事文本与 `08-GARDEN-NARRATIVE.md` 逐字一致
