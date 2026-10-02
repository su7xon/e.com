import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, ShieldCheck, Flame, Plus, Clock } from 'lucide-react';
import { MenuItem, PizzaSize, PizzaCrust, ExtraTopping, CartItem } from '../types';
import { AVAILABLE_TOPPINGS, SIZE_PRICE_MODIFIERS, CRUST_PRICE_MODIFIERS } from '../data/mockData';
import { PIZZA_CATEGORIES } from '../lib/customize';
import { VegNonVegIcon } from './VegNonVegIcon';

interface CustomizeModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddToCart: (cartItem: CartItem) => void;
}



export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmAddToCart,
}) => {
  if (!isOpen || !item) return null;

  // Only real pizzas get size/crust/cheese/toppings steps.
  // Drinks, desserts, sides etc. must never show pizza options —
  // chahe Firestore me isCustomizable true bhi ho.
  const isPizzaItem = PIZZA_CATEGORIES.includes(item.category);

  const [selectedSize, setSelectedSize] = useState<PizzaSize>(item.defaultSize || 'Regular');
  const [selectedCrust, setSelectedCrust] = useState<PizzaCrust>(item.defaultCrust || 'New Hand Tossed');
  const [extraCheese, setExtraCheese] = useState<boolean>(item.category === 'signature-7-cheese');
  const [selectedToppings, setSelectedToppings] = useState<ExtraTopping[]>([]);

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setSelectedSize(item.defaultSize || 'Regular');
      setSelectedCrust(item.defaultCrust || 'New Hand Tossed');
      setExtraCheese(item.category === 'signature-7-cheese');
      setSelectedToppings([]);
    }
  }, [item]);

  // Compute crust modifier based on size from 7 Cheese Pizza menu
  const getCrustModifier = (crust: PizzaCrust, size: PizzaSize): number => {
    if (crust === 'Cheese Burst') {
      return size === 'Regular' ? 50 : size === 'Medium' ? 80 : 110;
    }
    if (crust === 'Wheat Thin Crust') {
      return size === 'Regular' ? 30 : size === 'Medium' ? 40 : 70;
    }
    if (crust === 'Fresh Pan Pizza') {
      return 35;
    }
    return 0; // New Hand Tossed
  };

  // Compute extra cheese modifier based on size from 7 Cheese Pizza menu
  const getCheeseModifier = (size: PizzaSize): number => {
    return size === 'Regular' ? 49 : size === 'Medium' ? 69 : 99;
  };

  // Base price for selected size (pizzas only — drinks/sides stay flat)
  const baseSizePrice = isPizzaItem
    ? (item.sizePrices && item.sizePrices[selectedSize]
      ? item.sizePrices[selectedSize]!
      : item.price + (SIZE_PRICE_MODIFIERS[selectedSize] || 0))
    : item.price;

  const crustMod = isPizzaItem ? getCrustModifier(selectedCrust, selectedSize) : 0;
  const cheeseMod = extraCheese && isPizzaItem ? getCheeseModifier(selectedSize) : 0;
  const toppingsMod = isPizzaItem ? selectedToppings.reduce((acc, t) => acc + t.price, 0) : 0;
  const totalPrice = baseSizePrice + crustMod + cheeseMod + toppingsMod;

  const toggleTopping = (topping: ExtraTopping) => {
    if (selectedToppings.some((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const handleAdd = () => {
    const newCartItem: CartItem = {
      cartItemId: `${item.id}-${Date.now()}`,
      productId: item.id,
      name: item.name,
      isVeg: item.isVeg,
      image: item.image,
      basePrice: item.price,
      price: totalPrice,
      size: isPizzaItem ? selectedSize : undefined,
      crust: isPizzaItem ? selectedCrust : undefined,
      extraCheese: isPizzaItem ? extraCheese : false,
      extraToppings: isPizzaItem ? selectedToppings : [],
      quantity: 1,
    };
    onConfirmAddToCart(newCartItem);
    onClose();
  };

  const buildSummary = isPizzaItem
    ? [
        selectedSize,
        selectedCrust,
        extraCheese ? 'Extra cheese' : null,
        selectedToppings.length ? `${selectedToppings.length} topping${selectedToppings.length > 1 ? 's' : ''}` : null,
      ]
        .filter(Boolean)
        .join('  •  ')
    : (item.subCategoryTitle || 'Ready to add');

  const stepHead = (n: string, title: string, hint: string) => (
    <div className="flex items-baseline justify-between mb-3">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-xl font-bold text-[#C2410C]">{n}</span>
        <span className="text-sm font-black text-stone-900">{title}</span>
      </div>
      <span className="text-[11px] text-stone-400 font-medium">{hint}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="modal-customize-container"
        className="bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        {/* Header — dish + live build */}
        <div className="relative shrink-0 border-b border-stone-200/80 bg-[#FAF7F0] px-4 sm:px-6 py-4 flex items-center gap-3.5">
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
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-stone-200 shadow-xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <VegNonVegIcon isVeg={item.isVeg} size="md" />
              <h2 className="font-display text-lg sm:text-xl font-bold text-stone-900 leading-tight truncate">
                {item.name}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 font-medium truncate mt-0.5">
              {buildSummary}
            </p>
          </div>
          <div className="text-right shrink-0 hidden xs:block sm:block">
            <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Total</div>
            <div className="font-display text-xl font-bold text-stone-900">₹{totalPrice}</div>
          </div>
          <button
            id="btn-close-customize"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-7">

          {/* Step 1: Size — visual circles (pizzas only) */}
          {isPizzaItem && (
          <div>
            {stepHead('01', 'Pick your size', 'Required')}
            <div className="grid grid-cols-3 gap-2.5">
              {(['Regular', 'Medium', 'Large'] as PizzaSize[]).map((size) => {
                const isSelected = selectedSize === size;
                const extra = SIZE_PRICE_MODIFIERS[size];
                const slices = size === 'Regular' ? '4 slices' : size === 'Medium' ? '6 slices' : '8 slices';
                const serves = size === 'Regular' ? 'Serves 1' : size === 'Medium' ? 'Serves 2' : 'Serves 4';
                const circle =
                  size === 'Regular' ? 'w-9 h-9' : size === 'Medium' ? 'w-11 h-11' : 'w-[52px] h-[52px]';

                return (
                  <button
                    key={size}
                    id={`btn-size-${size.toLowerCase()}`}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-2xl border p-3 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#C2410C] bg-orange-50 ring-1 ring-[#C2410C] shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <span className={`${circle} rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#C2410C] bg-[#C2410C]/10' : 'border-stone-300 bg-stone-50'}`}>
                      {isSelected && <Check className="w-4 h-4 text-[#C2410C] stroke-[3]" />}
                    </span>
                    <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-[#9A3412]' : 'text-stone-800'}`}>
                      {size}
                    </span>
                    <span className="text-[10px] text-stone-500 leading-tight">
                      {serves} · {slices}
                    </span>
                    <span className="mt-1 text-xs font-mono font-bold text-stone-700">
                      {item.sizePrices && item.sizePrices[size]
                        ? `₹${item.sizePrices[size]}`
                        : extra === 0 ? 'Base price' : `+₹${extra}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Step 2: Crust (pizzas only) */}
          {isPizzaItem && (
          <div>
            {stepHead('02', 'Choose your crust', 'Required')}
            <div className="space-y-2">
              {(['New Hand Tossed', 'Cheese Burst', 'Fresh Pan Pizza', 'Wheat Thin Crust'] as PizzaCrust[]).map(
                (crust) => {
                  const isSelected = selectedCrust === crust;
                  const extra = getCrustModifier(crust, selectedSize);

                  return (
                    <button
                      key={crust}
                      id={`btn-crust-${crust.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setSelectedCrust(crust)}
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-[#C2410C] bg-orange-50 ring-1 ring-[#C2410C] shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-[#C2410C]' : 'border-stone-300'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#C2410C]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-stone-900">
                              {crust}
                            </span>
                            {crust === 'Cheese Burst' && (
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                ⭐ 7 Cheese Favourite
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-500 block">
                            {crust === 'Cheese Burst'
                              ? 'Crust filled with molten cheese blend'
                              : crust === 'New Hand Tossed'
                              ? 'Classic crispy on outside, soft on inside'
                              : crust === 'Fresh Pan Pizza'
                              ? 'Thick & soft golden pan crust'
                              : 'Light & crispy whole wheat crust'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 ml-2 ${extra === 0 ? 'text-emerald-700' : 'text-stone-800'}`}>
                        {extra === 0 ? 'Free' : `+₹${extra}`}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
          )}

          {/* Step 3: Extra cheese — switch (pizzas only) */}
          {isPizzaItem && (
          <div className="bg-white border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-700" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-stone-900 block">
                  Extra 7-cheese layer
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Mozzarella, Cheddar & Gouda · +₹{getCheeseModifier(selectedSize)}
                </span>
              </div>
            </div>
            <button
              id="btn-toggle-extra-cheese"
              role="switch"
              aria-checked={extraCheese}
              onClick={() => setExtraCheese(!extraCheese)}
              className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 cursor-pointer ${
                extraCheese ? 'bg-[#C2410C]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  extraCheese ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          )}

          {/* Step 4: Toppings — chips (pizzas only) */}
          {isPizzaItem && (
          <div>
            {stepHead('03', 'Load your toppings', `${selectedToppings.length} added · optional`)}
            <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 overflow-hidden">
              {AVAILABLE_TOPPINGS.filter(t => item.isVeg ? t.isVeg : true).map((topping) => {
                const isChecked = selectedToppings.some((t) => t.id === topping.id);
                return (
                  <div
                    key={topping.id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors ${
                      isChecked ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 ${topping.isVeg ? 'border-emerald-700' : 'border-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${topping.isVeg ? 'bg-emerald-700' : 'bg-red-700'}`} />
                    </span>
                    <span className="flex-1 min-w-0 text-xs sm:text-sm font-bold text-stone-800 truncate">
                      {topping.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-500 shrink-0">
                      +₹{topping.price}
                    </span>
                    <button
                      id={`btn-topping-${topping.id}`}
                      onClick={() => toggleTopping(topping)}
                      aria-pressed={isChecked}
                      className={`h-7 min-w-16 px-3 rounded-full text-[11px] font-black transition-all cursor-pointer shrink-0 ${
                        isChecked
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-900 text-white hover:bg-stone-700'
                      }`}
                    >
                      {isChecked ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Added
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Plus className="w-3 h-3 stroke-[3]" /> Add
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Assurance strip */}
          <div className="flex items-center justify-center gap-5 text-[11px] font-bold text-stone-500 pb-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Hygienic kitchen
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" /> Baked on order
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Served piping hot
            </span>
          </div>

        </div>

        {/* Bottom sticky CTA */}
        <div className="shrink-0 border-t border-stone-200 bg-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">
              Your build
            </span>
            <span className="text-2xl font-black text-stone-900">
              ₹{totalPrice}
            </span>
          </div>

          <button
            id="btn-confirm-add-customize"
            onClick={handleAdd}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-extrabold px-6 py-3.5 rounded-full shadow-lg shadow-red-900/20 text-sm tracking-wide transition-all cursor-pointer"
          >
            <span>Add to Cart</span>
            <span>•</span>
            <span className="font-mono">₹{totalPrice}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
