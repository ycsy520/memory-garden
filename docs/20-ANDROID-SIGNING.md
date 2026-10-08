# Android Signing Guide

## 目标

为 `Memory Garden` 生成正式发布签名，并让 Android Studio 可以稳定导出 `AAB`。

## 已完成的仓库准备

项目已支持：

- 从 `android/key.properties` 读取 release 签名配置
- `android/key.properties.example` 作为模板
- `.gitignore` 已忽略 `key.properties` 与 keystore 文件

## 第一步：生成 keystore

在 Windows PowerShell 中执行：

```powershell
keytool -genkeypair -v `
  -keystore "F:\git\game\memory-garden\android\release.keystore" `
  -alias memorygarden `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

执行后会让你输入：

- keystore 密码
- key 密码
- 名称、组织、地区等信息

## 第二步：创建 key.properties

复制：

- `android/key.properties.example`

为：

- `android/key.properties`

并填入你自己的实际值，例如：

```properties
storeFile=release.keystore
storePassword=你的-keystore-密码
keyAlias=memorygarden
keyPassword=你的-key-密码
```

说明：

- `storeFile=release.keystore` 会相对 `android/` 目录解析
- 不要把真实密码提交到 Git 仓库

## 第三步：在 Android Studio 中同步

1. 打开 Android 工程
2. 等待 `Gradle Sync`
3. 如果没有报错，说明签名配置读取成功

你也可以先在项目根目录执行：

```powershell
npm run release:android:check
```

它会直接告诉你：

- `key.properties` 是否存在
- keystore 路径是否有效
- 当前是否已具备导出正式 `AAB` 的条件

## 第四步：导出正式 AAB

在 Android Studio 中：

1. `Build`
2. `Generate Signed Bundle / APK`
3. 选择 `Android App Bundle`
4. 选择刚才的 `release.keystore`
5. 填写密码与别名
6. 选择 `release`
7. 导出 `.aab`

## 上架前再检查一次

- 图标是否已替换为花园品牌图标
- 启动图是否已替换
- `versionName` 是否与 `package.json` 一致
- `versionCode` 是否递增
- 真机测试是否通过
- 是否已准备 Play Console 素材与隐私政策
