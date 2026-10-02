import React from 'react';
import { 
  MapPin, 
  ChevronDown,
  ChevronUp,
  Search, 
  Clock,
  Sparkles,
  X,
  User
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
  /** Store chosen for Takeaway / Dine-in (shown in the mode switch). */
  pickupStoreName?: string;
  /** Called when Takeaway or Dine-in is tapped so the store picker can open. */
  onPickStore?: () => void;
  /** Opens the Profile tab (round icon at the right end of the header). */
  onOpenProfile?: () => void;
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
  pickupStoreName,
  onPickStore,
  onOpenProfile,
}) => {
  const [searchFocus, setSearchFocus] = React.useState(false);
  const [stripHidden, setStripHidden] = React.useState(() => {
    try {
      return localStorage.getItem('seven_cheese_mode_strip_hidden') === '1';
    } catch {
      return false;
    }
  });
  const toggleStrip = (hide: boolean) => {
    setStripHidden(hide);
    try {
      localStorage.setItem('seven_cheese_mode_strip_hidden', hide ? '1' : '0');
    } catch {
      // ignore
    }
  };
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
      {/* Single-row header: logo | address | search | profile (search goes on top on mobile) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4">

          {/* Search + dietary chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto sm:flex-1 sm:min-w-[240px] order-1 sm:order-2">
          <div className="relative flex-1 min-w-[120px]">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-pizza"
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
              placeholder="Search pizza, wraps, burgers..."
              className="w-full bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner font-medium"
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
          <div className="flex items-center gap-1.5 shrink-0 ">
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
              <span>Veg</span>
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
              <span className="hidden sm:inline">Non-Veg</span><span className="sm:hidden">Non</span>
            </button>
          </div>
          </div>

          {/* Brand Logo & Address */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-none order-2 sm:order-1">
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
              className="flex items-center gap-2 text-left max-w-[200px] sm:max-w-[260px] shrink min-w-0 cursor-pointer"
            >
              <div
                className="hidden sm:flex flex-col items-center justify-center bg-slate-900 px-1.5 py-1 rounded text-[11px] font-bold text-amber-400 shrink-0 cursor-pointer"
                title={gpsState === 'locked' ? 'Live outlet distance from GPS' : 'Detect my location'}
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
                <div className="flex items-center gap-1 text-xs font-bold text-[#ED1C24]"><MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {currentAddress.label}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 truncate font-normal">{currentAddress.address}</p>
              </div>
            </button>
            )}
          </div>

          {/* Collapsed mode strip: compact chip that shows the current mode and re-opens the strip */}
          {stripHidden && (
            <button
              id="btn-show-mode-strip"
              onClick={() => toggleStrip(false)}
              aria-label="Show order type"
              className="order-3 shrink-0 flex items-center gap-1 h-9 px-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
            >
              {orderType === 'DELIVERY' ? 'Delivery' : orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine-in'}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {/* Profile */}
          <button
            id="btn-header-profile"
            onClick={onOpenProfile}
            aria-label="Profile"
            className="order-3 shrink-0 w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            <User className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Mode switcher: full-width segmented control under the header row (Domino's style).
            Customer can collapse it; the choice is remembered on this device. */}
        {stripHidden ? null : (
        <div className="mt-2 flex items-stretch gap-1.5">
        <div className="flex-1 grid grid-cols-3 rounded-xl overflow-hidden border border-slate-200 text-center text-xs font-bold">
          {([['DELIVERY', 'Delivery', 'Now'], ['TAKEAWAY', 'Takeaway', 'Select Store'], ['DINE_IN', 'Dine-in', 'Select Store']] as const).map(([key, label, sub]) => (
            <button
              key={key}
              id={`tab-mode-${key.toLowerCase().replace('_', '')}`}
              onClick={() => {
                setOrderType(key);
                if (key !== 'DELIVERY') onPickStore?.();
              }}
              className={`py-1.5 transition-colors cursor-pointer ${
                orderType === key ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="block leading-tight">{label}</span>
              <span className={`block text-[10px] font-medium leading-tight ${orderType === key ? 'text-slate-300' : 'text-slate-400'}`}>{key === 'DELIVERY' ? sub : pickupStoreName || sub}</span>
            </button>
          ))}
        </div>
          <button
            id="btn-hide-mode-strip"
            onClick={() => toggleStrip(true)}
            aria-label="Hide order type"
            title="Hide"
            className="shrink-0 w-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
        )}

      </div>
    </header>
  );
};
