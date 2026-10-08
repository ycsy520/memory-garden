import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const androidRoot = path.join(projectRoot, 'android');
const packageJsonPath = path.join(projectRoot, 'package.json');
const buildGradlePath = path.join(androidRoot, 'app', 'build.gradle');
const keyPropertiesPath = path.join(androidRoot, 'key.properties');

/**
 * 读取 UTF-8 文本文件。
 *
 * @param {string} filePath
 * @returns {string}
 */
function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * 检查目标文件是否存在。
 *
 * @param {string} filePath
 * @returns {boolean}
 */
function exists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * 将 key.properties 文本解析为简单键值对象。
 *
 * @param {string} source
 * @returns {Record<string, string>}
 */
function parseProperties(source) {
  return source
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((result, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return result;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      result[key] = value;
      return result;
    }, /** @type {Record<string, string>} */ ({}));
}

/**
 * 把 `5.2.0` 这种 semver 转成 Android versionCode。
 *
 * @param {string} version
 * @returns {number}
 */
function toAndroidVersionCode(version) {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/u);
  if (!match) {
    return 1;
  }

  const [, major, minor, patch] = match;
  return (Number(major) * 10000) + (Number(minor) * 100) + Number(patch);
}

/**
 * 输出单条检查结果。
 *
 * @param {string} label
 * @param {boolean} ok
 * @param {string} detail
 */
function printCheck(label, ok, detail) {
  const prefix = ok ? '[OK] ' : '[MISSING] ';
  console.log(`${prefix}${label}: ${detail}`);
}

/**
 * 解析并返回 Android 发布前状态。
 *
 * @returns {{ hasBlockingIssue: boolean }}
 */
function runChecks() {
  const packageJson = JSON.parse(readText(packageJsonPath));
  const packageVersion = packageJson.version ?? '1.0.0';
  const expectedVersionCode = toAndroidVersionCode(packageVersion);
  const buildGradle = readText(buildGradlePath);

  console.log('Android 发布前检查');
  console.log(`- package.json version: ${packageVersion}`);
  console.log(`- expected versionCode: ${expectedVersionCode}`);
  console.log('');

  const usesPackageVersion = buildGradle.includes('readPackageVersionName()')
    && buildGradle.includes('versionName packageVersionName')
    && buildGradle.includes('versionCode packageVersionCode');
  printCheck('Android 版本号单一来源', usesPackageVersion, usesPackageVersion
    ? 'build.gradle 已从 package.json 读取 versionName/versionCode'
    : 'build.gradle 还没有正确接入 package.json 版本号');

  const usesReleaseSigning = buildGradle.includes('key.properties')
    && buildGradle.includes('signingConfigs')
    && buildGradle.includes('signingConfig signingConfigs.release');
  printCheck('Release 签名配置', usesReleaseSigning, usesReleaseSigning
    ? 'build.gradle 已支持从 key.properties 读取 release 签名'
    : 'build.gradle 还没有接好 release signingConfig');

  const hasKeyProperties = exists(keyPropertiesPath);
  printCheck('android/key.properties', hasKeyProperties, hasKeyProperties
    ? '已存在，可继续校验 keystore'
    : '未找到，当前还不能生成正式签名包');

  let hasKeystore = false;
  if (hasKeyProperties) {
    const properties = parseProperties(readText(keyPropertiesPath));
    const storeFile = properties.storeFile?.trim();
    const hasPasswords = Boolean(properties.storePassword && properties.keyPassword && properties.keyAlias);
    printCheck('key.properties 必填项', hasPasswords, hasPasswords
      ? 'storePassword / keyAlias / keyPassword 已填写'
      : 'key.properties 还缺少密码或别名');

    if (storeFile) {
      const keystorePath = path.resolve(androidRoot, storeFile);
      hasKeystore = exists(keystorePath);
      printCheck('Keystore 文件', hasKeystore, hasKeystore
        ? `已找到: ${keystorePath}`
        : `未找到: ${keystorePath}`);
    } else {
      printCheck('Keystore 文件', false, 'key.properties 没有填写 storeFile');
    }
  }

  const isReadyForSignedBundle = usesPackageVersion && usesReleaseSigning && hasKeyProperties && hasKeystore;
  console.log('');
  if (isReadyForSignedBundle) {
    console.log('[READY] 当前已具备生成 Signed Bundle / AAB 的基础条件。');
  } else {
    console.log('[BLOCKED] 当前还缺签名材料或配置，暂时不能稳定导出正式 AAB。');
    console.log('下一步：先生成 release.keystore，并补齐 android/key.properties。');
  }

  return { hasBlockingIssue: !isReadyForSignedBundle };
}

const result = runChecks();
process.exitCode = result.hasBlockingIssue ? 1 : 0;
