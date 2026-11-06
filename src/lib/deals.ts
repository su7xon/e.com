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

const DAY_DEAL_TERMS = [
  'Medium & Large Hand Tossed pizzas only (not Pan Pizzas)',
  'Upgrade to your favourite crust — charges extra',
  'Not on Simply Veg or Simply Non-Veg pizzas',
  'Applied automatically in the cart; coupons don’t stack — the bigger saving applies',
];

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
    terms: DAY_DEAL_TERMS,
  },
  {
    key: 'friday',
    name: 'Funday Friday',
    when: 'Every Friday',
    schedule: FRIDAY,
    slideSchedule: 'friday',
    summary: 'Buy One Get One pizza on Medium & Large pizzas.',
    perks: ['Buy 1 Medium pizza, get 1 Medium FREE', 'Buy 1 Large pizza, get 1 Large FREE'],
    terms: DAY_DEAL_TERMS,
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

/** Tuesday Treat / Funday Friday pizzas: hand-tossed veg & non-veg pizzas, not Simply Veg / Non-Veg. */
const isDealPizza = (item: MenuItem) =>
  (item.category === 'veg-pizza' || item.category === 'non-veg-pizza') &&
  item.id !== 'p-make-your-own' &&
  !(item.subCategoryTitle || '').startsWith('Simple');

interface Unit {
  cartItemId: string;
  size: PizzaSize;
  value: number;
}

/** Works out today's Tuesday / Friday pizza deal for the cart, or null when none is running. */
export function computeDayDeal(cart: CartItem[], menu: MenuItem[], now: Date): DayDealResult | null {
  const tuesday = isScheduleActive(TUESDAY, now);
  const friday = isScheduleActive(FRIDAY, now);
  if (!tuesday && !friday) return null;

  const units: Unit[] = [];
  cart.forEach((line) => {
    const item = menu.find((m) => m.id === line.productId);
    if (!item || !line.size || !isDealPizza(item)) return;
    // Never more than the line itself costs (e.g. an old cart saved before a price change).
    const value = Math.min(pizzaSizePrice(item, line.size), line.price);
    for (let i = 0; i < line.quantity; i++) units.push({ cartItemId: line.cartItemId, size: line.size, value });
  });
  if (units.length === 0) return null;

  const ofSize = (size: PizzaSize) => units.filter((u) => u.size === size);
  const freeUnits: Unit[] = [];
  let hint: string | undefined;

  if (tuesday) {
    // The cheapest pizzas are the free ones.
    const cheapestFirst = (a: Unit, b: Unit) => a.value - b.value;
    const large = ofSize('Large');
    const medium = ofSize('Medium').sort(cheapestFirst);
    const regular = ofSize('Regular').sort(cheapestFirst);
    const freeMedium = medium.slice(0, Math.min(large.length, medium.length));
    const paidMedium = medium.length - freeMedium.length;
    const freeRegular = regular.slice(0, Math.min(paidMedium, regular.length));
    freeUnits.push(...freeMedium, ...freeRegular);
    if (large.length > freeMedium.length) hint = 'Add a Medium pizza — it’s FREE with your Large today';
    else if (paidMedium > freeRegular.length) hint = 'Add a Small (Regular) pizza — it’s FREE with your Medium today';
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
