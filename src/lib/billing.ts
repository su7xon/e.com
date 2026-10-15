/**
 * Tax on customer bills. 0 = no GST / packaging charges for now.
 * To bring GST back later, set GST_RATE = 0.05 (and PACKAGING_FEE if needed).
 */
export const GST_RATE = 0;
export const PACKAGING_FEE = 0;

/** Taxes & charges added on top of the item subtotal. */
export function taxesAndChargesFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.round(subtotal * GST_RATE + PACKAGING_FEE);
}

/** Free Choco Lava Cake on orders with items worth at least this much. */
export const FREE_GIFT_THRESHOLD = 499;
export const FREE_GIFT_PRODUCT_ID = 'p-dessert-choco-lava';
export const FREE_GIFT_NAME = 'Choco Lava Cake';
export const FREE_GIFT_VALUE = 119;
