import type { MenuItem, PizzaSize } from '../types';
import { pizzaSizePrice } from '../lib/deals';

/**
 * Counter Billing catalog: the stores' item codes, add-ons and the versions on the printed menu
 * (Premium burgers, Non-Veg pasta / wraps / starters, 4 pc wings) that the customer menu doesn't have.
 */

/** Base codes from the store's menu card. Items not listed start blank; staff add them in Item Codes. */
export const DEFAULT_CODES: Record<string, string> = {
  'p-veg-baby-corn': 'BC',
  'p-veg-deluxe': 'DV',
  'p-veg-loaded': 'VL',
  'p-veg-supreme': 'VS',
  'p-veg-peppy-paneer': 'PP',
  'p-veg-schezwan': 'SP',
  'p-veg-mexican-salsa': 'MS',
  'p-veg-tandoori': 'TV',
  'p-veg-makhani': 'MP',
  'p-veg-spicy-tango': 'ST',
  'p-veg-achari': 'AP',
  'p-veg-double-cheese': 'DC',
  'p-veg-farmhouse': 'FH',
  'p-veg-country-special': 'CS',
  'p-veg-paneer-pizza': 'PZ',
  'p-veg-green-veg': 'GV',
  'p-veg-margherita': 'M',
  'p-veg-corn-cheese': 'CCP',
  'p-nonveg-chicken-supremo': 'NCSU',
  'p-nonveg-chicken-pepperoni': 'NCP',
  'p-nonveg-chicken-golden-delight': 'NCGD',
  'p-nonveg-baby-corn': 'NBCP',
  'p-nonveg-mexican-bbq': 'NMB',
  'p-nonveg-seekh-kabab': 'NCSK',
  'p-nonveg-schezwan': 'NSC',
  'p-nonveg-hot-hippy': 'NHH',
  'p-nonveg-peri-peri': 'NPPC',
  'p-nonveg-achari': 'NAP',
  'p-nonveg-pineapple-salami': 'NPS',
  'p-nonveg-chicken-salami': 'NCS',
  'p-nonveg-chicken-tikka': 'NCT',
  'p-nonveg-chicken-fiesta': 'NCF',
  'p-nonveg-tandoori': 'NTC',
  'p-nonveg-bbq': 'NBC',
  'p-nonveg-onion-spicy': 'NOS',
  'p-start-spicy-pockets': 'SCP',
  'p-start-cheese-bites': 'CB',
  'p-start-zingy-parcel': 'ZP',
  'p-start-taco': 'T',
  'p-start-salted-fries': 'SFF',
  'p-start-peri-fries': 'PPF',
  'p-start-garlic-bread': 'GB',
  'p-start-classic-stuffed-gb': 'CSG',
  'p-start-makhani-stuffed-gb': 'MSG',
  'p-start-korean-sweet-chilli-gb': 'KCS',
  'p-start-korean-paneer-gb': 'KPSG',
  'p-burger-veg': 'VB',
};

/** One way an item can be billed: a size, or a version such as Premium / Non-Veg. */
export interface PosOption {
  label: string;
  /** Added to the base code: fh + l, vb + p, msg + nv. */
  suffix: string;
  /** Printed in the bill's size column. */
  size: string;
  price: number;
  name: string;
  isVeg: boolean;
}

interface Version {
  label: string;
  suffix: string;
  size: string;
  price: number;
  nameSuffix?: string;
  isVeg?: boolean;
}

const premium = (price: number): Version => ({ label: 'Premium', suffix: 'p', size: 'PREMIUM', price });
const nonVeg = (price: number): Version => ({ label: 'Non-Veg', suffix: 'nv', size: 'NA', price, nameSuffix: ' Non-Veg', isVeg: false });

const NORMAL = { label: 'Normal', size: 'NORMAL' };
const VEG = { label: 'Veg', size: 'NA' };

/** Printed-menu versions. `base` names the menu item's own price. */
export const POS_VERSIONS: Record<string, { base: { label: string; size: string }; extra: Version[] }> = {
  'p-burger-veg': { base: NORMAL, extra: [premium(79)] },
  'p-burger-spicy-veg': { base: NORMAL, extra: [premium(89)] },
  'p-burger-nonveg': { base: NORMAL, extra: [premium(99)] },
  'p-burger-nonveg-double': { base: NORMAL, extra: [premium(139)] },
  'p-burger-veg-double': { base: NORMAL, extra: [premium(109)] },
  'p-burger-crispy-nonveg': { base: NORMAL, extra: [premium(159)] },
  'p-pasta-makhani': { base: VEG, extra: [nonVeg(140)] },
  'p-pasta-mix': { base: VEG, extra: [nonVeg(140)] },
  'p-pasta-red': { base: VEG, extra: [nonVeg(120)] },
  'p-pasta-white': { base: VEG, extra: [nonVeg(120)] },
  'p-wrap-tandoori': { base: VEG, extra: [nonVeg(139)] },
  'p-wrap-schezwan': { base: VEG, extra: [nonVeg(139)] },
  'p-wrap-mexican': { base: VEG, extra: [nonVeg(139)] },
  'p-wrap-makhani': { base: VEG, extra: [nonVeg(139)] },
  'p-wrap-hot-chili': { base: VEG, extra: [nonVeg(139)] },
  'p-wrap-bbq': { base: VEG, extra: [nonVeg(139)] },
  'p-wrap-chipotle': { base: VEG, extra: [nonVeg(139)] },
  'p-wrap-achari': { base: VEG, extra: [nonVeg(139)] },
  'p-start-spicy-pockets': { base: VEG, extra: [nonVeg(109)] },
  'p-start-zingy-parcel': { base: VEG, extra: [nonVeg(89)] },
  'p-start-taco': { base: VEG, extra: [nonVeg(129)] },
  'p-start-classic-stuffed-gb': { base: VEG, extra: [nonVeg(150)] },
  'p-start-makhani-stuffed-gb': { base: VEG, extra: [nonVeg(150)] },
  'p-start-korean-sweet-chilli-gb': { base: VEG, extra: [nonVeg(150)] },
  'p-chick-hot-wings': { base: { label: '2 pc', size: '2 PC' }, extra: [{ label: '4 pc', suffix: '4', size: '4 PC', price: 199 }] },
};

const SIZES: { size: PizzaSize; suffix: string }[] = [
  { size: 'Regular', suffix: 'r' },
  { size: 'Medium', suffix: 'm' },
  { size: 'Large', suffix: 'l' },
];

/** Every way this item can be billed. One option = add it straight away. */
export function posOptions(item: MenuItem): PosOption[] {
  if (item.sizePrices) {
    return SIZES.map(({ size, suffix }) => ({
      label: size,
      suffix,
      size,
      price: pizzaSizePrice(item, size),
      name: item.name,
      isVeg: item.isVeg,
    }));
  }
  const v = POS_VERSIONS[item.id];
  const base = { suffix: '', price: item.price, name: item.name, isVeg: item.isVeg };
  if (!v) return [{ ...base, label: item.name, size: 'NA' }];
  return [
    { ...base, label: v.base.label, size: v.base.size },
    ...v.extra.map((e) => ({
      label: e.label,
      suffix: e.suffix,
      size: e.size,
      price: e.price,
      name: `${item.name}${e.nameSuffix ?? ''}`,
      isVeg: e.isVeg ?? item.isVeg,
    })),
  ];
}

// ---------- Add-ons ----------

export type AddOnKind = 'crust' | 'cheese' | 'veg-topping' | 'nonveg-topping';

export interface PosAddOn {
  id: string;
  name: string;
  kind: AddOnKind;
  prices: Record<PizzaSize, number>;
}

const VEG_TOPPING = { Regular: 25, Medium: 35, Large: 45 };
const NONVEG_TOPPING = { Regular: 40, Medium: 50, Large: 70 };
const topping = (id: string, name: string, kind: 'veg-topping' | 'nonveg-topping'): PosAddOn => ({
  id: `addon-${id}`,
  name,
  kind,
  prices: kind === 'veg-topping' ? VEG_TOPPING : NONVEG_TOPPING,
});

/** Prices by size, from the "Crust" and "Pizza Topping" section of the menu card. */
export const POS_ADDONS: PosAddOn[] = [
  { id: 'addon-cheese-burst', name: 'Cheese Burst', kind: 'crust', prices: { Regular: 50, Medium: 80, Large: 110 } },
  { id: 'addon-thin-crust', name: 'Thin Crust', kind: 'crust', prices: { Regular: 30, Medium: 40, Large: 70 } },
  { id: 'addon-extra-cheese', name: 'Extra Cheese', kind: 'cheese', prices: { Regular: 49, Medium: 69, Large: 99 } },
  topping('black-olives', 'Black Olives', 'veg-topping'),
  topping('onion', 'Onion', 'veg-topping'),
  topping('capsicum', 'Capsicum', 'veg-topping'),
  topping('paneer', 'Paneer', 'veg-topping'),
  topping('mushroom', 'Mushroom', 'veg-topping'),
  topping('golden-corn', 'Golden Corn', 'veg-topping'),
  topping('tomato', 'Tomato', 'veg-topping'),
  topping('jalapeno', 'Jalapeno', 'veg-topping'),
  topping('baby-corn', 'Baby Corn', 'veg-topping'),
  topping('red-paprika', 'Red Paprika', 'veg-topping'),
  topping('bbq-chicken', 'Barbeque Chicken', 'nonveg-topping'),
  topping('peri-chicken', 'Peri Peri Chicken', 'nonveg-topping'),
  topping('chicken-tikka', 'Chicken Tikka', 'nonveg-topping'),
  topping('chicken-salami', 'Chicken Salami', 'nonveg-topping'),
  topping('seekh-kabab', 'Chicken Seekh Kabab', 'nonveg-topping'),
];

export const addOnById = (id?: string) => POS_ADDONS.find((a) => a.id === id);

export interface AddOnChoice {
  crustId?: string;
  extraCheese?: boolean;
  toppingIds?: string[];
}

export const isPizzaSize = (size: string): size is PizzaSize => size === 'Regular' || size === 'Medium' || size === 'Large';

/** What the chosen add-ons add to one pizza of this size. */
export function addOnsPrice(size: string, c: AddOnChoice): number {
  if (!isPizzaSize(size)) return 0;
  const ids = [c.crustId, c.extraCheese ? 'addon-extra-cheese' : undefined, ...(c.toppingIds ?? [])];
  return ids.reduce((sum, id) => sum + (addOnById(id)?.prices[size] ?? 0), 0);
}

/** Crust joins the item name on the bill, like the stores' bills: "Double Cheese Thin Crust". */
export function nameWithCrust(baseName: string, crustId?: string): string {
  const crust = addOnById(crustId);
  return crust ? `${baseName.replace(/ Pizza$/, '')} ${crust.name}` : baseName;
}

// ---------- Codes ----------

/** Saved codes on top of the defaults. A saved empty code clears the default. */
export const effectiveCodes = (saved: Record<string, string>): Record<string, string> => ({ ...DEFAULT_CODES, ...saved });

export const normalizeCode = (code: string) => code.trim().toUpperCase();
export const isValidCode = (code: string) => /^[A-Z0-9]{1,8}$/.test(code);

export type CodeHit = { kind: 'item'; item: MenuItem; option: PosOption } | { kind: 'addon'; addon: PosAddOn };

/** Every typable code (lower case), e.g. fhl → Farm House Large. */
export function buildCodeIndex(codes: Record<string, string>, menu: MenuItem[]): Map<string, CodeHit> {
  const index = new Map<string, CodeHit>();
  menu.forEach((item) => {
    const base = (codes[item.id] || '').toLowerCase();
    if (base) posOptions(item).forEach((option) => index.set(base + option.suffix, { kind: 'item', item, option }));
  });
  POS_ADDONS.forEach((addon) => {
    const base = (codes[addon.id] || '').toLowerCase();
    if (base) index.set(base, { kind: 'addon', addon });
  });
  return index;
}

export const resolveCode = (typed: string, index: Map<string, CodeHit>) => index.get(typed.trim().toLowerCase()) ?? null;

/** The full codes a base code produces: FH → FHR, FHM, FHL. */
export function fullCodes(id: string, code: string, menu: MenuItem[]): string[] {
  if (!code) return [];
  const item = menu.find((m) => m.id === id);
  return item ? posOptions(item).map((o) => (code + o.suffix).toUpperCase()) : [code.toUpperCase()];
}

/** Message when giving `id` this code would clash with another item, else null. */
export function findCodeClash(id: string, code: string, codes: Record<string, string>, menu: MenuItem[]): string | null {
  const others = buildCodeIndex({ ...codes, [id]: '' }, menu);
  for (const full of fullCodes(id, code, menu)) {
    const hit = others.get(full.toLowerCase());
    if (hit) return `${full} is already ${hit.kind === 'item' ? `${hit.option.name} (${hit.option.label})` : hit.addon.name}`;
  }
  return null;
}
