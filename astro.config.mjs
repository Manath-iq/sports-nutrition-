// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

// Публикуется на собственном поддомене, в корне — base не нужен.
// Все ссылки на файлы и страницы идут через src/lib/paths.ts, поэтому
// смена base ничего больше не требует.
export default defineConfig({
  site: 'https://sports-nutrition.manath.site',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'always',
  },
  server: { port: Number(process.env.PORT) || 4321 },
  vite: {
    plugins: [tailwind()],
    build: {
      cssCodeSplit: false,
    },
  },
});
