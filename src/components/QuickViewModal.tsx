import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Check, Star, Zap, ShoppingBag } from 'lucide-react';
import { MenuItem } from '../types';
import { needsCustomize } from '../lib/customize';
import { VegNonVegIcon } from './VegNonVegIcon';

interface QuickViewModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  /** Eat Now: cart me dalke sidha checkout (billing) page */
  onEatNow: (item: MenuItem) => void;
  onOpenCustomize: (item: MenuItem) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  item,
  isOpen,
  onClose,
  menuItems,
  onAddToCart,
  onEatNow,
  onOpenCustomize,
}) => {
  const [addedTick, setAddedTick] = useState(false);

  useEffect(() => {
    setAddedTick(false);
  }, [isOpen, item?.id]);

  // Also Try — 6 random foods (excluding the current item), reshuffled on every open
  const alsoTry = useMemo(() => {
    if (!item) return [];
    const pool = menuItems.filter((m) => m.id !== item.id);
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 6);
  }, [menuItems, item, isOpen]);

  if (!isOpen || !item) return null;

  const handleAdd = () => {
    onAddToCart(item);
    setAddedTick(true);
    window.setTimeout(() => setAddedTick(false), 1200);
  };

  const handleAlsoAdd = (sweet: MenuItem) => {
    // Also-try me pizza aaye to uska size/crust modal kholo (ye band karke)
    if (needsCustomize(sweet)) {
      onClose();
      onOpenCustomize(sweet);
    } else {
      onAddToCart(sweet);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="modal-quickview-container"
        className="bg-[#FDFBF7] rounded-none sm:rounded-3xl w-full max-w-lg h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        {/* Image */}
        <div className="relative shrink-0 h-44 sm:h-56 bg-slate-100">
          <img
            src={item.image}
            alt={item.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              if (!el.src.endsWith('/images/seven_cheese_pizza_1788869697088.jpg')) {
                el.src = '/images/seven_cheese_pizza_1788869697088.jpg';
              }
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 bg-white/90 p-1 rounded-sm shadow-xs">
            <VegNonVegIcon isVeg={item.isVeg} size="md" />
          </div>
          {item.badge && (
            <span className="absolute top-3 left-12 bg-[#ED1C24] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
              {item.badge}
            </span>
          )}
          {item.rating ? (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{item.rating}</span>
              {item.reviewsCount ? <span className="text-slate-300 text-[10px]">({item.reviewsCount})</span> : null}
            </div>
          ) : null}
          <button
            id="btn-close-quickview"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Price chip */}
          <div className="absolute bottom-3 right-3 bg-white rounded-xl px-2.5 py-1 shadow-md flex items-baseline gap-1.5">
            <span className="font-black text-base text-slate-900 font-mono">₹{item.price}</span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-slate-400 line-through font-mono">₹{item.originalPrice}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4">
          <h2 className="font-display text-xl font-bold text-stone-900 leading-tight">{item.name}</h2>
          {item.subCategoryTitle && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] mt-1">{item.subCategoryTitle}</p>
          )}
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1.5 leading-relaxed">{item.description}</p>
          {item.toppings && item.toppings.length > 0 && (
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-bold text-slate-700">Includes: </span>
              {item.toppings.join(' • ')}
            </p>
          )}

          {/* Also Try */}
          {alsoTry.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="flex-1 h-px bg-stone-200" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-500">Also Try</span>
                <span className="flex-1 h-px bg-stone-200" />
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x -mx-1 px-1">
                {alsoTry.map((sweet) => (
                  <div
                    key={sweet.id}
                    className="w-[132px] shrink-0 bg-white rounded-xl border border-stone-200/90 p-2 flex flex-col justify-between snap-start shadow-2xs"
                  >
                    <div>
                      <div className="relative w-full h-20 rounded-lg overflow-hidden mb-1.5 bg-slate-100">
                        <img
                          src={sweet.image}
                          alt={sweet.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/seven_cheese_pizza_1788869697088.jpg';
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-white/90 p-0.5 rounded-sm">
                          <VegNonVegIcon isVeg={sweet.isVeg} size="sm" />
                        </div>
                      </div>
                      <h4 className="text-[11px] font-extrabold text-slate-900 line-clamp-2 leading-snug min-h-7">
                        {sweet.name}
                      </h4>
                      <span className="text-xs font-black font-mono text-slate-900">₹{sweet.price}</span>
                    </div>
                    <button
                      id={`btn-quickview-also-${sweet.id}`}
                      onClick={() => handleAlsoAdd(sweet)}
                      className="mt-2 w-full bg-slate-900 hover:bg-black active:scale-95 text-white text-[10px] font-black py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>ADD</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA: Eat Now + Add to Cart */}
        <div className="shrink-0 border-t border-stone-200 bg-white px-4 sm:px-5 py-3.5 flex items-center gap-2.5">
          <button
            id="btn-quickview-add"
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-1.5 font-extrabold px-4 py-3 rounded-full text-sm tracking-wide transition-all cursor-pointer border-2 active:scale-95 ${
              addedTick
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
            }`}
          >
            {addedTick ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
          <button
            id="btn-quickview-eat"
            onClick={() => onEatNow(item)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-extrabold px-4 py-3 rounded-full shadow-lg shadow-red-900/20 text-sm tracking-wide transition-all cursor-pointer"
          >
            <span>Eat Now</span>
            <span>•</span>
            <span className="font-mono">₹{item.price}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
