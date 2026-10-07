import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  CheckCircle2, 
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  MapPin,
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Navigation,
  Compass
} from 'lucide-react';
import { CartItem, Coupon, UserAddress, DeliveryDetails, OrderType, MenuItem } from '../types';
import { COUPONS, MENU_ITEMS } from '../data/mockData';
import { VegNonVegIcon } from './VegNonVegIcon';
import { InteractiveMapPicker } from './InteractiveMapPicker';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon) => void;
  onRemoveCoupon: () => void;
  orderType: OrderType;
  currentAddress: UserAddress;
  onOpenAddressModal: () => void;
  onSelectAddress?: (addr: UserAddress) => void;
  onProceedToCheckout?: () => void;
  onPlaceOrder?: (notes: string, paymentMethod: string, delivery?: DeliveryDetails) => void;
  onQuickAdd: (productId: string) => void;
  onUpgradeItem?: (cartItemId: string) => void;
  availableCoupons?: Coupon[];
  availableMenuItems?: MenuItem[];
}

const CONFETTI_COLORS = ['#ED1C24', '#F59E0B', '#16A34A', '#2563EB', '#EC4899', '#8B5CF6'];

/**
 * "You saved ₹X" pop-up with a confetti burst. Mounts with the cart, so it shows
 * on every open, and again whenever the saving goes up (coupon applied, item added).
 */
const SavingsCelebration: React.FC<{ amount: number; breakdown: string }> = ({ amount, breakdown }) => {
  const [show, setShow] = useState(false);
  const [burst, setBurst] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (amount > prev.current) {
      setShow(true);
      setBurst((n) => n + 1);
    }
    prev.current = amount;
  }, [amount]);

  // Auto-hide; restarts on each new burst.
  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(() => setShow(false), 3200);
    return () => window.clearTimeout(id);
  }, [show, burst]);

  if (!show || amount <= 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center px-4">
      <style>{`
        @keyframes sc-fall { 0% { transform: translate(0,0) rotate(0); opacity: 1 }
          100% { transform: translate(var(--dx), 170px) rotate(var(--rot)); opacity: 0 } }
        @keyframes sc-pop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
      `}</style>
      <div key={burst} className="relative">
        {Array.from({ length: 26 }, (_, i) => {
          const left = 4 + ((i * 37) % 92);
          const dx = ((i * 53) % 120) - 60;
          const strip = i % 3 === 0;
          return (
            <span
              key={i}
              className="absolute top-0"
              style={{
                left: `${left}%`,
                width: strip ? 4 : 7,
                height: strip ? 12 : 7,
                borderRadius: strip ? 2 : i % 2 ? 9999 : 1,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animation: `sc-fall 1.6s ease-out ${(i % 6) * 0.05}s forwards`,
                ['--dx' as string]: `${dx}px`,
                ['--rot' as string]: `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
              } as React.CSSProperties}
            />
          );
        })}
        <button
          type="button"
          onClick={() => setShow(false)}
          className="pointer-events-auto relative bg-white border-2 border-emerald-500 rounded-2xl shadow-2xl px-5 py-3 text-center cursor-pointer"
          style={{ animation: 'sc-pop .45s ease-out' }}
        >
          <span className="block text-base sm:text-lg font-black text-emerald-700">🎉 You saved ₹{amount}!</span>
          {breakdown && <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">{breakdown}</span>}
        </button>
      </div>
    </div>
  );
};

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  orderType,
  currentAddress,
  onOpenAddressModal,
  onSelectAddress,
  onProceedToCheckout,
  onPlaceOrder,
  onQuickAdd,
  onUpgradeItem,
  availableCoupons,
  availableMenuItems,
}) => {
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [cookingNotes, setCookingNotes] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'card'>('upi');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  // Landmark hamesha blank — user khud likhega (saved address se auto-fill nahi)
  const [receiverLandmark, setReceiverLandmark] = useState('');
  const [formError, setFormError] = useState('');
  const [mealFilter, setMealFilter] = useState('For you');
  const [upsellDismissed, setUpsellDismissed] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const couponList = availableCoupons && availableCoupons.length > 0 ? availableCoupons : COUPONS;
  const menuList = availableMenuItems && availableMenuItems.length > 0 ? availableMenuItems : MENU_ITEMS;

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeDeliveryThreshold = 99;
  const isFreeDeliveryEligible = subtotal >= freeDeliveryThreshold || appliedCoupon?.code === 'FREEDEL';
  const deliveryFee = orderType === 'DELIVERY' ? (isFreeDeliveryEligible ? 0 : 40) : 0;
  const taxesAndCharges = subtotal > 0 ? Math.round(subtotal * 0.05 + 15) : 0;

  // Coupon discount computation
  let discount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrder) {
    if (appliedCoupon.discountType === 'percentage') {
      const calculated = Math.round((subtotal * appliedCoupon.value) / 100);
      discount = appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    } else {
      discount = appliedCoupon.value;
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee + taxesAndCharges - discount);

  const handleCustomCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    const found = couponList.find((c) => c.code === code);
    if (!found) {
      setCouponError('Invalid coupon code. Try 7CHEESE50 or CHEESEFEST');
      return;
    }
    if (subtotal < found.minOrder) {
      setCouponError(`Add items worth ₹${found.minOrder - subtotal} more to apply`);
      return;
    }
    onApplyCoupon(found);
    setCouponInput('');
  };

  const handleCompleteOrder = () => {
    setFormError('');
    if (orderType === 'DELIVERY') {
      const digits = receiverPhone.replace(/\D/g, '').replace(/^91/, '');
      if (!receiverName.trim()) {
        setFormError('Please enter receiver name for delivery.');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(digits)) {
        setFormError('Please enter a valid 10-digit mobile number.');
        return;
      }
    }
    setIsPlacing(true);
    setTimeout(() => {
      setIsPlacing(false);
      if (onPlaceOrder) {
        onPlaceOrder(cookingNotes, paymentMethod, {
          name: receiverName.trim(),
          phone: receiverPhone.replace(/\D/g, '').replace(/^91/, ''),
          landmark: receiverLandmark.trim(),
        });
      } else if (onProceedToCheckout) {
        onProceedToCheckout();
      }
    }, 600);
  };

  // "Complete Your Meal": upsell from what's in the cart, not the whole menu.
  // A cart with a main (pizza/burger/wrap/pasta) gets the add-ons it is missing first
  // (sides, dips, drinks, desserts); a cart with only add-ons gets bestseller mains.
  type MealGroup = 'main' | 'side' | 'dip' | 'drink' | 'dessert';
  const MEAL_GROUP_LABEL: Record<MealGroup, string> = {
    main: 'Pizzas & Mains', side: 'Sides', dip: 'Dips', drink: 'Drinks', dessert: 'Desserts',
  };
  const groupOf = (item: MenuItem): MealGroup | null => {
    const cat = item.category as string;
    if (cat === 'dips' || item.id.startsWith('p-dip-') || item.subCategoryTitle === 'Signature Dips') return 'dip';
    if (cat === 'drinks') return 'drink';
    if (cat === 'desserts') return 'dessert';
    if (cat === 'starters-sides' || cat === 'sides' || cat === 'chicken-corner') return 'side';
    if (cat === 'combos') return null; // offer combos are not add-ons
    return 'main';
  };
  const cartProductIds = new Set(cartItems.map((c) => c.productId));
  const cartGroups = new Set<MealGroup>();
  cartItems.forEach((c) => {
    const m = menuList.find((x) => x.id === c.productId);
    const g = m ? groupOf(m) : /pizza|burger|wrap|pasta/i.test(c.name) ? 'main' : null;
    if (g) cartGroups.add(g);
  });
  const addOnGroups: MealGroup[] = ['side', 'dip', 'drink', 'dessert'];
  // Missing groups first, then groups already in the cart (different items).
  const wantedGroups: MealGroup[] = cartGroups.has('main')
    ? [...addOnGroups.filter((g) => !cartGroups.has(g)), ...addOnGroups.filter((g) => cartGroups.has(g))]
    : ['main', ...addOnGroups.filter((g) => !cartGroups.has(g))];
  const candidatesByGroup = new Map<MealGroup, MenuItem[]>();
  wantedGroups.forEach((g) => {
    const list = menuList
      .filter((m) => !cartProductIds.has(m.id) && groupOf(m) === g)
      .sort((a, b) =>
        g === 'main'
          ? (b.rating || 0) - (a.rating || 0) // bestsellers first
          : a.price - b.price || (b.rating || 0) - (a.rating || 0), // cheap add-ons first
      );
    if (list.length) candidatesByGroup.set(g, list);
  });
  const MEAL_CHIPS = ['For you', ...wantedGroups.filter((g) => candidatesByGroup.has(g)).map((g) => MEAL_GROUP_LABEL[g])];
  // "For you": up to 3 from each wanted group, in priority order.
  const forYou = wantedGroups.flatMap((g) => (candidatesByGroup.get(g) || []).slice(0, 3));
  const chipGroup = (Object.keys(MEAL_GROUP_LABEL) as MealGroup[]).find((g) => MEAL_GROUP_LABEL[g] === mealFilter);
  const mealProducts = chipGroup ? candidatesByGroup.get(chipGroup) || [] : forYou;
  const isPizzaLine = (name: string, category: string) =>
    category === 'veg-pizza' || category === 'non-veg-pizza' || name.toLowerCase().includes('pizza');
  const offBadge = (item: MenuItem): string | null => {
    if (!item.originalPrice || item.originalPrice <= item.price) return null;
    return `₹${item.originalPrice - item.price} OFF`;
  };
  // What the customer actually saves: menu MRP cuts + coupon + waived delivery fee.
  const mrpSavings = cartItems.reduce((acc, line) => {
    const m = menuList.find((x) => x.id === line.productId);
    return m?.originalPrice && m.originalPrice > m.price ? acc + (m.originalPrice - m.price) * line.quantity : acc;
  }, 0);
  const deliverySaving = orderType === 'DELIVERY' && deliveryFee === 0 && subtotal > 0 ? 40 : 0;
  const savedAmount = mrpSavings + discount + deliverySaving;
  const savingsBreakdown = [
    mrpSavings > 0 ? `₹${mrpSavings} off MRP` : '',
    deliverySaving > 0 ? `₹${deliverySaving} free delivery` : '',
    discount > 0 ? `₹${discount} coupon` : '',
  ].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 z-[56] overflow-hidden bg-slate-50 flex animate-in fade-in duration-200">
      <div
        id="cart-drawer-panel"
        className="relative w-full h-full bg-slate-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        <SavingsCelebration amount={cartItems.length > 0 ? savedAmount : 0} breakdown={savingsBreakdown} />

        {/* Drawer Header */}
        <div className="bg-[#ED1C24] text-white py-2 sm:py-2.5 px-[max(0.875rem,calc((100%_-_48rem)/2))] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-300 shrink-0" />
            <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
              Your Cart
              <span className="ml-1.5 text-[11px] sm:text-xs font-medium text-red-100">
                · {cartItems.reduce((a, b) => a + b.quantity, 0)} {cartItems.reduce((a, b) => a + b.quantity, 0) === 1 ? 'item' : 'items'}
              </span>
            </h2>
          </div>
          <button
            id="btn-close-cart"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Domino's-style DELIVER header */}
        <button
          type="button"
          onClick={onOpenAddressModal}
          className="bg-white px-[max(0.875rem,calc((100%_-_48rem)/2))] py-1.5 flex items-center gap-3 border-b border-slate-200 text-left w-full cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="shrink-0">
            <div className="text-[11px] font-black text-slate-900 leading-tight">Deliver · 30 min</div>
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">
              {currentAddress.address}, {currentAddress.city} - {currentAddress.pincode}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Free Delivery Bar */}
        {orderType === 'DELIVERY' && cartItems.length > 0 && !isFreeDeliveryEligible && (
          <div className="px-[max(0.875rem,calc((100%_-_48rem)/2))] py-1.5 text-white text-xs bg-gradient-to-r from-[#ED1C24] via-[#9a1220] to-[#ED1C24]">
            {(
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                  <span>Add ₹{freeDeliveryThreshold - subtotal} more for FREE Delivery</span>
                  <span>₹{subtotal}/₹{freeDeliveryThreshold}</span>
                </div>
                <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Items Container */}
        <div className="flex-1 overflow-y-auto py-3.5 sm:py-4 px-[max(0.875rem,calc((100%_-_48rem)/2))] space-y-3.5">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-3xl mb-3 shadow-inner">
                🍕
              </div>
              <h3 className="text-base font-black text-slate-800">Your cart is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Good food is always cooking! Add your favourite pizzas, garlic breads and desserts.
              </p>
              <button
                id="btn-empty-cart-explore"
                onClick={onClose}
                className="mt-4 bg-[#ED1C24] hover:bg-[#c91430] text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* 1. Saved Products with Image */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Saved Items in Cart
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                      {cartItems.length}
                    </span>
                  </div>
                  <button
                    id="btn-clear-all-cart"
                    onClick={onClearCart}
                    className="text-[11px] text-red-600 hover:underline font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.cartItemId}
                      id={`cart-item-${item.cartItemId}`}
                      className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      {/* Product Image */}
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-2xs">
                        <img
                          src={item.image || '/images/seven_cheese_pizza_1788869697088.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/seven_cheese_pizza_1788869697088.jpg';
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-xs p-0.5 rounded-sm shadow-2xs">
                          <VegNonVegIcon isVeg={item.isVeg} size="sm" />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug truncate">
                          {item.name}
                        </h4>

                        {/* Customization Details */}
                        {(item.size || item.crust) && (
                          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            {item.size} • {item.crust}
                          </p>
                        )}
                        {item.extraCheese && (
                          <p className="text-[9px] text-amber-700 font-semibold leading-tight">
                            + Extra Mozzarella Cheese
                          </p>
                        )}
                        {item.extraToppings && item.extraToppings.length > 0 && (
                          <p className="text-[9px] text-slate-500 truncate leading-tight">
                            + {item.extraToppings.map((t) => t.name).join(', ')}
                          </p>
                        )}

                        {/* Domino's-style crust upgrade strip */}
                        {isPizzaLine(item.name, menuList.find((m) => m.id === item.productId)?.category ?? '') &&
                          !upsellDismissed[item.cartItemId] && item.crust !== 'Cheese Burst' && (
                          <div className="mt-1.5 bg-slate-100 rounded-lg p-1.5 flex items-center gap-2">
                            <img
                              src="/images/seven_cheese_pizza_1788869697088.jpg"
                              alt="Cheese Burst"
                              className="w-9 h-9 rounded-md object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-800 leading-tight">Upgrade your pizza crust now!</p>
                              <p className="text-[10px] text-slate-600 leading-tight">Cheese Burst + ₹50</p>
                            </div>
                            {onUpgradeItem ? (
                              <button
                                onClick={() => onUpgradeItem(item.cartItemId)}
                                className="text-[10px] font-black text-[#ED1C24] border border-[#ED1C24] rounded-lg px-2 py-1 bg-white cursor-pointer"
                              >
                                Select
                              </button>
                            ) : null}
                            <button
                              onClick={() => setUpsellDismissed((p) => ({ ...p, [item.cartItemId]: true }))}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              aria-label="Dismiss upgrade"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={onClose}
                          className="text-[10px] font-bold text-slate-500 underline underline-offset-2 mt-1 cursor-pointer"
                        >
                          Edit &gt;
                        </button>

                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-mono font-black text-slate-900">
                            ₹{item.price * item.quantity}
                          </span>

                          {/* Quantity Selector */}
                          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                            <button
                              id={`btn-cart-minus-${item.cartItemId}`}
                              onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                              className="p-1 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-3 h-3 text-red-500" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                            </button>
                            <span className="px-2 font-mono font-bold text-xs text-slate-900 min-w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              id={`btn-cart-plus-${item.cartItemId}`}
                              onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                              className="p-1 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="mt-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add more items
                </button>
              </div>

              {/* 2. Complete Your Meal With (Domino's-style chips + upsell) */}
              {mealProducts.length > 0 && (
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-bold text-slate-500">Complete Your Meal With</span>
                    <span className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                    {MEAL_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setMealFilter(chip)}
                        className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                          mealFilter === chip
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Horizontal Scroll List */}
                  <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x -mx-1 px-1">
                    {mealProducts.slice(0, 12).map((sweet) => {
                      const inCart = cartItems.find((c) => c.productId === sweet.id);
                      const off = offBadge(sweet);
                      return (
                        <div
                          key={sweet.id}
                          className="w-[140px] sm:w-[148px] shrink-0 bg-slate-50/80 rounded-xl border border-slate-200/90 p-2 flex flex-col justify-between snap-start shadow-2xs hover:border-amber-400 hover:bg-white transition-all"
                        >
                          <div>
                            <div className="relative w-full h-20 rounded-lg overflow-hidden mb-1.5 bg-slate-100">
                              <img
                                src={sweet.image}
                                alt={sweet.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/choco_lava_cake_1788869782552.jpg';
                                }}
                              />
                              {!inCart ? (
                                <button
                                  onClick={() => onQuickAdd(sweet.id)}
                                  className="absolute top-1 right-1 w-6 h-6 rounded-md bg-white shadow flex items-center justify-center text-[#ED1C24] hover:bg-[#ED1C24] hover:text-white transition-colors cursor-pointer"
                                  aria-label={`Add ${sweet.name}`}
                                >
                                  <Plus className="w-4 h-4 stroke-[3]" />
                                </button>
                              ) : null}
                              <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-xs p-0.5 rounded-sm">
                                <VegNonVegIcon isVeg={sweet.isVeg} size="sm" />
                              </div>
                              {off && (
                                <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-tight">
                                  {off}
                                </span>
                              )}
                            </div>
                            <h4 className="text-[11px] font-extrabold text-slate-900 line-clamp-2 leading-snug min-h-7">
                              {sweet.name}
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs font-black font-mono text-slate-900">
                                ₹{sweet.price}
                              </span>
                              {sweet.originalPrice && (
                                <span className="text-[10px] font-mono line-through text-slate-400">
                                  ₹{sweet.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2">
                            {inCart ? (
                              <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-lg py-0.5 px-1.5">
                                <button
                                  onClick={() => onUpdateQuantity(inCart.cartItemId, -1)}
                                  className="p-0.5 text-amber-900 hover:bg-amber-100 rounded cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black font-mono text-amber-950">
                                  {inCart.quantity}
                                </span>
                                <button
                                  onClick={() => onUpdateQuantity(inCart.cartItemId, 1)}
                                  className="p-0.5 text-amber-900 hover:bg-amber-100 rounded cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                id={`btn-sweet-add-${sweet.id}`}
                                onClick={() => onQuickAdd(sweet.id)}
                                className="w-full bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 text-white text-[10px] font-black py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3 h-3 stroke-[3]" />
                                <span>ADD</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Apply Coupons Section (1 coupon shown + View All) */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#ED1C24]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Apply Coupon Code
                    </span>
                  </div>
                  {!appliedCoupon && couponList.length > 1 && (
                    <button
                      type="button"
                      id="btn-toggle-coupons-header"
                      onClick={() => setShowAllCoupons(!showAllCoupons)}
                      className="text-[11px] font-bold text-[#ED1C24] hover:text-[#c91430] flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      <span>{showAllCoupons ? 'Show Less' : `View All (${couponList.length})`}</span>
                      {showAllCoupons ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">Applied!</span>
                      </div>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        You saved ₹{discount} with this coupon
                      </p>
                    </div>
                    <button
                      id="btn-remove-applied-coupon"
                      onClick={onRemoveCoupon}
                      className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleCustomCouponSubmit} className="flex gap-2">
                      <input
                        id="input-cart-coupon"
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value);
                          setCouponError('');
                        }}
                        placeholder="Enter Promo Code"
                        className="flex-1 bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24] font-mono font-bold uppercase"
                      />
                      <button
                        type="submit"
                        id="btn-apply-coupon"
                        className="bg-[#ED1C24] text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-[#c91430] transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                    {couponError && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">
                        {couponError}
                      </p>
                    )}

                    {/* Quick Coupon Chips - 1 coupon default, all coupons when expanded */}
                    <div className="mt-2.5 space-y-1.5">
                      {(showAllCoupons ? couponList : couponList.slice(0, 1)).map((cp) => (
                        <div
                          key={cp.code}
                          className="flex items-center justify-between p-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 hover:border-amber-400 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-black text-slate-800">
                                {cp.code}
                              </span>
                              {cp.tag && (
                                <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1 rounded">
                                  {cp.tag}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {cp.description}
                            </span>
                          </div>
                          <button
                            id={`btn-apply-quick-${cp.code}`}
                            onClick={() => onApplyCoupon(cp)}
                            className="text-xs font-black text-[#ED1C24] hover:underline shrink-0 cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>

                    {!showAllCoupons && couponList.length > 1 && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          id="btn-view-all-coupons-link"
                          onClick={() => setShowAllCoupons(true)}
                          className="text-[11px] font-bold text-[#ED1C24] hover:text-[#c91430] flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>View all coupons ({couponList.length})</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 4. Payment Method Selection (UPI, Cash, Cards) */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Payment Method
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    100% Secure
                  </span>
                </div>

                <div className="space-y-2">
                  {/* UPI Option */}
                  <label
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-[#ED1C24] bg-red-50/60 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cartPaymentMethod"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="mt-1 text-[#ED1C24] focus:ring-[#ED1C24]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-[#ED1C24]" />
                          <span className="text-xs font-extrabold text-slate-900">
                            UPI & QR Code
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                          FASTEST
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Google Pay, PhonePe, Paytm, BHIM or any UPI App
                      </p>
                    </div>
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-[#ED1C24] bg-red-50/60 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cartPaymentMethod"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="mt-1 text-[#ED1C24] focus:ring-[#ED1C24]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-extrabold text-slate-900">
                          Cash on Delivery (COD)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Pay cash or scan QR at your doorstep
                      </p>
                    </div>
                  </label>

                  {/* Cards / Netbanking Option */}
                  <label
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#ED1C24] bg-red-50/60 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cartPaymentMethod"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="mt-1 text-[#ED1C24] focus:ring-[#ED1C24]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-extrabold text-slate-900">
                          Credit / Debit Card & NetBanking
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Visa, MasterCard, RuPay, Maestro & Netbanking
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 5. Delivery Address Pill & Cooking Notes */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                <div className="bg-gradient-to-r from-red-50/90 via-amber-50/40 to-amber-50/30 border border-red-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#ED1C24] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <MapPin className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-900 block">
                          Delivering To: {currentAddress.label}
                        </span>
                        {currentAddress.lat && (
                          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1 rounded-sm uppercase">
                            GPS Pinned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 truncate font-medium">
                        {currentAddress.address}, {currentAddress.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      id="btn-cart-open-live-map"
                      onClick={() => setIsMapPickerOpen(true)}
                      className="text-[11px] font-black text-white bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      title="Set exact location on live map"
                    >
                      <Navigation className="w-3 h-3 text-amber-300 animate-pulse" />
                      <span>Live Map</span>
                    </button>
                    <button
                      type="button"
                      id="btn-cart-change-address"
                      onClick={onOpenAddressModal}
                      className="text-xs font-bold text-[#ED1C24] hover:underline px-1 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    Delivery / Cooking Instructions
                  </span>
                  <input
                    id="input-cart-notes"
                    type="text"
                    value={cookingNotes}
                    onChange={(e) => setCookingNotes(e.target.value)}
                    placeholder="e.g. Leave at door, extra chilli flakes, ring doorbell..."
                    className="w-full bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>

                {/* Receiver details — rider isi name/number/landmark par pahunchega */}
                {orderType === 'DELIVERY' && (
                  <div className="border-t border-slate-100 pt-2.5 space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block">
                      Receiver Details (for Rider)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={receiverName}
                        onChange={(e) => { setReceiverName(e.target.value); setFormError(''); }}
                        placeholder="Receiver name *"
                        className="bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                      />
                      <input
                        value={receiverPhone}
                        onChange={(e) => { setReceiverPhone(e.target.value); setFormError(''); }}
                        placeholder="10-digit mobile *"
                        inputMode="numeric"
                        maxLength={13}
                        className="bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24] font-mono"
                      />
                    </div>
                    <input
                      value={receiverLandmark}
                      onChange={(e) => setReceiverLandmark(e.target.value)}
                      placeholder="Landmark — e.g. Near Hanuman Mandir, 2nd floor"
                      className="w-full bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                    />
                    {formError && (
                      <p className="text-[11px] text-red-600 font-bold">{formError}</p>
                    )}
                    <p className="text-[10px] text-slate-500">
                      Rider call + live location isi number par hogi. Order ke baad apni live location WhatsApp par share kar dena.
                    </p>
                  </div>
                )}
              </div>

              {/* 6. Bill Details */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2 text-xs">
                <span className="font-black uppercase tracking-wider text-slate-800 block border-b border-slate-100 pb-1.5">
                  Bill Summary
                </span>

                <div className="flex justify-between text-slate-600">
                  <span>Item Total</span>
                  <span className="font-mono font-semibold">₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-mono font-semibold">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Taxes & Restaurant Packaging</span>
                  <span className="font-mono font-semibold">₹{taxesAndCharges}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span className="font-mono">-₹{discount}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                  <span>To Pay</span>
                  <span className="font-mono text-base text-[#ED1C24]">₹{grandTotal}</span>
                </div>
              </div>

              {/* You saved strip */}
              {savedAmount > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">%</span>
                  <span>You saved ₹{savedAmount}{deliveryFee === 0 && orderType === 'DELIVERY' ? ' (FREE Delivery)' : ''} 🎉</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 7. Sticky Bottom Pay & Place Order Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200 py-3 sm:py-4 px-[max(0.875rem,calc((100%_-_48rem)/2))] bg-white shadow-lg flex items-center justify-between gap-3 shrink-0">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                Total Payable
              </span>
              <span className="text-xl font-black text-slate-900 font-mono leading-none">
                ₹{grandTotal}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                via {paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'cash' ? 'Cash' : 'Card'}
              </span>
            </div>

            <button
              id="btn-cart-checkout"
              onClick={handleCompleteOrder}
              disabled={isPlacing}
              className="flex-1 flex items-center justify-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 disabled:opacity-75 text-white font-black px-4 py-3 rounded-xl shadow-lg shadow-red-900/20 text-xs sm:text-sm tracking-wide transition-all cursor-pointer"
            >
              {isPlacing ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Placing Order...
                </span>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'upi'
                      ? `Pay ₹${grandTotal} with UPI`
                      : paymentMethod === 'cash'
                      ? `Place Order (Cash) • ₹${grandTotal}`
                      : `Pay ₹${grandTotal} with Card`}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Embedded Live Map Picker Modal */}
      <InteractiveMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectAddress={(newAddr) => {
          onSelectAddress?.(newAddr);
          setIsMapPickerOpen(false);
        }}
        currentAddress={currentAddress}
      />
    </div>
  );
};
