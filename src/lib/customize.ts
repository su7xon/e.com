import type { MenuItem } from '../types';

/** Categories jinke items hamesha Customize modal se jaane chahiye (size/crust wale). */
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
 * Item modal mangta ya direct add ho sakta?
 * Flag ke saath category bhi check — Firestore/admin me flag chhoota to bhi
 * koi pizza bina size/crust select direct cart me nahi jayega.
 */
export const needsCustomize = (item: MenuItem): boolean =>
  !!item.isCustomizable || PIZZA_CATEGORIES.includes(item.category);
