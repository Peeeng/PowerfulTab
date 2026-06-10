// 从 originals/ 保留的原图生成 1280×800 RGB PNG，主文件名也可直接上传。
// 使用：node scripts/prepare-store-screenshots.mjs
import sharp from 'sharp';
import { readFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = ['screen-1', 'screen-2'];

for (const name of files) {
  const input = fileURLToPath(new URL(`../release/screenshots/originals/${name}.png`, import.meta.url));
  const output = fileURLToPath(new URL(`../release/screenshots/${name}.png`, import.meta.url));

  await sharp(input)
    .flatten({ background: '#ffffff' })
    .resize(1280, 800, {
      fit: 'contain',
      position: 'centre',
      background: '#ffffff',
    })
    .toColourspace('srgb')
    .removeAlpha()
    .png({ palette: false, compressionLevel: 9 })
    .toFile(output);

  const metadata = await sharp(output).metadata();
  const png = await readFile(output);
  // PNG IHDR：8 bit/channel + color type 2（RGB）= 24 位、无 alpha。
  if (metadata.width !== 1280 || metadata.height !== 800
      || metadata.hasAlpha || metadata.channels !== 3
      || png[24] !== 8 || png[25] !== 2) {
    throw new Error(`商店截图格式验证失败：${output}`);
  }
  console.log(`✓ ${output} — 1280×800，24 位 RGB PNG，无 alpha`);
  // 保持之前分享的下载文件名可用，内容与主文件完全相同。
  const alias = fileURLToPath(new URL(`../release/screenshots/${name}-1280x800.png`, import.meta.url));
  await copyFile(output, alias);
}
