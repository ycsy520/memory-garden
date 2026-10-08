# 14 — 风险修复执行清单 (RISK REMEDIATION TASKS)

> 版本: v1.0
> 更新: 2026-07-15
> 状态: 待执行
> 依赖蓝图: [13-RISK-REMEDIATION-BLUEPRINT.md](./13-RISK-REMEDIATION-BLUEPRINT.md)

---

## 1. 目标

将 `13-RISK-REMEDIATION-BLUEPRINT.md` 中定义的 P0 / P1 风险修复蓝图拆解为可执行、可验收、可逐步回归的任务清单。

原则：

1. 先切断真实风险，再修数据闭环。
2. 先做最小收口，再做结构升级。
3. 每个阶段都必须具备独立验证与回滚能力。

---

## 2. 总体执行顺序

```text
T0 文档与样本止血
  ↓
T1 账户删除与数据清理一致性
  ↓
T2 云同步闭环与稳定主键
  ↓
T3 首包压缩与路由拆包
  ↓
T4 GameScreen 渲染热点治理
  ↓
T5 存储与版本协议升级
  ↓
T6 全链路回归与文档对齐
```

---

## 3. 任务分解

## T0 — 文档与样本止血

### 目标

立即移除真实隐私样本，避免仓库和文档继续扩散敏感数据。

### 涉及文件

- `docs/memory-garden-backup-2026-07-15.json`
- `docs/memory-garden-backup-example.json`
- 相关引用文档

### 交付物

1. 删除真实备份样本或改为脱敏 mock
2. 如需保留示例，新增结构化脱敏样本
3. 文档说明中补充“示例数据不得使用真实用户数据”

### 验收标准

- 仓库搜索不到真实训练备份样本
- 文档中的示例均为脱敏数据

### 风险

- 如果文档还引用旧样本路径，需要同步更新链接

---

## T1 — 账户删除与数据清理一致性

### 目标

修复删除账户、清空数据、导入备份三条高风险清理链路，保证失败可见、结果可控。

### 涉及文件

- `supabase/functions/delete-account/index.ts`
- `src/screens/SettingsScreen.jsx`
- `src/services/SyncService.js`
- `src/services/BackupService.js`

### 交付物

1. 删除账户函数逐步校验
2. 删除失败时返回明确错误
3. 清空数据 / 导入备份 / 删除账户时统一清理离线同步队列
4. 明确是否同步清理分析缓存的产品口径

### 验收标准

- 任一步删除失败时，接口不再返回 success
- 清空或导入后重新联网，不会发生旧数据回灌

### 风险

- 删除逻辑变严格后，之前被吞掉的失败会首次显性暴露

---

## T2 — 云同步闭环与稳定主键

### 目标

补齐“登录后拉云 -> 落本地 -> 重建统计”的闭环，并为会话建立统一稳定主键。

### 涉及文件

- `src/services/AuthService.js`
- `src/services/SyncService.js`
- `src/hooks/useGameEngine.js`
- `src/stores/useStatsStore.js`
- 相关收藏 / 日记 store

### 交付物

1. 登录成功后的拉云与应用主链路
2. `sessions`、叙事解锁、日记碎片、profile 的完整落地
3. 本地会话稳定 `id`
4. 导入 / 拉云后的统计派生重建

### 验收标准

- 新设备登录后，用户历史、收藏、日记、统计一致
- 本地与云端合并后不出现重复会话

### 风险

- 初次登录恢复链路可能出现重复触发，需要幂等保护

---

## T3 — 首包压缩与路由拆包

### 目标

在不改产品行为的前提下，先压掉当前最明显的首包体积问题。

### 涉及文件

- `src/App.jsx`

### 交付物

1. 非首屏页面改为 `React.lazy + Suspense`
2. 统一页面级 fallback
3. 构建产物对比记录

### 优先拆分页面

- `StatsScreen`
- `AchievementsScreen`
- `LeaderboardScreen`
- `GuideScreen`
- `ModeGuideScreen`
- `SettingsScreen`
- `src/screens/about/*`

### 验收标准

- 主包体积明显下降
- 构建警告缓解
- 首屏链路功能无回归

### 风险

- 首次进入低频页时会出现懒加载 fallback，需要视觉上保持克制

---

## T4 — GameScreen 渲染热点治理

### 目标

控制 `GameScreen` 的高频重渲染范围，降低限时模式与暂停恢复时的 UI 抖动。

### 涉及文件

- `src/screens/GameScreen.jsx`
- 必要时新增：
  - `GameHeader`
  - `GameProgress`
  - `GameTimerHud`
  - `GamePauseOverlay`

### 交付物

1. 高频状态区域拆分
2. 更细的 store selector
3. `React.memo` 包装纯展示组件

### 验收标准

- 秒级计时变化不再带动整页明显重渲
- 暂停 / 恢复遮罩切换稳定

### 风险

- 组件拆分后若继续透传大对象，收益会被抵消

---

## T5 — 存储与版本协议升级

### 目标

把长期结构风险收口到“统一时钟、统一存储、统一版本协议”三件事上。

### 涉及文件

- `src/hooks/useGameEngine.js`
- `src/engine/GameLoop.js`
- `src/services/StorageService.js`
- 各核心 store
- `src/services/BackupService.js`
- `src/screens/StatsScreen.jsx`

### 交付物

1. 游戏时钟模型统一计划与落地
2. 高频大对象迁移到 IndexedDB
3. 核心 store schema / version 协议
4. 统计派生字段统一从 `sessions` 重建
5. 统计页热点计算收口

### 验收标准

- 游戏模式共享一致的暂停 / 恢复语义
- 高频持久化不再走 `localStorage` 主线程同步写
- 升级后旧数据可平滑迁移

### 风险

- 这是结构升级阶段，必须在 T0-T4 稳定后再做

---

## T6 — 全链路回归与文档对齐

### 目标

在核心风险收口后，对主链路、跨设备、同步链路和文档体系做最终对齐。

### 涉及文件

- `docs/00-INDEX.md`
- `docs/06-CHANGELOG.md`
- `docs/11-REVIEW.md`
- 关键 E2E / 手工回归清单

### 交付物

1. 风险修复结果回填到评审文档
2. 关键链路回归清单
3. 文档索引与变更记录对齐

### 建议回归范围

1. 清空数据
2. 导入备份
3. 删除账户
4. 登录后拉云
5. 首屏到开局
6. 暂停 / 恢复
7. 限时模式
8. 统计页与历史页

### 验收标准

- 文档与代码一致
- 主链路、同步链路、清理链路均通过回归

---

## 4. 推荐分批落地

### 第一批

- T0
- T1

### 第二批

- T2

### 第三批

- T3
- T4

### 第四批

- T5
- T6

---

## 5. 每阶段统一验收规则

每个阶段结束时都必须至少满足：

1. `npm run lint` 通过
2. 构建通过
3. 主链路 E2E 不回退
4. 文档与真实实现保持一致
