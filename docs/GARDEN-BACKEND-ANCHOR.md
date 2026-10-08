# 记忆花园·后端与账号系统实施路线图 (Memory Garden Implementation Roadmap)

> **版本**: v1.3  
> **更新日期**: 2026-07-08  
> **状态**: P0 已完成 ✅  
> **定位**: 记忆花园项目后端架构、账号系统、数据持久化及管理端的唯一实施锚点文档。  
> **技术栈**: Supabase (BaaS) + Capacitor (App壳) + Taro/Uni-app (小程序)

---

## 1. 数据库建表脚本 (Supabase SQL)

已生成并验证完整的数据库结构设计。以下为核心建表 SQL，已预先写入本地 `/docs/supabase_schema.sql`，可直接导入 Supabase SQL Editor 中运行：

- **profiles**: 用户基础档案（集成 Supabase Auth）。
- **sessions**: 记忆训练记录（包含 `schema_version` 与自适应自变量）。
- **narrative_unlocks**: 32段叙事解锁状态（唯一约束防重）。
- **diary_entries**: 花园日记卡片快照。
- **auth_identities**: 多登录方式关联表（支持游客转正）。
- **user_settings**: 用户独立偏好设置。

---

## 2. P0 阶段：账号骨架与游客云同步 ✅ 已完成

> 完成日期: 2026-07-08  
> 版本: v5.2.0

### **1. 启动与静默登录** ✅

- 打开游戏后，检查本地 LocalStorage 是否存有 Supabase Session Token。
- 若无，静默调用 `supabase.auth.signInAnonymously()` 创建游客账户，将返回的 `user_id` 绑定至本地游戏状态。

### **2. 极简"账号中心"与"设置"整合** ✅

- 避免繁琐的独立登录页，直接在 **设置页 (Settings)** 顶部加入 **账号状态看板**：

  ```text
  [ 🌿 我的花园云同步 ]
  当前身份：游客模式 (数据已保存在本机)
  [立即保存到云端] -> 绑定手机/邮箱入口
  ```

- 整合 **数据与隐私安全**：
  - [导出备份] 按钮：允许导出 JSON 格式的训练历史。
  - [清除本地数据] / [注销并删除云端账户] 红色按钮。

### **3. P0 实施清单**

| 项目 | 状态 | 文件 |
|------|------|------|
| Supabase 客户端初始化 | ✅ | `src/services/supabaseClient.js` |
| 匿名登录 | ✅ | `src/services/AuthService.js` |
| 邮箱 OTP 登录 | ✅ | `src/services/AuthService.js` |
| Auth Store | ✅ | `src/stores/useAuthStore.js` |
| 数据同步服务 | ✅ | `src/services/SyncService.js` |
| 离线队列 | ✅ | `src/services/SyncService.js` |
| 游戏结束触发同步 | ✅ | `src/hooks/useGameEngine.js` |
| 解锁触发同步 | ✅ | `src/stores/useAchievementStore.js` |
| 设置页账号卡片 | ✅ | `src/screens/SettingsScreen.jsx` |
| 账户注销 Edge Function | ✅ | `supabase/functions/delete-account/index.ts` |
| 免责声明 | ✅ | `src/screens/SettingsScreen.jsx` |
| 数据库迁移 | ✅ | `docs/supabase_p0_migration.sql` |
| RLS 策略 | ✅ | `docs/supabase_p0_migration.sql` |

### **4. 已随 P0 一并完成的配套交付** ✅

| 项目 | 状态 | 文件 |
|------|------|------|
| 关于页统一布局 | ✅ | `src/screens/about/AboutLayout.jsx` |
| 免责声明独立页面 | ✅ | `src/screens/about/DisclaimerPage.jsx` |
| 隐私政策独立页面 | ✅ | `src/screens/about/PrivacyPage.jsx` |
| 使用条款独立页面 | ✅ | `src/screens/about/TermsPage.jsx` |
| N-back 科学介绍页面 | ✅ | `src/screens/about/NbackPage.jsx` |
| 关于页面路由接入 | ✅ | `src/App.jsx` |
| 设置页关于入口 | ✅ | `src/screens/SettingsScreen.jsx` |
| 三语翻译补全 | ✅ | `src/i18n/zh-CN.json` / `src/i18n/en-US.json` / `src/i18n/zh-TW.json` |
| Chrome PWA 安装兼容修复 | ✅ | `vite.config.ts` / `index.html` / `public/icon-192.png` / `public/icon-512.png` |
| 设置页注销按钮防误触优化 | ✅ | `src/screens/SettingsScreen.jsx` |

---

## 3. 合规性设计 (App Store & 微信小程序必备)

1. **账户注销 (Account Deletion)** ✅：
   - 提供二次确认弹窗，强制输入 "DELETE" 以确认。
   - 调用 Supabase Edge Function `delete-account` 进行全表级联物理删除，或匿名化处理。
2. **免责声明 (Medical Disclaimer)** ✅：
   - 必须在设置或关于页面注明："*本产品为注意力与工作记忆练习工具，不用于医疗诊断、治疗或任何疾病预防。*"
3. **隐私政策 / 使用条款 / 科学介绍页面** ✅：
   - 已落地独立页面：免责声明、隐私政策、使用条款、N-back 科学介绍。
   - 已在设置页提供入口，满足审核和合规说明的可访问性要求。

---

## 4. P0+ 后续迭代计划

### P1: 认证方式扩展

| 功能 | 工作量 | 成本 | 优先级 |
|------|--------|------|--------|
| 邮箱验证码 (OTP) | 0.5 天 | 免费 | ✅ 已完成 |
| 匿名→正式升级 | 1 天 | 免费 | P1-最高 |
| Apple Sign In | 1 天 | $99/年 | P1 |

### P2: 社交与小程序

| 功能 | 工作量 | 成本 | 优先级 |
|------|--------|------|--------|
| Google Sign In | 0.5 天 | 免费 | P2 |
| 手机号+短信 | 1 天 | ¥0.05-0.10/条 | P2 |
| 微信 OAuth | 2-3 天 | ¥300/年 | P2 |
| Taro/Uni-app 小程序壳 | 5-7 天 | — | P2 |

### P3: 高级功能

| 功能 | 工作量 | 成本 | 优先级 |
|------|--------|------|--------|
| Realtime 多设备同步 | 2 天 | — | P3 |
| 管理端 Dashboard | 5 天 | — | P3 |

### 当前推荐执行顺序

1. **匿名→正式升级**：优先补齐游客账户转正式账户的数据继承闭环。
2. **Apple Sign In / Google Sign In**：依据实际上架平台选择先后顺序。
3. **手机号+短信**：面向国内用户进一步降低登录门槛。
4. **微信 OAuth + 小程序壳**：在明确小程序渠道投入后推进。
5. **Realtime 同步 / 管理端**：待用户量与运营需求明确后再做。

---

*后续开发将严格以此文档为唯一锚点，按 Phase 逐一落地。*
