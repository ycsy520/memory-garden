# Android Release Checklist

## 目标

本清单用于把 `Memory Garden` 从“能在 Android Studio 运行”推进到“可提交 Google Play 的正式版”。

## 当前结论

项目已经具备以下基础能力：

- Capacitor Android 容器已接入
- 状态栏、启动图、触觉、分享、文件导出已接入原生插件
- Android 顶部状态栏已改为透明沉浸式，并补了原生安全区兜底
- 系统返回键与 App 前后台生命周期已开始桥接
- Android 版本号已改为读取 `package.json`
- Android 图标与启动图已替换为花园主题资源
- 发布签名配置已支持通过 `android/key.properties` 注入

但距离正式上架，还缺少若干发布级内容。

## 必须完成

### 1. 发布签名

- [ ] 生成 release keystore
- [x] 在 `android/app/build.gradle` 增加 `signingConfigs.release`
- [ ] 在 Android Studio 产出正式 `AAB`

没有签名配置，就不算可正式发布。

### 2. 品牌资源

- [x] 替换默认 App 图标
- [x] 替换默认启动图
- [ ] 检查深浅背景下图标识别度

当前工程仍含默认 Capacitor 图标与启动图，不适合上架。

### 3. 真机回归

至少验证：

- 首页启动
- 菜单导航
- 游戏开始 / 暂停 / 继续 / 结束
- 系统返回键
- 切到后台再回来
- 导入备份
- 导出备份
- 登录与同步

### 4. Google Play 控制台资料

- 应用标题
- 简短描述
- 详细描述
- 图标 512x512
- Feature Graphic
- 手机截图
- 隐私政策 URL
- 联系邮箱

### 5. 合规申报

需要按真实情况填写：

- Data safety
- Content rating
- App access
- 是否面向儿童

项目用了：

- Supabase
- 本地训练记录
- 可选账号登录
- 可选 Sentry

这些都应进入申报判断。

## 强烈建议完成

### 1. 接入 release 构建优化

- 评估 `minifyEnabled true`
- 评估资源收缩
- 产出一版 release 真机包做回归

### 2. 决定 `allowBackup` 策略

当前 Manifest 中仍允许系统级备份，需要明确：

- 是否保留系统自动备份
- 是否改为显式关闭

### 3. Android 名称与文案本地化

如计划面向多语言市场，建议补：

- `values-zh-rTW`
- `values-en`

## 当前插件评估

### 已接入，且属于当前核心必要项

- `@capacitor/app`
- `@capacitor/filesystem`
- `@capacitor/haptics`
- `@capacitor/share`
- `@capacitor/splash-screen`
- `@capacitor/status-bar`

### 当前不必急着加

- Push Notifications
- Local Notifications
- Camera
- Geolocation
- Browser

这些不是当前核心玩法依赖，先不引入更稳。

### 可选增强项

- Network：弱网提示、同步重试
- 原生文件选择器：让导入备份更像正式 App

## 建议的下一步顺序

1. 生成 release keystore 并填写 `android/key.properties`
2. 出 release AAB
3. 做真机回归
4. 准备 Play Console 素材
5. 填合规表单后提交封闭测试
