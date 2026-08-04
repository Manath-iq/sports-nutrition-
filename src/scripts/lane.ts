/** Горизонтальная лента: перетаскивание мышью и стрелки на desktop. */

export function initLane(): void {
  const lane = document.querySelector<HTMLElement>('[data-lane]');
  if (!lane) return;

  const prev = document.querySelector<HTMLButtonElement>('[data-lane-prev]');
  const next = document.querySelector<HTMLButtonElement>('[data-lane-next]');

  const card = lane.querySelector<HTMLElement>('.card');
  const step = () => (card?.offsetWidth ?? 300) + 16;

  const updateArrows = () => {
    if (!prev || !next) return;
    const max = lane.scrollWidth - lane.clientWidth - 2;
    prev.disabled = lane.scrollLeft <= 2;
    next.disabled = lane.scrollLeft >= max;
  };

  prev?.addEventListener('click', () =>
    lane.scrollBy({ left: -step(), behavior: 'smooth' }),
  );
  next?.addEventListener('click', () => lane.scrollBy({ left: step(), behavior: 'smooth' }));
  lane.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows, { passive: true });
  updateArrows();

  // Drag-скролл мышью. На тач-устройствах не мешаем нативному жесту.
  let down = false;
  let startX = 0;
  let startScroll = 0;
  let moved = 0;
  let captured = false;

  lane.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true;
    moved = 0;
    captured = false;
    startX = e.clientX;
    startScroll = lane.scrollLeft;
    // Захват указателя здесь ставить нельзя: при активном захвате click
    // приходит на саму ленту, и кнопка «В заказ» внутри карточки его не
    // получает. Захватываем только когда стало ясно, что это перетаскивание.
  });

  lane.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.abs(dx);
    if (moved > 4 && !captured) {
      captured = true;
      lane.dataset.dragging = 'true';
      lane.setPointerCapture(e.pointerId);
    }
    if (captured) lane.scrollLeft = startScroll - dx;
  });

  const end = (e: PointerEvent) => {
    if (!down) return;
    down = false;
    delete lane.dataset.dragging;
    if (captured && lane.hasPointerCapture(e.pointerId)) lane.releasePointerCapture(e.pointerId);
    captured = false;
  };
  lane.addEventListener('pointerup', end);
  lane.addEventListener('pointercancel', end);

  // Клик по кнопке внутри карточки не должен срабатывать после перетаскивания.
  lane.addEventListener(
    'click',
    (e) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    },
    true,
  );
}
