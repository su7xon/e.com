import type { MenuItem } from '../types';

/** Categories whose items must always go through the Customize modal (size/crust ones). */
export const PIZZA_CATEGORIES: string[] = [
  'signature-7-cheese',
  'veg-pizza',
  'non-veg-pizza',
  'chicken-pizza',
  'pan-pizza',
  'cheese-burst',
  'pan-pizza-mania',
];

/**
 * Does the item need the modal, or can it be added directly?
 * Check category along with the flag — so even if the flag is missing in
 * Firestore/admin, no pizza lands in the cart without size/crust selected.
 */
export const needsCustomize = (item: MenuItem): boolean =>
  !!item.isCustomizable || PIZZA_CATEGORIES.includes(item.category);
