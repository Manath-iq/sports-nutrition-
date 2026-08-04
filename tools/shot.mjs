/**
 * Снимки страницы для визуальной проверки.
 * Запускает системный Chrome через playwright-core — без скачивания браузера.
 *
 *   node tools/shot.mjs <url> [ширина] [--full] [--reduced]
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4321';
const width = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 1440);
const full = process.argv.includes('--full');
const reduced = process.argv.includes('--reduced');
const out = '.shots';

mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newPage({
  viewport: { width, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
});

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(url, { waitUntil: 'networkidle' });

// Проматываем страницу целиком, чтобы отработали ленивые картинки и появления.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
});

// Появления держит IntersectionObserver — после прогона снимаем их принудительно,
// иначе на полностраничном снимке половина блоков окажется прозрачной.
await page.evaluate(() => {
  document
    .querySelectorAll('[data-reveal], [data-reveal-group]')
    .forEach((el) => (el.dataset.in = 'true'));
});
await page.waitForTimeout(700);

if (full) {
  await page.screenshot({ path: `${out}/full-${width}.png`, fullPage: true });
} else {
  const sections = await page.evaluate(() =>
    [...document.querySelectorAll('section, footer')].map((s) => ({
      id: s.id || s.className.split(' ')[0],
      top: Math.round(s.getBoundingClientRect().top + window.scrollY),
      height: Math.round(s.getBoundingClientRect().height),
    })),
  );
  let i = 0;
  for (const s of sections) {
    await page.screenshot({
      path: `${out}/${String(i).padStart(2, '0')}-${s.id}.png`,
      // clip отсчитывается от всей страницы только вместе с fullPage
      fullPage: true,
      clip: { x: 0, y: s.top, width, height: Math.min(s.height, 2200) },
    });
    i++;
  }
  console.log(sections.map((s) => `${s.id} ${s.height}px`).join('\n'));
}

// Горизонтального переполнения быть не должно ни на одной ширине.
const overflow = await page.evaluate(() => ({
  docW: document.documentElement.scrollWidth,
  winW: window.innerWidth,
  wide: [...document.querySelectorAll('*')]
    .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 2)
    .slice(0, 6)
    .map((el) => `${el.tagName}.${String(el.className).split(' ')[0]}`),
}));

console.log('overflow:', JSON.stringify(overflow));
if (errors.length) console.log('ошибки консоли:', errors.slice(0, 10));

await browser.close();
