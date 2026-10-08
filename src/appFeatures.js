/**
 * 应用功能开关
 * 统一管理当前版本是否开放某些能力，避免多个页面各自硬编码。
 */
export const APP_FEATURES = {
  /** 当前 Google Play 版本采用 9+ 口径。 */
  recommendedMinimumAge: 9,
  /** 当前 Android / Google Play 版本先关闭云端登录与同步，所有数据仅保存在本地。 */
  cloudSyncEnabled: false,
  /** 当前 Google Play 版本关闭远程错误上报与远程统计，避免与本地存储口径冲突。 */
  remoteReportingEnabled: false,
};

export default APP_FEATURES;
