/**
 * Превью для соцсетей и мессенджеров, 1200×630.
 * Собирается из кадра секвенции и той же типографики, что на странице,
 * — чтобы ссылка в WhatsApp выглядела как продолжение сайта.
 */

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { svgToPng, C, FONT, esc } from './lib/render.mjs';

const W = 1200;
const H = 630;

// Значения дублируют конфиг клиента: скрипт не тянет TypeScript ради двух строк.
const CITY = 'Нижнекамск';
const NAME = 'СОСТАВ';
const PICKUP = 30;

const t = (x, y, size, text, o = {}) => {
  const { font = FONT.mono, fill = C.ink, spacing = 0.04, anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${(size * spacing).toFixed(2)}">${esc(text)}</text>`;
};

const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  ${Array.from({ length: 9 }, (_, i) => {
    const x = (W / 8) * i;
    return `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${C.ink}" stroke-opacity=".07"/>`;
  }).join('')}
  <line x1="72" y1="104" x2="${W - 72}" y2="104" stroke="${C.ink}" stroke-opacity=".2"/>
  ${t(72, 90, 18, `СПОРТИВНОЕ ПИТАНИЕ · ${CITY.toUpperCase()}`, { fill: C.steel, spacing: 0.08 })}
  ${t(W - 72, 90, 18, NAME, { anchor: 'end', spacing: 0.08 })}

  ${t(72, 230, 62, 'Подберём добавки', { font: FONT.display, spacing: -0.02 })}
  ${t(72, 300, 62, 'под вашу цель', { font: FONT.display, spacing: -0.02 })}

  ${t(72, 372, 22, 'Четыре вопроса — и готовый набор с ценами', { font: FONT.sans, fill: C.steel, spacing: 0 })}

  <line x1="72" y1="440" x2="640" y2="440" stroke="${C.ink}" stroke-opacity=".2"/>
  ${t(72, 492, 44, '4', { spacing: -0.03 })}
  ${t(72, 520, 15, 'ВОПРОСА', { fill: C.steel, spacing: 0.06 })}
  ${t(260, 492, 44, String(PICKUP), { spacing: -0.03 })}
  ${t(260, 520, 15, 'МИНУТ ДО ЗАБОРА', { fill: C.steel, spacing: 0.06 })}
  ${t(560, 492, 44, '100%', { spacing: -0.03 })}
  ${t(560, 520, 15, 'ПРОВЕРКА КОДА', { fill: C.steel, spacing: 0.06 })}

  ${t(72, 590, 14, 'БАД. НЕ ЯВЛЯЕТСЯ ЛЕКАРСТВЕННЫМ СРЕДСТВОМ', { fill: C.steel, spacing: 0.06 })}
</svg>`;

const base = await svgToPng(bg, W);
const jar = await sharp(readFileSync('public/seq/jar-12.webp'))
  .resize({ width: 560 })
  .toBuffer();

await sharp(base)
  .composite([{ input: jar, left: W - 560 + 40, top: 60 }])
  .webp({ quality: 84, effort: 5 })
  .toFile('public/demo/og.webp');

console.log('og.webp готов');
