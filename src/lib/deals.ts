import { CartItem, MenuItem, PizzaSize } from '../types';
import { SIZE_PRICE_MODIFIERS } from '../data/mockData';
import { FRIDAY, LUNCH, OfferSchedule, TUESDAY, isScheduleActive } from '../utils/offerSchedule';
import { FREE_GIFT_NAME, FREE_GIFT_THRESHOLD } from './billing';

/** Price of a pizza at a size, before crust / toppings / cheese. */
export const pizzaSizePrice = (item: MenuItem, size: PizzaSize): number =>
  item.sizePrices?.[size] ?? item.price + (SIZE_PRICE_MODIFIERS[size] || 0);

export type OfferKey = 'tuesday' | 'friday' | 'lunch' | 'free-lava' | 'free-delivery';

/** True on Tuesday / Friday, when the day deal runs all day. */
export const isDayDealDay = (now: Date): boolean =>
  isScheduleActive(TUESDAY, now) || isScheduleActive(FRIDAY, now);

export interface OfferInfo {
  key: OfferKey;
  name: string;
  when: string;
  /** Running window; omitted = every day. */
  schedule?: OfferSchedule;
  /** Hero banner schedule whose image illustrates the offer. */
  slideSchedule?: 'tuesday' | 'friday' | 'lunch';
  summary: string;
  perks: string[];
  terms: string[];
}

const HAND_TOSSED_TERM = 'Medium & Large Hand Tossed pizzas only (not Pan Pizzas)';
const CRUST_TERM = 'Upgrade to your favourite crust — charges extra';
const AUTO_TERM = 'Applied automatically in the cart; coupons don’t stack — the bigger saving applies';

const TUESDAY_TERMS = [
  HAND_TOSSED_TERM,
  'The free pizza is from the same group as the one you buy, or a cheaper group (veg or non-veg)',
  CRUST_TERM,
  AUTO_TERM,
];

const FRIDAY_TERMS = [HAND_TOSSED_TERM, CRUST_TERM, 'Not on Simply Veg or Simply Non-Veg pizzas', AUTO_TERM];

/** Offers as printed on the store banners. Shown on the Offers page and in the deal pop-ups. */
export const OFFERS: OfferInfo[] = [
  {
    key: 'tuesday',
    name: 'Tuesday Treat',
    when: 'Every Tuesday',
    schedule: TUESDAY,
    slideSchedule: 'tuesday',
    summary: 'Medium pizza FREE with a Large, Small pizza FREE with a Medium.',
    perks: ['Medium pizza FREE with every Large pizza', 'Small (Regular) pizza FREE with every Medium pizza'],
    terms: TUESDAY_TERMS,
  },
  {
    key: 'friday',
    name: 'Funday Friday',
    when: 'Every Friday',
    schedule: FRIDAY,
    slideSchedule: 'friday',
    summary: 'Buy One Get One pizza on Medium & Large pizzas.',
    perks: ['Buy 1 Medium pizza, get 1 Medium FREE', 'Buy 1 Large pizza, get 1 Large FREE'],
    terms: FRIDAY_TERMS,
  },
  {
    key: 'lunch',
    name: 'Lunch Combo',
    when: 'Every day · 11 AM – 2 PM',
    schedule: LUNCH,
    slideSchedule: 'lunch',
    summary: 'Pizza + cold drink + fries, from ₹149.',
    perks: ['1 Regular or Medium pizza (Veg / Non-Veg)', '1 Cold Drink', '1 Fries'],
    terms: ['Available 11:00 AM – 2:00 PM only', 'Not on Tuesday / Friday – the day deal runs instead'],
  },
  {
    key: 'free-lava',
    name: `Free ${FREE_GIFT_NAME}`,
    when: 'Every day',
    summary: `A FREE ${FREE_GIFT_NAME} on orders of ₹${FREE_GIFT_THRESHOLD} or more.`,
    perks: [`Add items worth ₹${FREE_GIFT_THRESHOLD}+ and the cake is added for free`],
    terms: ['One free cake per order', "Can't be combined with a coupon or another running offer"],
  },
  {
    key: 'free-delivery',
    name: 'Free Delivery',
    when: 'Every day',
    summary: 'Free delivery on orders above ₹99.',
    perks: ['No delivery charge on orders of ₹99 or more'],
    terms: ['Applied automatically, no coupon needed'],
  },
];

export const offerByKey = (key: string) => OFFERS.find((o) => o.key === key);

export interface DayDealResult {
  key: 'tuesday' | 'friday';
  name: string;
  /** Total taken off the bill. */
  discount: number;
  /** cartItemId → free units on that line and their value. */
  free: Record<string, { qty: number; amount: number }>;
  /** Nudge shown in the cart when one more pizza would unlock a free one. */
  hint?: string;
}

/** Day deal pizzas: veg & non-veg pizzas. Simply Veg / Non-Veg count on Tuesday only. */
const isDealPizza = (item: MenuItem, allowSimple: boolean) =>
  (item.category === 'veg-pizza' || item.category === 'non-veg-pizza') &&
  item.id !== 'p-make-your-own' &&
  (allowSimple || !(item.subCategoryTitle || '').startsWith('Simple'));

interface Unit {
  cartItemId: string;
  item: MenuItem;
  size: PizzaSize;
  /** What this pizza takes off the bill when it's free. */
  value: number;
}

/**
 * Tuesday: a free pizza may cost at most what the pizza that unlocks it costs at the free size.
 * So a Large Simple Veg frees a Simple Veg Medium (₹229 or less), while a Large Veg Special frees
 * any Medium up to ₹449: same group or a cheaper one, veg or non-veg.
 */
const priceAt = (u: Unit, size: PizzaSize) => pizzaSizePrice(u.item, size);

/**
 * Pairs each free pizza with a paid one that covers it, using the smallest cover that works so the
 * biggest covers stay open. Returns the covers left over, or null when the free pizzas can't all be paired.
 */
function pairFree(paid: Unit[], free: Unit[], freeSize: PizzaSize): number[] | null {
  const covers = paid.map((p) => priceAt(p, freeSize)).sort((a, b) => a - b);
  const needs = free.map((f) => priceAt(f, freeSize)).sort((a, b) => b - a);
  for (const need of needs) {
    const i = covers.findIndex((c) => c >= need);
    if (i < 0) return null;
    covers.splice(i, 1);
  }
  return covers;
}

/** The free pizzas worth the most that the paid ones can cover: most valuable first, kept if they still all pair. */
function pickFree(paid: Unit[], candidates: Unit[], freeSize: PizzaSize): Unit[] {
  const chosen: Unit[] = [];
  [...candidates]
    .sort((a, b) => b.value - a.value)
    .forEach((c) => {
      if (pairFree(paid, [...chosen, c], freeSize)) chosen.push(c);
    });
  return chosen;
}

const sum = (list: Unit[]) => list.reduce((s, u) => s + u.value, 0);

/** Tuesday: Medium free with a Large, Small free with a Medium, each by the price rule above. */
function tuesdayDeal(large: Unit[], medium: Unit[], regular: Unit[]): { free: Unit[]; hint?: string } {
  // A Medium is either free (with a Large) or paid (and can free a Small), so try every split.
  // Carts with a lot of Mediums use the plain best-first pick instead.
  const splits: Unit[][] = [];
  if (medium.length <= 10) {
    for (let mask = 0; mask < 1 << medium.length; mask++) {
      const freeMedium = medium.filter((_, i) => mask & (1 << i));
      if (pairFree(large, freeMedium, 'Medium')) splits.push(freeMedium);
    }
  } else {
    splits.push(pickFree(large, medium, 'Medium'));
  }

  let best = { freeMedium: [] as Unit[], freeRegular: [] as Unit[], total: -1 };
  for (const freeMedium of splits) {
    const paidMedium = medium.filter((m) => !freeMedium.includes(m));
    const freeRegular = pickFree(paidMedium, regular, 'Regular');
    const total = sum(freeMedium) + sum(freeRegular);
    if (total > best.total) best = { freeMedium, freeRegular, total };
  }

  const { freeMedium, freeRegular } = best;
  const paidMedium = medium.filter((m) => !freeMedium.includes(m));
  const openLarge = pairFree(large, freeMedium, 'Medium') ?? [];
  const openMedium = pairFree(paidMedium, freeRegular, 'Regular') ?? [];
  let hint: string | undefined;
  if (openLarge.length > 0) {
    hint = `Add a Medium pizza up to ₹${Math.max(...openLarge)} — it’s FREE with your Large today`;
  } else if (openMedium.length > 0) {
    hint = `Add a Small (Regular) pizza up to ₹${Math.max(...openMedium)} — it’s FREE with your Medium today`;
  }
  return { free: [...freeMedium, ...freeRegular], hint };
}

/** Works out today's Tuesday / Friday pizza deal for the cart, or null when none is running. */
export function computeDayDeal(cart: CartItem[], menu: MenuItem[], now: Date): DayDealResult | null {
  const tuesday = isScheduleActive(TUESDAY, now);
  const friday = isScheduleActive(FRIDAY, now);
  if (!tuesday && !friday) return null;

  const units: Unit[] = [];
  cart.forEach((line) => {
    const item = menu.find((m) => m.id === line.productId);
    // Pan Pizzas are their own category and never count; the Pan crust on a normal pizza doesn't either.
    // Cheese Burst / Thin Crust still count (the upgrade is charged on top).
    if (!item || !line.size || !isDealPizza(item, tuesday) || line.crust === 'Fresh Pan Pizza') return;
    // Never more than the line itself costs (e.g. an old cart saved before a price change).
    const value = Math.min(pizzaSizePrice(item, line.size), line.price);
    for (let i = 0; i < line.quantity; i++) units.push({ cartItemId: line.cartItemId, item, size: line.size, value });
  });
  if (units.length === 0) return null;

  const ofSize = (size: PizzaSize) => units.filter((u) => u.size === size);
  const freeUnits: Unit[] = [];
  let hint: string | undefined;

  if (tuesday) {
    const result = tuesdayDeal(ofSize('Large'), ofSize('Medium'), ofSize('Regular'));
    freeUnits.push(...result.free);
    hint = result.hint;
  } else {
    // Buy one get one: pair pizzas of the same size, the cheaper of each pair is free.
    (['Medium', 'Large'] as PizzaSize[]).forEach((size) => {
      const list = ofSize(size).sort((a, b) => b.value - a.value);
      list.forEach((u, i) => {
        if (i % 2 === 1) freeUnits.push(u);
      });
      if (list.length % 2 === 1 && !hint) hint = `Add 1 more ${size} pizza — it’s FREE today (Buy 1 Get 1)`;
    });
  }

  if (freeUnits.length === 0 && !hint) return null;
  const free: DayDealResult['free'] = {};
  freeUnits.forEach((u) => {
    const f = (free[u.cartItemId] ??= { qty: 0, amount: 0 });
    f.qty += 1;
    f.amount += u.value;
  });
  return {
    key: tuesday ? 'tuesday' : 'friday',
    name: tuesday ? 'Tuesday Treat' : 'Funday Friday',
    discount: freeUnits.reduce((s, u) => s + u.value, 0),
    free,
    hint,
  };
}
