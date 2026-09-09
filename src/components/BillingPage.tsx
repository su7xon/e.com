import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Tag,
  CheckCircle2,
  Bike,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  Sparkles,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Navigation,
} from 'lucide-react';
import { CartItem, Coupon, UserAddress, OrderType, MenuItem } from '../types';
import { COUPONS, MENU_ITEMS } from '../data/mockData';
import { VegNonVegIcon } from './VegNonVegIcon';
import { InteractiveMapPicker } from './InteractiveMapPicker';

interface BillingPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon) => void;
  onRemoveCoupon: () => void;
  orderType: OrderType;
  currentAddress: UserAddress;
  onOpenAddressModal: () => void;
  onSelectAddress?: (addr: UserAddress) => void;
  onPlaceOrder: (notes: string, paymentMethod?: string) => void;
  onGoBack: () => void;
  onAddToCart: (item: MenuItem) => void;
  availableCoupons?: Coupon[];
  availableMenuItems?: MenuItem[];
}

export const BillingPage: React.FC<BillingPageProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  orderType,
  currentAddress,
  onOpenAddressModal,
  onSelectAddress,
  onPlaceOrder,
  onGoBack,
  onAddToCart,
  availableCoupons,
  availableMenuItems,
}) => {
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [cookingNotes, setCookingNotes] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');

  const couponList = availableCoupons || COUPONS;
  const menuList = availableMenuItems || MENU_ITEMS;

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeDeliveryThreshold = 99;
  const isFreeDeliveryEligible = subtotal >= freeDeliveryThreshold || appliedCoupon?.code === 'FREEDEL';
  const deliveryFee = orderType === 'DELIVERY' ? (isFreeDeliveryEligible ? 0 : 40) : 0;
  const taxesAndCharges = subtotal > 0 ? Math.round(subtotal * 0.05 + 15) : 0;

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

  const handlePlaceOrderClick = () => {
    setIsPlacing(true);
    setTimeout(() => {
      setIsPlacing(false);
      onPlaceOrder(cookingNotes, paymentMethod);
    }, 800);
  };

  // You May Also Like — pick random items not already in cart
  const suggestedItems = useMemo(() => {
    const cartProductIds = new Set(cartItems.map((c) => c.productId));
    const available = menuList.filter((m) => !cartProductIds.has(m.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [cartItems, menuList]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            id="btn-billing-back"
            onClick={onGoBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-bold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Menu</span>
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#ED1C24]" />
            <span className="text-sm font-black text-slate-900">
              Checkout ({cartItems.reduce((a, b) => a + b.quantity, 0)} Items)
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        
        {/* Checkout Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Complete Your Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your items, apply coupons, and place your order
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left Column - Items & Details */}
          <div className="lg:col-span-3 space-y-5">

            {/* Order Items */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#ED1C24]" />
                  <span className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Your Items
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {cartItems.reduce((a, b) => a + b.quantity, 0)} items
                </span>
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <VegNonVegIcon isVeg={item.isVeg} size="sm" />
                            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug truncate">
                              {item.name}
                            </h4>
                          </div>
                          {(item.size || item.crust) && (
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {item.size} • {item.crust}
                            </p>
                          )}
                          {item.extraCheese && (
                            <p className="text-[10px] text-amber-700 font-semibold">
                              + Extra Mozzarella Cheese
                            </p>
                          )}
                          {item.extraToppings.length > 0 && (
                            <p className="text-[10px] text-slate-500">
                              + {item.extraToppings.map((t) => t.name).join(', ')}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-black font-mono text-slate-900">
                          ₹{item.price * item.quantity}
                        </span>

                        {/* Quantity Selector */}
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-xs">
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors rounded-l-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 font-mono font-bold text-xs text-slate-900 min-w-6 text-center border-x border-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors rounded-r-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Your Meal (Sweet Products Horizontal Scroll) */}
            {menuList.filter((item) => item.category === 'desserts' || item.id.includes('dessert') || item.id.includes('choco')).length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍰</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                        Complete Your Meal
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Irresistible sweet treats to complete your feast
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Sweet Treats
                  </span>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x -mx-1 px-1">
                  {menuList
                    .filter((item) => item.category === 'desserts' || item.id.includes('dessert') || item.id.includes('choco'))
                    .map((sweet) => {
                      const inCart = cartItems.find((c) => c.productId === sweet.id);
                      return (
                        <div
                          key={sweet.id}
                          className="w-[148px] sm:w-[160px] shrink-0 bg-slate-50 rounded-xl border border-slate-200 p-2 flex flex-col justify-between snap-start shadow-2xs hover:border-amber-400 hover:bg-white transition-all"
                        >
                          <div>
                            <div className="relative w-full h-22 rounded-lg overflow-hidden mb-1.5 bg-slate-100">
                              <img
                                src={sweet.image}
                                alt={sweet.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/choco_lava_cake_1788869782552.jpg';
                                }}
                              />
                              <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-xs p-0.5 rounded-sm">
                                <VegNonVegIcon isVeg={sweet.isVeg} size="sm" />
                              </div>
                              {sweet.badge && (
                                <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase leading-tight">
                                  {sweet.badge}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1 leading-snug">
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

                          <div className="mt-2.5">
                            {inCart ? (
                              <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-lg py-1 px-2">
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
                                id={`btn-billing-sweet-add-${sweet.id}`}
                                onClick={() => onAddToCart(sweet)}
                                className="w-full bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 text-white text-[11px] font-black py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
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

            {/* Coupon Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#ED1C24]" />
                  <span className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Apply Coupon Code
                  </span>
                </div>
                {!appliedCoupon && couponList.length > 1 && (
                  <button
                    type="button"
                    id="btn-billing-toggle-coupons"
                    onClick={() => setShowAllCoupons(!showAllCoupons)}
                    className="text-[11px] font-bold text-[#005580] hover:text-[#003d5c] flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <span>{showAllCoupons ? 'Show Less' : `View All (${couponList.length})`}</span>
                    {showAllCoupons ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono font-black text-sm text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">Applied!</span>
                    </div>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      You saved ₹{discount} with this coupon 🎉
                    </p>
                  </div>
                  <button
                    onClick={onRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:underline shrink-0 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleCustomCouponSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError('');
                      }}
                      placeholder="Enter Promo Code"
                      className="flex-1 bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580] font-mono font-bold uppercase"
                    />
                    <button
                      type="submit"
                      className="bg-[#005580] text-white text-sm font-black px-5 py-2.5 rounded-xl hover:bg-[#003d5c] transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                  {couponError && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5">{couponError}</p>
                  )}

                  {/* Quick Coupon Chips - 1 coupon default, all coupons when expanded */}
                  <div className="mt-3 space-y-2">
                    {(showAllCoupons ? couponList : couponList.slice(0, 1)).map((cp) => (
                      <div
                        key={cp.code}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:border-amber-400 hover:bg-amber-50/30 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-black text-slate-800">
                              {cp.code}
                            </span>
                            {cp.tag && (
                              <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                {cp.tag}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {cp.description}
                          </span>
                        </div>
                        <button
                          onClick={() => onApplyCoupon(cp)}
                          className="text-xs font-black text-[#ED1C24] hover:underline shrink-0 ml-2 cursor-pointer"
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

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-[#005580]" />
                <span className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Delivery Address
                </span>
              </div>

              <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-amber-50/30 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      {currentAddress.label}
                    </span>
                    {currentAddress.lat && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-sm uppercase">
                        GPS Pinned
                      </span>
                    )}
                    {orderType === 'DELIVERY' && (
                      <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                        <Bike className="w-3 h-3" />
                        {isFreeDeliveryEligible ? 'FREE Delivery' : `₹${deliveryFee} Delivery`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 font-medium mt-1">
                    {currentAddress.address}, {currentAddress.city}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="bg-[#005580] hover:bg-[#003d5c] text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Live Map</span>
                  </button>
                  <button
                    onClick={onOpenAddressModal}
                    className="text-sm font-bold text-[#005580] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            {/* Cooking Notes */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
              <span className="text-sm font-black uppercase tracking-wider text-slate-800 block mb-2">
                Delivery & Cooking Notes
              </span>
              <input
                type="text"
                value={cookingNotes}
                onChange={(e) => setCookingNotes(e.target.value)}
                placeholder="e.g., Leave at door, extra chilli flakes, ring doorbell..."
                className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
              />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
              <span className="text-sm font-black uppercase tracking-wider text-slate-800 block mb-3">
                Payment Method
              </span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-[#005580] bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Smartphone className={`w-6 h-6 ${paymentMethod === 'upi' ? 'text-[#005580]' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${paymentMethod === 'upi' ? 'text-[#005580]' : 'text-slate-600'}`}>
                    UPI
                  </span>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#005580] bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-[#005580]' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${paymentMethod === 'card' ? 'text-[#005580]' : 'text-slate-600'}`}>
                    Card
                  </span>
                </button>

                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-[#005580] bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Banknote className={`w-6 h-6 ${paymentMethod === 'cod' ? 'text-[#005580]' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${paymentMethod === 'cod' ? 'text-[#005580]' : 'text-slate-600'}`}>
                    Cash
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Bill Summary */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bill Summary Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm lg:sticky lg:top-20">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#005580]" />
                <span className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Bill Summary
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
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
                  <span>Taxes & Packaging</span>
                  <span className="font-mono font-semibold">₹{taxesAndCharges}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Coupon ({appliedCoupon?.code})
                    </span>
                    <span className="font-mono">-₹{discount}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-black text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-lg text-[#005580]">₹{grandTotal}</span>
                </div>
              </div>

              {/* Delivery Time Estimate */}
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-black text-amber-800 block">
                    Estimated Delivery: 25-30 mins
                  </span>
                  <span className="text-[10px] text-amber-600">
                    Your order will be freshly prepared
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                id="btn-billing-place-order"
                onClick={handlePlaceOrderClick}
                disabled={isPlacing || cartItems.length === 0}
                className="w-full mt-4 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#e31837] to-[#c4122d] hover:from-[#c4122d] hover:to-[#a80f26] active:scale-[0.98] disabled:opacity-60 text-white font-black px-5 py-4 rounded-2xl shadow-lg shadow-red-900/25 text-base tracking-wide transition-all cursor-pointer"
              >
                {isPlacing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  <>
                    <span>Pay ₹{grandTotal}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Secure & Safe Payments</span>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              You May Also Like
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {suggestedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {item.badge && (
                    <span className="absolute top-2 left-2 bg-[#ED1C24] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                      {item.badge}
                    </span>
                  )}
                  <div className="absolute top-2 right-2">
                    <VegNonVegIcon isVeg={item.isVeg} size="sm" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5 sm:p-3">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight line-clamp-2">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black font-mono text-slate-900">
                        ₹{item.price}
                      </span>
                      {item.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through font-mono">
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="bg-white border-2 border-[#e31837] text-[#e31837] hover:bg-[#e31837] hover:text-white px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer"
                    >
                      + ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white border-t border-slate-200 shadow-2xl px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
              Total Payable
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{grandTotal}
            </span>
          </div>
          <button
            onClick={handlePlaceOrderClick}
            disabled={isPlacing || cartItems.length === 0}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 bg-gradient-to-r from-[#e31837] to-[#c4122d] hover:from-[#c4122d] hover:to-[#a80f26] disabled:opacity-60 text-white font-black px-5 py-3 rounded-xl shadow-lg text-sm transition-all cursor-pointer"
          >
            {isPlacing ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Placing...
              </span>
            ) : (
              <>
                <span>Pay ₹{grandTotal}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
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
