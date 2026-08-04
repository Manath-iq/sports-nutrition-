/**
 * Секвенция банки: 36 кадров поворота на 360°.
 *
 * Никакого 3D-софта. Этикетка рисуется один раз как плоская текстура,
 * а дальше нарезается на вертикальные полосы и раскладывается по
 * цилиндрической проекции: x = R·sin φ, ширина полосы ∝ cos φ.
 * Сверху — градиент затенения и блик. Получается честный поворот
 * цилиндра ценой одного PNG и арифметики.
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { svgToPng, C, FONT } from './lib/render.mjs';

const SIZE = 1000;
const CX = 500;
const R = 218;
const BODY_TOP = 206;
const BODY_BOTTOM = 812;
const RY = 34;
const CAP_TOP = 132;
const LABEL_TOP = 330;
const LABEL_H = 384;

const FRAMES = 36;
const SLICES = 72;
/** Позиция «лицевой» зоны этикетки в текстуре (0..1). */
const FRONT_U = 0.21;
/** На этом кадре этикетка смотрит на зрителя. */
const FACE_FRAME = 12;

const TW = Math.round(2 * Math.PI * R);

// ——————————————————————————————————————————————————————— этикетка

function labelSvg() {
  const t = (x, y, size, text, opts = {}) => {
    const {
      font = FONT.mono,
      fill = C.ink,
      anchor = 'start',
      spacing = 0.04,
      weight = 400,
    } = opts;
    return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${(size * spacing).toFixed(2)}">${text}</text>`;
  };
  const rule = (x1, y, x2, o = 0.16) =>
    `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.ink}" stroke-opacity="${o}" stroke-width="1.5"/>`;

  // Штрихкод: настоящая разметка полос, а не картинка.
  let bars = '';
  let bx = 1040;
  for (let i = 0; i < 42; i++) {
    const w = [1.5, 2.5, 4][i % 3];
    bars += `<rect x="${bx.toFixed(1)}" y="250" width="${w}" height="52" fill="${C.ink}" opacity=".85"/>`;
    bx += w + 3;
  }

  const nutrition = [
    ['Белки', '24 г'],
    ['Жиры', '1,8 г'],
    ['Углеводы', '2,1 г'],
    ['Калорийность', '118 ккал'],
  ];
  const rows = nutrition
    .map(
      ([k, v], i) =>
        rule(600, 84 + i * 46, 960) +
        t(600, 112 + i * 46, 17, k.toUpperCase()) +
        t(960, 112 + i * 46, 17, v.toUpperCase(), { anchor: 'end' }),
    )
    .join('');

  const ingredients = [
    'Концентрат сывороточного',
    'белка, ароматизатор,',
    'подсластитель, лецитин.',
    'Хранить при +5…+25 °C.',
  ]
    .map((line, i) => t(1040, 96 + i * 24, 13, line, { fill: C.steel, spacing: 0.02 }))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${LABEL_H}" viewBox="0 0 ${TW} ${LABEL_H}">
    <rect width="${TW}" height="${LABEL_H}" fill="${C.paper}"/>
    <rect width="${TW}" height="7" fill="${C.ink}"/>
    <rect y="${LABEL_H - 7}" width="${TW}" height="7" fill="${C.ink}"/>

    <!-- Зона 1: лицо -->
    ${t(40, 52, 13, 'ОБРАЗЕЦ · ДЕМО-ЭТИКЕТКА', { fill: C.steel, spacing: 0.08 })}
    ${t(40, 118, 42, 'СЫВОРОТОЧНЫЙ', { font: FONT.display, spacing: -0.02 })}
    ${t(40, 166, 42, 'ПРОТЕИН', { font: FONT.display, spacing: -0.02 })}
    ${rule(40, 196, 535)}
    ${t(40, 224, 16, 'КОНЦЕНТРАТ · ВАНИЛЬ', { fill: C.steel, spacing: 0.06 })}
    ${t(40, 320, 92, '24', { spacing: -0.04 })}
    ${t(215, 292, 15, 'Г БЕЛКА', { spacing: 0.06 })}
    ${t(215, 316, 15, 'В ПОРЦИИ', { fill: C.steel, spacing: 0.06 })}
    ${t(535, 320, 30, '900 Г', { anchor: 'end', spacing: 0.02 })}
    ${t(40, 358, 12, 'ПОРЦИЙ В УПАКОВКЕ 30', { fill: C.steel, spacing: 0.06 })}

    <line x1="575" y1="7" x2="575" y2="${LABEL_H - 7}" stroke="${C.ink}" stroke-opacity=".16"/>

    <!-- Зона 2: панель состава -->
    ${t(600, 52, 13, 'ПИЩЕВАЯ ЦЕННОСТЬ НА ПОРЦИЮ 30 Г', { fill: C.steel, spacing: 0.06 })}
    ${rows}
    ${rule(600, 268, 960)}
    ${t(600, 300, 12, 'БАД. НЕ ЯВЛЯЕТСЯ', { fill: C.steel, spacing: 0.05 })}
    ${t(600, 320, 12, 'ЛЕКАРСТВЕННЫМ СРЕДСТВОМ', { fill: C.steel, spacing: 0.05 })}
    ${t(600, 358, 12, 'ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ', { fill: C.steel, spacing: 0.05 })}

    <line x1="1000" y1="7" x2="1000" y2="${LABEL_H - 7}" stroke="${C.ink}" stroke-opacity=".16"/>

    <!-- Зона 3: состав и штрихкод -->
    ${t(1040, 52, 13, 'СОСТАВ', { fill: C.ink, spacing: 0.08 })}
    ${ingredients}
    ${bars}
    ${t(1040, 330, 12, 'СРОК ГОДНОСТИ 24 МЕС', { fill: C.steel, spacing: 0.05 })}
    ${t(1040, 356, 12, 'ИЗГОТОВЛЕНО ПО ЗАКАЗУ', { fill: C.steel, spacing: 0.05 })}
  </svg>`;
}

// ——————————————————————————————————————————————————————— корпус

const cylinderPath = `M ${CX - R} ${BODY_TOP}
  L ${CX - R} ${BODY_BOTTOM}
  A ${R} ${RY} 0 0 0 ${CX + R} ${BODY_BOTTOM}
  L ${CX + R} ${BODY_TOP}
  A ${R} ${RY} 0 0 1 ${CX - R} ${BODY_TOP} Z`;

function bodySvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <defs>
      <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${C.jarDark}"/>
        <stop offset=".2" stop-color="#262C33"/>
        <stop offset=".45" stop-color="#333A42"/>
        <stop offset=".7" stop-color="#20252B"/>
        <stop offset="1" stop-color="${C.jarDark}"/>
      </linearGradient>
      <linearGradient id="cap" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#070909"/>
        <stop offset=".35" stop-color="#20242A"/>
        <stop offset=".62" stop-color="#14181C"/>
        <stop offset="1" stop-color="#070909"/>
      </linearGradient>
    </defs>

    <!-- крышка -->
    <path d="M ${CX - R - 10} ${CAP_TOP + 18}
      L ${CX - R - 10} ${BODY_TOP + 6}
      A ${R + 10} ${RY} 0 0 0 ${CX + R + 10} ${BODY_TOP + 6}
      L ${CX + R + 10} ${CAP_TOP + 18}
      A ${R + 10} ${RY + 2} 0 0 0 ${CX - R - 10} ${CAP_TOP + 18} Z" fill="url(#cap)"/>
    <ellipse cx="${CX}" cy="${CAP_TOP + 18}" rx="${R + 10}" ry="${RY + 2}" fill="#2A3037"/>
    <ellipse cx="${CX}" cy="${CAP_TOP + 18}" rx="${R - 4}" ry="${RY - 6}" fill="#171B20"/>

    <!-- корпус -->
    <path d="${cylinderPath}" fill="url(#cyl)"/>
    <ellipse cx="${CX}" cy="${BODY_TOP}" rx="${R}" ry="${RY}" fill="#2A3037" opacity=".9"/>
  </svg>`;
}

function maskSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <path d="M ${CX - R - 10} ${CAP_TOP + 18}
      L ${CX - R - 10} ${BODY_TOP + 6}
      A ${R + 10} ${RY} 0 0 0 ${CX + R + 10} ${BODY_TOP + 6}
      L ${CX + R + 10} ${CAP_TOP + 18}
      A ${R + 10} ${RY + 2} 0 0 0 ${CX - R - 10} ${CAP_TOP + 18} Z" fill="#fff"/>
    <path d="${cylinderPath}" fill="#fff"/>
  </svg>`;
}

/** Затенение цилиндра: тёмные края, светлая середина, узкий блик. */
function shadeSvg() {
  const x0 = CX - R - 12;
  const w = (R + 12) * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <defs>
      <linearGradient id="sh" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity=".66"/>
        <stop offset=".12" stop-color="#000" stop-opacity=".22"/>
        <stop offset=".3" stop-color="#000" stop-opacity="0"/>
        <stop offset=".5" stop-color="#000" stop-opacity="0"/>
        <stop offset=".68" stop-color="#000" stop-opacity=".08"/>
        <stop offset=".86" stop-color="#000" stop-opacity=".38"/>
        <stop offset="1" stop-color="#000" stop-opacity=".7"/>
      </linearGradient>
    </defs>
    <rect x="${x0}" y="0" width="${w}" height="${SIZE}" fill="url(#sh)"/>
  </svg>`;
}

function glareSvg() {
  const x = CX - R * 0.46;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <defs>
      <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#fff" stop-opacity=".26"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="${x}" y="${BODY_TOP}" width="86" height="${BODY_BOTTOM - BODY_TOP}" fill="url(#gl)"/>
  </svg>`;
}

// ——————————————————————————————————————————————————————— сборка

export async function generateSequence(outDir = 'public/seq') {
  mkdirSync(outDir, { recursive: true });

  const [labelPng, bodyPng, maskPng, shadePng, glarePng] = await Promise.all([
    svgToPng(labelSvg(), TW),
    svgToPng(bodySvg(), SIZE),
    svgToPng(maskSvg(), SIZE),
    svgToPng(shadeSvg(), SIZE),
    svgToPng(glareSvg(), SIZE),
  ]);

  // Нарезаем этикетку один раз: дальше только меняем ширину полос.
  const sliceW = TW / SLICES;
  const slices = [];
  for (let i = 0; i < SLICES; i++) {
    const left = Math.floor(i * sliceW);
    const width = Math.max(1, Math.min(Math.ceil(sliceW) + 1, TW - left));
    slices.push(
      await sharp(labelPng).extract({ left, top: 0, width, height: LABEL_H }).png().toBuffer(),
    );
  }

  // Один и тот же кусок этикетки на разных кадрах сжимается до одной
  // и той же ширины — кэш экономит примерно половину ресайзов.
  const cache = new Map();
  const scaled = async (i, w) => {
    const key = `${i}:${w}`;
    if (!cache.has(key)) {
      cache.set(
        key,
        await sharp(slices[i]).resize({ width: w, height: LABEL_H, fit: 'fill' }).png().toBuffer(),
      );
    }
    return cache.get(key);
  };

  for (let f = 0; f < FRAMES; f++) {
    const layers = [];

    for (let i = 0; i < SLICES; i++) {
      const u = (i + 0.5) / SLICES;
      const phi = 2 * Math.PI * (u - FRONT_U) - (2 * Math.PI * (f - FACE_FRAME)) / FRAMES;
      const cos = Math.cos(phi);
      if (cos <= 0.06) continue; // полоса ушла на обратную сторону

      const w = Math.max(1, Math.round(sliceW * cos) + 1);
      const x = Math.round(CX + R * Math.sin(phi) - w / 2);
      if (x + w < 0 || x > SIZE) continue;

      layers.push({ input: await scaled(i, w), left: x, top: LABEL_TOP });
    }

    const frame = await sharp(bodyPng)
      .composite([
        ...layers,
        { input: shadePng, blend: 'multiply' },
        { input: glarePng, blend: 'screen' },
        { input: maskPng, blend: 'dest-in' },
      ])
      .webp({ quality: 76, effort: 5, alphaQuality: 90 })
      .toBuffer();

    await sharp(frame).toFile(`${outDir}/jar-${String(f).padStart(2, '0')}.webp`);
    process.stdout.write(`\rкадр ${f + 1}/${FRAMES}`);
  }
  process.stdout.write('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await generateSequence();
}
