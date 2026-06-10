// 生成 Chrome Web Store 商店所需的图块：
//   - icon-128.png            （128×128、24 位 RGB、无 alpha）
//   - promo-small-440x280.png （小宣传图块，必填）
//   - promo-marquee-1400x560  （大宣传图块，推荐）
//
// 用 sharp 在内存里 SVG → PNG，无需任何外部依赖（sharp 已在 devDependencies）。
//
// 使用：node scripts/gen-promo.mjs
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'release/screenshots');
mkdirSync(OUT, { recursive: true });

// 商店图标与宣传图都使用正式 SVG，不维护第二套 Logo。
const iconSource = readFileSync(resolve(ROOT, 'src/assets/icons/icon.svg'));
const iconDst = resolve(OUT, 'icon-128.png');
await sharp(iconSource, { density: 576 })
  .resize(128, 128)
  .flatten({ background: '#ffffff' })
  .toColourspace('srgb')
  .removeAlpha()
  .png({ palette: false, compressionLevel: 9 })
  .toFile(iconDst);
console.log(`✓ ${iconDst}`);
const logoPng = await sharp(iconSource, { density: 576 }).resize(512, 512).png().toBuffer();
const logoUrl = `data:image/png;base64,${logoPng.toString('base64')}`;

// 共享品牌背景与正式图标。
const brand = (w, h, title, subtitle, opts = {}) => {
  const titleFontSize = opts.titleFontSize ?? Math.round(h * 0.16);
  const subtitleFontSize = opts.subtitleFontSize ?? Math.round(h * 0.058);
  const logoSize = opts.logoSize ?? Math.round(h * 0.4);
  const logoX = opts.logoX ?? Math.round(w * 0.06);
  const logoY = opts.logoY ?? Math.round(h * 0.5 - logoSize / 2);
  const textX = logoX + logoSize + Math.round(w * 0.04);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6f8cff"/>
      <stop offset="55%" stop-color="#5a72ff"/>
      <stop offset="100%" stop-color="#4f63f7"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.7" cy="0.3" r="0.8">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- 背景 -->
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <!-- 装饰小星 -->
  <g fill="#ffffff" opacity="0.25">
    <circle cx="${w * 0.85}" cy="${h * 0.18}" r="2.5"/>
    <circle cx="${w * 0.92}" cy="${h * 0.42}" r="1.5"/>
    <circle cx="${w * 0.78}" cy="${h * 0.78}" r="2"/>
  </g>
  <!-- 正式 PowerfulTab Logo -->
  <image href="${logoUrl}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"/>
  <!-- 文案 -->
  <g font-family="-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif" fill="#ffffff">
    <text x="${textX}" y="${h * 0.5 - subtitleFontSize * 0.4}" font-size="${titleFontSize}" font-weight="800" letter-spacing="-1">${title}</text>
    <text x="${textX}" y="${h * 0.5 + titleFontSize * 0.7}" font-size="${subtitleFontSize}" font-weight="500" opacity="0.85">${subtitle}</text>
  </g>
</svg>`;
};

const items = [
  {
    name: 'promo-small-440x280.png',
    w: 440,
    h: 280,
    title: 'PowerfulTab',
    subtitle: '标签整理 · 分组与搜索',
    titleFontSize: 36,
  },
  {
    name: 'promo-marquee-1400x560.png',
    w: 1400,
    h: 560,
    title: 'PowerfulTab',
    subtitle: '域名 / Path 分组 · 精确去重 · 标签搜索 · 本地运行',
  },
];

for (const it of items) {
  const svg = brand(it.w, it.h, it.title, it.subtitle, { titleFontSize: it.titleFontSize });
  const out = resolve(OUT, it.name);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
  console.log(`✓ ${out}`);
}

console.log(`\n📸 Promo 图已生成于 ${OUT}`);
console.log('   产品截图 (screen-1.png ~ screen-5.png) 请按 release/05-screenshots.md 手动拍。');
