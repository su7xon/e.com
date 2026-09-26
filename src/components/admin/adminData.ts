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
