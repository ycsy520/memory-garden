/**
 * SVG to PNG icon converter
 * Uses sharp library for high quality conversion
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');

async function convertSvgToPng(svgFile, pngFile, size) {
  const svgPath = path.join(publicDir, svgFile);
  const pngPath = path.join(publicDir, pngFile);
  
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(pngPath);
  
  console.log('Converted: ' + svgFile + ' -> ' + pngFile + ' (' + size + 'x' + size + ')');
}

async function main() {
  await convertSvgToPng('icon-192.svg', 'icon-192.png', 192);
  await convertSvgToPng('icon-512.svg', 'icon-512.png', 512);
  console.log('Done!');
}

main().catch(console.error);
