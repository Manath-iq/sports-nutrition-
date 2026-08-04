/**
 * Чек-лист приёмки в исполняемом виде.
 * Проверяет то, что глазами проверять долго и легко забыть:
 * конструктор, калькулятор на краевых значениях, корзину-заявку,
 * страницу без JS и режим уменьшенного движения.
 *
 *   node tools/qa.mjs http://localhost:4321
 */

import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:4321';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const results = [];
const check = (name, ok, note = '') => results.push({ name, ok, note });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

// ——— 1. Конструктор цели ———
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'networkidle' });

  // Проходим все четыре шага первым вариантом ответа.
  for (let step = 0; step < 4; step++) {
    await page.locator(`[data-step="${step}"] .opt`).first().click();
    await page.waitForTimeout(300);
  }

  const res = page.locator('[data-quiz-result]');
  await res.waitFor({ state: 'visible', timeout: 3000 });

  const rows = await res.locator('.qrow').count();
  check('Конструктор: собрался набор', rows >= 2, `позиций: ${rows}`);

  const href = await res.locator('[data-qres-send]').getAttribute('href');
  const text = decodeURIComponent((href ?? '').split('text=')[1] ?? '');
  check('Конструктор: ссылка wa.me собрана', (href ?? '').startsWith('https://wa.me/'), href?.slice(0, 40));
  check(
    'Конструктор: текст заявки читаемый',
    text.includes('Итого:') && text.includes('Цель:'),
    text.split('\n').slice(0, 3).join(' / '),
  );

  await page.close();
}

// ——— 2. Калькулятор на краевых значениях ———
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });

  const cases = [
    { age: 16, height: 160, weight: 45 },
    { age: 70, height: 190, weight: 130 },
    { age: 30, height: 178, weight: 78 },
  ];

  for (const c of cases) {
    for (const [key, value] of Object.entries(c)) {
      await page.$eval(
        `[data-in="${key}"]`,
        (el, v) => {
          el.value = String(v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        },
        value,
      );
    }
    const out = await page.evaluate(() => ({
      need: document.querySelector('[data-r="need"]').textContent,
      usual: document.querySelector('[data-r="usual"]').textContent,
      diff: document.querySelector('[data-r="diff"]').textContent,
      kcal: document.querySelector('[data-r="kcal"]').textContent,
      cost: document.querySelector('[data-r="cost"]').textContent,
    }));
    const need = Number(out.need);
    const kcal = Number(String(out.kcal).replace(/[^\d]/g, ''));
    check(
      `Калькулятор: возраст ${c.age}, вес ${c.weight}`,
      need > 0 && need < 400 && kcal > 800 && kcal < 5000,
      `норма ${out.need} г · ${out.kcal} · разница ${out.diff} г · ${out.cost}`,
    );
  }

  await page.close();
}

// ——— 3. Корзина-заявка ———
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });

  const hiddenBefore = await page.$eval('[data-order-bar]', (el) => el.dataset.open);
  await page.locator('[data-add]').first().click();
  await page.waitForTimeout(200);
  const state = await page.evaluate(() => {
    const bar = document.querySelector('[data-order-bar]');
    return {
      open: bar.dataset.open,
      count: bar.querySelector('[data-order-count]').textContent,
      total: bar.querySelector('[data-order-total]').textContent,
      href: bar.querySelector('[data-order-send]').getAttribute('href'),
    };
  });
  check(
    'Корзина: пустая скрыта, с товаром появляется',
    hiddenBefore === 'false' && state.open === 'true' && state.count === '1',
    `${state.count} поз. на ${state.total}`,
  );
  check(
    'Корзина: ссылка содержит состав заказа',
    decodeURIComponent(state.href ?? '').includes('Итого:'),
  );

  await page.close();
}

// ——— 4. Страница без JS ———
{
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  const info = await page.evaluate(() => ({
    text: document.body.innerText.length,
    hidden: [...document.querySelectorAll('[data-reveal], [data-reveal-group] > *')].filter(
      (el) => Number(getComputedStyle(el).opacity) < 0.9,
    ).length,
  }));
  check('Без JS: страница читается', info.text > 3000, `${info.text} символов текста`);
  check('Без JS: ничего не спрятано', info.hidden === 0, `скрыто элементов: ${info.hidden}`);
  await context.close();
}

// ——— 5. Уменьшенное движение ———
{
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => ({
    lenis: document.documentElement.classList.contains('lenis'),
    hidden: [...document.querySelectorAll('[data-reveal]')].filter(
      (el) => Number(getComputedStyle(el).opacity) < 0.9,
    ).length,
    panel: getComputedStyle(document.querySelector('[data-unfold-box]')).opacity,
  }));
  check('Reduced motion: инерционный скролл выключен', !state.lenis);
  check('Reduced motion: всё видно сразу', state.hidden === 0, `скрыто: ${state.hidden}`);
  check('Reduced motion: панель не прозрачная', Number(state.panel) > 0.9, `opacity ${state.panel}`);
  await page.close();
}

// ——— 6. Доступность форм и ссылок ———
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const a11y = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    return {
      imgs: imgs.length,
      noAlt: imgs.filter((i) => !i.getAttribute('alt')).length,
      h1: document.querySelectorAll('h1').length,
      unlabelled: [...document.querySelectorAll('input')].filter(
        (i) => !i.labels?.length && !i.getAttribute('aria-label'),
      ).length,
      noNameButtons: [...document.querySelectorAll('button')].filter(
        (b) => !b.textContent.trim() && !b.getAttribute('aria-label'),
      ).length,
    };
  });
  check('Доступность: один H1', a11y.h1 === 1, `найдено: ${a11y.h1}`);
  check('Доступность: alt у всех картинок', a11y.noAlt === 0, `без alt: ${a11y.noAlt} из ${a11y.imgs}`);
  check('Доступность: у полей есть подписи', a11y.unlabelled === 0);
  check('Доступность: у кнопок есть имя', a11y.noNameButtons === 0, `безымянных: ${a11y.noNameButtons}`);
  await page.close();
}

// ——— 7. Юридические требования ———
{
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();

  check('Юрка: дисклеймер БАД на странице', text.includes('не является лекарственным средством'));
  check('Юрка: есть слова о противопоказаниях', text.includes('противопоказания'));

  // Глаголы, за которые прилетает штраф в рекламе БАД.
  const banned = [
    'лечит',
    'излечивает',
    'избавляет от',
    'применяется при',
    'показан при',
    'повышает иммунитет',
    'восстанавливает суставы',
    'профилактик',
    'до/после',
  ];
  const found = banned.filter((w) => text.includes(w));
  check('Юрка: нет «лечебных» формулировок', found.length === 0, found.join(', '));
  await page.close();
}

await browser.close();

const pad = Math.max(...results.map((r) => r.name.length));
for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.name.padEnd(pad)} ${r.note ?? ''}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} из ${results.length} проверок пройдено`);
process.exit(failed ? 1 : 0);
