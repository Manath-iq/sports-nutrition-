/**
 * ЕДИНСТВЕННЫЙ файл, который правится при переносе шаблона на нового клиента.
 * Плюс папка /public/client/ с его фотографиями и src/data/products.ts с ассортиментом.
 * Цель: 20 минут на подмену. Хардкода города/телефона нигде больше быть не должно.
 */

export type Theme = 'light' | 'dark';

export interface ClientConfig {
  /**
   * Демо-сборка для портфолио, а не сайт работающего магазина.
   * true закрывает страницу от индексации, убирает микроразметку Store
   * и FAQPage (заявка на существующий магазин с адресом и телефоном,
   * которых нет) и включает оговорку в подвале.
   * Под живого клиента — false, и всё это возвращается само.
   */
  demo: boolean;
  name: string;
  legalName: string;
  city: string;
  /** Предложный падеж: «в Нижнекамске» — для заголовков и title. */
  cityIn: string;
  /** Родительный падеж: «Нижнекамска» — для «доставка по городу». */
  cityGen: string;
  /** Дательный падеж: «по Нижнекамску». */
  cityDat: string;
  foundedYear: number;
  theme: Theme;
  /** Фирменный цвет клиента. Ляжет в --c-accent, из него считается --signal
   * (в тёмной теме автоматически осветляется). */
  accent: string;

  hero: {
    /** 1..4 — варианты H1 из блока 01. */
    variant: 1 | 2 | 3 | 4;
    positions: number;
    pickupMinutes: number;
  };

  contacts: {
    phone: string;
    /** Только цифры, для ссылки wa.me. */
    whatsapp: string;
    address: string;
    addressNote: string;
    hours: string;
    /** [широта, долгота] */
    mapCoords: [number, number];
    social: { vk: string; telegram: string; twoGis: string };
  };

  consultant: {
    name: string;
    role: string;
    yearsGym: number;
    yearsShop: number;
    replyMinutes: string;
    photo: string;
  };

  stats: { years: number; customers: number; rating: number };

  delivery: {
    cityPrice: number;
    cityFreeFrom: number;
    cutoffHour: number;
    russiaFrom: number;
    /** Скидка за объём. */
    bulkFrom: number;
    bulkPercent: number;
    /** Цена сашета «попробовать вкус». */
    sachetPrice: number;
  };

  legal: {
    entity: string;
    inn: string;
    /** false → на странице появляется «не является публичной офертой». */
    isOffer: boolean;
    privacyUpdated: string;
  };

  /** Номер счётчика Яндекс.Метрики. 0 — счётчик не подключается. */
  metrika: number;

  /**
   * Приём финальной формы. Пустой formspreeId — форма уходит в WhatsApp
   * тем же способом, что и конструктор. Бэкенда у шаблона нет намеренно.
   */
  forms: { formspreeId: string };

  /** Продублировать заявку в Telegram-бота (опция). */
  telegram: { enabled: boolean; botLink: string };

  /** Дата актуальности цен в блоке «Хиты продаж». */
  pricesActualAt: string;
}

export const client: ClientConfig = {
  demo: true,
  name: 'СОСТАВ',
  legalName: 'магазин спортивного питания «СОСТАВ»',
  city: 'Нижнекамск',
  cityIn: 'в Нижнекамске',
  cityGen: 'Нижнекамска',
  cityDat: 'Нижнекамску',
  foundedYear: 2018,
  theme: 'light',
  accent: '#1F3CFF',

  hero: {
    variant: 1,
    positions: 640,
    pickupMinutes: 30,
  },

  contacts: {
    phone: '+7 900 000-00-00',
    whatsapp: '79000000000',
    address: 'пр. Химиков, 42',
    addressNote: '1 этаж, вход со стороны парковки',
    hours: 'Пн–Сб 10:00–20:00, Вс 11:00–18:00',
    mapCoords: [55.6366, 51.8245],
    social: { vk: '#', telegram: '#', twoGis: '#' },
  },

  consultant: {
    name: 'Ринат',
    role: 'владелец магазина',
    yearsGym: 12,
    yearsShop: 7,
    replyMinutes: '10–15 минут',
    // Съёмка клиента кладётся в /public/client/ и путь меняется здесь.
    photo: '/demo/consultant.webp',
  },

  stats: { years: 7, customers: 1200, rating: 4.9 },

  delivery: {
    cityPrice: 250,
    cityFreeFrom: 3000,
    cutoffHour: 16,
    russiaFrom: 350,
    bulkFrom: 8000,
    bulkPercent: 7,
    sachetPrice: 90,
  },

  legal: {
    entity: 'ИП Иванов И. И.',
    inn: '000000000000',
    isOffer: false,
    privacyUpdated: '1 августа 2026',
  },

  metrika: 0,

  forms: { formspreeId: '' },

  telegram: { enabled: false, botLink: '' },

  pricesActualAt: '4 августа',
};

/** Год для копирайта — считается, а не хардкодится. */
export const currentYear = new Date().getFullYear();

/** Ссылка на WhatsApp с преднабранным текстом. */
export function waLink(text = ''): string {
  const base = `https://wa.me/${client.contacts.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Телефон в виде tel: */
export const telLink = `tel:${client.contacts.phone.replace(/[^\d+]/g, '')}`;
