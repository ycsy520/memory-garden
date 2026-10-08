# Google Play Console Checklist

## 用途

这份清单用于指导 `Memory Garden` 当前版本在 Google Play Console 中逐项填写与提交流程。

当前版本口径：

- `9+`
- `无广告`
- `无账号`
- `本地存储优先`
- `无云同步`

## 一、提交前你先准备好

### 1. 正式隐私政策 URL

要求：

- 必须是公网 `HTTPS`
- 必须无需登录即可访问
- 建议路径：`/privacy/`
- 页面需要能正常打开，不报错，不跳转到其他站点

建议最终形式：

- `https://你的域名/privacy/`

### 2. 商店素材

你要准备：

- App 图标：`512 x 512`
- Feature Graphic
- 手机截图
- 应用标题
- 短描述
- 长描述

文案已在这里：

- [23-GOOGLE-PLAY-STORE-COPY.md](file:///F:/git/game/memory-garden/docs/23-GOOGLE-PLAY-STORE-COPY.md)

### 3. 最终提审包

要求：

- 使用正式签名
- 优先提交 `AAB`
- 确认是最新代码打出的包

## 二、Play Console 填写顺序

## 1. App details

### App name

建议：

- 简体中文：`记忆小花园`
- 英文：`Memory Garden`

要求：

- 保持与你应用内名称一致
- 不要塞关键词堆砌

### Short description

直接使用：

- 简体中文：`本地优先的记忆训练小游戏，无广告、无账号，随时开始一场安静练习。`
- 英文：`A calm local-first memory training game with no ads, no account, and no cloud setup.`

### Full description

直接从：

- [23-GOOGLE-PLAY-STORE-COPY.md](file:///F:/git/game/memory-garden/docs/23-GOOGLE-PLAY-STORE-COPY.md)

拷贝对应语言版本。

要求：

- 不要写“治疗”“康复保证”“医疗改善”
- 可以写“训练”“练习”“专注”“工作记忆”

## 2. Graphics

### App icon

要求：

- `512 x 512`
- PNG
- 与当前 Android 图标风格一致

### Feature Graphic

要求：

- 画面干净
- 不要放误导性的“医疗”“医院”“专业治疗”视觉
- 保持花园、安静、记忆训练、专注体验的品牌方向

### Phone screenshots

建议优先放：

1. 首页 / 欢迎页
2. 模式选择页
3. 游戏进行中
4. 结算页
5. 统计页
6. 设置页（体现本地存储）

要求：

- 截图里不要出现“云同步”“登录备份”等旧口径
- 截图内容要与当前提审版本一致

## 3. App content

## 3.1 Privacy policy

这里填写：

- `https://你的域名/privacy/`

要求：

- 必须实际可打开
- 最好部署后自己先在浏览器和手机里都点开一次

## 3.2 Ads

建议选择：

- `No, my app does not contain ads`

要求：

- 必须与你当前版本一致
- 当前代码和产品口径就是无广告，所以这里不要填错

## 3.3 App access

建议选择：

- `All functionality is available without special access`

原因：

- 当前版本无登录墙
- 无会员墙
- 无审核测试账号要求

## 3.4 Target audience and content

建议选择：

- `9-12`
- `13-15`

不建议当前选择：

- `6-8`

原因：

- 你的产品口径已经定为 `9+`
- 当前 N-back 玩法对 `6-8` 段更容易产生适龄性争议

填写要求：

- 不要继续写 `8+`
- 不要试图把它包装成“成人产品”但素材又明显面向儿童

## 3.5 News apps

建议：

- `No`

## 3.6 Health apps declaration

建议：

- `No`

说明：

- 当前不是医疗产品
- 是记忆训练 / 注意力练习类游戏

## 4. Data safety

当前建议口径：

- `No data collected`
- `No data shared`

你填写前要理解这套口径成立的前提：

- 当前版本无广告
- 当前版本无账号
- 当前版本无云同步
- 当前版本代码层已关闭远程错误上报与远程统计
- 数据主要保存在本地设备

可以按这个思路填写：

- 应用不会自动把训练数据上传到开发者服务器
- 用户主动导出或分享备份文件，不算应用自动收集或共享

填写时要求：

- 不要因为“有本地存储”就误填成 collected
- 不要把“用户主动导出文件”误填成 app share

如果 Console 里某个具体题目让你拿不准，建议你把题目截图给我，我可以逐题帮你判断。

## 5. Content rating

这个部分需要你完成 IARC 问卷。

原则：

- 全部按真实内容回答
- 不手填 `9+`
- 以 IARC 自动结果为准

大方向上应接近：

- 暴力：无
- 血腥：无
- 赌博：无
- 色情：无
- 仇恨内容：无
- 用户互动：无
- 位置共享：无
- 数字购买：无

## 6. Pricing and distribution

建议：

- 先免费发布

原因：

- 当前版本目标是先稳定首发
- 无广告、无内购的口径更简单

## 7. Release

### 上传包

建议：

- 上传 `AAB`

要求：

- 版本号正确
- 签名正确
- 使用最新代码构建

### Release notes

首发版可写得克制一点，例如：

- `Memory Garden first public release on Google Play.`
- `Includes local-first memory training, multilingual support, and Android-optimized experience.`

## 三、提交前最终自查

你提交前至少确认这 10 件事：

1. 隐私政策 URL 能打开
2. 商店文案里没有“治疗/康复保证”
3. 商店文案口径统一为 `9+`
4. Ads 填的是 `No`
5. App access 填的是无受限访问
6. Target audience 选的是 `9-12`、`13-15`
7. Data safety 按本地优先版本填写
8. 截图没有旧的云同步/登录口径
9. 上传的是最新 Signed AAB
10. 真机最终包已经回归验证过

## 四、当前最推荐的执行顺序

1. 先部署 Vercel，拿到隐私政策 URL
2. 准备商店图标、Feature Graphic、截图
3. 进入 Play Console 填 `App details`
4. 填 `App content`
5. 完成 `Data safety`
6. 完成 `IARC`
7. 上传 `AAB`
8. 做最终提交

## 五、如果你卡住，最值得马上发给我的内容

如果你下一步操作中卡住，最有帮助的是直接把以下任一内容发给我：

- Play Console 某一页的截图
- 某一个表单问题的原文
- IARC 某一道题目的选项
- Vercel 部署后的隐私政策 URL
- AAB 上传时报错信息

这样我可以继续按“逐页代填”的方式帮你推进。
