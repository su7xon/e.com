import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { CartItem, ExtraTopping, MenuItem, PizzaCrust, PizzaSize } from '../types';
import { AVAILABLE_TOPPINGS, FREE_TOPPINGS, PIZZA_SAUCES, SAUCE_PRICE } from '../data/mockData';
import { VegNonVegIcon } from './VegNonVegIcon';

interface BuildYourOwnWizardProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (line: CartItem) => void;
  /** Cart line being edited — reopens on the last step with its choices. */
  editingLine?: CartItem | null;
}

const STEPS = ['Size', 'Crust', 'Sauce', 'Toppings', 'Cheese'] as const;
const SIZES: PizzaSize[] = ['Regular', 'Medium', 'Large'];
const CRUSTS: { id: PizzaCrust; desc: string }[] = [
  { id: 'New Hand Tossed', desc: 'Classic crispy on outside, soft on inside' },
  { id: 'Cheese Burst', desc: 'Crust filled with molten cheese blend' },
  { id: 'Thin Crust', desc: 'Light & crispy thin crust' },
];

const crustPrice = (crust: PizzaCrust, size: PizzaSize) =>
  crust === 'Cheese Burst' ? (size === 'Regular' ? 50 : size === 'Medium' ? 80 : 110)
  : crust === 'Thin Crust' ? (size === 'Regular' ? 30 : size === 'Medium' ? 40 : 70)
  : 0;
const cheesePrice = (size: PizzaSize) => (size === 'Regular' ? 49 : size === 'Medium' ? 69 : 99);
const sauceCost = (name: string) => (PIZZA_SAUCES.find((s) => s.name === name)?.free ? 0 : SAUCE_PRICE);

/** "Make your own pizza" — one window per step: Size → Crust → Sauce → Toppings → Cheese. */
export const BuildYourOwnWizard: React.FC<BuildYourOwnWizardProps> = ({ item, isOpen, onClose, onConfirm, editingLine = null }) => {
  const [step, setStep] = useState(0);
  const [size, setSize] = useState<PizzaSize>('Regular');
  const [crust, setCrust] = useState<PizzaCrust>('New Hand Tossed');
  const [sauce, setSauce] = useState(PIZZA_SAUCES[0].name);
  // Toppings in the order picked — the first FREE_TOPPINGS are free.
  const [picked, setPicked] = useState<ExtraTopping[]>([]);
  const [extraCheese, setExtraCheese] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(Date.now());

  useEffect(() => {
    if (!isOpen || !item) return;
    openedAt.current = Date.now();
    if (editingLine && editingLine.productId === item.id) {
      setSize(editingLine.size || 'Regular');
      setCrust(editingLine.crust || 'New Hand Tossed');
      setSauce(editingLine.sauce || PIZZA_SAUCES[0].name);
      setPicked(
        (editingLine.extraToppings || []).map((t) => AVAILABLE_TOPPINGS.find((a) => a.id === t.id) || t),
      );
      setExtraCheese(editingLine.extraCheese);
      setStep(STEPS.length - 1);
    } else {
      setSize(item.defaultSize || 'Regular');
      setCrust(item.defaultCrust || 'New Hand Tossed');
      setSauce(PIZZA_SAUCES[0].name);
      setPicked([]);
      setExtraCheese(false);
      setStep(0);
    }
  }, [isOpen, item, editingLine]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const basePrice = (s: PizzaSize) => item?.sizePrices?.[s] ?? item?.price ?? 0;
  const toppingCharge = (index: number, t: ExtraTopping) => (index < FREE_TOPPINGS ? 0 : t.price);
  const toppingsTotal = picked.reduce((sum, t, i) => sum + toppingCharge(i, t), 0);
  const total = basePrice(size) + crustPrice(crust, size) + sauceCost(sauce) + toppingsTotal + (extraCheese ? cheesePrice(size) : 0);
  const isVeg = !!item?.isVeg && !picked.some((t) => !t.isVeg);
  const freeLeft = Math.max(0, FREE_TOPPINGS - picked.length);

  const summary = useMemo(
    () =>
      [size, crust, sauce, picked.length ? `${picked.length} topping${picked.length > 1 ? 's' : ''}` : null, extraCheese ? 'Extra cheese' : null]
        .filter(Boolean)
        .join(' • '),
    [size, crust, sauce, picked.length, extraCheese],
  );

  if (!isOpen || !item) return null;

  const toggleTopping = (t: ExtraTopping) =>
    setPicked((prev) => (prev.some((p) => p.id === t.id) ? prev.filter((p) => p.id !== t.id) : [...prev, t]));

  const finish = () => {
    if (Date.now() - openedAt.current < 700) return;
    onConfirm({
      cartItemId: editingLine?.cartItemId ?? `${item.id}-${Date.now()}`,
      productId: item.id,
      name: item.name,
      isVeg,
      image: item.image,
      basePrice: basePrice(size),
      price: total,
      size,
      crust,
      sauce,
      extraCheese,
      // Price stored per topping as charged (0 for the free ones) so bills add up.
      extraToppings: picked.map((t, i) => ({ ...t, price: toppingCharge(i, t) })),
      quantity: editingLine?.quantity ?? 1,
    });
    onClose();
  };

  const card = (selected: boolean) =>
    `w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all text-left cursor-pointer ${
      selected ? 'border-[#C2410C] bg-orange-50 ring-1 ring-[#C2410C] shadow-xs' : 'border-stone-200 bg-white hover:border-stone-300'
    }`;
  const radio = (selected: boolean) => (
    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-[#C2410C]' : 'border-stone-300'}`}>
      {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#C2410C]" />}
    </span>
  );
  const priceTag = (n: number, freeText = 'Free') => (
    <span className={`text-xs font-mono font-bold shrink-0 ${n === 0 ? 'text-emerald-700' : 'text-stone-800'}`}>{n === 0 ? freeText : `+₹${n}`}</span>
  );

  const toppingRow = (t: ExtraTopping) => {
    const idx = picked.findIndex((p) => p.id === t.id);
    const isOn = idx >= 0;
    const charge = isOn ? toppingCharge(idx, t) : freeLeft > 0 ? 0 : t.price;
    return (
      <div key={t.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${isOn ? 'bg-emerald-50/60' : ''}`}>
        <VegNonVegIcon isVeg={t.isVeg} size="sm" />
        <span className="flex-1 min-w-0 text-sm font-bold text-stone-800 truncate">{t.name}</span>
        <span className={`text-xs font-mono font-bold shrink-0 ${charge === 0 ? 'text-emerald-700' : 'text-stone-500'}`}>{charge === 0 ? 'Free' : `+₹${charge}`}</span>
        <button
          id={`btn-wiz-topping-${t.id}`}
          onClick={() => toggleTopping(t)}
          aria-pressed={isOn}
          className={`h-8 min-w-[72px] px-3 rounded-full text-xs font-black cursor-pointer shrink-0 ${isOn ? 'bg-emerald-700 text-white' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
        >
          {isOn ? (
            <span className="flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5 stroke-[3]" /> Added</span>
          ) : (
            <span className="flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5 stroke-[3]" /> Add</span>
          )}
        </button>
      </div>
    );
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-label="Make your own pizza" className="bg-[#FDFBF7] w-full sm:max-w-lg h-[100dvh] sm:h-[min(760px,92vh)] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header + progress */}
        <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-stone-200 bg-[#FAF7F0]">
          <div className="flex items-center gap-3">
            <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <VegNonVegIcon isVeg={isVeg} size="sm" />
                <h2 className="font-display text-lg font-bold text-stone-900 truncate">{item.name}</h2>
              </div>
              <p className="text-[11px] text-stone-500 truncate">{summary}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => i < step && setStep(i)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#C2410C]' : 'bg-stone-200'} ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
                tabIndex={-1}
              />
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-black text-stone-900">
              <span className="text-[#C2410C]">Step {step + 1} of {STEPS.length}</span> · {STEP_TITLES[step]}
            </span>
            <span className="text-[11px] text-stone-400 font-medium">{STEP_HINTS[step]}</span>
          </div>
        </div>

        {/* Step body */}
        <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
          {step === 0 && (
            <div className="grid grid-cols-3 gap-2.5">
              {SIZES.map((s) => {
                const sel = size === s;
                const slices = s === 'Regular' ? 4 : s === 'Medium' ? 6 : 8;
                const circle = s === 'Regular' ? 'w-12 h-12' : s === 'Medium' ? 'w-16 h-16' : 'w-20 h-20';
                return (
                  <button key={s} id={`btn-wiz-size-${s.toLowerCase()}`} onClick={() => setSize(s)} className={`rounded-2xl border p-3 flex flex-col items-center gap-1 cursor-pointer ${sel ? 'border-[#C2410C] bg-orange-50 ring-1 ring-[#C2410C]' : 'border-stone-200 bg-white'}`}>
                    <span className="h-20 flex items-center justify-center">
                      <span className={`${circle} relative block rounded-full overflow-hidden border-2 ${sel ? 'border-[#C2410C]' : 'border-stone-200 opacity-80'}`}>
                        <img src={item.image} alt="" className="w-full h-full object-cover scale-125" />
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                          {Array.from({ length: slices / 2 }, (_, i) => (
                            <line key={i} x1="50" y1="0" x2="50" y2="100" stroke="white" strokeOpacity="0.85" strokeWidth="2.5" transform={`rotate(${(180 / (slices / 2)) * i} 50 50)`} />
                          ))}
                        </svg>
                      </span>
                    </span>
                    <span className={`text-sm font-black ${sel ? 'text-[#9A3412]' : 'text-stone-800'}`}>{s}</span>
                    <span className="text-[11px] text-stone-500">Serves {s === 'Regular' ? 1 : s === 'Medium' ? 2 : 4} · {slices} slices</span>
                    <span className="text-xs font-mono font-bold text-stone-700">₹{basePrice(s)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2.5">
              {CRUSTS.map((c) => (
                <button key={c.id} id={`btn-wiz-crust-${c.id.replace(/\s+/g, '-').toLowerCase()}`} onClick={() => setCrust(c.id)} className={card(crust === c.id)}>
                  <span className="flex items-center gap-3">
                    {radio(crust === c.id)}
                    <span>
                      <span className="text-sm font-bold text-stone-900 block">{c.id}</span>
                      <span className="text-[11px] text-stone-500 block">{c.desc}</span>
                    </span>
                  </span>
                  {priceTag(crustPrice(c.id, size))}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (() => {
            const sauceRow = (s: (typeof PIZZA_SAUCES)[number]) => (
              <button key={s.id} id={`btn-wiz-sauce-${s.id}`} onClick={() => setSauce(s.name)} className={card(sauce === s.name)}>
                <span className="flex items-center gap-3">
                  {radio(sauce === s.name)}
                  <span>
                    <span className="text-sm font-bold text-stone-900 block">{s.name}</span>
                    <span className="text-[11px] text-stone-500 block">{s.desc}</span>
                  </span>
                </span>
                {s.free && <span className="text-xs font-bold text-emerald-700 shrink-0">Included</span>}
              </button>
            );
            return (
              <div className="space-y-2.5">
                {PIZZA_SAUCES.filter((s) => s.free).map(sauceRow)}
                <div className="pt-3 flex items-baseline justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-600">Special sauces</span>
                  <span className="text-xs font-bold text-stone-500">+{SAUCE_PRICE} each</span>
                </div>
                {PIZZA_SAUCES.filter((s) => !s.free).map(sauceRow)}
              </div>
            );
          })()}

          {step === 3 && (
            <div className="space-y-4">
              <div className={`rounded-xl px-3 py-2 text-xs font-bold ${freeLeft > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {freeLeft > 0
                  ? `${picked.length} of ${FREE_TOPPINGS} free toppings used — ${freeLeft} more free`
                  : `All ${FREE_TOPPINGS} free toppings used — more toppings are charged`}
              </div>
              {[
                { key: 'veg', title: 'Veg toppings', list: AVAILABLE_TOPPINGS.filter((t) => t.isVeg) },
                { key: 'nonveg', title: 'Non-veg toppings', list: AVAILABLE_TOPPINGS.filter((t) => !t.isVeg) },
              ].map((g) => (
                <div key={g.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <VegNonVegIcon isVeg={g.key === 'veg'} size="sm" />
                    <span className="text-xs font-black uppercase tracking-wider text-stone-600">{g.title}</span>
                  </div>
                  <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 overflow-hidden">{g.list.map(toppingRow)}</div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2.5">
              {[
                { on: false, title: 'Normal cheese', desc: 'Our regular mozzarella layer', price: 0 },
                { on: true, title: 'Extra cheese', desc: 'Double the cheese, extra stretchy', price: cheesePrice(size) },
              ].map((o) => (
                <button key={o.title} id={o.on ? 'btn-wiz-cheese-extra' : 'btn-wiz-cheese-normal'} onClick={() => setExtraCheese(o.on)} className={card(extraCheese === o.on)}>
                  <span className="flex items-center gap-3">
                    {radio(extraCheese === o.on)}
                    <span>
                      <span className="text-sm font-bold text-stone-900 block">{o.title}</span>
                      <span className="text-[11px] text-stone-500 block">{o.desc}</span>
                    </span>
                  </span>
                  {priceTag(o.price, 'Included')}
                </button>
              ))}

              {/* Recap */}
              <div className="mt-4 rounded-2xl bg-white border border-stone-200 p-3.5 text-xs text-stone-700 space-y-1">
                <div className="font-black text-stone-900 text-sm mb-1">Your pizza</div>
                <div className="flex justify-between"><span>{size} base</span><span className="font-mono">₹{basePrice(size)}</span></div>
                <div className="flex justify-between"><span>{crust}</span><span className="font-mono">{crustPrice(crust, size) ? `+₹${crustPrice(crust, size)}` : 'Free'}</span></div>
                <div className="flex justify-between"><span>{sauce}</span><span className="font-mono">{sauceCost(sauce) ? `+₹${sauceCost(sauce)}` : 'Included'}</span></div>
                <div className="flex justify-between gap-3"><span className="truncate">{picked.length ? picked.map((t) => t.name).join(', ') : 'No toppings'}</span><span className="font-mono shrink-0">{toppingsTotal ? `+₹${toppingsTotal}` : 'Free'}</span></div>
                <div className="flex justify-between"><span>{extraCheese ? 'Extra cheese' : 'Normal cheese'}</span><span className="font-mono">{extraCheese ? `+₹${cheesePrice(size)}` : 'Included'}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-stone-200 bg-white px-4 sm:px-6 py-3.5 flex items-center gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-3 rounded-full border border-stone-300 text-sm font-bold text-stone-700 cursor-pointer shrink-0">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div className="shrink-0">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider font-bold block">Your build</span>
              <span className="text-xl font-black text-stone-900">₹{total}</span>
            </div>
          )}
          <button
            id="btn-wiz-next"
            onClick={() => (isLast ? finish() : setStep(step + 1))}
            className="flex-1 flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-extrabold px-5 py-3.5 rounded-full shadow-lg shadow-red-900/20 text-sm cursor-pointer"
          >
            {isLast ? (
              <span>{editingLine ? 'Update Item' : 'Add to Cart'} • ₹{total}</span>
            ) : (
              <>
                <span>Next</span>
                <span className="font-mono opacity-80">· ₹{total}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const STEP_TITLES = ['Pick your size', 'Choose your crust', 'Choose your sauce', 'Add toppings', 'Choose your cheese'];
const STEP_HINTS = ['Required', 'Required', 'Tomato is free', `First ${FREE_TOPPINGS} free`, 'Required'];
