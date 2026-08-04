/**
 * Общая обвязка генератора ассетов: рендер SVG теми же шрифтами,
 * что и на сайте. resvg не читает woff2, поэтому один раз распаковываем
 * их в .fontcache/ — каталог служебный и в репозиторий не идёт.
 */

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import woff2 from 'wawoff2';

const SOURCES = [
  ['src/assets/fonts/unbounded-cyrillic.woff2', 'unbounded-cyr.ttf'],
  ['src/assets/fonts/unbounded-latin.woff2', 'unbounded-lat.ttf'],
  ['src/assets/fonts/mono-cyrillic.woff2', 'mono-cyr.ttf'],
  ['src/assets/fonts/mono-latin.woff2', 'mono-lat.ttf'],
  ['src/assets/fonts/onest-cyrillic.woff2', 'onest-cyr.ttf'],
  ['src/assets/fonts/onest-latin.woff2', 'onest-lat.ttf'],
];

let fontFiles = null;

export async function fonts() {
  if (fontFiles) return fontFiles;
  mkdirSync('.fontcache', { recursive: true });
  fontFiles = [];
  for (const [src, out] of SOURCES) {
    const dest = `.fontcache/${out}`;
    if (!existsSync(dest)) {
      writeFileSync(dest, await woff2.decompress(readFileSync(src)));
    }
    fontFiles.push(dest);
  }
  return fontFiles;
}

/** SVG → PNG-буфер. width задаёт итоговый растр. */
export async function svgToPng(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: {
      loadSystemFonts: false,
      fontFiles: await fonts(),
      defaultFontFamily: 'Onest',
    },
    background: 'rgba(0,0,0,0)',
  });
  return resvg.render().asPng();
}

/** Токены дизайн-системы — те же значения, что в global.css. */
export const C = {
  ink: '#14171A',
  paper: '#EFEEE9',
  paper2: '#E3E2DC',
  steel: '#8A9299',
  signal: '#1F3CFF',
  heat: '#FF5A1F',
  line: 'rgba(20,23,26,.14)',
  jar: '#1B1F24',
  jarDark: '#0D1013',
  cap: '#101317',
};

export const FONT = {
  display: 'Unbounded',
  sans: 'Onest',
  mono: 'JetBrains Mono',
};

/** Экранирование текста для SVG. */
export const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
