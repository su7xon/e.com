import React, { useState } from 'react';
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
  const [mealFilter, setMealFilter] = useState('All');
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

  // Domino's-style "Complete Your Meal" chips -> menu matchers
  const MEAL_CHIPS = ['All', 'Desserts', 'Breads & More', 'Taco & Parcel', 'Beverages', 'Chicken Feast', 'Dips'];
  const matchesMealChip = (item: MenuItem, chip: string): boolean => {
    const id = item.id.toLowerCase();
    const name = item.name.toLowerCase();
    const cat = item.category;
    switch (chip) {
      case 'All': return true;
      case 'Desserts': return cat === 'desserts' || id.includes('dessert') || id.includes('choco') || id.includes('lava');
      case 'Breads & More': return name.includes('garlic') || name.includes('bread') || cat === 'pan-pizza';
      case 'Taco & Parcel': return name.includes('taco') || name.includes('parcel') || name.includes('pocket') || name.includes('bites');
      case 'Beverages': return cat === 'drinks';
      case 'Chicken Feast': return cat === 'chicken-corner' || (!item.isVeg && (cat === 'non-veg-pizza' || name.includes('chicken')));
      case 'Dips': return name.includes('dip');
      default: return true;
    }
  };
  const mealProducts = menuList.filter((item) => matchesMealChip(item, mealFilter));
  const isPizzaLine = (name: string, category: string) =>
    category === 'veg-pizza' || category === 'non-veg-pizza' || name.toLowerCase().includes('pizza');
  const offBadge = (item: MenuItem): string | null => {
    if (!item.originalPrice || item.originalPrice <= item.price) return null;
    return `₹${item.originalPrice - item.price} OFF`;
  };
  const savedAmount = discount + (orderType === 'DELIVERY' && deliveryFee === 0 && subtotal > 0 ? 40 : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        id="cart-drawer-panel"
        className="w-full max-w-md sm:max-w-lg bg-slate-50 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="bg-[#005580] text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                Your Cart & Checkout
              </h2>
              <span className="text-[11px] text-blue-200 font-medium">
                {cartItems.reduce((a, b) => a + b.quantity, 0)} {cartItems.reduce((a, b) => a + b.quantity, 0) === 1 ? 'item' : 'items'} saved
              </span>
            </div>
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
          className="bg-white px-4 py-2.5 flex items-center gap-3 border-b border-slate-200 text-left w-full cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Deliver</div>
            <div className="text-sm font-black text-slate-900">30 Mins</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">
              {currentAddress.address}, {currentAddress.city} - {currentAddress.pincode}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {currentAddress.landmark ? `Landmark: ${currentAddress.landmark}` : 'Tap to set exact address + landmark'}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Free Delivery Bar */}
        {orderType === 'DELIVERY' && cartItems.length > 0 && (
          <div className="px-4 py-2 text-white text-xs bg-gradient-to-r from-[#ED1C24] via-[#7a1fa2] to-[#005580]">
            {isFreeDeliveryEligible ? (
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-300" />
                <span>Lowest Prices & FREE Delivery unlocked — Congratulations!</span>
              </div>
            ) : (
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
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
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
                      className="text-[11px] font-bold text-[#005580] hover:text-[#003d5c] flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors"
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
                        className="flex-1 bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580] font-mono font-bold uppercase"
                      />
                      <button
                        type="submit"
                        id="btn-apply-coupon"
                        className="bg-[#005580] text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-[#003d5c] transition-colors cursor-pointer"
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
                          className="text-[11px] font-bold text-[#005580] hover:text-[#003d5c] flex items-center gap-1 hover:underline cursor-pointer"
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
                        ? 'border-[#005580] bg-blue-50/60 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cartPaymentMethod"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="mt-1 text-[#005580] focus:ring-[#005580]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-[#005580]" />
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
                        ? 'border-[#005580] bg-blue-50/60 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cartPaymentMethod"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="mt-1 text-[#005580] focus:ring-[#005580]"
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
                        ? 'border-[#005580] bg-blue-50/60 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cartPaymentMethod"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="mt-1 text-[#005580] focus:ring-[#005580]"
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
                <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-amber-50/30 border border-blue-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#005580] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <MapPin className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
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
                      className="text-[11px] font-black text-white bg-[#005580] hover:bg-[#003d5c] active:scale-95 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      title="Set exact location on live map"
                    >
                      <Navigation className="w-3 h-3 text-amber-300 animate-pulse" />
                      <span>Live Map</span>
                    </button>
                    <button
                      type="button"
                      id="btn-cart-change-address"
                      onClick={onOpenAddressModal}
                      className="text-xs font-bold text-[#005580] hover:underline px-1 cursor-pointer"
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
                    className="w-full bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
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
                        className="bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
                      />
                      <input
                        value={receiverPhone}
                        onChange={(e) => { setReceiverPhone(e.target.value); setFormError(''); }}
                        placeholder="10-digit mobile *"
                        inputMode="numeric"
                        maxLength={13}
                        className="bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580] font-mono"
                      />
                    </div>
                    <input
                      value={receiverLandmark}
                      onChange={(e) => setReceiverLandmark(e.target.value)}
                      placeholder="Landmark — e.g. Near Hanuman Mandir, 2nd floor"
                      className="w-full bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
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
          <div className="border-t border-slate-200 p-3 sm:p-4 bg-white shadow-lg flex items-center justify-between gap-3 shrink-0">
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
