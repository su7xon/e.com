import React from 'react';
import {
  Pizza,
  RotateCcw,
  ChefHat,
  Package,
  ShoppingBag,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

export type StoreTab = 'menu' | 'reorder' | 'makeyourown' | 'combos' | 'profile';

interface BottomNavProps {
  activeTab: StoreTab;
  setActiveTab: (tab: StoreTab) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  /** Opens the Filter & Sort sheet. */
  onOpenFilters?: () => void;
  /** Shows a dot on the Filter tab when a veg/non-veg filter or non-default sort is on. */
  filtersActive?: boolean;
  /** Image URLs of cart lines, shown as overlapping thumbnails on the cart bar. */
  cartThumbs?: string[];
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenFilters,
  filtersActive = false,
  cartThumbs = [],
}) => {
  const tabBtn = (isActive: boolean, activeColor: string) =>
    `flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl relative transition-all cursor-pointer min-w-0 flex-1 ${
      isActive ? activeColor : 'text-slate-400 hover:text-slate-900'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">

      {/* Floating Cart Banner if cart has items */}
      {cartCount > 0 && (
        <div className="max-w-md sm:max-w-lg mx-auto px-3 pb-2 animate-in slide-in-from-bottom-2 duration-200">
          <div
            onClick={onOpenCart}
            className="bg-[#ED1C24] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-[#c91430] hover:bg-[#d8141c] transition-all"
          >
            <div className="flex items-center gap-2.5">
              {cartThumbs.length > 0 ? (
                // Overlapping photos of what's in the cart (max 3, then "+N")
                <div className="flex items-center">
                  {cartThumbs.slice(0, 3).map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className={`w-9 h-9 rounded-full object-cover bg-white border-2 border-[#ED1C24] ${i > 0 ? '-ml-3' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                  {cartThumbs.length > 3 && (
                    <span className="-ml-3 w-9 h-9 rounded-full bg-white text-[#ED1C24] border-2 border-[#ED1C24] flex items-center justify-center text-[10px] font-black">
                      +{cartThumbs.length - 3}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-white text-[#ED1C24] flex items-center justify-center font-black text-xs">
                  {cartCount}
                </div>
              )}
              <div>
                <span className="text-xs font-bold block text-red-100">
                  {cartCount} {cartCount === 1 ? 'Item' : 'Items'} in Cart
                </span>
                <span className="text-sm font-black font-mono text-white">
                  ₹{cartTotal}
                </span>
              </div>
            </div>

            <button
              id="btn-bottom-view-cart"
              className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-[#ED1C24] font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="bg-white text-slate-900 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 sm:px-6 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md sm:max-w-2xl mx-auto flex items-stretch justify-between gap-1">

          {/* Menu */}
          <button
            id="btn-tab-menu"
            onClick={() => setActiveTab('menu')}
            className={tabBtn(activeTab === 'menu', 'text-[#ED1C24]')}
          >
            <Pizza className={`w-5 h-5 ${activeTab === 'menu' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-bold">Menu</span>
          </button>

          {/* Reorder */}
          <button
            id="btn-tab-reorder"
            onClick={() => setActiveTab('reorder')}
            className={tabBtn(activeTab === 'reorder', 'text-[#ED1C24]')}
          >
            <RotateCcw className={`w-5 h-5 ${activeTab === 'reorder' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-bold">Reorder</span>
          </button>

          {/* Make Your Own */}
          <button
            id="btn-tab-makeyourown"
            onClick={() => setActiveTab('makeyourown')}
            className={tabBtn(activeTab === 'makeyourown', 'text-[#ED1C24]')}
          >
            <ChefHat className={`w-5 h-5 ${activeTab === 'makeyourown' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-bold">Make Own</span>
          </button>

          {/* Combos */}
          <button
            id="btn-tab-combos"
            onClick={() => setActiveTab('combos')}
            className={tabBtn(activeTab === 'combos', 'text-[#ED1C24]')}
          >
            <Package className={`w-5 h-5 ${activeTab === 'combos' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-bold">Combos</span>
          </button>

          {/* Filter & Sort */}
          {onOpenFilters && (
            <button
              id="btn-tab-filter"
              onClick={onOpenFilters}
              className={tabBtn(filtersActive, 'text-[#ED1C24]')}
            >
              <span className="relative">
                <SlidersHorizontal className={`w-5 h-5 ${filtersActive ? 'stroke-[2.5]' : ''}`} />
                {filtersActive && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#ED1C24]" />
                )}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold">Filter</span>
            </button>
          )}
        </div>
      </nav>

      {/* Hidden cart trigger for tests */}
      <button id="btn-bottom-cart-hidden" onClick={onOpenCart} className="hidden" aria-hidden="true">
        <ShoppingBag className="w-4 h-4" />
      </button>
    </div>
  );
};
