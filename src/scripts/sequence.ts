/**
 * Секвенция банки + разворот этикетки.
 *
 * Осознанно без WebGL и без GSAP: это первый экран, он должен подниматься
 * на бюджетном Android и не ломаться в Safari iOS. Всё, что здесь есть, —
 * <canvas>, предзагрузка кадров и одна rAF-петля, читающая позицию скролла.
 */

import { asset } from '../lib/paths';

const FRAMES = 36;
/** Кадр «этикетка лицом к зрителю» — он же кадр покоя при reduced-motion. */
const FACE_FRAME = 12;
const PRIORITY = 6;

const frameUrl = (i: number) => asset(`/seq/jar-${String(i).padStart(2, '0')}.webp`);

export function initSequence(): void {
  const host = document.querySelector<HTMLElement>('[data-seq]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-seq-canvas]');
  const unfoldBox = document.querySelector<HTMLElement>('[data-unfold-box]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!host || !canvas || !hero) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const images: (HTMLImageElement | undefined)[] = new Array(FRAMES);
  let drawn = -1;

  function draw(index: number) {
    const i = Math.max(0, Math.min(FRAMES - 1, Math.round(index)));
    const img = images[i];
    if (!img || !img.complete || i === drawn) return;
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    ctx!.drawImage(img, 0, 0, canvas!.width, canvas!.height);
    drawn = i;
  }

  /** Ближайший уже загруженный кадр — чтобы канвас не мигал пустотой. */
  function drawNearest(index: number) {
    const i = Math.round(index);
    for (let d = 0; d < FRAMES; d++) {
      const a = i - d;
      const b = i + d;
      if (a >= 0 && images[a]?.complete) return draw(a);
      if (b < FRAMES && images[b]?.complete) return draw(b);
    }
  }

  function load(i: number, priority: boolean): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      if (priority) img.fetchPriority = 'high';
      img.onload = () => {
        images[i] = img;
        if (drawn === -1) draw(i);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = frameUrl(i);
    });
  }

  // Первым делом — кадр покоя (он же LCP первого экрана) и ещё пять
  // равномерно по кругу: даже если остальные не доехали, оборот читается.
  const step = Math.round(FRAMES / (PRIORITY - 1));
  const priorityFrames = new Set([FACE_FRAME]);
  for (let i = 0; i < PRIORITY - 1; i++) priorityFrames.add((FACE_FRAME + i * step) % FRAMES);

  Promise.all([...priorityFrames].map((i) => load(i, true))).then(() => {
    drawNearest(FACE_FRAME);
    if (reduced) return;
    // Остальные кадры — после того, как страница успокоилась.
    const rest = () => {
      for (let i = 0; i < FRAMES; i++) if (!images[i]) load(i, false);
    };
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
        rest,
      );
    } else {
      setTimeout(rest, 400);
    }
  });

  if (reduced) {
    // Секвенция замирает, панель просто на месте.
    unfoldBox?.style.setProperty('transform', 'none');
    return;
  }

  // ——— привязка к скроллу ———

  const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;

    // Прогресс ухода первого экрана: за него банка делает полный оборот.
    const heroRect = hero!.getBoundingClientRect();
    const spin = clamp01(-heroRect.top / Math.max(1, heroRect.height * 0.85));
    drawNearest(FACE_FRAME + spin * (FRAMES - 1));

    // Этикетка отклеивается и ложится в плоскость по мере входа панели.
    if (unfoldBox) {
      const r = unfoldBox.getBoundingClientRect();
      const q = clamp01((vh - r.top) / (vh * 0.55));
      const eased = 1 - Math.pow(1 - q, 3);
      const rot = (1 - eased) * -76;
      const sx = 0.46 + eased * 0.54;
      const sy = 0.72 + eased * 0.28;
      unfoldBox.style.transform = `perspective(1400px) rotateX(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}
