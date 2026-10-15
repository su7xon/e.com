import { MenuItem, Coupon } from '../../types';

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: 'DELIVERY' | 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: string;
  address?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    isVeg: boolean;
    size?: string;
    crust?: string;
    extraCheese?: boolean;
    /** Make Your Own: chosen sauce. */
    sauce?: string;
    /** Topping names chosen by the customer. */
    toppings?: string[];
    notes?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'UPI' | 'CASH' | 'CARD';
  paymentStatus: 'PAID' | 'PENDING';
  status: 'NEW' | 'KITCHEN' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string; // e.g. "10:14 PM"
  /** When the order was placed (epoch ms). Older orders: derive with orderTimeMs(). */
  createdAtMs?: number;
  timeAgo: string;
  cookingNotes?: string;
  outletId?: string; // which outlet owns the order (outlet-1 / outlet-2). Legacy orders without it are visible to all outlets.
  // Rushda counter-billing extensions (optional so old orders keep working)
  billDateIso?: string; // YYYY-MM-DD, defaults to today when missing
  saleType?: 'CASH' | 'CREDIT';
  partyPhone?: string;
  // Rider delivery extensions (online store orders)
  landmark?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  mapsUrl?: string;
}

export const SEED_ADMIN_ORDERS: AdminOrder[] = [];

/** Local calendar date as YYYY-MM-DD (not UTC — avoids yesterday's date before 5:30 AM in India). */
export function localDateIso(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * When an order was placed, in epoch ms. New orders carry createdAtMs; older ones
 * have it inside the id ("ord-<ms>"); counter bills fall back to their bill date.
 */
export function orderTimeMs(o: Pick<AdminOrder, 'id' | 'createdAtMs' | 'billDateIso'>): number | null {
  if (typeof o.createdAtMs === 'number') return o.createdAtMs;
  const m = /^ord-(\d{12,})$/.exec(o.id);
  if (m) return Number(m[1]);
  if (o.billDateIso) return new Date(`${o.billDateIso}T12:00:00`).getTime();
  return null;
}

/** Local YYYY-MM-DD the order belongs to (null when unknown). */
export function orderDateIso(o: Pick<AdminOrder, 'id' | 'createdAtMs' | 'billDateIso'>): string | null {
  if (o.billDateIso) return o.billDateIso;
  const ms = orderTimeMs(o);
  return ms === null ? null : localDateIso(new Date(ms));
}

/** One place for how each order type is named and coloured across admin screens. */
export const ORDER_TYPE_META: Record<AdminOrder['orderType'], { label: string; short: string; tone: string; edge: string; chip: string }> = {
  DELIVERY: { label: 'Home Delivery', short: 'Delivery', tone: 'text-blue-700', edge: 'border-l-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  DINE_IN: { label: 'Dine-in', short: 'Dine-in', tone: 'text-amber-700', edge: 'border-l-amber-500', chip: 'bg-amber-50 text-amber-800 border-amber-200' },
  TAKEAWAY: { label: 'Takeaway', short: 'Takeaway', tone: 'text-violet-700', edge: 'border-l-violet-500', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
};

/** "Table T-03" from "T-03" / "Table T-03" / "table 5" — never "Table Table". */
export function tableLabel(t?: string): string {
  if (!t) return 'Table';
  return /^table\b/i.test(t.trim()) ? t.trim().replace(/^table/i, 'Table') : `Table ${t.trim()}`;
}

export function formatTimeAgo(id: string, fallback: string): string {
  if (!id.startsWith('ord-')) return fallback;
  const timestamp = parseInt(id.replace('ord-', ''), 10);
  if (isNaN(timestamp)) return fallback;
  
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hr ago';
  if (diffHours < 24) return `${diffHours} hrs ago`;
  
  return fallback;
}

export const PRESET_PIZZA_IMAGES = [
  { label: '7 Cheese Special', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80' },
  { label: 'Pepperoni & Meat', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80' },
  { label: 'Farmhouse Veggie', url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80' },
  { label: 'Crispy Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80' },
  { label: 'Cheesy Wrap', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=80' },
  { label: 'Garlic Bread', url: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=800&auto=format&fit=crop&q=80' },
  { label: 'Beverages / Shake', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80' },
];

export type SalesPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all';

/** Inclusive local date range [from, to] for a period; null = no limit. */
export function periodRange(p: SalesPeriod, base: Date = new Date()): [string, string] | null {
  const day = (offset: number) => {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    return localDateIso(d);
  };
  switch (p) {
    case 'today':
      return [day(0), day(0)];
    case 'yesterday':
      return [day(-1), day(-1)];
    case 'week':
      return [day(-6), day(0)];
    case 'month':
      return [localDateIso(new Date(base.getFullYear(), base.getMonth(), 1)), day(0)];
    default:
      return null;
  }
}

/** Orders whose local date falls inside [from, to]. Orders without any date only count for "all". */
export function ordersInRange(orders: AdminOrder[], range: [string, string] | null): AdminOrder[] {
  if (!range) return orders;
  return orders.filter((o) => {
    const d = orderDateIso(o);
    return d !== null && d >= range[0] && d <= range[1];
  });
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

/** One set of totals used by Dashboard, Z-report and export — cancelled orders never count as sales. */
export function summarizeOrders(orders: AdminOrder[]) {
  const live = orders.filter((o) => o.status !== 'CANCELLED');
  const cancelled = orders.filter((o) => o.status === 'CANCELLED');
  const total = (l: AdminOrder[]) => l.reduce((s, o) => s + num(o.total), 0);
  const gross = total(live);
  const types = ['DELIVERY', 'DINE_IN', 'TAKEAWAY'] as const;
  const byType = Object.fromEntries(
    types.map((t) => {
      const l = live.filter((o) => o.orderType === t);
      const running = l.filter((o) => o.status === 'NEW' || o.status === 'KITCHEN' || o.status === 'DISPATCHED').length;
      return [t, { count: l.length, total: total(l), running }];
    }),
  ) as Record<(typeof types)[number], { count: number; total: number; running: number }>;
  const paid = live.filter((o) => o.paymentStatus !== 'PENDING');
  const byPay = {
    UPI: total(paid.filter((o) => o.paymentMethod === 'UPI')),
    CARD: total(paid.filter((o) => o.paymentMethod === 'CARD')),
    CASH: total(paid.filter((o) => o.paymentMethod === 'CASH')),
    PENDING: total(live.filter((o) => o.paymentStatus === 'PENDING')),
  };
  return {
    live,
    cancelled,
    gross,
    cancelledTotal: total(cancelled),
    count: live.length,
    avg: live.length ? Math.round(gross / live.length) : 0,
    // Tax actually charged on the bills (0 while GST is switched off).
    gst: Math.round(live.reduce((s, o) => s + num(o.tax), 0)),
    itemsSubtotal: live.reduce((s, o) => s + num(o.subtotal), 0),
    byType,
    byPay,
    running: byType.DELIVERY.running + byType.DINE_IN.running + byType.TAKEAWAY.running,
  };
}

/**
 * Old or hand-made orders can carry an unexpected type/status (e.g. "dine-in", missing items).
 * Admin screens run every order through this so nothing downstream breaks on bad data.
 */
export function normalizeOrder(o: AdminOrder): AdminOrder {
  const rawType = String(o.orderType ?? '').toUpperCase().replace(/[\s-]+/g, '_');
  const orderType: AdminOrder['orderType'] =
    rawType === 'DINE_IN' || rawType === 'DINEIN' || rawType === 'TABLE'
      ? 'DINE_IN'
      : rawType === 'TAKEAWAY' || rawType === 'TAKE_AWAY' || rawType === 'CARRY_OUT' || rawType === 'PICKUP'
      ? 'TAKEAWAY'
      : rawType === 'DELIVERY' || rawType === 'HOME_DELIVERY'
      ? 'DELIVERY'
      : o.tableNumber
      ? 'DINE_IN'
      : 'DELIVERY';
  const rawStatus = String(o.status ?? '').toUpperCase();
  const status: AdminOrder['status'] = (['NEW', 'KITCHEN', 'DISPATCHED', 'COMPLETED', 'CANCELLED'] as const).includes(
    rawStatus as AdminOrder['status'],
  )
    ? (rawStatus as AdminOrder['status'])
    : 'NEW';
  const paymentMethod: AdminOrder['paymentMethod'] = (['UPI', 'CASH', 'CARD'] as const).includes(
    String(o.paymentMethod ?? '').toUpperCase() as AdminOrder['paymentMethod'],
  )
    ? (String(o.paymentMethod).toUpperCase() as AdminOrder['paymentMethod'])
    : 'CASH';
  if (orderType === o.orderType && status === o.status && paymentMethod === o.paymentMethod && Array.isArray(o.items)) return o;
  return {
    ...o,
    orderType,
    status,
    paymentMethod,
    items: Array.isArray(o.items) ? o.items : [],
    orderNumber: o.orderNumber || o.id,
    customerName: o.customerName || '',
    customerPhone: o.customerPhone || '',
  };
}

/** "Medium • Thin Crust • Schezwan Sauce • Paneer, Corn • Extra cheese" — what the kitchen needs to make it. */
export function itemBuildText(it: { size?: string; crust?: string; sauce?: string; toppings?: string[]; extraCheese?: boolean }): string {
  return [
    it.size && it.size !== 'NA' ? it.size : '',
    it.crust || '',
    it.sauce || '',
    it.toppings && it.toppings.length ? it.toppings.join(', ') : '',
    it.extraCheese ? 'Extra cheese' : '',
  ]
    .filter(Boolean)
    .join(' • ');
}
