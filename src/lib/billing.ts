import { Coupon } from '../types';

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

/** What a coupon takes off the item subtotal (0 when below its minimum order). */
export function couponDiscountFor(subtotal: number, coupon: Coupon | null | undefined): number {
  if (!coupon || subtotal < coupon.minOrder) return 0;
  if (coupon.discountType === 'percentage') {
    const calc = Math.round((subtotal * coupon.value) / 100);
    return coupon.maxDiscount ? Math.min(calc, coupon.maxDiscount) : calc;
  }
  return coupon.value;
}

/** Day deal (Tuesday / Friday) and coupons don't stack — the bigger saving applies. */
export function bestDiscount(
  subtotal: number,
  coupon: Coupon | null | undefined,
  dealDiscount: number,
): { discount: number; source: 'deal' | 'coupon' | null; couponDiscount: number } {
  const couponDiscount = couponDiscountFor(subtotal, coupon);
  if (dealDiscount <= 0 && couponDiscount <= 0) return { discount: 0, source: null, couponDiscount };
  return dealDiscount >= couponDiscount
    ? { discount: dealDiscount, source: 'deal', couponDiscount }
    : { discount: couponDiscount, source: 'coupon', couponDiscount };
}
