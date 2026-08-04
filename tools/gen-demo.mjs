/**
 * Демо-ассеты: карточки товаров, плитки категорий и плейсхолдеры под
 * съёмку клиента.
 *
 * Ни одного реального бренда — упаковки нарисованы по той же логике,
 * что и вся страница: имя по составу, цифра крупно, единица мельче.
 * Фотографии магазина и людей заменяются съёмкой клиента (раздел 6.1 ТЗ),
 * поэтому здесь они оформлены как слоты с номером кадра из брифа.
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { svgToPng, C, FONT, esc } from './lib/render.mjs';

const OUT = 'public/demo';

const t = (x, y, size, text, o = {}) => {
  const {
    font = FONT.mono,
    fill = C.ink,
    anchor = 'start',
    spacing = 0.04,
    opacity = 1,
  } = o;
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}" fill-opacity="${opacity}" text-anchor="${anchor}" letter-spacing="${(size * spacing).toFixed(2)}">${esc(text)}</text>`;
};

const rule = (x1, y, x2, o = 0.18) =>
  `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.ink}" stroke-opacity="${o}" stroke-width="1.4"/>`;

/** Градиенты корпуса: один и тот же цилиндрический уход для всех форм. */
const defs = `
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0C0F12"/>
      <stop offset=".2" stop-color="#262C33"/>
      <stop offset=".45" stop-color="#343B43"/>
      <stop offset=".72" stop-color="#1F242A"/>
      <stop offset="1" stop-color="#0C0F12"/>
    </linearGradient>
    <linearGradient id="cap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#060809"/>
      <stop offset=".38" stop-color="#1F242A"/>
      <stop offset=".68" stop-color="#12161A"/>
      <stop offset="1" stop-color="#060809"/>
    </linearGradient>
    <linearGradient id="paperShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".34"/>
      <stop offset=".18" stop-color="#000" stop-opacity=".06"/>
      <stop offset=".45" stop-color="#000" stop-opacity="0"/>
      <stop offset=".78" stop-color="#000" stop-opacity=".1"/>
      <stop offset="1" stop-color="#000" stop-opacity=".38"/>
    </linearGradient>
    <radialGradient id="drop" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#14171A" stop-opacity=".26"/>
      <stop offset="1" stop-color="#14171A" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

/**
 * Формы упаковок. Каждая возвращает корпус и прямоугольник под этикетку,
 * чтобы подпись всегда ложилась по месту.
 */
function shape(kind, cx, baseY) {
  switch (kind) {
    case 'jar': {
      const w = 300;
      const h = 372;
      const r = w / 2;
      const ry = 26;
      const top = baseY - h;
      return {
        body: `
          <path d="M ${cx - r - 9} ${top - 44} L ${cx - r - 9} ${top + 6}
            A ${r + 9} ${ry} 0 0 0 ${cx + r + 9} ${top + 6}
            L ${cx + r + 9} ${top - 44}
            A ${r + 9} ${ry} 0 0 0 ${cx - r - 9} ${top - 44} Z" fill="url(#cap)"/>
          <ellipse cx="${cx}" cy="${top - 44}" rx="${r + 9}" ry="${ry}" fill="#333A42"/>
          <path d="M ${cx - r} ${top} L ${cx - r} ${baseY}
            A ${r} ${ry} 0 0 0 ${cx + r} ${baseY}
            L ${cx + r} ${top}
            A ${r} ${ry} 0 0 1 ${cx - r} ${top} Z" fill="url(#body)"/>`,
        label: { x: cx - r, y: top + 64, w, h: 232 },
      };
    }
    case 'jar-sm': {
      const w = 236;
      const h = 262;
      const r = w / 2;
      const ry = 21;
      const top = baseY - h;
      return {
        body: `
          <path d="M ${cx - r - 8} ${top - 36} L ${cx - r - 8} ${top + 5}
            A ${r + 8} ${ry} 0 0 0 ${cx + r + 8} ${top + 5}
            L ${cx + r + 8} ${top - 36}
            A ${r + 8} ${ry} 0 0 0 ${cx - r - 8} ${top - 36} Z" fill="url(#cap)"/>
          <ellipse cx="${cx}" cy="${top - 36}" rx="${r + 8}" ry="${ry}" fill="#2C333A"/>
          <path d="M ${cx - r} ${top} L ${cx - r} ${baseY}
            A ${r} ${ry} 0 0 0 ${cx + r} ${baseY}
            L ${cx + r} ${top}
            A ${r} ${ry} 0 0 1 ${cx - r} ${top} Z" fill="url(#body)"/>`,
        label: { x: cx - r, y: top + 46, w, h: 176 },
      };
    }
    case 'caps': {
      const w = 210;
      const h = 250;
      const r = w / 2;
      const ry = 19;
      const top = baseY - h;
      return {
        body: `
          <rect x="${cx - 62}" y="${top - 58}" width="124" height="66" rx="6" fill="url(#cap)"/>
          <ellipse cx="${cx}" cy="${top - 58}" rx="62" ry="11" fill="#2C333A"/>
          <path d="M ${cx - r} ${top} L ${cx - r} ${baseY}
            A ${r} ${ry} 0 0 0 ${cx + r} ${baseY}
            L ${cx + r} ${top}
            A ${r} ${ry} 0 0 1 ${cx - r} ${top} Z" fill="url(#body)"/>`,
        label: { x: cx - r, y: top + 38, w, h: 172 },
      };
    }
    case 'bottle': {
      const w = 176;
      const h = 396;
      const r = w / 2;
      const ry = 16;
      const top = baseY - h;
      return {
        body: `
          <rect x="${cx - 34}" y="${top - 76}" width="68" height="52" rx="5" fill="url(#cap)"/>
          <path d="M ${cx - 30} ${top - 26} L ${cx - r} ${top + 46} L ${cx - r} ${baseY}
            A ${r} ${ry} 0 0 0 ${cx + r} ${baseY}
            L ${cx + r} ${top + 46} L ${cx + 30} ${top - 26} Z" fill="url(#body)"/>`,
        label: { x: cx - r, y: top + 96, w, h: 208 },
      };
    }
    case 'pouch': {
      const w = 336;
      const h = 424;
      const r = w / 2;
      const top = baseY - h;
      return {
        body: `
          <path d="M ${cx - r + 18} ${top} L ${cx + r - 18} ${top}
            L ${cx + r} ${top + 44} L ${cx + r} ${baseY - 16}
            Q ${cx + r} ${baseY} ${cx + r - 20} ${baseY}
            L ${cx - r + 20} ${baseY}
            Q ${cx - r} ${baseY} ${cx - r} ${baseY - 16}
            L ${cx - r} ${top + 44} Z" fill="url(#body)"/>
          <rect x="${cx - r + 18}" y="${top - 26}" width="${w - 36}" height="30" rx="3" fill="#2C333A"/>`,
        label: { x: cx - r + 14, y: top + 76, w: w - 28, h: 250 },
      };
    }
    case 'box':
    default: {
      const w = 372;
      const h = 258;
      const r = w / 2;
      const top = baseY - h;
      return {
        body: `
          <path d="M ${cx - r} ${top + 34} L ${cx - r + 54} ${top} L ${cx + r} ${top}
            L ${cx + r} ${baseY - 34} L ${cx + r - 54} ${baseY} L ${cx - r} ${baseY} Z"
            fill="url(#body)"/>
          <path d="M ${cx - r} ${top + 34} L ${cx - r + 54} ${top} L ${cx - r + 54} ${baseY} L ${cx - r} ${baseY} Z"
            fill="#0C0F12" opacity=".5"/>`,
        label: { x: cx - r + 70, y: top + 30, w: w - 96, h: 198 },
      };
    }
  }
}

/**
 * Этикетка: эйбрау, имя по составу, линейка, крупная цифра и единица мельче.
 * Вертикальный ритм задан явно — иначе на узких упаковках строки наезжают.
 */
function labelBlock(box, item) {
  const { x, y, w, h } = box;
  const pad = Math.round(w * 0.085);
  const browSize = Math.max(9, Math.round(w * 0.04));
  const nameSize = Math.max(14, Math.round(w * 0.082));
  const numSize = Math.max(26, Math.round(w * 0.16));
  const unitSize = Math.max(9, Math.round(w * 0.042));

  const lines = item.title.split('\n');
  const nameTop = y + pad + browSize + 26;
  const ruleY = nameTop + (lines.length - 1) * (nameSize + 6) + 18;

  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.paper}"/>
    <rect x="${x}" y="${y}" width="${w}" height="5" fill="${C.ink}"/>
    <rect x="${x}" y="${y + h - 5}" width="${w}" height="5" fill="${C.ink}"/>
    ${t(x + pad, y + pad + browSize + 4, browSize, item.brow, { fill: C.steel, spacing: 0.08 })}
    ${lines
      .map((line, i) =>
        t(x + pad, nameTop + i * (nameSize + 6), nameSize, line, {
          font: FONT.display,
          spacing: -0.02,
        }),
      )
      .join('')}
    ${rule(x + pad, ruleY, x + w - pad)}
    ${t(x + w - pad, ruleY + 20, unitSize + 1, item.pack, { anchor: 'end', spacing: 0.03 })}
    ${t(x + pad, y + h - 34, numSize, item.big, { spacing: -0.03 })}
    ${t(x + pad, y + h - 16, unitSize, item.unit, { fill: C.steel, spacing: 0.06 })}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#paperShade)"/>`;
}

function productSvg(item, size = 640) {
  const cx = size / 2;
  const baseY = Math.round(size * 0.84);
  const s = shape(item.kind, cx, baseY);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs}
    <rect width="${size}" height="${size}" fill="${C.paper2}"/>
    <ellipse cx="${cx}" cy="${baseY + 18}" rx="${size * 0.3}" ry="26" fill="url(#drop)"/>
    ${s.body}
    ${labelBlock(s.label, item)}
    <rect x="0" y="0" width="${size}" height="${size}" fill="none"/>
  </svg>`;
}

/** Слот под съёмку клиента: номер кадра из брифа и требуемый размер. */
function slotSvg(w, h, { n, title, note }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${C.paper2}"/>
    <rect x="12" y="12" width="${w - 24}" height="${h - 24}" fill="none"
      stroke="${C.ink}" stroke-opacity=".18" stroke-dasharray="6 8"/>
    ${t(32, 48, 13, `КАДР ${n}`, { fill: C.steel, spacing: 0.1 })}
    ${t(32, h / 2 - 6, Math.min(30, Math.round(w * 0.055)), title, { font: FONT.display, spacing: -0.02 })}
    ${t(32, h / 2 + 24, 13, note, { fill: C.steel, spacing: 0.05 })}
    ${rule(32, h - 56, w - 32)}
    ${t(32, h - 30, 12, `${w * 2}×${h * 2} · ФОТО КЛИЕНТА`, { fill: C.steel, spacing: 0.06 })}
  </svg>`;
}

// ————————————————————————————————————————————————— данные ассетов

const productItems = [
  { file: 'p-whey-concentrate', kind: 'jar', brow: 'СЫВОРОТОЧНЫЙ', title: 'ПРОТЕИН\nКОНЦЕНТРАТ', big: '24', unit: 'Г БЕЛКА В ПОРЦИИ', pack: '900 Г' },
  { file: 'p-whey-isolate', kind: 'jar', brow: 'СЫВОРОТОЧНЫЙ', title: 'ПРОТЕИН\nИЗОЛЯТ', big: '27', unit: 'Г БЕЛКА В ПОРЦИИ', pack: '900 Г' },
  { file: 'p-plant-protein', kind: 'jar', brow: 'ГОРОХ И РИС', title: 'ПРОТЕИН\nРАСТИТЕЛЬНЫЙ', big: '22', unit: 'Г БЕЛКА В ПОРЦИИ', pack: '900 Г' },
  { file: 'p-casein', kind: 'jar', brow: 'МИЦЕЛЛЯРНЫЙ', title: 'КАЗЕИН', big: '25', unit: 'Г БЕЛКА В ПОРЦИИ', pack: '900 Г' },
  { file: 'p-creatine', kind: 'jar-sm', brow: 'МОНОГИДРАТ', title: 'КРЕАТИН', big: '5', unit: 'Г В ПОРЦИИ', pack: '300 Г' },
  { file: 'p-creatine-caps', kind: 'caps', brow: 'МОНОГИДРАТ', title: 'КРЕАТИН', big: '120', unit: 'КАПСУЛ', pack: '40 ПОРЦ.' },
  { file: 'p-bcaa', kind: 'jar-sm', brow: 'ПРОПОРЦИЯ 2:1:1', title: 'BCAA', big: '10', unit: 'Г В ПОРЦИИ', pack: '300 Г' },
  { file: 'p-carnitine', kind: 'bottle', brow: 'ЖИДКИЙ КОНЦЕНТРАТ', title: 'L-КАРНИТИН', big: '1500', unit: 'МГ В ПОРЦИИ', pack: '500 МЛ' },
  { file: 'p-d3', kind: 'caps', brow: 'ХОЛЕКАЛЬЦИФЕРОЛ', title: 'ВИТАМИН D3', big: '2000', unit: 'МЕ В КАПСУЛЕ', pack: '60 КАПС.' },
  { file: 'p-omega', kind: 'caps', brow: 'РЫБИЙ ЖИР', title: 'ОМЕГА-3', big: '1000', unit: 'МГ В КАПСУЛЕ', pack: '90 КАПС.' },
  { file: 'p-multivit', kind: 'caps', brow: 'КОМПЛЕКС', title: 'ВИТАМИНЫ\nИ МИНЕРАЛЫ', big: '90', unit: 'ТАБЛЕТОК', pack: '90 ДНЕЙ' },
  { file: 'p-magnesium', kind: 'caps', brow: 'ЦИТРАТ С B6', title: 'МАГНИЙ', big: '2', unit: 'КАПСУЛЫ В ПОРЦИИ', pack: '90 КАПС.' },
  { file: 'p-gainer', kind: 'pouch', brow: 'УГЛЕВОДНО-БЕЛКОВАЯ СМЕСЬ', title: 'ГЕЙНЕР', big: '30', unit: 'Г БЕЛКА · 70 Г УГЛЕВОДОВ', pack: '3 КГ' },
  { file: 'p-bars', kind: 'box', brow: 'КОРОБКА 12 ШТ', title: 'ПРОТЕИНОВЫЕ\nБАТОНЧИКИ', big: '20', unit: 'Г БЕЛКА В БАТОНЧИКЕ', pack: '60 Г' },
  { file: 'p-collagen', kind: 'jar-sm', brow: 'С ВИТАМИНОМ C', title: 'КОЛЛАГЕН', big: '10', unit: 'Г В ПОРЦИИ', pack: '200 Г' },
];

const categoryItems = [
  { file: 'cat-protein', from: 'p-whey-concentrate', w: 900, h: 900 },
  { file: 'cat-creatine', from: 'p-creatine', w: 900, h: 900 },
  { file: 'cat-amino', from: 'p-bcaa', w: 700, h: 560 },
  { file: 'cat-vitamins', from: 'p-d3', w: 700, h: 560 },
  { file: 'cat-gainer', from: 'p-gainer', w: 700, h: 560 },
  { file: 'cat-bars', from: 'p-bars', w: 700, h: 560 },
];

const slots = [
  { file: 'store-1', w: 900, h: 620, n: '01', title: 'Витрина снаружи', note: 'Днём, горизонтальный кадр' },
  { file: 'store-2', w: 600, h: 620, n: '02', title: 'Полки с товаром', note: 'Общий план' },
  { file: 'store-3', w: 600, h: 620, n: '06', title: 'Пробники и шейкер', note: 'На стойке' },
  { file: 'consultant', w: 640, h: 800, n: '03', title: 'Продавец за стойкой', note: 'Смотрит в камеру, вертикально' },
  { file: 'guarantee-1', w: 640, h: 460, n: '04', title: 'Код на банке', note: 'Руки стирают защитный слой' },
  { file: 'guarantee-2', w: 560, h: 400, n: '04б', title: 'Проверка кода', note: 'Экран сайта производителя' },
  { file: 'guarantee-3', w: 520, h: 380, n: '07', title: 'Собранный заказ', note: 'Пакет с товаром' },
  { file: 'review-1', w: 200, h: 200, n: '08', title: 'Портрет', note: 'Покупатель' },
  { file: 'review-video', w: 560, h: 760, n: '09', title: 'Видео-отзыв', note: 'Вертикально, 15–30 сек' },
];

// ————————————————————————————————————————————————— генерация

async function writeWebp(png, file, quality = 82) {
  await sharp(png).webp({ quality, effort: 5 }).toFile(`${OUT}/${file}.webp`);
}

export async function generateDemo() {
  mkdirSync(OUT, { recursive: true });

  for (const item of productItems) {
    await writeWebp(await svgToPng(productSvg(item, 640), 640), item.file);
  }

  const byFile = Object.fromEntries(productItems.map((p) => [p.file, p]));
  for (const cat of categoryItems) {
    const item = byFile[cat.from];
    // Плитка категории кадрируется вплотную к упаковке: в вёрстке она
    // выводится через object-fit: contain, и лишние поля превращают
    // товар в марку на конверте.
    const size = Math.max(cat.w, cat.h);
    const png = await svgToPng(productSvg(item, size), size);
    const tight = await sharp(png)
      .trim({ background: C.paper2, threshold: 6 })
      .toBuffer();
    const { width = 0, height = 0 } = await sharp(tight).metadata();
    const pad = Math.round(Math.max(width, height) * 0.06);

    // Два прохода: sharp применяет resize раньше extend независимо от
    // порядка вызовов, и в одну цепочку поля попадают уже после ресайза.
    const padded = await sharp(tight)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: C.paper2 })
      .toBuffer();

    await sharp(padded)
      .resize({ width: cat.w, height: cat.h, fit: 'contain', background: C.paper2 })
      .webp({ quality: 82, effort: 5 })
      .toFile(`${OUT}/${cat.file}.webp`);
  }

  for (const slot of slots) {
    await writeWebp(await svgToPng(slotSvg(slot.w, slot.h, slot), slot.w), slot.file, 78);
  }

  console.log(`демо-ассеты: ${productItems.length + categoryItems.length + slots.length} файлов`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await generateDemo();
}
