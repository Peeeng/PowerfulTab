// Convert retained originals to plain 1280×800, 24-bit RGB PNG screenshots.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = ['screen-1', 'screen-2', 'screen-3', 'screen-4'];

for (const name of files) {
  const input = fileURLToPath(new URL(`../release/screenshots/originals/${name}.png`, import.meta.url));
  const output = fileURLToPath(new URL(`../release/screenshots/${name}.png`, import.meta.url));

  await sharp(input)
    .flatten({ background: '#ffffff' })
    .resize(1280, 800, { fit: 'contain', position: 'centre', background: '#ffffff' })
    .toColourspace('srgb')
    .removeAlpha()
    .png({ palette: false, compressionLevel: 9 })
    .toFile(output);

  const metadata = await sharp(output).metadata();
  const png = await readFile(output);
  if (metadata.width !== 1280 || metadata.height !== 800
      || metadata.hasAlpha || metadata.channels !== 3
      || png[24] !== 8 || png[25] !== 2) {
    throw new Error(`Invalid store screenshot format: ${output}`);
  }
  console.log(`✓ ${output} — 1280×800, 24-bit RGB PNG, no alpha`);
}
