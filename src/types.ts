export type PizzaSize = 'Regular' | 'Medium' | 'Large';
export type PizzaCrust = 'New Hand Tossed' | 'Cheese Burst' | 'Fresh Pan Pizza' | 'Wheat Thin Crust';

export interface ExtraTopping {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
}

export type MenuCategoryType = 
  | 'all' 
  | 'signature-7-cheese' 
  | 'veg-pizza'
  | 'non-veg-pizza'
  | 'chicken-pizza'
  | 'pan-pizza'
  | 'cheese-burst'
  | 'burgers' 
  | 'wraps' 
  | 'starters-sides'
  | 'sides'
  | 'pasta' 
  | 'chicken-corner' 
  | 'drinks'
  | 'desserts' 
  | 'combos'
  | 'veg' 
  | 'non-veg'
  | 'pan-pizza-mania'
  | 'desserts-drinks';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategoryType;
  subCategoryTitle?: string;
  isVeg: boolean;
  price: number;
  originalPrice?: number;
  description: string;
  toppings?: string[];
  image: string;
  badge?: 'NEW' | 'BESTSELLER' | 'CHEF SPECIAL' | '7 CHEESE' | 'MUST TRY' | 'POPULAR';
  rating?: number;
  reviewsCount?: number;
  isCustomizable: boolean;
  defaultSize?: PizzaSize;
  defaultCrust?: PizzaCrust;
  sizePrices?: { Regular?: number; Medium?: number; Large?: number };
  /** Outlet scope: jis outlet ne item banaya. Empty = shared (sab outlets me dikhega). */
  outletId?: string;
  /** Shared item ko kisi outlet ne apne yahan hide kiya (delete = sirf apne outlet se hide). */
  hiddenInOutlets?: string[];
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  isVeg: boolean;
  image: string;
  price: number; // base price + selected customization
  basePrice: number;
  size?: PizzaSize;
  crust?: PizzaCrust;
  extraCheese: boolean;
  extraToppings: ExtraTopping[];
  quantity: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  tag?: string;
  image: string;
  /** Browse Our Category card photo (marquee). Falls back to image when empty. */
  bannerImage?: string;
  startingPrice?: number;
  filterKey: MenuItem['category'] | 'all';
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  maxDiscount?: number;
  minOrder: number;
  title: string;
  description: string;
  tag?: string;
}

export type OrderType = 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';

export interface UserAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  address: string;
  city: string;
  pincode: string;
  landmark?: string;
  distanceKm?: number;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
}

export interface DeliveryDetails {
  name: string;
  phone: string;
  landmark: string;
}

export interface ActiveOrder {
  orderId: string;
  items: CartItem[];
  orderType: OrderType;
  address: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: 'CONFIRMED' | 'PREPARING' | 'BAKING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  timestamp: string;
  estimatedMinutes: number;
  riderName: string;
  riderPhone: string;
}
