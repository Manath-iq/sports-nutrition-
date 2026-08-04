// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

// Демо живёт на GitHub Pages в подкаталоге репозитория.
// Для боевого проекта в корне домена: site: 'https://домен.ру', base: '/'.
// Все ссылки на файлы и страницы идут через src/lib/paths.ts, поэтому
// смена base ничего больше не требует.
export default defineConfig({
  site: 'https://manath-iq.github.io',
  base: '/sports-nutrition-/',
  trailingSlash: 'ignore',
  build: {
    // Один экран решает всё: инлайн стилей убирает блокирующий запрос
    // ценой ~12 КБ в HTML. Для лендинга это выгоднее, чем кеш файла.
    inlineStylesheets: 'always',
  },
  // Порт задаётся окружением, чтобы дев-сервер поднимался там, где его ждут.
  server: { port: Number(process.env.PORT) || 4321 },
  vite: {
    plugins: [tailwind()],
    build: {
      cssCodeSplit: false,
    },
  },
});
