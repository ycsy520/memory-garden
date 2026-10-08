# 16 — 分析体系规格文档 (ANALYTICS SPEC)

> 版本: v1.0
> 更新: 2026-07-16
> 状态: 待执行
> 定位: 面向上线后版本优化、难度调优与漏斗分析的正式数据分析规格

---

## 1. 文档目标

本文件用于定义 `Memory Garden` 的正式分析体系，解决以下问题：

1. 记录每次开局的真实完成时间与有效游玩时间。
2. 找出用户在菜单、暖身、正式阶段的主要流失点。
3. 为模式、节奏、难度和版本迭代提供统一、诚实、可对比的数据口径。
4. 在保护用户隐私的前提下，为后续难度调优和版本优化保留足够证据。

本轮目标不是引入“全量行为监控”，而是建立一套**最小但可信**的分析闭环：

```text
客户端关键事件
  -> attempt 汇总
  -> 本地待上传队列
  -> Supabase Edge Function ingest
  -> 原始表 + 聚合表
  -> Supabase 后台简单报表
```

---

## 2. 产品决策

本轮分析体系已明确采用以下产品口径：

1. **登录用户上云统计**
   - 匿名用户不做云端分析同步。
   - 匿名用户可保留本地轻量分析，但不进入正式云端报表。

2. **报表载体采用 Supabase 后台 + 简单报表**
   - 不在第一阶段额外开发复杂运营后台。
   - 优先依靠 Supabase 表、视图和 SQL 聚合获得可读结果。

3. **删除账户时，分析数据匿名化保留**
   - 不再保留 `user_id`
   - 保留 attempt / event 的统计价值
   - 不保留可回溯到个人身份的信息

4. **所有趋势比较必须按同维度分组**
   - 禁止把不同 `mode / rhythm / difficulty / timed` 的结果混在一起做“进步趋势”。

---

## 3. 现状与迁移方向

### 3.1 当前现状

项目中已存在本地轻量统计服务：

- `src/services/AnalyticsService.js`

当前能力特点：

1. 数据仅保存在 `localStorage`
2. 主要记录页面访问、功能使用、简单的游戏结束摘要
3. 没有正式的云端分析表结构
4. 没有 attempt 级生命周期与暂停/恢复口径
5. 不适合做版本对比、漏斗分析和难度调优

### 3.2 本轮方向

本轮不是推翻已有 `AnalyticsService`，而是将其升级为两层体系：

1. **本地轻量层**
   - 保留最基础的本地事件缓冲与离线兜底能力

2. **正式分析层**
   - 定义统一的 attempt / event / rollup 模型
   - 登录用户通过云端 ingest 写入 Supabase
   - 报表基于云端聚合结果读取

---

## 4. 不可违背原则

1. **数据真实性优先**
   - 必须区分“总耗时”和“有效游玩耗时”
   - 暂停、失焦、切后台产生的时间不得污染真实完成时间

2. **同维度对比优先**
   - 任何趋势、版本对比、难度判断都必须在同一维度下进行

3. **最小埋点优先**
   - 不记录无用的逐帧、逐毫秒行为
   - 只记录对产品优化有意义的关键节点

4. **隐私优先**
   - 不记录邮箱、文本输入、设备唯一标识等敏感信息
   - 删除账户后分析数据只做匿名化保留

5. **异步不阻塞**
   - 分析上报不得阻塞 UI 和主游戏链路

---

## 5. 核心分析对象

## 5.1 Attempt

`attempt` 表示一次完整的开局尝试，是本系统的主分析单位。

起点：

- 用户确认开始，游戏引擎真正进入 `attempt_start`

终点：

- 正常完成：`attempt_finish`
- 中途退出：`attempt_exit`

一个 attempt 必须带上完整维度：

- `mode_id`
- `rhythm_id`
- `difficulty_n`
- `timed`
- `time_limit_s`
- `app_version`
- `platform`

## 5.2 Event

`event` 表示一次关键生命周期节点，用于：

1. 漏斗分析
2. 暂停/恢复质量分析
3. 退出阶段定位
4. 异常复盘

本轮不做“每回合全量上云”，只记录关键节点事件。

## 5.3 Rollup

`rollup` 表示按天、按维度聚合后的报表结果，用于：

1. 提升报表查询性能
2. 直接支持版本对比
3. 让 Supabase 后台简单可读

---

## 6. 关键维度

所有分析至少按以下字段隔离：

- `mode_id`
- `rhythm_id`
- `difficulty_n`
- `timed`
- `time_limit_s`
- `app_version`
- `platform`
- `locale`

### 为什么强制分维度

因为以下对比都是错误的：

1. 把散步和晨跑放在一起比较“完成时间”
2. 把不同难度的准确率混成一个趋势
3. 把限时模式和非限时模式放在同一条效率曲线上

---

## 7. attempt 字段规格

建议建立表：`analytics_attempts`

### 7.1 主键与身份

- `id`
- `user_id nullable`
- `session_id`

### 7.2 玩法维度

- `mode_id`
- `rhythm_id`
- `difficulty_n`
- `timed`
- `time_limit_s`

### 7.3 生命周期

- `started_at`
- `ended_at`
- `ended_reason`
  - `finished`
  - `exit`

### 7.4 耗时指标

- `duration_ms`
- `pause_duration_ms`
- `active_duration_ms`
- `warmup_duration_ms`

### 7.5 过程指标

- `turn_count_total`
- `turn_count_scored`
- `exit_stage`
  - `intro`
  - `warmup`
  - `main`
  - `finished`
- `exit_turn_index`

### 7.6 表现指标

- `score`
- `accuracy`
- `rt_p50_ms`
- `rt_p90_ms`

### 7.7 环境维度

- `app_version`
- `platform`
  - `web`
  - `pwa`
  - `android`
  - `ios`
- `locale`

---

## 8. event 字段规格

建议建立表：`analytics_events`

- `id`
- `attempt_id`
- `user_id nullable`
- `event_name`
- `ts`
- `payload jsonb`

### 8.1 推荐事件名

#### 漏斗类

- `menu_enter`
- `mode_selected`
- `rhythm_selected`
- `difficulty_selected`
- `game_start_clicked`

#### 生命周期类

- `attempt_start`
- `warmup_start`
- `warmup_end`
- `pause`
- `resume`
- `attempt_finish`
- `attempt_exit`

#### 可选辅助类

- `backup_export`
- `backup_import`
- `cloud_hydrate_success`
- `cloud_hydrate_fail`

### 8.2 payload 允许内容

只允许与行为分析直接相关的少量字段：

- `pause_reason`
- `turn_index`
- `stage`
- `source`

### 8.3 payload 禁止内容

严禁写入：

- 邮箱
- auth token
- 任意用户输入文本
- 可追踪设备唯一标识

---

## 9. rollup 字段规格

建议建立表：`analytics_rollup_daily`

- `date`
- `mode_id`
- `rhythm_id`
- `difficulty_n`
- `timed`
- `time_limit_s`
- `app_version`
- `platform`
- `attempts_started`
- `attempts_finished`
- `completion_rate`
- `p50_active_duration_ms`
- `p90_active_duration_ms`
- `pause_rate`
- `warmup_exit_rate`
- `main_exit_rate`

该表用于报表，不作为客户端写入表。

---

## 10. 指标计算口径

## 10.1 总耗时

```text
duration_ms = ended_at - started_at
```

## 10.2 暂停耗时

```text
pause_duration_ms = sum(all pause -> resume intervals)
```

## 10.3 有效游玩耗时

```text
active_duration_ms = duration_ms - pause_duration_ms
```

这是后续判断难度、节奏和完成时间的主口径。

## 10.4 暖身耗时

```text
warmup_duration_ms = warmup_end - warmup_start
```

## 10.5 完成率

```text
completion_rate = attempts_finished / attempts_started
```

## 10.6 暖身退出率

```text
warmup_exit_rate = exits_in_warmup / attempts_started
```

## 10.7 正式阶段退出率

```text
main_exit_rate = exits_in_main / attempts_started
```

## 10.8 反应时分位数

只在正式回合统计，不把暖身和暂停期间计入：

- `rt_p50_ms`
- `rt_p90_ms`

---

## 11. 上传链路规格

## 11.1 客户端策略

采用：

- **本地队列**
- **批量上传**
- **失败重试**

原则：

1. 游戏结束或退出时优先完成本地 attempt 汇总
2. 登录用户进入云端队列
3. 网络恢复或登录成功时批量补传

## 11.2 服务端入口

建议新增 Supabase Edge Function：

- `analytics-ingest`

职责：

1. 校验身份
2. 校验字段白名单
3. 写入 `analytics_attempts`
4. 可选写入 `analytics_events`

## 11.3 入参结构

```json
{
  "attempt": {},
  "events": []
}
```

---

## 12. 与现有模块的联动

## 12.1 `useGameEngine.js`

负责：

1. 生成 attempt 生命周期
2. 在暂停/恢复时累计 pause 时长
3. 在 finish / exit 时输出最终 attempt 汇总

## 12.2 `SyncService.js`

负责：

1. 新增 analytics 队列
2. 统一批量上传 attempt / events
3. 网络恢复与登录后补传

## 12.3 `AuthService.js`

负责：

1. 登录后触发分析队列补传
2. 登出后停止用户态云端分析上传

## 12.4 `BackupService.js`

本轮产品口径：

1. 普通用户备份不包含正式 analytics 原始数据
2. 备份继续只保留业务核心数据
3. 分析数据属于产品优化资产，不属于用户可迁移核心资产

## 12.5 `delete-account`

文件：

- `supabase/functions/delete-account/index.ts`

本轮要求：

1. 业务数据仍按既有删除链路处理
2. 分析数据不做物理删除
3. 对 `analytics_attempts` 和 `analytics_events` 执行匿名化
   - `user_id = null`
4. 不再保留任何可识别用户身份的信息
5. 第一阶段优先通过外键 `user_id -> profiles(id) on delete set null` 实现匿名化
   - 这样现有 `delete-account` 在删除 `profiles` 时即可自动触发匿名化
   - 避免在第一阶段扩大 Edge Function 代码改动范围

---

## 13. 隐私与合规口径

1. **最小化采集**
   - 只记录产品优化需要的数据

2. **匿名化保留**
   - 删除账户后保留 attempt / event 统计价值
   - 不保留可识别用户字段

3. **不进入用户备份**
   - 防止普通备份夹带分析原始数据

4. **不写敏感 payload**
   - analytics payload 禁止进入用户文本与身份信息

---

## 14. 报表设计

## 14.1 总览页

展示：

- 每日开局数
- 完成率
- P50 / P90 有效耗时
- 暂停率

## 14.2 模式分析页

按以下路径下钻：

```text
mode -> rhythm -> difficulty -> version
```

## 14.3 退出分析页

展示：

- `intro / warmup / main` 退出率
- 退出最集中的 turn 区间

## 14.4 版本对比页

同维度下比较：

- 完成率变化
- 有效耗时变化
- 暂停率变化

---

## 15. 风险与失败模式

1. **维度污染**
   - 报表未按 mode/rhythm/difficulty 分层，得到错误趋势

2. **时间口径失真**
   - 未扣除 pause_duration，导致完成时间虚高

3. **数据成本失控**
   - 逐回合、逐细节全量上云，造成噪音与成本暴涨

4. **匿名化不彻底**
   - 删除账户后仍能通过某些字段反查用户

5. **删除链路口径冲突**
   - 业务数据要求物理删除，但分析数据要求匿名化保留，必须区分表和链路

---

## 16. 成功标准

当以下条件满足时，可视为本规格落地成功：

1. 已存在的本地 `AnalyticsService` 完成升级路径对齐
2. 登录用户的 attempt 数据可稳定上云
3. 有效耗时与暂停耗时口径可信
4. Supabase 后台可以按 mode/rhythm/difficulty/version 查看结果
5. 删除账户后分析数据实现匿名化保留
6. 备份中不混入正式 analytics 原始数据
