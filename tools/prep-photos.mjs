/**
 * Приводит сгенерированные фотографии к пропорциям слотов на странице
 * и укладывает в /public/demo.
 *
 * ChatGPT отдаёт только три формата (1536×1024, 1024×1024, 1024×1536),
 * а на макете у каждого слота свои размеры — поэтому кадрируем по центру
 * и жмём в webp. Исходники лежат в .gen/ и в репозиторий не идут.
 */

import sharp from 'sharp';
import { existsSync } from 'node:fs';

const SRC = '.gen';
const OUT = 'public/demo';

/** width/height берутся из разметки соответствующего блока. */
const JOBS = [
  { file: 'store-1', w: 900, h: 620, gravity: 'centre' },
  { file: 'store-2', w: 600, h: 620, gravity: 'centre' },
  { file: 'store-3', w: 600, h: 620, gravity: 'centre' },
  // Портрет консультанта кадрируем сверху: лицо не должно уезжать под обрез.
  { file: 'consultant', w: 640, h: 800, gravity: 'north' },
  { file: 'guarantee-1', w: 640, h: 460, gravity: 'centre' },
  { file: 'guarantee-2', w: 560, h: 400, gravity: 'centre' },
  { file: 'guarantee-3', w: 520, h: 380, gravity: 'centre' },
  { file: 'review-1', w: 200, h: 200, gravity: 'north' },
  { file: 'review-video', w: 560, h: 760, gravity: 'north' },
];

const kb = (n) => `${(n / 1024).toFixed(0)} КБ`;
let total = 0;

for (const job of JOBS) {
  const src = `${SRC}/${job.file}.png`;
  if (!existsSync(src)) {
    console.log(`пропуск: нет ${src}`);
    continue;
  }

  const buf = await sharp(src)
    .resize({ width: job.w, height: job.h, fit: 'cover', position: job.gravity })
    .webp({ quality: 80, effort: 6 })
    .toBuffer();

  await sharp(buf).toFile(`${OUT}/${job.file}.webp`);
  total += buf.length;
  console.log(`${job.file.padEnd(14)} ${job.w}×${job.h}  ${kb(buf.length)}`);
}

console.log(`\nитого ${kb(total)}`);
