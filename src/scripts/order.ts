/**
 * Корзина-заявка. Не магазин: ничего не оплачивается, заказ уходит
 * продавцу в WhatsApp готовым списком. Состав живёт в sessionStorage,
 * чтобы не терялся при переходе на политику и обратно.
 */

import { productById } from '../data/products';
import { goal } from './phone';

const KEY = 'order-v1';

type Cart = Record<string, number>;

function read(): Cart {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Cart;
  } catch {
    return {};
  }
}

function write(cart: Cart): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    /* приватный режим — переживём */
  }
}

let cart: Cart = {};

export function cartCount(): number {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

export function cartTotal(): number {
  return Object.entries(cart).reduce(
    (sum, [id, qty]) => sum + (productById[id]?.price ?? 0) * qty,
    0,
  );
}

export function cartText(waNumberText = 'Здравствуйте! Хочу оформить заказ с сайта.'): string {
  const lines = Object.entries(cart)
    .map(([id, qty], i) => {
      const p = productById[id];
      if (!p) return '';
      const q = qty > 1 ? ` × ${qty}` : '';
      return `${i + 1}. ${p.name}, ${p.pack}${q} — ${(p.price * qty).toLocaleString('ru-RU')} ₽`;
    })
    .filter(Boolean);
  return [waNumberText, '', ...lines, '', `Итого: ${cartTotal().toLocaleString('ru-RU')} ₽`].join(
    '\n',
  );
}

function renderButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((btn) => {
    const id = btn.dataset.add!;
    const inCart = Boolean(cart[id]);
    btn.dataset.state = inCart ? 'in' : 'out';
    const label = btn.querySelector('[data-add-label]');
    if (label) label.textContent = inCart ? 'В заявке' : 'В заказ';
    btn.setAttribute('aria-pressed', String(inCart));
  });
}

function renderBar(): void {
  const bar = document.querySelector<HTMLElement>('[data-order-bar]');
  if (!bar) return;
  const count = cartCount();
  bar.dataset.open = String(count > 0);
  // Не aria-hidden: панель уезжает вниз, но внутри остаются кнопки, и
  // скрытый от скринридера контейнер с фокусируемым содержимым — ошибка.
  // inert убирает и из дерева доступности, и из порядка табуляции.
  bar.toggleAttribute('inert', count === 0);

  const countEl = bar.querySelector('[data-order-count]');
  const totalEl = bar.querySelector('[data-order-total]');
  const wordEl = bar.querySelector('[data-order-word]');
  if (countEl) countEl.textContent = String(count);
  if (totalEl) totalEl.textContent = `${cartTotal().toLocaleString('ru-RU')} ₽`;
  if (wordEl) wordEl.textContent = plural(count, ['позиция', 'позиции', 'позиций']);

  const link = bar.querySelector<HTMLAnchorElement>('[data-order-send]');
  if (link) {
    const base = link.dataset.wa!;
    link.href = `${base}?text=${encodeURIComponent(cartText())}`;
  }
}

export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

function sync(): void {
  write(cart);
  renderButtons();
  renderBar();
}

export function initOrder(): void {
  cart = read();

  document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.add!;
      if (cart[id]) {
        delete cart[id];
      } else {
        cart[id] = 1;
        goal('add_to_order');
      }
      sync();
    });
  });

  document.querySelector('[data-order-clear]')?.addEventListener('click', () => {
    cart = {};
    sync();
  });

  document.querySelector('[data-order-send]')?.addEventListener('click', () => goal('wa_click'));

  sync();
}
