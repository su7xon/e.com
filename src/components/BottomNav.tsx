import React from 'react';
import {
  Pizza,
  RotateCcw,
  ChefHat,
  Package,
  User,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

export type StoreTab = 'menu' | 'reorder' | 'makeyourown' | 'combos' | 'profile';

interface BottomNavProps {
  activeTab: StoreTab;
  setActiveTab: (tab: StoreTab) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  cartTotal,
  onOpenCart,
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
            className="bg-[#18181b] text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-white/10 hover:bg-[#27272a] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                {cartCount}
              </div>
              <div>
                <span className="text-xs font-bold block text-zinc-300">
                  {cartCount} {cartCount === 1 ? 'Item' : 'Items'} in Cart
                </span>
                <span className="text-sm font-black font-mono text-amber-400">
                  ₹{cartTotal}
                </span>
              </div>
            </div>

            <button
              id="btn-bottom-view-cart"
              className="flex items-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="bg-white text-slate-900 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 sm:px-6 py-2">
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

          {/* Profile */}
          <button
            id="btn-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={tabBtn(activeTab === 'profile', 'text-[#ED1C24]')}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-bold">Profile</span>
          </button>
        </div>
      </nav>

      {/* Hidden cart trigger for tests */}
      <button id="btn-bottom-cart-hidden" onClick={onOpenCart} className="hidden" aria-hidden="true">
        <ShoppingBag className="w-4 h-4" />
      </button>
    </div>
  );
};
