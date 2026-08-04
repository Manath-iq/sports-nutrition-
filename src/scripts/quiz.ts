/**
 * Конструктор цели: 4 шага → готовый набор.
 *
 * Логика подбора живёт в data/matrix.ts и правится под ассортимент клиента.
 * Здесь только состояние шагов, разметка результата и отправка в WhatsApp.
 */

import { buildSet, labels, orderText, type Answers } from '../data/matrix';
import { waLink } from '../config/client.config';
import { link } from '../lib/paths';
import { isPhoneComplete, maskPhone, goal } from './phone';

const KEYS = ['goal', 'exp', 'limit', 'budget'] as const;
type Key = (typeof KEYS)[number];

export function initQuiz(): void {
  const root = document.querySelector<HTMLElement>('[data-quiz]');
  if (!root) return;

  const stage = root.querySelector<HTMLElement>('[data-quiz-stage]')!;
  const bar = root.querySelector<HTMLElement>('[data-quiz-bar]')!;
  const barBox = root.querySelector<HTMLElement>('[role="progressbar"]')!;
  const stepLabel = root.querySelector<HTMLElement>('[data-quiz-step]')!;
  const crumbs = root.querySelector<HTMLElement>('[data-quiz-crumbs]')!;
  const back = root.querySelector<HTMLButtonElement>('[data-quiz-back]')!;
  const result = root.querySelector<HTMLElement>('[data-quiz-result]')!;
  const fieldsets = Array.from(stage.querySelectorAll<HTMLElement>('[data-step]'));

  const answers: Partial<Answers> = {};
  let current = 0;
  let started = false;

  const show = (index: number) => {
    current = index;
    const done = index >= fieldsets.length;

    fieldsets.forEach((fs, i) => {
      fs.hidden = i !== index;
    });
    result.hidden = !done;

    const shown = Math.min(index + 1, fieldsets.length);
    bar.style.width = `${(done ? 4 : shown) * 25}%`;
    barBox.setAttribute('aria-valuenow', String(done ? 4 : shown));
    stepLabel.textContent = done ? 'Готово' : `Шаг ${shown} / ${fieldsets.length}`;
    back.hidden = index === 0;

    crumbs.textContent = KEYS.filter((k) => answers[k])
      .map((k) => labels[k][answers[k] as never])
      .join(' · ');

    if (!done) {
      const first =
        fieldsets[index]!.querySelector<HTMLElement>('[aria-checked="true"]') ??
        fieldsets[index]!.querySelector<HTMLElement>('.opt');
      // Фокус переносим только если пользователь уже внутри конструктора,
      // иначе страница дёрнется к блоку при первой загрузке.
      if (started && root.contains(document.activeElement)) first?.focus();
    }
  };

  // ——— выбор ответа ———
  root.querySelectorAll<HTMLButtonElement>('.opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key as Key;
      const group = btn.closest('[role="radiogroup"]')!;
      group.querySelectorAll('.opt').forEach((o) => {
        o.setAttribute('aria-checked', 'false');
        (o as HTMLElement).tabIndex = -1;
      });
      btn.setAttribute('aria-checked', 'true');
      btn.tabIndex = 0;
      answers[key] = btn.dataset.value as never;

      if (!started) {
        started = true;
        goal('quiz_start');
      }

      const next = current + 1;
      if (next >= fieldsets.length) {
        render();
        goal('quiz_complete');
      }
      // Небольшая пауза: пользователь должен увидеть, что выбор засчитан.
      setTimeout(() => show(next), 220);
    });
  });

  // ——— клавиатура: стрелки внутри группы ———
  root.querySelectorAll<HTMLElement>('[role="radiogroup"]').forEach((group) => {
    const opts = Array.from(group.querySelectorAll<HTMLButtonElement>('.opt'));
    group.addEventListener('keydown', (e) => {
      const i = opts.indexOf(document.activeElement as HTMLButtonElement);
      if (i === -1) return;
      let next = -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % opts.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + opts.length) % opts.length;
      if (next === -1) return;
      e.preventDefault();
      opts.forEach((o) => (o.tabIndex = -1));
      opts[next]!.tabIndex = 0;
      opts[next]!.focus();
    });
  });

  back.addEventListener('click', () => show(Math.max(0, current - 1)));

  // ——— экран результата ———
  const render = () => {
    const set = buildSet(answers as Answers);
    const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

    const head = [
      'Ваш набор',
      labels.goal[set.answers.goal],
      labels.exp[set.answers.exp],
      labels.budget[set.answers.budget],
    ];
    if (set.answers.limit !== 'none') head.push(labels.limit[set.answers.limit]);

    const rows = set.items
      .map(
        (item, i) => `
        <div class="qrow">
          <span class="qrow__n t-data">${String(i + 1).padStart(2, '0')}</span>
          <span class="qrow__name">${item.product.name}, ${item.product.pack}</span>
          <span class="qrow__price">${rub(item.product.price)}</span>
          <span class="qrow__why">${item.product.why}</span>
          <span class="qrow__dose t-data">${item.product.dosage} · хватит на ${item.product.packDays} дн.</span>
        </div>`,
      )
      .join('');

    const notes = set.notes
      .map((n) => `<p class="qres__note">${n}</p>`)
      .join('');

    result.innerHTML = `
      <div class="qres__head">
        ${head.map((h) => `<span class="chip">${h}</span>`).join('')}
      </div>

      <div class="qres__table">${rows}</div>

      <div class="qres__sum">
        <div class="qres__sumrow">
          <span class="t-data">Итого</span>
          <b>${rub(set.total)}</b>
        </div>
        <div class="qres__sumrow">
          <span class="t-data">Хватит на</span>
          <b>${set.days[0]}–${set.days[1]} <span class="qres__unit">дней</span></b>
        </div>
      </div>

      ${notes}

      <form class="qres__form" data-qres-form novalidate>
        <label class="sr-only-x" for="quiz-phone">Телефон</label>
        <input
          class="field"
          id="quiz-phone"
          name="phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="+7 (___) ___-__-__"
          data-qres-phone
        />
        <div class="qres__actions">
          <a class="btn btn-signal" data-qres-send target="_blank" rel="noopener" href="#">
            Отправить набор в WhatsApp
          </a>
          <button type="button" class="btn btn-outline" data-qres-copy>Сохранить список</button>
        </div>
        <p class="t-micro qres__legal">
          Отправляя, вы соглашаетесь с <a class="link-rule" href="${link('/privacy')}">политикой обработки персональных данных</a>.
          Телефон нужен, чтобы ответить — рассылок не делаем.
        </p>
      </form>

      <button type="button" class="qres__restart t-data" data-qres-restart>↺ Собрать заново</button>
    `;

    const phone = result.querySelector<HTMLInputElement>('[data-qres-phone]')!;
    const send = result.querySelector<HTMLAnchorElement>('[data-qres-send]')!;
    const copy = result.querySelector<HTMLButtonElement>('[data-qres-copy]')!;
    maskPhone(phone);

    const updateLink = () => {
      const value = phone.value.trim();
      send.href = waLink(orderText(set, undefined, isPhoneComplete(value) ? value : undefined));
    };
    updateLink();
    phone.addEventListener('input', updateLink);

    send.addEventListener('click', () => goal('wa_click'));

    copy.addEventListener('click', async () => {
      const text = orderText(set);
      try {
        await navigator.clipboard.writeText(text);
        copy.textContent = 'Список скопирован';
      } catch {
        // Буфер недоступен (нет https или отказ) — показываем текст для ручного копирования.
        window.prompt('Скопируйте список:', text);
      }
      setTimeout(() => (copy.textContent = 'Сохранить список'), 2400);
    });

    result.querySelector('[data-qres-restart]')?.addEventListener('click', () => {
      KEYS.forEach((k) => delete answers[k]);
      root
        .querySelectorAll('.opt')
        .forEach((o) => o.setAttribute('aria-checked', 'false'));
      show(0);
    });
  };

  show(0);
}
