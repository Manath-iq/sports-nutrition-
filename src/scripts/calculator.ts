/**
 * Калькулятор белка. Формула Миффлина–Сан Жеора, всё считается на клиенте —
 * так и написано в подзаголовке, и это снимает недоверие к «сбору данных».
 */

import { productById } from '../data/products';
import { goal } from './phone';

/** Опорный протеин для пересчёта разницы в порции и рубли. */
const REF = productById['whey-concentrate-900']!;

interface State {
  sex: 'm' | 'f';
  age: number;
  height: number;
  weight: number;
  activity: number;
  goalK: number;
}

const state: State = {
  sex: 'm',
  age: 30,
  height: 178,
  weight: 78,
  activity: 1.55,
  goalK: 1.6,
};

function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function initCalculator(): void {
  const root = document.querySelector<HTMLElement>('[data-calc]');
  if (!root) return;

  const out = (key: string) => root.querySelector<HTMLElement>(`[data-r="${key}"]`);

  const compute = () => {
    const { sex, age, height, weight, activity, goalK } = state;

    const bmr =
      10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
    const kcal = Math.round((bmr * activity) / 10) * 10;

    const need = Math.round(weight * goalK);
    // Средний добор белка из обычного рациона — около 1 г на кг веса.
    // Это ориентир, а не измерение: так и подписано в интерфейсе.
    const usual = Math.round(weight * 1.0);
    const diff = Math.max(0, need - usual);

    const perServing = REF.proteinPerServing ?? 24;
    const servings = diff / perServing;
    const costPerServing = REF.price / REF.servings;
    const cost = Math.round(servings * costPerServing);

    const roundedServings = Math.round(servings * 10) / 10;

    out('need')!.textContent = String(need);
    out('usual')!.textContent = String(usual);
    out('diff')!.textContent = String(diff);
    out('kcal')!.textContent = `${kcal.toLocaleString('ru-RU')} ккал`;

    if (diff <= 0) {
      out('scoops')!.textContent = 'норма закрывается едой';
      out('cost')!.textContent = '0 ₽';
    } else {
      out('scoops')!.textContent = `${roundedServings.toLocaleString('ru-RU')} ${plural(
        Math.round(roundedServings),
        ['порция', 'порции', 'порций'],
      )} протеина`;
      out('cost')!.textContent = `${cost.toLocaleString('ru-RU')} ₽`;
    }
  };

  // ——— поля ———
  root.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((input) => {
    const key = input.dataset.in as 'age' | 'height' | 'weight';
    const display = root.querySelector<HTMLElement>(`[data-out="${key}"]`);
    input.addEventListener('input', () => {
      state[key] = Number(input.value);
      if (display) display.textContent = input.value;
      compute();
    });
  });

  const radios = (selector: string, apply: (el: HTMLElement) => void) => {
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    els.forEach((el) => {
      el.addEventListener('click', () => {
        els.forEach((o) => o.setAttribute('aria-checked', 'false'));
        el.setAttribute('aria-checked', 'true');
        apply(el);
        compute();
      });
    });
  };

  radios('[data-sex]', (el) => (state.sex = el.dataset.sex as 'm' | 'f'));
  radios('[data-act]', (el) => (state.activity = Number(el.dataset.act)));
  radios('[data-goal-k]', (el) => (state.goalK = Number(el.dataset.goalK)));

  root.querySelector('[data-goal="calc_complete"]')?.addEventListener('click', () =>
    goal('calc_complete'),
  );

  compute();
}
