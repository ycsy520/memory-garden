# 17 — 分析体系执行清单 (ANALYTICS TASKS)

> 版本: v1.0
> 更新: 2026-07-16
> 状态: 待执行
> 依赖规格: [16-ANALYTICS-SPEC.md](./16-ANALYTICS-SPEC.md)

---

## 1. 目标

将 `16-ANALYTICS-SPEC.md` 中定义的分析体系拆解为可执行、可验收、可分批回归的任务清单。

本轮原则：

1. 先定义 attempt 主数据，再补 event 细节。
2. 先打通登录用户上云闭环，再做报表优化。
3. 先完成隐私口径与删除链路对齐，再扩大分析覆盖范围。

---

## 2. 总体执行顺序

```text
T0 现状审计与口径冻结
  ↓
T1 Supabase 表结构与匿名化策略
  ↓
T2 客户端 attempt 汇总链路
  ↓
T3 analytics ingest 与离线队列
  ↓
T4 event 关键节点补齐
  ↓
T5 daily rollup 与后台报表
  ↓
T6 删除账户匿名化与文档回填
```

---

## 3. 任务分解

## T0 — 现状审计与口径冻结

### 目标

明确当前本地分析能力与正式分析体系之间的差距，冻结第一阶段的数据口径。

### 涉及文件

- `src/services/AnalyticsService.js`
- `src/services/SyncService.js`
- `src/hooks/useGameEngine.js`
- `docs/16-ANALYTICS-SPEC.md`

### 交付物

1. 盘点已有本地 analytics 事件
2. 标记哪些事件继续保留，哪些需要废弃或迁移
3. 冻结第一阶段 attempt 字段字典
4. 冻结第一阶段 event 白名单

### 验收标准

- 不再把“本地轻量统计”和“正式上云分析”混为一谈
- attempt 字段口径在文档中固定

### 风险

- 若口径未冻结就直接编码，后续表结构与事件名会频繁返工

---

## T1 — Supabase 表结构与匿名化策略

### 目标

建立正式分析表结构，并把“删除账户匿名化保留”的产品决策落到数据库层。

### 涉及对象

- `analytics_attempts`
- `analytics_events`
- `analytics_rollup_daily`
- `supabase/functions/delete-account/index.ts`
- 迁移 SQL 文档

### 交付物

1. 新增三张分析表的 migration
2. attempt / event 基础索引
3. RLS 设计说明
4. 删除账户匿名化 SQL 路径
5. 用 `user_id -> profiles(id) on delete set null` 实现第一阶段匿名化保留

### 验收标准

- 表结构能承载规格中的字段
- 删除账户时，analytics 可匿名化而非物理删除
- 普通业务数据删除与分析数据匿名化的边界清晰

### 风险

- 若直接沿用业务删除策略，会误删后续版本分析样本

---

## T2 — 客户端 attempt 汇总链路

### 目标

先打通最重要的 attempt 主数据，不急于补充所有 event。

### 涉及文件

- `src/hooks/useGameEngine.js`
- `src/services/AnalyticsService.js`
- 可能新增 `src/services/AttemptAnalyticsService.js`

### 交付物

1. `attempt_start` 生命周期起点
2. `attempt_finish / attempt_exit` 终点汇总
3. `pause_duration_ms` 累计
4. `active_duration_ms` 计算
5. `warmup_duration_ms` 计算

### 验收标准

- 每次开局都能生成一条完整 attempt 汇总
- finish 与 exit 有明确区分
- 暂停时长不会污染有效游玩时间

### 风险

- 若 pause/resume 口径不准，所有后续“完成时间”判断都会失真

---

## T3 — analytics ingest 与离线队列

### 目标

把客户端汇总稳定上传到云端，并复用现有同步体系处理失败重试。

### 涉及文件

- `src/services/SyncService.js`
- `src/services/AuthService.js`
- 新增 Supabase Edge Function `analytics-ingest`

### 交付物

1. analytics pending queue
2. 登录后补传机制
3. 网络恢复后补传机制
4. ingest 接口字段校验
5. 最大重试次数与队列裁剪策略

### 验收标准

- 登录用户 attempt 数据可上云
- 网络中断时数据不会直接丢失
- 失败重试不会阻塞主 UI

### 风险

- 若直接同步写云端且无队列兜底，移动端或 PWA 场景下会大量丢样本

---

## T4 — event 关键节点补齐

### 目标

在 attempt 主链路稳定后，再补漏斗与复盘所需的关键 event。

### 涉及文件

- `src/screens/MenuScreen.jsx`
- `src/screens/GameScreen.jsx`
- `src/hooks/useGameEngine.js`
- `src/services/AnalyticsService.js`

### 交付物

1. 漏斗事件：
   - `menu_enter`
   - `mode_selected`
   - `rhythm_selected`
   - `difficulty_selected`
   - `game_start_clicked`
2. 生命周期事件：
   - `warmup_start`
   - `warmup_end`
   - `pause`
   - `resume`
3. payload 白名单实施

### 验收标准

- 可以从 event 复盘菜单到开局的关键漏斗
- 可以区分用户退出发生在 warmup 还是 main

### 风险

- 事件过多会带来噪音，必须坚持白名单，不得无限扩张

---

## T5 — daily rollup 与后台报表

### 目标

把原始数据变成可读、可比、可直接用于版本决策的后台报表。

### 涉及对象

- `analytics_rollup_daily`
- Supabase SQL / View
- Supabase 后台查询视图

### 交付物

1. 每日聚合逻辑
2. completion / duration / pause 统计视图
3. mode -> rhythm -> difficulty -> version 的查询模板
4. 简单报表说明文档

### 验收标准

- 可查看每日完成率
- 可查看 P50/P90 有效耗时
- 可按同维度对比不同版本

### 风险

- 若直接用原始 event 表做后台报表，查询会越来越重且可读性差

---

## T6 — 删除账户匿名化与文档回填

### 目标

完成隐私闭环，让“业务删除 + 分析匿名化保留”真正落到实现与文档中。

### 涉及文件

- `supabase/functions/delete-account/index.ts`
- `docs/06-CHANGELOG.md`
- `docs/00-INDEX.md`
- `docs/16-ANALYTICS-SPEC.md`
- `docs/17-ANALYTICS-TASKS.md`

### 交付物

1. 删除账户逻辑增加 analytics 匿名化步骤
2. 变更记录回填
3. 风险文档与索引对齐
4. 验证“删除后 analytics 不再含 user_id”

### 验收标准

- 删除账户后，分析表内不再能识别到该用户
- analytics 数据仍可参与聚合统计

### 风险

- 若匿名化遗漏某些字段，实际效果会偏离产品决策

---

## 4. 推荐分批落地

### 第一批

- T0
- T1

说明：

- 先冻结规格与数据库边界，不直接改游戏主链路

### 第二批

- T2
- T3

说明：

- 先让 attempt 汇总可靠落地，再考虑更细事件

### 第三批

- T4
- T5

说明：

- 在 attempt 稳定后补漏斗与报表，不提前扩张埋点范围

### 第四批

- T6

说明：

- 最后把删除账户隐私闭环和文档体系全部对齐

---

## 5. 每阶段统一验收规则

每个阶段结束时都必须至少满足：

1. 字段口径与文档一致
2. 不阻塞主游戏链路
3. 登录用户与匿名用户边界清晰
4. 删除账户隐私口径不回退
5. 关键自动化或最小手工回归通过

---

## 6. 建议回归范围

### T1 后

- 数据库 migration 可执行
- 删除账户匿名化 SQL 可验证

### T2 后

- 开局、暂停、恢复、完成、退出能生成正确 attempt

### T3 后

- 离线时进入队列
- 登录后成功补传
- 网络恢复后成功补传

### T4 后

- 菜单到开局漏斗事件完整
- warmup / main 阶段退出可区分

### T5 后

- Supabase 后台可看到 daily rollup
- 能按 mode / rhythm / difficulty / version 过滤

### T6 后

- 删除账户后 analytics 已匿名化
- 备份不混入 analytics 原始数据
- 文档与实现一致
