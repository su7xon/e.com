import React from 'react';
import { 
  MapPin, 
  ChevronDown, 
  User, 
  Search, 
  ShoppingBag, 
  Clock,
  Sparkles,
  X,
  ShieldCheck
} from 'lucide-react';
import { OrderType, UserAddress } from '../types';
import { SevenCheeseLogo } from './SevenCheeseLogo';

interface NavbarProps {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  currentAddress: UserAddress;
  onOpenAddressModal: () => void;
  onOpenCart: () => void;
  cartItemCount: number;
  cartTotal: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  vegOnly: boolean;
  setVegOnly: (val: boolean) => void;
  nonVegOnly: boolean;
  setNonVegOnly: (val: boolean) => void;
  onOpenRewards: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  orderType,
  setOrderType,
  currentAddress,
  onOpenAddressModal,
  onOpenCart,
  cartItemCount,
  cartTotal,
  searchQuery,
  setSearchQuery,
  vegOnly,
  setVegOnly,
  nonVegOnly,
  setNonVegOnly,
  onOpenRewards,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#121214] text-white shadow-lg border-b border-white/10">
      {/* Top Utility Ribbon — hidden on mobile (saves space), same on sm+ */}
      <div className="hidden sm:block bg-[#09090b] px-3 py-1.5 text-xs border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              7 Cheese Pizza Express: 30 Mins Guarantee
            </span>
            <span className="hidden md:inline text-zinc-600">|</span>
            <span className="hidden md:inline text-zinc-300">Free delivery on orders above ₹99 • Authentic 7-Cheese Blend</span>
          </div>

          {onOpenAdmin && (
            <button
              id="btn-top-admin-pos"
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-0.5 rounded-md border border-amber-400/30 transition-all cursor-pointer shadow-xs"
              title="Open Live POS & Kitchen Admin Panel"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin POS</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Address */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* 7 Cheese Pizza Logo */}
            <div className="flex items-center shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {/* Full logo for desktop / sm+ */}
              <div className="hidden sm:block">
                <SevenCheeseLogo variant="full" height={40} />
              </div>
              {/* Icon badge for mobile */}
              <div className="block sm:hidden">
                <SevenCheeseLogo variant="icon" height={36} />
              </div>
            </div>

            {/* Address / Store Selector */}
            <button
              id="btn-address-selector"
              onClick={onOpenAddressModal}
              className="flex items-center gap-2 text-left bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl transition-colors border border-white/10 max-w-[180px] sm:max-w-[320px] truncate"
            >
              <div className="hidden sm:flex flex-col items-center justify-center bg-zinc-800 px-1.5 py-1 rounded text-[11px] font-bold text-amber-400 shrink-0 border border-amber-400/20">
                <span>{currentAddress.distanceKm ?? '1.8'} km</span>
                <span className="text-[9px] text-zinc-400 uppercase">OUTLET</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-white">
                  <span className="truncate">
                    {orderType === 'DELIVERY' ? 'Deliver to:' : orderType === 'TAKEAWAY' ? 'Takeaway from:' : 'Dine-In Table:'}
                  </span>
                  <span className="text-amber-400">{currentAddress.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 text-white/80" />
                </div>
                <p className="text-[11px] text-zinc-300 truncate font-normal">
                  {currentAddress.address}, {currentAddress.city}
                </p>
              </div>
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="hidden lg:flex items-center bg-[#1f1f23] p-1 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              id="tab-mode-delivery"
              onClick={() => setOrderType('DELIVERY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                orderType === 'DELIVERY'
                  ? 'bg-[#ED1C24] text-white shadow-md font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🛵 Delivery (30m)
            </button>
            <button
              id="tab-mode-takeaway"
              onClick={() => setOrderType('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                orderType === 'TAKEAWAY'
                  ? 'bg-[#ED1C24] text-white shadow-md font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🛍️ Takeaway
            </button>
            <button
              id="tab-mode-dinein"
              onClick={() => setOrderType('DINE_IN')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                orderType === 'DINE_IN'
                  ? 'bg-[#ED1C24] text-white shadow-md font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🍽️ Dine-in
            </button>
          </div>

          {/* Actions: Cart & Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cart Button */}
            <button
              id="btn-nav-cart"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 text-white px-3 py-1.5 rounded-xl transition-all shadow-md font-bold text-xs sm:text-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 ? (
                <span className="bg-white text-[#ED1C24] text-xs px-1.5 py-0.2 rounded-full font-black min-w-5 text-center">
                  {cartItemCount}
                </span>
              ) : null}
              {cartTotal > 0 && (
                <span className="hidden md:inline font-mono border-l border-white/30 pl-2 text-xs">
                  ₹{cartTotal}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            <button
              id="btn-nav-profile"
              onClick={onOpenRewards}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors text-white"
              title="User Account"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Admin POS Shortcut Button */}
            {onOpenAdmin && (
              <button
                id="btn-nav-admin-action"
                onClick={onOpenAdmin}
                className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 px-2 sm:px-2.5 py-1.5 rounded-xl transition-all font-bold text-xs cursor-pointer shadow-xs"
                title="Open 7 Cheese Admin POS Panel"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin POS</span>
              </button>
            )}
          </div>

        </div>

        {/* Search Bar & Fast Filters row */}
        <div className="mt-2 sm:mt-2.5 flex flex-row items-center gap-1.5 sm:gap-2">
          {/* Quick Dietary Filters (Veg / Non-veg) - on mobile appears on left, on desktop sm: appears on right */}
          <div className="flex items-center gap-1.5 shrink-0 order-1 sm:order-2">
            <button
              id="btn-filter-veg"
              onClick={() => {
                setVegOnly(!vegOnly);
                if (!vegOnly) setNonVegOnly(false);
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                vegOnly
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-xs border border-white flex items-center justify-center bg-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </span>
              <span>Veg Only</span>
            </button>

            <button
              id="btn-filter-nonveg"
              onClick={() => {
                setNonVegOnly(!nonVegOnly);
                if (!nonVegOnly) setVegOnly(false);
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                nonVegOnly
                  ? 'bg-red-700 text-white border-red-600 shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-xs border border-white flex items-center justify-center bg-white/20">
                <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-400" />
              </span>
              <span>Non-Veg</span>
            </button>
          </div>

          {/* Search Input - on mobile occupies right space of veg/non-veg; on desktop sm: occupies left */}
          <div className="relative flex-1 min-w-0 order-2 sm:order-1">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-pizza"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pizza..."
              className="w-full bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-500 text-xs sm:text-sm pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner font-medium sm:hidden"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 7 Cheese Special, Farmhouse, Tandoori Chicken, Wraps, Burgers..."
              className="w-full bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-500 text-xs sm:text-sm pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner font-medium hidden sm:block"
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
