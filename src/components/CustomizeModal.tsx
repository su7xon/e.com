import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, ShieldCheck, Flame, Plus } from 'lucide-react';
import { MenuItem, PizzaSize, PizzaCrust, ExtraTopping, CartItem } from '../types';
import { AVAILABLE_TOPPINGS, SIZE_PRICE_MODIFIERS, CRUST_PRICE_MODIFIERS } from '../data/mockData';
import { VegNonVegIcon } from './VegNonVegIcon';

interface CustomizeModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddToCart: (cartItem: CartItem) => void;
}

// Small topping thumbnail with letter-tile fallback (broken URL kabhi blank nahi chhodega)
const ToppingThumb: React.FC<{ topping: ExtraTopping }> = ({ topping }) => {
  const [failed, setFailed] = useState(false);
  if (!topping.image || failed) {
    return (
      <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-black shrink-0">
        {topping.name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={topping.image}
      alt={topping.name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-8 h-8 rounded-lg object-cover shrink-0 bg-amber-50"
    />
  );
};

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmAddToCart,
}) => {
  if (!isOpen || !item) return null;

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

  // Base price for selected size
  const baseSizePrice = item.sizePrices && item.sizePrices[selectedSize]
    ? item.sizePrices[selectedSize]!
    : item.price + (SIZE_PRICE_MODIFIERS[selectedSize] || 0);

  const crustMod = getCrustModifier(selectedCrust, selectedSize);
  const cheeseMod = extraCheese ? getCheeseModifier(selectedSize) : 0;
  const toppingsMod = selectedToppings.reduce((acc, t) => acc + t.price, 0);
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
      size: selectedSize,
      crust: selectedCrust,
      extraCheese,
      extraToppings: selectedToppings,
      quantity: 1,
    };
    onConfirmAddToCart(newCartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="modal-customize-container"
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="relative border-b border-slate-200 p-4 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <VegNonVegIcon isVeg={item.isVeg} size="md" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {item.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Customise your pizza to your taste
              </p>
            </div>
          </div>
          <button
            id="btn-close-customize"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Step 1: Select Size */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                1. Select Size
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Required</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(['Regular', 'Medium', 'Large'] as PizzaSize[]).map((size) => {
                const isSelected = selectedSize === size;
                const extra = SIZE_PRICE_MODIFIERS[size];
                const serving =
                  size === 'Regular'
                    ? 'Serves 1 (4 slices)'
                    : size === 'Medium'
                    ? 'Serves 2 (6 slices)'
                    : 'Serves 4 (8 slices)';

                return (
                  <button
                    key={size}
                    id={`btn-size-${size.toLowerCase()}`}
                    onClick={() => setSelectedSize(size)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#ED1C24] bg-red-50/50 ring-2 ring-[#ED1C24]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`font-black text-xs sm:text-sm ${isSelected ? 'text-[#ED1C24]' : 'text-slate-800'}`}>
                          {size}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#ED1C24]" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                        {serving}
                      </span>
                    </div>
                    <span className="mt-2 text-xs font-mono font-bold text-slate-700">
                      {item.sizePrices && item.sizePrices[size]
                        ? `₹${item.sizePrices[size]}`
                        : extra === 0 ? 'Base price' : `+₹${extra}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Crust */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Select Crust
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Required</span>
            </div>

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
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-[#ED1C24] bg-red-50/50 ring-2 ring-[#ED1C24]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#ED1C24] bg-[#ED1C24]' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-800">
                              {crust}
                            </span>
                            {crust === 'Cheese Burst' && (
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                                ⭐ 7 Cheese Favourite
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
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
                      <span className="text-xs font-mono font-bold text-slate-800 shrink-0 ml-2">
                        {extra === 0 ? 'Free' : `+₹${extra}`}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Step 3: Extra Cheese Add-on */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-sm">
                🧀
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                  Add Extra 7-Cheese Blend Topping
                </span>
                <span className="text-[11px] text-slate-600">
                  Extra layer of Mozzarella, Cheddar & Gouda
                </span>
              </div>
            </div>
            <button
              id="btn-toggle-extra-cheese"
              onClick={() => setExtraCheese(!extraCheese)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                extraCheese
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {extraCheese
                ? `Added (+₹${getCheeseModifier(selectedSize)})`
                : `+ Add ₹${getCheeseModifier(selectedSize)}`}
            </button>
          </div>

          {/* Step 4: Add Extra Toppings */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                3. Add Extra Toppings (Optional)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {selectedToppings.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_TOPPINGS.filter(t => item.isVeg ? t.isVeg : true).map((topping) => {
                const isChecked = selectedToppings.some((t) => t.id === topping.id);
                return (
                  <button
                    key={topping.id}
                    id={`btn-topping-${topping.id}`}
                    onClick={() => toggleTopping(topping)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isChecked
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 ${
                          isChecked ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                      <ToppingThumb topping={topping} />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {topping.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      +₹{topping.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Bottom Sticky CTA */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
              Total Amount
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{totalPrice}
            </span>
          </div>

          <button
            id="btn-confirm-add-customize"
            onClick={handleAdd}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-red-900/20 text-sm tracking-wide transition-all cursor-pointer"
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
