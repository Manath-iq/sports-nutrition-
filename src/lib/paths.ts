/**
 * Пути с учётом базового каталога сборки.
 *
 * Демо живёт на GitHub Pages в подкаталоге /sports-nutrition-/, а боевой
 * проект обычно в корне домена. Абсолютные пути вида «/demo/x.webp» ломаются
 * в первом случае, относительные — во втором. Поэтому всё, что ссылается на
 * файлы из /public и на внутренние страницы, проходит через эти две функции.
 *
 * import.meta.env.BASE_URL подставляется на этапе сборки и в .astro,
 * и в клиентских скриптах.
 */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Файл из /public: asset('/demo/og.webp') → '/sports-nutrition-/demo/og.webp' */
export function asset(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Внутренняя ссылка. Якоря и внешние адреса возвращаются как есть. */
export function link(path: string): string {
  if (path.startsWith('#') || /^[a-z]+:/i.test(path)) return path;
  return asset(path);
}
