import React from 'react';
import { Plus, Minus, ChevronRight, Star, Sparkles } from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { VegNonVegIcon } from './VegNonVegIcon';

interface ProductCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  onOpenCustomize: (item: MenuItem) => void;
  quantityInCart: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onAddToCart,
  onOpenCustomize,
  quantityInCart,
  onUpdateQuantity,
}) => {
  return (
    <div
      id={`product-card-${item.id}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden relative"
    >
      {/* Top Image Banner */}
      <div className="relative aspect-4/3 sm:aspect-16/10 w-full overflow-hidden bg-slate-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            if (!el.src.endsWith('/images/seven_cheese_pizza_1788869697088.jpg')) {
              el.src = '/images/seven_cheese_pizza_1788869697088.jpg';
            }
          }}
        />

        {/* Veg / Non-Veg Indicator on Top-Left */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 p-1 rounded-sm shadow-xs backdrop-blur-xs">
          <VegNonVegIcon isVeg={item.isVeg} size="md" />
        </div>

        {/* Badges (NEW / BESTSELLER / 7 CHEESE / MUST TRY) */}
        {item.badge && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md ${
                item.badge === '7 CHEESE'
                  ? 'bg-black text-amber-300 border border-amber-400/50'
                  : item.badge === 'BESTSELLER'
                  ? 'bg-amber-400 text-slate-950'
                  : item.badge === 'NEW'
                  ? 'bg-[#ED1C24] text-white'
                  : item.badge === 'MUST TRY'
                  ? 'bg-orange-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {item.badge}
            </span>
          </div>
        )}

        {/* Rating chip if available */}
        {item.rating && (
          <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{item.rating}</span>
            {item.reviewsCount && (
              <span className="text-slate-300 text-[10px]">({item.reviewsCount})</span>
            )}
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Item Name */}
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-[#005580] transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Toppings / Description */}
          {item.toppings && item.toppings.length > 0 ? (
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
              <span className="font-semibold text-slate-700">Toppings: </span>
              {item.toppings.join(' • ')}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Size / Crust Selector Trigger (Matches Screenshot 3: "Regular | New Hand Tossed >") */}
          {item.isCustomizable && (
            <button
              id={`btn-customize-link-${item.id}`}
              onClick={() => onOpenCustomize(item)}
              className="mt-2 text-[11px] font-semibold text-slate-700 hover:text-[#005580] inline-flex items-center gap-1 border-b border-dashed border-slate-400 pb-0.5 transition-colors cursor-pointer"
            >
              <span>{item.defaultSize || 'Regular'} | {item.defaultCrust || 'New Hand Tossed'}</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-base sm:text-lg text-slate-900 font-mono">
                ₹{item.price}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-xs text-slate-400 line-through font-mono">
                  ₹{item.originalPrice}
                </span>
              )}
            </div>
            {item.isCustomizable && (
              <span className="text-[10px] text-slate-500 font-medium">
                Customise available
              </span>
            )}
          </div>

          {/* Action Button: "+ ADD" or Counter `[-] qty [+]` */}
          <div>
            {quantityInCart === 0 ? (
              <div className="flex items-center gap-1.5">
                {item.isCustomizable ? (
                  <button
                    id={`btn-add-${item.id}`}
                    onClick={() => onOpenCustomize(item)}
                    className="flex items-center gap-1 bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-extrabold px-3.5 py-1.5 rounded-lg shadow-sm text-xs sm:text-sm tracking-wide transition-all cursor-pointer"
                  >
                    <span>Add</span>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                ) : (
                  <button
                    id={`btn-add-${item.id}`}
                    onClick={() => onAddToCart(item)}
                    className="flex items-center gap-1 bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-extrabold px-3.5 py-1.5 rounded-lg shadow-sm text-xs sm:text-sm tracking-wide transition-all cursor-pointer"
                  >
                    <span>Add</span>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center bg-[#e31837] text-white rounded-lg shadow-xs overflow-hidden">
                <button
                  id={`btn-decrease-${item.id}`}
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="px-2.5 py-1.5 hover:bg-black/15 active:bg-black/30 transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-black text-xs sm:text-sm min-w-5 text-center font-mono">
                  {quantityInCart}
                </span>
                <button
                  id={`btn-increase-${item.id}`}
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="px-2.5 py-1.5 hover:bg-black/15 active:bg-black/30 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
