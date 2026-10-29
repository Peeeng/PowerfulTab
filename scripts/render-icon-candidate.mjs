// 候选图标导出，不覆盖扩展正在使用的 src/assets/icons/。
// 使用：node scripts/render-icon-candidate.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = await readFile(new URL('../release/icons/powerfultab-v2.svg', import.meta.url));
for (const size of [16, 32, 48, 128, 512]) {
  const output = fileURLToPath(new URL(`../release/icons/powerfultab-v2-${size}.png`, import.meta.url));
  await sharp(source, { density: 576 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(output);
  console.log(`✓ ${output}`);
}

const storeOutput = fileURLToPath(new URL('../release/icons/powerfultab-v2-store-128.png', import.meta.url));
await sharp(source, { density: 576 })
  .resize(128, 128)
  .flatten({ background: '#ffffff' })
  .toColourspace('srgb')
  .removeAlpha()
  .png({ palette: false, compressionLevel: 9 })
  .toFile(storeOutput);

const metadata = await sharp(storeOutput).metadata();
const bytes = await readFile(storeOutput);
if (metadata.width !== 128 || metadata.height !== 128
    || metadata.hasAlpha || metadata.channels !== 3
    || bytes[24] !== 8 || bytes[25] !== 2) {
  throw new Error('商店图标格式验证失败');
}
console.log(`✓ ${storeOutput} — 128×128、24 位 RGB PNG、无 alpha`);
