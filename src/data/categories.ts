export type CategoryId =
  | 'protein'
  | 'creatine'
  | 'amino'
  | 'vitamins'
  | 'gainer'
  | 'bars';

export interface Category {
  id: CategoryId;
  title: string;
  /** Подпись под названием. Цены подставляются из ассортимента. */
  sub: string;
  /** Крупная плитка в бенто-сетке. */
  large?: boolean;
  img: string;
  alt: string;
}

/** Шесть категорий закрывают 90% задач. Порядок = порядок в бенто-сетке. */
export const categories: Category[] = [
  {
    id: 'protein',
    title: 'Протеин',
    sub: 'Изолят, концентрат, казеин',
    large: true,
    img: '/demo/cat-protein.webp',
    alt: 'Банки сывороточного протеина на светлом фоне',
  },
  {
    id: 'creatine',
    title: 'Креатин',
    sub: 'Моногидрат в порошке и капсулах',
    large: true,
    img: '/demo/cat-creatine.webp',
    alt: 'Банка креатина моногидрата и мерная ложка',
  },
  {
    id: 'amino',
    title: 'Аминокислоты и BCAA',
    sub: 'Восстановление после нагрузки',
    img: '/demo/cat-amino.webp',
    alt: 'Банка аминокислот с порошком',
  },
  {
    id: 'vitamins',
    title: 'Витамины и минералы',
    sub: 'Комплексы, D3, магний, омега',
    img: '/demo/cat-vitamins.webp',
    alt: 'Баночки с витаминами и капсулами',
  },
  {
    id: 'gainer',
    title: 'Гейнеры',
    sub: 'Для набора массы при быстром обмене',
    img: '/demo/cat-gainer.webp',
    alt: 'Большая упаковка гейнера',
  },
  {
    id: 'bars',
    title: 'Батончики и напитки',
    sub: 'Перекус на 20 г белка',
    img: '/demo/cat-bars.webp',
    alt: 'Протеиновые батончики и напиток',
  },
];

export const categoryById = Object.fromEntries(
  categories.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;
