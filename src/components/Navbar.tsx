import React from 'react';
import { 
  MapPin, 
  ChevronDown, 
  Search, 
  ShoppingBag, 
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { OrderType, UserAddress, MenuItem } from '../types';
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
  /** Live outlet distance (computed from GPS / selected address). Falls back to the address's saved distanceKm. */
  outletDistanceKm?: number;
  gpsState?: 'idle' | 'locating' | 'locked' | 'denied';
  onDetectLocation?: () => void;
  /** Amazon-style live suggestions for current searchQuery */
  suggestions?: MenuItem[];
  onSelectSuggestion?: (item: MenuItem) => void;
  /** Customer arrived via table QR — no point showing the address pill */
  isTableLocked?: boolean;
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
  outletDistanceKm,
  gpsState,
  onDetectLocation,
  suggestions = [],
  onSelectSuggestion,
  isTableLocked = false,
}) => {
  const [searchFocus, setSearchFocus] = React.useState(false);
  const liveKm =
    typeof outletDistanceKm === 'number' && Number.isFinite(outletDistanceKm)
      ? outletDistanceKm.toFixed(1)
      : (currentAddress.distanceKm?.toFixed(1) ?? '—');
  const showSuggestions = searchFocus && searchQuery.trim().length > 0 && suggestions.length > 0;
  const scrollToMenu = () => {
    const el = document.getElementById('menu-items-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <header className="sticky top-0 z-40 bg-white text-slate-900 shadow-md border-b border-slate-200">
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

            {/* Address / Store Selector — hidden on table QR lock (address is meaningless for dine-in) */}
            {!isTableLocked && (
            <button
              id="btn-address-selector"
              onClick={onOpenAddressModal}
              className="flex items-center gap-2 text-left bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors border border-slate-200 max-w-[180px] sm:max-w-[320px] truncate"
            >
              <div
                className="hidden sm:flex flex-col items-center justify-center bg-slate-900 px-1.5 py-1 rounded text-[11px] font-bold text-amber-400 shrink-0 cursor-pointer"
                title={gpsState === 'locked' ? 'Live outlet distance from GPS' : 'Tap for exact GPS distance'}
                onClick={(e) => {
                  e.stopPropagation();
                  if (gpsState === 'locating') return;
                  if (onDetectLocation) onDetectLocation();
                  else onOpenAddressModal();
                }}
              >
                <span>{gpsState === 'locating' ? '...' : `${liveKm} km`}</span>
                <span className="text-[9px] text-slate-400 uppercase">OUTLET</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                  <span className="truncate">
                    {orderType === 'DELIVERY' ? 'Deliver to:' : orderType === 'TAKEAWAY' ? 'Takeaway from:' : 'Dine-In Table:'}
                  </span>
                  <span className="text-amber-600">{currentAddress.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 truncate font-normal">
                  {currentAddress.address}, {currentAddress.city}
                </p>
              </div>
            </button>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              id="tab-mode-delivery"
              onClick={() => setOrderType('DELIVERY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                orderType === 'DELIVERY'
                  ? 'bg-[#ED1C24] text-white shadow-md font-bold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white'
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
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white'
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
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white'
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
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-xs border border-slate-400 flex items-center justify-center bg-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-xs border border-slate-400 flex items-center justify-center bg-white">
                <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-400" />
              </span>
              <span>Non-Veg</span>
            </button>
          </div>

          {/* Search Input - on mobile occupies right space of veg/non-veg; on desktop sm: occupies left */}
          <div className="relative flex-1 min-w-0 order-2 sm:order-1">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-pizza"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="Search pizza..."
              className="w-full bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner font-medium sm:hidden"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                  scrollToMenu();
                }
              }}
              placeholder="Search 7 Cheese Special, Farmhouse, Tandoori Chicken, Wraps, Burgers..."
              className="w-full bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner font-medium hidden sm:block"
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
            {/* Amazon-style live suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectSuggestion?.(s);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-amber-50 active:bg-amber-100 transition-colors text-left cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <img
                      src={s.image}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover shrink-0 bg-slate-100"
                      loading="lazy"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.isVeg ? 'bg-emerald-500' : 'bg-red-600'}`} />
                        <span className="truncate">{s.name}</span>
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {s.isVeg ? 'Veg' : 'Non-veg'} • tap to order
                      </span>
                    </span>
                    <span className="text-xs font-black text-slate-900 shrink-0">₹{s.price}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (document.activeElement as HTMLElement | null)?.blur?.();
                    setSearchFocus(false);
                    scrollToMenu();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 text-[11px] font-black text-[#ED1C24] text-center cursor-pointer"
                >
                  See all results below ↓
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
