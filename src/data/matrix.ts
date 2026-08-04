import { productById, type Product } from './products';

/**
 * Правила подбора для конструктора цели.
 * Это таблица правил, а не ИИ: результат должен быть предсказуемым,
 * объяснимым продавцу и правимым под ассортимент конкретного клиента.
 *
 * Порядок работы: базовый набор по цели → модификаторы по опыту и
 * ограничениям → обрезка по бюджету. Правила применяются сверху вниз.
 */

export type Goal = 'mass' | 'cut' | 'power' | 'protein';
export type Exp = 'novice' | 'mid' | 'pro';
export type Limit = 'lactose' | 'plant' | 'none';
export type Budget = 'low' | 'mid' | 'high';

export interface Answers {
  goal: Goal;
  exp: Exp;
  limit: Limit;
  budget: Budget;
}

export const labels = {
  goal: {
    mass: 'Набор массы',
    cut: 'Снижение веса',
    power: 'Больше сил',
    protein: 'Добор белка',
  },
  exp: {
    novice: 'Новичок',
    mid: 'Опыт до 2 лет',
    pro: 'Опыт 2+ года',
  },
  limit: {
    lactose: 'Без лактозы',
    plant: 'Растительное',
    none: 'Без ограничений',
  },
  budget: {
    low: 'До 3 000 ₽',
    mid: '3 000–6 000 ₽',
    high: 'Больше 6 000 ₽',
  },
} as const;

/** Потолок и максимум позиций по бюджету. */
const budgetRules: Record<Budget, { cap: number; maxItems: number }> = {
  low: { cap: 3000, maxItems: 2 },
  mid: { cap: 6000, maxItems: 3 },
  high: { cap: Infinity, maxItems: 4 },
};

/** Базовый набор по цели. Порядок = приоритет: последнее отваливается первым. */
const base: Record<Goal, string[]> = {
  mass: ['whey-concentrate-900', 'creatine-300', 'vitamin-d3-60'],
  cut: ['whey-isolate-900', 'multivit-90', 'l-carnitine-500'],
  power: ['whey-concentrate-900', 'creatine-300', 'magnesium-90'],
  protein: ['whey-concentrate-900', 'vitamin-d3-60', 'bar-box-12'],
};

type Op =
  | { add: string }
  | { drop: string }
  | { replace: [string, string] };

interface Rule {
  id: string;
  when: (a: Answers) => boolean;
  ops: Op[];
  /** Строка-объяснение на экране результата. */
  note?: string;
}

const rules: Rule[] = [
  // ——— опыт
  {
    id: 'novice-no-bcaa',
    when: (a) => a.exp === 'novice',
    ops: [{ drop: 'bcaa-300' }, { drop: 'l-carnitine-500' }],
    note: 'Пока хватит базы. Аминокислоты и жиросжигатели имеют смысл, когда сон и еда уже налажены.',
  },
  {
    id: 'pro-adds-casein',
    when: (a) => a.exp === 'pro' && a.goal === 'mass' && a.budget !== 'low',
    ops: [{ add: 'casein-900' }],
  },
  {
    id: 'pro-adds-bcaa',
    when: (a) => a.exp !== 'novice' && a.goal === 'power' && a.budget === 'high',
    ops: [{ add: 'bcaa-300' }],
  },

  // ——— цель + бюджет
  {
    id: 'mass-high-gainer',
    when: (a) => a.goal === 'mass' && a.budget === 'high',
    ops: [{ add: 'gainer-3000' }],
  },
  {
    id: 'cut-high-omega',
    when: (a) => a.goal === 'cut' && a.budget === 'high',
    ops: [{ add: 'omega-3-90' }],
  },
  {
    id: 'protein-high-collagen',
    when: (a) => a.goal === 'protein' && a.budget === 'high',
    ops: [{ add: 'collagen-200' }],
  },
  {
    id: 'cut-novice-simplify',
    when: (a) => a.goal === 'cut' && a.exp === 'novice',
    ops: [{ add: 'vitamin-d3-60' }],
    note: 'При снижении веса главное — белок и дефицит калорий. Остальное второстепенно.',
  },

  // ——— ограничения: молоко
  {
    id: 'lactose-isolate',
    when: (a) => a.limit === 'lactose',
    ops: [
      { replace: ['whey-concentrate-900', 'whey-isolate-900'] },
      { drop: 'casein-900' },
      { drop: 'gainer-3000' },
    ],
    note: 'Заменили концентрат на изолят: в нём меньше грамма лактозы на порцию.',
  },

  // ——— ограничения: растительное
  {
    id: 'plant-swap',
    when: (a) => a.limit === 'plant',
    ops: [
      { replace: ['whey-concentrate-900', 'plant-protein-900'] },
      { replace: ['whey-isolate-900', 'plant-protein-900'] },
      { drop: 'casein-900' },
      { drop: 'gainer-3000' },
      { drop: 'collagen-200' },
      { replace: ['omega-3-90', 'magnesium-90'] },
    ],
    note: 'Собрали набор без сырья животного происхождения: гороховый протеин вместо сывороточного.',
  },

  // ——— бюджет
  {
    id: 'low-budget-basics',
    when: (a) => a.budget === 'low',
    ops: [{ drop: 'multivit-90' }, { drop: 'collagen-200' }, { drop: 'bar-box-12' }],
  },
];

export interface PickedItem {
  product: Product;
  index: number;
}

export interface QuizResult {
  answers: Answers;
  items: PickedItem[];
  total: number;
  /** Диапазон: на сколько дней хватит позиций набора. */
  days: [number, number];
  notes: string[];
  /** Итог вышел за названный бюджет — говорим об этом прямо. */
  overBudget: boolean;
  cap: number;
}

export function buildSet(answers: Answers): QuizResult {
  let ids = [...base[answers.goal]];
  const notes: string[] = [];

  for (const rule of rules) {
    if (!rule.when(answers)) continue;
    for (const op of rule.ops) {
      if ('add' in op) {
        if (!ids.includes(op.add)) ids.push(op.add);
      } else if ('drop' in op) {
        ids = ids.filter((id) => id !== op.drop);
      } else {
        const [from, to] = op.replace;
        const i = ids.indexOf(from);
        // Если замена уже в наборе, дубль снимется ниже — позиция «from» уходит.
        if (i !== -1) ids[i] = to;
      }
    }
    if (rule.note) notes.push(rule.note);
  }

  // Дубли после замен
  ids = [...new Set(ids)];

  const { cap, maxItems } = budgetRules[answers.budget];
  ids = ids.slice(0, maxItems);

  // Обрезаем по бюджету, но не тоньше двух позиций: набор из одной банки
  // выглядит как отписка, а честнее сказать про перебор текстом.
  const sum = (list: string[]) =>
    list.reduce((acc, id) => acc + (productById[id]?.price ?? 0), 0);

  while (ids.length > 2 && sum(ids) > cap) ids.pop();

  const items = ids
    .map((id) => productById[id])
    .filter(Boolean)
    .map((product, index) => ({ product, index }));

  const total = sum(ids);
  const dayValues = items.map((i) => i.product.packDays);
  const days: [number, number] = [
    dayValues.length ? Math.min(...dayValues) : 0,
    dayValues.length ? Math.max(...dayValues) : 0,
  ];

  const overBudget = total > cap;
  if (overBudget) {
    notes.push(
      `Набор вышел дороже названного бюджета на ${total - cap} ₽. Если нужно строго в рамках — возьмите первую позицию, остальное можно добрать в следующий раз.`,
    );
  }

  return { answers, items, total, days, notes, overBudget, cap };
}

/** Текст заявки для WhatsApp. Продавец должен понять заказ без переспросов. */
export function orderText(result: QuizResult, name?: string, phone?: string): string {
  const { answers, items, total, days } = result;
  const head = [
    'Здравствуйте! Собрал набор на сайте.',
    '',
    `Цель: ${labels.goal[answers.goal]}`,
    `Опыт: ${labels.exp[answers.exp]}`,
    `Ограничения: ${labels.limit[answers.limit]}`,
    `Бюджет: ${labels.budget[answers.budget]}`,
    '',
    'Набор:',
  ];
  const lines = items.map(
    (i, n) =>
      `${n + 1}. ${i.product.name}, ${i.product.pack} — ${i.product.dosage} — ${i.product.price} ₽`,
  );
  const tail = [
    '',
    `Итого: ${total} ₽`,
    `Хватит на ${days[0]}–${days[1]} дней`,
  ];
  if (name) tail.push('', `Имя: ${name}`);
  if (phone) tail.push(`Телефон: ${phone}`);
  return [...head, ...lines, ...tail].join('\n');
}
