# Google Play Console Draft

## 目标

本文件用于把 `Memory Garden` 当前版本的 Google Play 提交信息整理成可直接照填的草稿。

当前提交前提：

- 产品口径：`9+`
- 当前版本：`无广告`
- 当前版本：`无云存储`
- 当前版本：`本地存储优先`
- 当前版本：`远程错误上报 / 远程分析已代码层关闭`

## 一、App Content

### 1. Privacy policy

- 结论：`需要填写`
- 当前状态：`阻塞`
- 需要提交的内容：一个公网可访问的 `HTTPS` 隐私政策页面 URL

建议口径：

- 本应用默认将训练数据、设置和花园进度保存在设备本地
- 当前版本不要求注册账户
- 当前版本不自动上传训练数据到云端
- 当前版本不自动发送数据到第三方广告、分析或错误监控服务
- 用户可主动导出或分享备份文件

### 2. Ads

- 建议填写：`No, my app does not contain ads`

### 3. App access

- 建议填写：`All functionality is available without special access`
- 原因：当前版本无登录墙、会员墙、邀请码、审核专用账号

### 4. News apps

- 建议填写：`No`

### 5. Health apps

- 建议填写：`No`

说明：

虽然产品和认知训练有关，但当前应避免把自己申报为医疗或健康诊疗产品。  
商店文案中也应坚持“训练 / 练习 / 游戏”，不要写成“治疗 / 康复疗效 / 医疗改善承诺”。

## 二、Target audience and content

### 建议选择

- `Ages 9-12`
- `Ages 13-15`

### 不建议当前选择

- `Ages 6-8`

原因：

- 当前玩法为 N-back 认知训练
- 对 `6-8` 年龄段存在更高的适龄性争议
- 你已经明确把产品口径调整为 `9+`

### 内容声明建议

- 应用不包含暴力、血腥、赌博、酒精、烟草、成人内容
- 不包含聊天、UGC、社交匹配
- 不包含广告
- 不包含位置追踪或精准画像

## 三、Data safety 草案

## 总体建议

当前版本建议按以下方向填写：

- `No data collected`
- `No data shared`

但这只有在 release 包保持以下事实时才成立：

- `cloudSyncEnabled = false`
- `remoteReportingEnabled = false`
- release 环境未启用 Supabase / Sentry / Umami 上报

## 可作为“不算 collected / shared”的行为

- 本地存储训练数据
- 本地存储用户设置
- 用户主动导出备份文件
- 用户主动使用系统分享面板分享备份文件

这些属于设备本地处理或用户主动触发的文件输出，不等于应用自动向开发者服务器收集数据。

## 四、Content rating / IARC

### 当前建议

按真实内容作答，不主动拔高，也不要手填“9+”。

预期方向：

- 暴力：无
- 血腥：无
- 性：无
- 裸露：无
- 赌博：无
- 酒精/烟草/药物：无
- 仇恨言论：无
- 用户互动：无
- 位置共享：无
- 数字购买：无

最终结果以 IARC 问卷自动生成的评级为准。

## 五、商店文案口径

### 推荐关键词

- memory training
- focus practice
- working memory
- local-first
- no account required
- calm practice game

### 避免使用

- cure
- treatment
- rehabilitation guarantee
- medically proven outcome
- for all children
- designed for ages 6-8

## 六、当前我已经完成的内容

- 已把项目产品口径切到 `9+`
- 已新增功能开关，明确关闭云同步
- 已新增功能开关，明确关闭远程错误上报与远程统计
- 已让 Supabase 客户端在当前版本代码层不启用
- 已让 SyncService 在当前版本代码层不可用
- 已让 Sentry 上报在当前版本代码层不可用
- 已让 Umami 远程发送在当前版本代码层不可用
- 已把应用内三语隐私 / 条款中的年龄口径改为 `9+`
- 已把隐私文案中的第三方错误监控分享描述移除，并改为用户主动导出 / 分享口径
- 已产出 Google Play 合规计划文档

## 七、还缺什么

### 你需要完成

1. 准备公网 `HTTPS` 隐私政策 URL
2. 在 Play Console 里按本文件填写 `Target audience and content`
3. 在 Play Console 里按本文件填写 `Ads`
4. 在 Play Console 里按本文件填写 `App access`
5. 完成 `Content rating / IARC` 问卷
6. 上传最终商店素材：
   - App icon `512 x 512`
   - Feature Graphic
   - 手机截图
   - 应用标题 / 短描述 / 长描述

### 我还可以继续做

1. 帮你生成一版 `隐私政策网页 HTML`
2. 帮你生成 `Google Play 短描述 / 长描述 / 标题`
3. 帮你做一版 `Data safety` 填写说明书
4. 帮你检查最终 release 包与 Play 口径是否一致
