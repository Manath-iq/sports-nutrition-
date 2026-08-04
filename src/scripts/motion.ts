/**
 * Одна оркестрованная сцена, а не двадцать разбросанных эффектов.
 *
 * Появления держит IntersectionObserver, само движение — CSS-переходы.
 * От GSAP + ScrollTrigger отказались осознанно: связка ScrollTrigger + Lenis
 * пропускает срабатывания при программном скролле (якорь, восстановление
 * позиции при перезагрузке, поиск по странице) — секции остаются
 * невидимыми. IntersectionObserver от этого не зависит и стоит 0 КБ.
 * Из тяжёлого остаётся только Lenis ради инерционного скролла.
 *
 * Секвенция банки живёт отдельно (scripts/sequence.ts) и тоже без библиотек.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Разбивает текст на строки-обёртки: каждая строка едет снизу отдельно. */
function splitLines(el: HTMLElement): void {
  const text = (el.textContent ?? '').trim();
  if (!text) return;
  const words = text.split(/\s+/);

  el.textContent = '';
  const spans = words.map((word, i) => {
    const s = document.createElement('span');
    s.textContent = i === words.length - 1 ? word : `${word} `;
    s.style.display = 'inline-block';
    s.style.whiteSpace = 'pre';
    el.appendChild(s);
    return s;
  });

  // Группируем слова по вертикальной позиции — так получаются реальные строки.
  const groups: HTMLElement[][] = [];
  let top = Number.NaN;
  for (const s of spans) {
    const t = Math.round(s.offsetTop);
    if (t !== top) {
      groups.push([]);
      top = t;
    }
    groups[groups.length - 1]!.push(s);
  }

  el.textContent = '';
  groups.forEach((group, i) => {
    const mask = document.createElement('span');
    mask.className = 'reveal-line';
    mask.style.setProperty('--i', String(i));
    const inner = document.createElement('span');
    group.forEach((s) => inner.appendChild(s));
    mask.appendChild(inner);
    el.appendChild(mask);
  });
}

function observe(els: Iterable<HTMLElement>, onEnter: (el: HTMLElement) => void, ratio = 0.15) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        onEnter(entry.target as HTMLElement);
      }
    },
    { threshold: ratio, rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of els) io.observe(el);
}

function counters(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-count]');
  const format = (v: number, decimals: number) =>
    v.toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  observe(
    els,
    (el) => {
      const target = Number(el.dataset.count ?? '0');
      const decimals = Number(el.dataset.decimals ?? '0');
      if (reduced) {
        el.textContent = format(target, decimals);
        return;
      }
      const dur = 1100;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = format(target * (1 - Math.pow(1 - p, 3)), decimals);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    0.4,
  );
}

function reveals(): void {
  document.querySelectorAll<HTMLElement>('[data-reveal="lines"]').forEach(splitLines);

  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    Array.from(group.children).forEach((child, i) =>
      (child as HTMLElement).style.setProperty('--i', String(i)),
    );
  });

  observe(
    document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-group]'),
    (el) => (el.dataset.in = 'true'),
  );
}

async function smoothScroll(): Promise<void> {
  const Lenis = (await import('lenis')).default;
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    // На тач-устройствах нативная инерция лучше любой эмуляции.
    syncTouch: false,
  });

  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // Дев-хук: инерционный скролл перехватывает программные переходы,
  // и без доступа к инстансу страницу неудобно проверять. В сборку не идёт.
  if (import.meta.env.DEV) {
    (window as unknown as { __lenis?: unknown }).__lenis = lenis;
  }

  // Якорные ссылки едут через Lenis, иначе конфликтуют два скролла.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
      history.replaceState(null, '', id);
    });
  });
}

const main = (): void => {
  counters();

  if (reduced) {
    document.documentElement.classList.add('motion-ready');
    return;
  }

  reveals();
  document.documentElement.classList.add('motion-ready');
  void smoothScroll();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true });
} else {
  main();
}
