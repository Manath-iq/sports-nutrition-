/**
 * Подрезка шрифтов под реальный набор символов страницы.
 *
 * Полные подмножества с fontsource весят 184 КБ, из них латиница
 * JetBrains Mono — 40 КБ ради цифр и десятка слов. После подрезки
 * все шесть файлов укладываются примерно в 40 КБ суммарно.
 *
 * Запускать после правок текстов: node tools/gen-fonts.mjs
 */

import subsetFont from 'subset-font';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'node_modules/@fontsource-variable';
const OUT = 'src/assets/fonts';

/** Символы, которые реально встречаются на странице. */
const RU = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const EN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUM = '0123456789';
const PUNCT = ' .,:;!?—–-−«»„“”"\'()[]{}/\\|@#№%&*+=<>~^$₽€°·•…↺→←↑↓×';

/**
 * Из каких исходников что собираем.
 * Диапазон веса режем по факту использования: полная ось 100–900 тянет
 * за собой все мастера и стоит дороже самих глифов.
 * Дисплей идёт только в 700–800, текст в 400–600, данные в 400–500.
 */
const JOBS = [
  ['unbounded/files/unbounded-cyrillic-wght-normal.woff2', 'unbounded-cyrillic.woff2', RU + PUNCT, [700, 800]],
  ['unbounded/files/unbounded-latin-wght-normal.woff2', 'unbounded-latin.woff2', EN + NUM + PUNCT, [700, 800]],
  ['onest/files/onest-cyrillic-wght-normal.woff2', 'onest-cyrillic.woff2', RU + PUNCT, [400, 600]],
  ['onest/files/onest-latin-wght-normal.woff2', 'onest-latin.woff2', EN + NUM + PUNCT, [400, 600]],
  ['jetbrains-mono/files/jetbrains-mono-cyrillic-wght-normal.woff2', 'mono-cyrillic.woff2', RU + PUNCT, [400, 500]],
  ['jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', 'mono-latin.woff2', EN + NUM + PUNCT, [400, 500]],
];

const kb = (n) => `${(n / 1024).toFixed(1)} КБ`;

let before = 0;
let after = 0;

for (const [src, out, chars, [min, max]] of JOBS) {
  const input = readFileSync(join(SRC, src));
  const dest = join(OUT, out);

  const subset = await subsetFont(input, chars, {
    targetFormat: 'woff2',
    variationAxes: { wght: { min, max } },
  });

  before += input.length;
  after += subset.length;
  writeFileSync(dest, subset);
  console.log(`${out.padEnd(26)} ${kb(input.length).padStart(9)} → ${kb(subset.length)}`);
}

console.log(`\nитого ${kb(before)} → ${kb(after)}`);

// Контроль: в шаблоне не должно остаться ссылок на файлы, которых нет.
const files = readdirSync(OUT).filter((f) => f.endsWith('.woff2'));
const total = files.reduce((sum, f) => sum + statSync(join(OUT, f)).size, 0);
console.log(`в src/assets/fonts: ${files.length} файлов, ${kb(total)}`);

