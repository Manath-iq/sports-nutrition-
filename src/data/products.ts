import type { CategoryId } from './categories';

/**
 * Ассортимент. В демо НЕТ ни одного реального бренда — это юридический риск
 * и мешает подмене. Названия построены по составу, а не по марке: это же
 * и есть концепция страницы.
 *
 * При переносе на клиента правится только этот файл: id должны остаться
 * теми же, что используются в matrix.ts, иначе подбор перестанет собираться.
 */

export type Diet = 'lactose-free' | 'plant' | 'sugar-free';

export interface Product {
  id: string;
  cat: CategoryId;
  /** Название по составу: «Сывороточный протеин, концентрат». */
  name: string;
  /** Объём упаковки в подписи: «900 Г». */
  pack: string;
  price: number;
  oldPrice?: number;
  /** Строка данных под названием в карточке. Только факты с этикетки. */
  data: string[];
  /** Порций в упаковке. */
  servings: number;
  /** Грамм белка в порции — нужно калькулятору. */
  proteinPerServing?: number;
  flavors: string[];
  diet: Diet[];
  badge?: { text: string; tone: 'neutral' | 'heat' };
  /** Хит продаж — попадает в ленту блока 06. */
  hit?: boolean;
  img: string;
  alt: string;
  /** Для конструктора: рекомендуемая схема приёма. */
  dosage: string;
  /** Сколько дней хватит упаковки при этой дозировке. */
  packDays: number;
  /** Одна строка «зачем это в наборе». Без обещаний лечения. */
  why: string;
}

export const products: Product[] = [
  {
    id: 'whey-concentrate-900',
    cat: 'protein',
    name: 'Сывороточный протеин, концентрат',
    pack: '900 г',
    price: 2890,
    oldPrice: 3400,
    data: ['900 Г', '30 ПОРЦИЙ', '24 Г БЕЛКА В ПОРЦИИ'],
    servings: 30,
    proteinPerServing: 24,
    flavors: ['Ваниль', 'Шоколад', 'Клубника', 'Банан', 'Кокос', 'Фисташка', 'Без вкуса'],
    diet: [],
    badge: { text: 'ХИТ', tone: 'neutral' },
    hit: true,
    img: '/demo/p-whey-concentrate.webp',
    alt: 'Банка сывороточного протеина, 900 грамм',
    dosage: '2 порции в день',
    packDays: 15,
    why: 'Закрывает нехватку белка в рационе',
  },
  {
    id: 'whey-isolate-900',
    cat: 'protein',
    name: 'Сывороточный протеин, изолят',
    pack: '900 г',
    price: 3990,
    data: ['900 Г', '30 ПОРЦИЙ', '27 Г БЕЛКА В ПОРЦИИ', '<1 Г ЛАКТОЗЫ'],
    servings: 30,
    proteinPerServing: 27,
    flavors: ['Ваниль', 'Шоколад', 'Малина', 'Без вкуса'],
    diet: ['lactose-free'],
    hit: true,
    img: '/demo/p-whey-isolate.webp',
    alt: 'Банка сывороточного изолята, 900 грамм',
    dosage: '2 порции в день',
    packDays: 15,
    why: 'Меньше лактозы и жира на ту же порцию белка',
  },
  {
    id: 'plant-protein-900',
    cat: 'protein',
    name: 'Растительный протеин, горох и рис',
    pack: '900 г',
    price: 2490,
    data: ['900 Г', '30 ПОРЦИЙ', '22 Г БЕЛКА В ПОРЦИИ'],
    servings: 30,
    proteinPerServing: 22,
    flavors: ['Какао', 'Ваниль', 'Без вкуса'],
    diet: ['plant', 'lactose-free'],
    img: '/demo/p-plant-protein.webp',
    alt: 'Банка растительного протеина, 900 грамм',
    dosage: '2 порции в день',
    packDays: 15,
    why: 'Полный аминокислотный профиль без молочного сырья',
  },
  {
    id: 'casein-900',
    cat: 'protein',
    name: 'Казеин мицеллярный',
    pack: '900 г',
    price: 3290,
    data: ['900 Г', '30 ПОРЦИЙ', '25 Г БЕЛКА В ПОРЦИИ'],
    servings: 30,
    proteinPerServing: 25,
    flavors: ['Ваниль', 'Шоколад'],
    diet: [],
    img: '/demo/p-casein.webp',
    alt: 'Банка мицеллярного казеина, 900 грамм',
    dosage: '1 порция на ночь',
    packDays: 30,
    why: 'Медленный белок на длинный перерыв между приёмами пищи',
  },
  {
    id: 'creatine-300',
    cat: 'creatine',
    name: 'Креатин моногидрат, порошок',
    pack: '300 г',
    price: 990,
    data: ['300 Г', '60 ПОРЦИЙ', '5 Г В ПОРЦИИ'],
    servings: 60,
    flavors: ['Без вкуса'],
    diet: ['plant', 'lactose-free', 'sugar-free'],
    badge: { text: 'ХИТ', tone: 'neutral' },
    hit: true,
    img: '/demo/p-creatine.webp',
    alt: 'Банка креатина моногидрата, 300 грамм',
    dosage: '5 г в день',
    packDays: 60,
    why: 'Одна из самых изученных добавок для силовой работы',
  },
  {
    id: 'creatine-caps-120',
    cat: 'creatine',
    name: 'Креатин моногидрат, капсулы',
    pack: '120 капсул',
    price: 1190,
    data: ['120 КАПСУЛ', '40 ПОРЦИЙ', '3 КАПСУЛЫ В ПОРЦИИ'],
    servings: 40,
    flavors: ['Без вкуса'],
    diet: ['sugar-free'],
    img: '/demo/p-creatine-caps.webp',
    alt: 'Банка креатина в капсулах',
    dosage: '3 капсулы в день',
    packDays: 40,
    why: 'То же самое, что порошок, но без шейкера',
  },
  {
    id: 'bcaa-300',
    cat: 'amino',
    name: 'BCAA 2:1:1, порошок',
    pack: '300 г',
    price: 1290,
    oldPrice: 1590,
    data: ['300 Г', '30 ПОРЦИЙ', '10 Г В ПОРЦИИ'],
    servings: 30,
    flavors: ['Лимон', 'Лесные ягоды', 'Апельсин', 'Без вкуса'],
    diet: ['lactose-free', 'sugar-free'],
    badge: { text: '−19%', tone: 'neutral' },
    hit: true,
    img: '/demo/p-bcaa.webp',
    alt: 'Банка BCAA, 300 грамм',
    dosage: '1 порция на тренировке',
    packDays: 30,
    why: 'Питьё на тренировку, когда до еды далеко',
  },
  {
    id: 'l-carnitine-500',
    cat: 'amino',
    name: 'L-карнитин, жидкий концентрат',
    pack: '500 мл',
    price: 890,
    data: ['500 МЛ', '25 ПОРЦИЙ', '1500 МГ В ПОРЦИИ'],
    servings: 25,
    flavors: ['Вишня', 'Цитрус'],
    diet: ['lactose-free'],
    img: '/demo/p-carnitine.webp',
    alt: 'Бутылка жидкого L-карнитина',
    dosage: '1 порция перед нагрузкой',
    packDays: 25,
    why: 'Берут на период дефицита калорий вместе с тренировками',
  },
  {
    id: 'vitamin-d3-60',
    cat: 'vitamins',
    name: 'Витамин D3, 2000 МЕ',
    pack: '60 капсул',
    price: 490,
    data: ['60 КАПСУЛ', '60 ПОРЦИЙ', '2000 МЕ В КАПСУЛЕ'],
    servings: 60,
    flavors: ['Без вкуса'],
    diet: ['sugar-free'],
    hit: true,
    img: '/demo/p-d3.webp',
    alt: 'Баночка витамина D3 в капсулах',
    dosage: '1 капсула утром',
    packDays: 60,
    why: 'Актуально с октября по апрель на нашей широте',
  },
  {
    id: 'omega-3-90',
    cat: 'vitamins',
    name: 'Омега-3, 1000 мг',
    pack: '90 капсул',
    price: 790,
    data: ['90 КАПСУЛ', '45 ПОРЦИЙ', '2 КАПСУЛЫ В ПОРЦИИ'],
    servings: 45,
    flavors: ['Без вкуса'],
    diet: [],
    img: '/demo/p-omega.webp',
    alt: 'Баночка омега-3 в капсулах',
    dosage: '2 капсулы с едой',
    packDays: 45,
    why: 'Добор жирных кислот, если рыба в рационе редко',
  },
  {
    id: 'multivit-90',
    cat: 'vitamins',
    name: 'Витаминно-минеральный комплекс',
    pack: '90 таблеток',
    price: 1090,
    data: ['90 ТАБЛЕТОК', '90 ПОРЦИЙ', '1 ТАБЛЕТКА В ДЕНЬ'],
    servings: 90,
    flavors: ['Без вкуса'],
    diet: ['sugar-free'],
    img: '/demo/p-multivit.webp',
    alt: 'Банка витаминно-минерального комплекса',
    dosage: '1 таблетка с завтраком',
    packDays: 90,
    why: 'База, когда рацион однообразный',
  },
  {
    id: 'magnesium-90',
    cat: 'vitamins',
    name: 'Магний цитрат с B6',
    pack: '90 капсул',
    price: 590,
    data: ['90 КАПСУЛ', '45 ПОРЦИЙ', '2 КАПСУЛЫ В ПОРЦИИ'],
    servings: 45,
    flavors: ['Без вкуса'],
    diet: ['plant', 'sugar-free'],
    img: '/demo/p-magnesium.webp',
    alt: 'Баночка магния с витамином B6',
    dosage: '2 капсулы вечером',
    packDays: 45,
    why: 'Часто добирают при регулярных нагрузках',
  },
  {
    id: 'gainer-3000',
    cat: 'gainer',
    name: 'Гейнер, углеводно-белковая смесь',
    pack: '3 кг',
    price: 2790,
    data: ['3 КГ', '30 ПОРЦИЙ', '30 Г БЕЛКА · 70 Г УГЛЕВОДОВ'],
    servings: 30,
    proteinPerServing: 30,
    flavors: ['Шоколад', 'Ваниль', 'Клубника'],
    diet: [],
    badge: { text: 'ОСТАЛОСЬ 3', tone: 'heat' },
    hit: true,
    img: '/demo/p-gainer.webp',
    alt: 'Упаковка гейнера, 3 килограмма',
    dosage: '1 порция после тренировки',
    packDays: 30,
    why: 'Проще добрать калории, когда аппетита не хватает',
  },
  {
    id: 'bar-box-12',
    cat: 'bars',
    name: 'Протеиновые батончики, коробка',
    pack: '12 шт × 60 г',
    price: 1440,
    oldPrice: 1680,
    data: ['12 ШТ', '20 Г БЕЛКА В БАТОНЧИКЕ', 'БЕЗ САХАРА'],
    servings: 12,
    proteinPerServing: 20,
    flavors: ['Арахис', 'Кокос', 'Двойной шоколад', 'Солёная карамель'],
    diet: ['sugar-free'],
    badge: { text: '−14%', tone: 'neutral' },
    hit: true,
    img: '/demo/p-bars.webp',
    alt: 'Коробка протеиновых батончиков',
    dosage: '1 батончик как перекус',
    packDays: 12,
    why: 'Перекус на 20 г белка вместо сладкого',
  },
  {
    id: 'collagen-200',
    cat: 'bars',
    name: 'Коллаген с витамином C',
    pack: '200 г',
    price: 1190,
    data: ['200 Г', '20 ПОРЦИЙ', '10 Г В ПОРЦИИ'],
    servings: 20,
    flavors: ['Без вкуса', 'Лимон'],
    diet: ['lactose-free'],
    hit: true,
    img: '/demo/p-collagen.webp',
    alt: 'Банка коллагена с витамином C',
    dosage: '1 порция в день',
    packDays: 20,
    why: 'Берут в дополнение к обычному белку в рационе',
  },
];

export const productById = Object.fromEntries(
  products.map((p) => [p.id, p]),
) as Record<string, Product>;

export const hits = products.filter((p) => p.hit);

/** Минимальная цена в категории — для подписей в бенто-сетке. */
export function minPrice(cat: CategoryId): number {
  const inCat = products.filter((p) => p.cat === cat);
  return inCat.length ? Math.min(...inCat.map((p) => p.price)) : 0;
}

export function countIn(cat: CategoryId): number {
  return products.filter((p) => p.cat === cat).length;
}
