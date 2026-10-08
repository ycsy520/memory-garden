import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const resRoot = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

const iconSourceRoot = path.join(projectRoot, 'assets', 'android-icons');
const iconMasterSourcePath = path.join(iconSourceRoot, 'logo-master-color-1024.png');
const foregroundSourcePath = path.join(iconSourceRoot, 'ic_launcher_foreground_432.png');
const monochromeSourcePath = path.join(iconSourceRoot, 'ic_launcher_monochrome_432.png');
const fallbackLegacyIconSourcePath = path.join(projectRoot, 'public', 'icon-192.png');
const splashIconSourcePath = path.join(projectRoot, 'public', 'icon-512.png');
const splashBackground = '#F7F5EF';

const legacyLauncherTargets = [
  'mipmap-mdpi/ic_launcher.png',
  'mipmap-mdpi/ic_launcher_round.png',
  'mipmap-hdpi/ic_launcher.png',
  'mipmap-hdpi/ic_launcher_round.png',
  'mipmap-xhdpi/ic_launcher.png',
  'mipmap-xhdpi/ic_launcher_round.png',
  'mipmap-xxhdpi/ic_launcher.png',
  'mipmap-xxhdpi/ic_launcher_round.png',
  'mipmap-xxxhdpi/ic_launcher.png',
  'mipmap-xxxhdpi/ic_launcher_round.png',
];

const foregroundTargets = [
  'mipmap-mdpi/ic_launcher_foreground.png',
  'mipmap-hdpi/ic_launcher_foreground.png',
  'mipmap-xhdpi/ic_launcher_foreground.png',
  'mipmap-xxhdpi/ic_launcher_foreground.png',
  'mipmap-xxxhdpi/ic_launcher_foreground.png',
];

const monochromeTargets = [
  'mipmap-mdpi/ic_launcher_monochrome.png',
  'mipmap-hdpi/ic_launcher_monochrome.png',
  'mipmap-xhdpi/ic_launcher_monochrome.png',
  'mipmap-xxhdpi/ic_launcher_monochrome.png',
  'mipmap-xxxhdpi/ic_launcher_monochrome.png',
];

const splashTargets = [
  'drawable/splash.png',
  'drawable-port-mdpi/splash.png',
  'drawable-port-hdpi/splash.png',
  'drawable-port-xhdpi/splash.png',
  'drawable-port-xxhdpi/splash.png',
  'drawable-port-xxxhdpi/splash.png',
  'drawable-land-mdpi/splash.png',
  'drawable-land-hdpi/splash.png',
  'drawable-land-xhdpi/splash.png',
  'drawable-land-xxhdpi/splash.png',
  'drawable-land-xxxhdpi/splash.png',
];

/**
 * 读取图片尺寸信息
 *
 * @param {string} filePath
 * @returns {Promise<{ width: number, height: number }>}
 */
async function readDimensions(filePath) {
  const metadata = await sharp(filePath).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`无法读取图片尺寸: ${filePath}`);
  }
  return { width: metadata.width, height: metadata.height };
}

/**
 * 生成 Android 启动图
 * 按现有目标文件尺寸生成，避免改动 Capacitor 默认资源结构。
 *
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
async function generateSplash(outputPath) {
  const { width, height } = await readDimensions(outputPath);
  const side = Math.max(96, Math.round(Math.min(width, height) * 0.42));
  const iconBuffer = await sharp(splashIconSourcePath)
    .resize(side, side, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: splashBackground,
    },
  })
    .composite([{
      input: iconBuffer,
      gravity: 'center',
    }])
    .png()
    .toFile(outputPath);
}

/**
 * 根据 Android density 目录推断目标尺寸。
 *
 * @param {string} filePath
 * @returns {{ width: number, height: number } | null}
 */
function inferLauncherDimensions(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.includes('mipmap-mdpi/')) return { width: 48, height: 48 };
  if (normalizedPath.includes('mipmap-hdpi/')) return { width: 72, height: 72 };
  if (normalizedPath.includes('mipmap-xhdpi/')) return { width: 96, height: 96 };
  if (normalizedPath.includes('mipmap-xxhdpi/')) return { width: 144, height: 144 };
  if (normalizedPath.includes('mipmap-xxxhdpi/')) return { width: 192, height: 192 };

  return null;
}

/**
 * 根据 Android density 目录推断 adaptive foreground/monochrome 图标尺寸。
 *
 * @param {string} filePath
 * @returns {{ width: number, height: number } | null}
 */
function inferAdaptiveDimensions(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.includes('mipmap-mdpi/')) return { width: 108, height: 108 };
  if (normalizedPath.includes('mipmap-hdpi/')) return { width: 162, height: 162 };
  if (normalizedPath.includes('mipmap-xhdpi/')) return { width: 216, height: 216 };
  if (normalizedPath.includes('mipmap-xxhdpi/')) return { width: 324, height: 324 };
  if (normalizedPath.includes('mipmap-xxxhdpi/')) return { width: 432, height: 432 };

  return null;
}

/**
 * 读取存在的首选素材，否则回退到兼容素材。
 *
 * @param {string[]} filePaths
 * @returns {Promise<string>}
 */
async function resolveExistingSource(filePaths) {
  for (const filePath of filePaths) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // 继续尝试下一个候选素材
    }
  }

  throw new Error(`未找到可用素材: ${filePaths.join(', ')}`);
}

/**
 * 生成 Android 图标位图
 * 以现有目标文件尺寸为准输出，便于复用 Capacitor 已生成的 mipmap 目录。
 *
 * @param {string} sourcePath
 * @param {string} outputPath
 * @param {(filePath: string) => ({ width: number, height: number } | null)} inferDimensions
 * @returns {Promise<void>}
 */
async function generateLauncher(sourcePath, outputPath, inferDimensions) {
  let width;
  let height;

  try {
    ({ width, height } = await readDimensions(outputPath));
  } catch {
    const inferred = inferDimensions(outputPath);
    if (!inferred) {
      throw new Error(`无法推断输出尺寸: ${outputPath}`);
    }
    ({ width, height } = inferred);
  }

  await sharp(sourcePath)
    .resize(width, height, { fit: 'cover' })
    .png()
    .toFile(outputPath);
}

/**
 * 依次生成指定资源列表
 *
 * @param {string[]} targets
 * @param {(outputPath: string) => Promise<void>} generator
 * @returns {Promise<void>}
 */
async function writeTargets(targets, generator) {
  for (const relativePath of targets) {
    const outputPath = path.join(resRoot, relativePath);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await generator(outputPath);
  }
}

/**
 * 主入口
 * 生成 Android 启动图和图标资源。
 *
 * @returns {Promise<void>}
 */
async function main() {
  await fs.access(splashIconSourcePath);

  const legacySourcePath = await resolveExistingSource([
    iconMasterSourcePath,
    fallbackLegacyIconSourcePath,
  ]);
  const adaptiveForegroundSourcePath = await resolveExistingSource([
    foregroundSourcePath,
    iconMasterSourcePath,
    fallbackLegacyIconSourcePath,
  ]);
  const adaptiveMonochromeSourcePath = await resolveExistingSource([
    monochromeSourcePath,
    foregroundSourcePath,
    iconMasterSourcePath,
    fallbackLegacyIconSourcePath,
  ]);

  await writeTargets(legacyLauncherTargets, (outputPath) => generateLauncher(legacySourcePath, outputPath, inferLauncherDimensions));
  await writeTargets(foregroundTargets, (outputPath) => generateLauncher(adaptiveForegroundSourcePath, outputPath, inferAdaptiveDimensions));
  await writeTargets(monochromeTargets, (outputPath) => generateLauncher(adaptiveMonochromeSourcePath, outputPath, inferAdaptiveDimensions));
  await writeTargets(splashTargets, generateSplash);

  console.log('[generate-android-assets] Android 图标与启动图已更新');
}

main().catch((error) => {
  console.error('[generate-android-assets] 生成失败', error);
  process.exitCode = 1;
});
