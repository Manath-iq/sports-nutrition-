/** Маска +7 (___) ___-__-__ и проверка полноты номера. */

export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7')) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  const rest = digits.slice(1);
  let out = '+7';
  if (rest.length) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += `) ${rest.slice(3, 6)}`;
  if (rest.length >= 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length >= 8) out += `-${rest.slice(8, 10)}`;
  return out;
}

export function isPhoneComplete(value: string): boolean {
  return value.replace(/\D/g, '').length === 11;
}

/** Вешает маску на поле. Курсор всегда в конец — для телефона это ожидаемо. */
export function maskPhone(input: HTMLInputElement): void {
  const apply = () => {
    input.value = formatPhone(input.value);
    input.setAttribute('aria-invalid', String(!isPhoneComplete(input.value) && input.value.length > 3));
  };
  input.addEventListener('focus', () => {
    if (!input.value) input.value = '+7 ';
  });
  input.addEventListener('input', apply);
  input.addEventListener('blur', () => {
    if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
  });
}

/** Отправка цели в Метрику, если счётчик подключён. */
export function goal(name: string): void {
  const w = window as unknown as { ym?: (id: number, action: string, target: string) => void };
  const id = Number(document.documentElement.dataset.metrika ?? '0');
  if (w.ym && id) w.ym(id, 'reachGoal', name);
}
