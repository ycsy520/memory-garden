# Google Play Compliance Plan

## 目标

基于 Google Play 官方政策，对 `Memory Garden` 当前 Android 版本做一次提交前合规对照，并给出可执行的上线计划。

当前产品前提：

- 游戏定位：`9+`
- 当前版本：`无广告`
- 当前版本：`不做云存储`
- 当前版本：`本地存储优先`

## 官方依据

以下为本次对照所参考的 Google 官方页面：

- Google Play Families Policies  
  https://goo.gle/families?hl=en
- Provide information for Google Play's Data safety section  
  https://goo.gle/faqs
- Manage target audience and app content settings  
  https://support.google.com/googleplay/android-developer/answer/9285070?hl=en
- Prepare your app for review / App content  
  https://support.google.com/googleplay/android-developer/answer/9859455?hl=en
- Google Play Developer Policy Center  
  https://play.google.com/about/developer-content-policy/

## 当前项目事实

### 已确认事实

- Android Manifest 当前仅声明 `INTERNET` 权限
- 当前版本 `APP_FEATURES.cloudSyncEnabled = false`
- 设置页已改为“本地存储模式”说明
- App 启动时当前版本不会初始化 AuthService / SyncService
- 当前无广告 SDK、无 AdMob、无内购
- 当前无聊天、无 UGC、无社交关系链、无随机匹配
- 当前应用内已有隐私政策页 / 使用条款页 / 联系邮箱
- 当前 Android 桌面名、图标、多语言已具备基础可提交状态

### 仍需特别注意的事实

- 代码中仍保留 `@supabase/supabase-js`、`SyncService`、`AuthService`
- `.env.local` 当前仍存在 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`
- 代码中仍保留可选 `Sentry` 与 `Umami` 远程链路
- `useGameEngine` 在结算时仍会调用 `SyncService.syncSession()` / `syncAnalyticsAttempt()` / `syncGardenState()`
- 这些调用当前依赖“未登录则不上传”与“未初始化 auth”的事实来避免联网，而不是从代码层彻底禁用远程能力

## 逐项合规对照

### 1. Families Policy / 是否面向儿童

#### 官方要求

- 只要目标受众包含儿童，就必须遵守 Families Policy
- Target audience 必须如实填写，Play 会自行审查，不接受“表单写成人、素材却明显吸引儿童”的做法
- 若应用面向儿童或包含儿童受众，必须确保内容、SDK、数据处理、隐私政策与实际行为一致

#### 当前项目判断

- 你的产品口径现已定为 `9+`
- 这意味着在 Google Play 的 target audience 维度里，**很难完全绕开儿童受众**
- 一旦选择 `6-8` 或 `9-12`，就进入 Families Policy 约束

#### 关键风险

Google Play 的 `target audience` 不是“你自己写一个 8+ 文案”这么简单，而是平台固定年龄段。  
更麻烦的是，官方在 `Ages 6-8` 指引里明确提到，这个年龄段通常**不适合需要短时记忆任务、快速反应、较高认知负荷** 的玩法。  
而 `Memory Garden` 本质上是 N-back 认知训练，这一点和 `6-8` 段存在天然张力。

#### 结论

- 当前口径已经切到 `9+`
- 仍需按 Families / Target audience 相关规则准备申报材料，因为 `9-12` 依旧属于儿童受众范围

### 2. 内容适龄性

#### 官方要求

- 儿童可访问内容必须适龄
- 不得含暴力、恐怖、成人主题、暗示性内容、赌博、酒精烟草美化等

#### 当前项目判断

- 当前游戏为认知训练 / 花园叙事 / 轻度成长内容
- 未见暴力、色情、赌博、社交配对、匿名聊天等高风险内容

#### 结论

- **基本满足**
- 但商店文案、截图、Feature Graphic 也必须维持同样的低风险、非误导口径

### 3. 广告与商业化

#### 官方要求

- 面向儿童时广告限制极严
- 面向儿童或未知年龄用户展示广告时，必须使用 Families Self-Certified Ads SDK，并满足广告格式限制

#### 当前项目判断

- 当前版本不做广告
- 当前代码中未发现 AdMob / 广告 SDK

#### 结论

- **当前项满足**
- Play Console 的 `Ads` 声明应填写 `No`

### 4. Data safety / 数据安全申报

#### 官方要求

- 所有上架 Google Play 的应用都必须填写 Data safety
- 即使不采集任何数据，也必须填写，并提供隐私政策
- 第三方 SDK 的数据处理也要由开发者负责申报
- “本地处理、不离开设备”的数据，不需要按 collected 声明
- 用户主动触发、且合理预期的数据分享，在某些场景下不算 share

#### 当前项目判断

- 本地训练数据、设置、花园状态主要保存在 localStorage / app sandbox
- 导出备份、分享文件属于用户主动触发
- 当前版本不做账号系统入口，不做云同步入口
- 但项目代码与环境中仍保留 Supabase / Sync / 可选 Sentry / 可选 Umami 能力

#### 结论

当前项目**有机会按“无数据收集 / 无数据共享”方向申报**，但前提是：

1. release 版必须确认不启用 `Sentry`
2. release 版必须确认不启用 `Umami`
3. release 版必须确认不会触发 `Supabase` 远程请求
4. 隐私政策文案必须和上面三点完全一致

如果以上任一点在 release 实包中不成立，就不能按最干净口径申报。

### 5. 隐私政策

#### 官方要求

- 目标儿童的应用，无论是否访问敏感权限或数据，都必须提供隐私政策
- 需在 Play 商店页提供可访问 URL
- 也应在应用内可访问
- 内容必须准确反映实际数据收集、使用、共享方式

#### 当前项目判断

- 应用内已存在 Privacy 页面
- 但这不等于已经有可提交 Play Console 的 **公网 HTTPS 隐私政策 URL**

#### 结论

- **当前阻塞项**
- 必须补一个公开可访问、稳定、非登录态、非 PDF 的隐私政策页面 URL

### 6. App access

#### 官方要求

- 如果应用有登录、会员、地区限制、验证码、其他认证限制，必须向审核提供访问说明
- 无限制则按“无受限访问”填写

#### 当前项目判断

- 当前版本无账号登录入口作为主路径
- 无会员墙、无审核专用隐藏页

#### 结论

- `App access` 可按 **No restricted access** 处理

### 7. Content rating / IARC

#### 官方要求

- 必须完成内容分级问卷
- 若不填，可能被列为 Unrated，甚至下架

#### 当前项目判断

- 当前内容风险较低
- 但最终分级必须按问卷真实答案生成，不能手填“9+”

#### 结论

- 你要区分：
  - `内容分级`：IARC 问卷结果
  - `目标受众`：Play Console Target audience
- 这两者不是一回事

### 8. 儿童安全标准 / 社交功能

#### 官方要求

- 若有聊天、UGC、社交分享、陌生人互动等，则需额外满足更高标准

#### 当前项目判断

- 当前无聊天、无 UGC、无陌生人互动

#### 结论

- **当前不适用**

### 9. 权限合规

#### 官方要求

- 高风险权限会触发额外审查
- 权限应与核心功能直接相关

#### 当前项目判断

- 当前仅见 `INTERNET`
- 未见定位、短信、通话记录、通讯录、相机、麦克风等高风险权限

#### 结论

- **当前满足**

### 10. SDK 责任

#### 官方要求

- App 中集成的 SDK 行为，开发者负全责
- SDK 若会采集或上传数据，需要进入 Data safety 与隐私政策口径

#### 当前项目判断

- 依赖中包含 `@supabase/supabase-js`
- 依赖中包含 `@sentry/react`
- 代码中包含 Umami 可选上报逻辑

#### 结论

- 即使产品口径是“本地版”，只要 release 实包仍实际启用这些远程链路，就必须如实申报
- 因此 **上线前必须确认 release 环境变量与代码路径**

## 当前结论

### 已满足

- 无广告
- 无高风险权限
- 无社交 / UGC / 聊天
- 当前内容整体低风险
- 本地存储模式已在产品层面落地
- 应用内已有隐私政策与条款入口

### 必须补齐

1. **公网隐私政策 URL**
2. **Target audience 策略定稿**
3. **Data safety 最终口径定稿**
4. **release 环境中远程能力是否彻底关闭**
5. **Play 商店素材与文案统一口径**

### 当前最大风险

不是广告，也不是云存储入口本身，而是：

1. **`9+` 产品口径与 Google 固定年龄分组仍需正确映射**
2. **代码里仍存在可联网的远程能力与环境变量**
3. **如果申报写“完全不采集”，但 release 包仍有远程上报，就会形成口径不一致**

## 建议的上线口径

### 推荐方案 A：稳妥上线方案

- 产品宣传口径改为：`适合 9+`
- Target audience 选择：`9-12`、`13-15`
- 是否继续包含更高年龄组，取决于你是否要把它定义为“适合全年龄”
- Ads：`No`
- App access：`No restricted access`
- Data safety：在彻底确认 release 不启用远程上报后，按“本地处理、不采集、不共享”方向填写

### 备选方案 B：坚持 8+ 方案

- 继续主张 `8+`
- 需准备进入更严格的儿童受众审查语境
- 必须认真评估 `6-8` 与当前 N-back 玩法之间的适龄性张力

## 上线前动作清单

### P0 阻塞项

- [ ] 提供公网 HTTPS 隐私政策 URL
- [ ] 明确最终 Target audience 方案
- [ ] 确认 release 环境不启用 Sentry / Umami / Supabase 远程链路，或改写 Data safety 口径
- [ ] 完成 Data safety 表单草案
- [ ] 完成 Content rating 问卷

### P1 高优先项

- [ ] 清理或硬禁用当前版本不用的云同步 / 远程分析入口
- [ ] 复核隐私政策文案与实际 release 行为完全一致
- [ ] 复核商店标题、短描述、长描述，避免误导为“儿童应用”或“教育医疗承诺”
- [ ] 准备 512 图标、Feature Graphic、手机截图、联系邮箱

### P2 建议项

- [ ] 为当前“本地版”增加一条更清晰的 Play 商店说明：`No account required / Local-first`
- [ ] 在设置页增加“数据仅存本地”的短说明截图，方便商店素材与审核口径统一
- [ ] 为 release 单独准备 `.env.release`，不要沿用当前本地开发环境变量

## 我对当前版本的最终判断

如果你坚持当前版本：

- 无广告
- 不做云存储
- 无账号主路径
- 本地存储优先

那么这款游戏 **是有机会按低风险 Google Play 游戏上架的**。  
但在正式提交前，必须先处理掉下面两个核心问题：

1. **年龄定位口径定稿**
2. **远程数据链路口径定稿**

如果这两项不先收敛，后面的 Data safety、Target audience、隐私政策、商店文案都会互相打架。
