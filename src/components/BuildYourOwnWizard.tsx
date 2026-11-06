import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { X, Check, ArrowLeft, ArrowRight, Plus, ChefHat, Flame, Sparkles, Star, Trophy, Pizza } from 'lucide-react';
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

const STEPS = ['Size', 'Crust', 'Sauce', 'Toppings', 'Cheese', 'Bake'] as const;
const SIZES: PizzaSize[] = ['Regular', 'Medium', 'Large'];
const CRUSTS: { id: PizzaCrust; desc: string; emoji: string }[] = [
  { id: 'New Hand Tossed', desc: 'Classic crispy on outside, soft on inside', emoji: '🫓' },
  { id: 'Cheese Burst', desc: 'Crust filled with molten cheese blend', emoji: '🧀' },
  { id: 'Thin Crust', desc: 'Light & crispy thin crust', emoji: '🥖' },
];

const crustPrice = (crust: PizzaCrust, size: PizzaSize) =>
  crust === 'Cheese Burst' ? (size === 'Regular' ? 50 : size === 'Medium' ? 80 : 110)
  : crust === 'Thin Crust' ? (size === 'Regular' ? 30 : size === 'Medium' ? 40 : 70)
  : 0;
const cheesePrice = (size: PizzaSize) => (size === 'Regular' ? 49 : size === 'Medium' ? 69 : 99);
const sauceCost = (name: string) => (PIZZA_SAUCES.find((s) => s.name === name)?.free ? 0 : SAUCE_PRICE);

/* ─── Floating particle component ─── */
const FloatingParticle: React.FC<{ emoji: string; delay: number; x: number }> = ({ emoji, delay, x }) => (
  <span
    className="absolute text-lg pointer-events-none select-none"
    style={{
      left: `${x}%`,
      bottom: '-10px',
      animation: `floatUp 2s ease-out ${delay}s forwards`,
      opacity: 0,
    }}
  >
    {emoji}
  </span>
);

/* ─── XP / Progress bar ─── */
const XPBar: React.FC<{ step: number; total: number }> = ({ step, total }) => {
  const xp = Math.round(((step + 1) / total) * 100);
  const level = step < 2 ? 'Apprentice' : step < 4 ? 'Pizza Artisan' : 'Master Chef';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
          <ChefHat className="w-3.5 h-3.5" />
          {level}
        </span>
        <span className="text-[11px] font-mono font-bold text-amber-600">{xp} XP</span>
      </div>
      <div className="w-full h-2 rounded-full bg-stone-200/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${xp}%`,
            background: 'linear-gradient(90deg, #f59e0b, #ea580c, #dc2626)',
          }}
        />
      </div>
    </div>
  );
};

/* ─── Achievement badge popup ─── */
const AchievementBadge: React.FC<{ text: string; emoji: string; show: boolean }> = ({ text, emoji, show }) => {
  if (!show) return null;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-[badgePop_0.5s_ease-out]">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-full shadow-lg shadow-orange-500/30 flex items-center gap-2 whitespace-nowrap">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-black">{text}</span>
        <Trophy className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

/* ─── Oven baking animation ─── */
const OvenAnimation: React.FC<{
  pizzaImage: string;
  onComplete: () => void;
  size: PizzaSize;
  toppings: ExtraTopping[];
  extraCheese: boolean;
  sauce: string;
}> = ({ pizzaImage, onComplete, size, toppings, extraCheese, sauce }) => {
  const [phase, setPhase] = useState<'sliding-in' | 'baking' | 'done'>('sliding-in');
  const [heatLevel, setHeatLevel] = useState(0);
  const [showSteam, setShowSteam] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('baking'), 800);
    const t2 = setTimeout(() => setHeatLevel(33), 1200);
    const t3 = setTimeout(() => setHeatLevel(66), 2200);
    const t4 = setTimeout(() => setHeatLevel(100), 3200);
    const t5 = setTimeout(() => setShowSteam(true), 3500);
    const t6 = setTimeout(() => setPhase('done'), 4000);
    const t7 = setTimeout(() => onComplete(), 4800);
    return () => [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
  }, [onComplete]);

  const sizeScale = size === 'Regular' ? 0.6 : size === 'Medium' ? 0.75 : 0.9;

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      {/* Oven body */}
      <div className="relative w-72 h-56 sm:w-80 sm:h-64">
        {/* Oven background */}
        <div
          className="absolute inset-0 rounded-3xl border-4 overflow-hidden"
          style={{
            borderColor: phase === 'baking' ? '#dc2626' : '#78716c',
            background: `linear-gradient(180deg, 
              ${phase === 'baking' ? `rgba(220,38,38,${0.1 + heatLevel * 0.004})` : 'rgba(28,25,23,0.95)'} 0%,
              rgba(28,25,23,0.98) 100%)`,
            transition: 'all 0.5s ease',
            boxShadow: phase === 'baking'
              ? `0 0 ${20 + heatLevel * 0.5}px rgba(220,38,38,${0.2 + heatLevel * 0.005}), inset 0 0 ${30 + heatLevel}px rgba(220,38,38,${0.1 + heatLevel * 0.003})`
              : 'none',
          }}
        >
          {/* Oven rack lines */}
          <div className="absolute bottom-8 left-4 right-4 h-[2px] bg-stone-600/50 rounded-full" />
          <div className="absolute bottom-12 left-6 right-6 h-[2px] bg-stone-600/30 rounded-full" />

          {/* Heat glow at bottom */}
          {phase === 'baking' && (
            <div
              className="absolute bottom-0 left-0 right-0 h-16"
              style={{
                background: `linear-gradient(0deg, rgba(220,38,38,${heatLevel * 0.008}), transparent)`,
                transition: 'all 0.5s ease',
              }}
            />
          )}

          {/* Flame emojis */}
          {phase === 'baking' && (
            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-3 text-xl">
              {['🔥', '🔥', '🔥', '🔥', '🔥'].map((f, i) => (
                <span
                  key={i}
                  className="inline-block"
                  style={{
                    animation: `flicker ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
                    opacity: Math.min(1, heatLevel / 50),
                    transform: `scale(${0.7 + (heatLevel / 100) * 0.5})`,
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Pizza inside oven */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(-50%, -50%) scale(${sizeScale}) ${
                phase === 'sliding-in' ? 'translateY(200px)' : 'translateY(0)'
              }`,
              transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-amber-800/50">
              <img src={pizzaImage} alt="" className="w-full h-full object-cover" />
              {/* Melting cheese overlay */}
              {phase === 'baking' && heatLevel > 50 && (
                <div
                  className="absolute inset-0 bg-gradient-to-b from-amber-400/0 via-amber-400/20 to-amber-500/40 rounded-full"
                  style={{ opacity: heatLevel / 100, transition: 'opacity 0.5s' }}
                />
              )}
            </div>
            {/* Topping icons floating around the pizza */}
            {toppings.slice(0, 4).map((t, i) => (
              <span
                key={t.id}
                className="absolute text-xs bg-white/90 rounded-full px-1 shadow-sm"
                style={{
                  top: `${20 + Math.sin(i * 1.5) * 30}%`,
                  left: `${20 + Math.cos(i * 1.5) * 35}%`,
                  opacity: phase === 'baking' && heatLevel > 30 ? 0 : 0.8,
                  transition: 'opacity 1s',
                  fontSize: '10px',
                }}
              >
                {t.isVeg ? '🟢' : '🔴'}
              </span>
            ))}
          </div>

          {/* Steam */}
          {showSteam && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-3">
              {[0, 0.2, 0.4].map((d, i) => (
                <span
                  key={i}
                  className="text-2xl"
                  style={{
                    animation: `steamRise 1.5s ease-out ${d}s infinite`,
                    opacity: 0,
                  }}
                >
                  ♨️
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Oven door handle */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-stone-400 rounded-full shadow-md" />

        {/* Temperature display */}
        <div
          className="absolute -top-1 -right-1 bg-stone-900 border-2 rounded-xl px-2.5 py-1 flex items-center gap-1.5"
          style={{
            borderColor: heatLevel > 70 ? '#dc2626' : '#78716c',
            transition: 'border-color 0.3s',
          }}
        >
          <Flame className="w-3.5 h-3.5" style={{ color: heatLevel > 70 ? '#dc2626' : '#a8a29e' }} />
          <span
            className="text-xs font-mono font-black"
            style={{ color: heatLevel > 70 ? '#fbbf24' : '#a8a29e', transition: 'color 0.3s' }}
          >
            {Math.round(180 + heatLevel * 1.2)}°C
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="mt-6 text-center">
        <div className="text-lg font-black text-stone-900 flex items-center justify-center gap-2">
          {phase === 'sliding-in' && (
            <>
              <Pizza className="w-5 h-5 text-orange-600 animate-bounce" />
              Sliding into the oven...
            </>
          )}
          {phase === 'baking' && (
            <>
              <Flame className="w-5 h-5 text-red-600" style={{ animation: 'flicker 0.3s ease-in-out infinite alternate' }} />
              {heatLevel < 50 ? 'Heating up...' : heatLevel < 80 ? 'Cheese is melting! 🤤' : 'Almost done! 🍕'}
            </>
          )}
          {phase === 'done' && (
            <>
              <Sparkles className="w-5 h-5 text-amber-500" />
              Your pizza is ready! 🎉
            </>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-1">
          {phase === 'baking'
            ? `${sauce} sauce • ${toppings.length} topping${toppings.length !== 1 ? 's' : ''} • ${extraCheese ? 'Extra cheese' : 'Regular cheese'}`
            : phase === 'done'
            ? 'Perfectly baked to golden perfection'
            : 'Preparing your masterpiece...'}
        </p>
      </div>

      {/* Baking progress bar */}
      <div className="mt-4 w-56">
        <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${phase === 'done' ? 100 : heatLevel}%`,
              background: heatLevel > 70
                ? 'linear-gradient(90deg, #f59e0b, #dc2626)'
                : 'linear-gradient(90deg, #fbbf24, #f97316)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-stone-400">RAW</span>
          <span className="text-[10px] text-stone-400">PERFECT 🤌</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Visual Pizza Preview (builds up as you pick ingredients) ─── */
const PizzaPreview: React.FC<{
  image: string;
  size: PizzaSize;
  crust: PizzaCrust;
  sauce: string;
  toppings: ExtraTopping[];
  extraCheese: boolean;
  step: number;
}> = ({ image, size, crust, sauce, toppings, extraCheese, step }) => {
  const scale = size === 'Regular' ? 0.7 : size === 'Medium' ? 0.85 : 1;
  const sauceColor =
    sauce.includes('Tomato') ? 'rgba(220,38,38,0.25)' :
    sauce.includes('Schezwan') ? 'rgba(185,28,28,0.3)' :
    sauce.includes('Makhani') ? 'rgba(234,179,8,0.25)' :
    sauce.includes('Barbeque') ? 'rgba(120,53,15,0.25)' :
    sauce.includes('Peri') ? 'rgba(239,68,68,0.3)' :
    'rgba(234,88,12,0.2)';

  return (
    <div className="relative flex items-center justify-center" style={{ height: '110px' }}>
      <div
        className="relative transition-transform duration-500 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Pizza base */}
        <div
          className="w-24 h-24 rounded-full overflow-hidden border-[3px] shadow-lg relative"
          style={{
            borderColor: crust === 'Cheese Burst' ? '#fbbf24' : crust === 'Thin Crust' ? '#d6d3d1' : '#a16207',
            boxShadow: crust === 'Cheese Burst'
              ? '0 0 12px rgba(251,191,36,0.4), inset 0 0 8px rgba(251,191,36,0.2)'
              : '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <img src={image} alt="" className="w-full h-full object-cover" />

          {/* Sauce overlay */}
          {step >= 2 && (
            <div
              className="absolute inset-0 rounded-full transition-opacity duration-500"
              style={{ background: sauceColor, opacity: step >= 2 ? 1 : 0 }}
            />
          )}

          {/* Cheese overlay */}
          {step >= 4 && extraCheese && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/30 via-transparent to-yellow-400/20" />
          )}
        </div>

        {/* Topping dots orbiting */}
        {step >= 3 && toppings.slice(0, 6).map((t, i) => {
          const angle = (i / Math.min(6, toppings.length)) * Math.PI * 2;
          const r = 44;
          return (
            <div
              key={t.id}
              className="absolute w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm"
              style={{
                left: `${50 + Math.cos(angle) * r - 10}px`,
                top: `${48 + Math.sin(angle) * r - 10}px`,
                background: t.isVeg ? '#dcfce7' : '#fef2f2',
                border: `1.5px solid ${t.isVeg ? '#86efac' : '#fca5a5'}`,
                animation: `popIn 0.3s ease-out ${i * 0.1}s both`,
              }}
            >
              {t.isVeg ? '🌿' : '🍗'}
            </div>
          );
        })}

        {/* Cheese burst ring */}
        {crust === 'Cheese Burst' && (
          <div
            className="absolute -inset-1 rounded-full border-2 border-dashed border-yellow-400/60"
            style={{ animation: 'spin 8s linear infinite' }}
          />
        )}
      </div>
    </div>
  );
};


/** Gamified "Make your own pizza" — Size → Crust → Sauce → Toppings → Cheese → BAKE 🔥 */
export const BuildYourOwnWizard: React.FC<BuildYourOwnWizardProps> = ({ item, isOpen, onClose, onConfirm, editingLine = null }) => {
  const [step, setStep] = useState(0);
  const [size, setSize] = useState<PizzaSize>('Regular');
  const [crust, setCrust] = useState<PizzaCrust>('New Hand Tossed');
  const [sauce, setSauce] = useState(PIZZA_SAUCES[0].name);
  const [picked, setPicked] = useState<ExtraTopping[]>([]);
  const [extraCheese, setExtraCheese] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(Date.now());
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);
  const [achievement, setAchievement] = useState<{ text: string; emoji: string } | null>(null);
  const [bakeComplete, setBakeComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    openedAt.current = Date.now();
    setBakeComplete(false);
    setShowConfetti(false);
    setAchievement(null);
    if (editingLine && editingLine.productId === item.id) {
      setSize(editingLine.size || 'Regular');
      setCrust(editingLine.crust || 'New Hand Tossed');
      setSauce(editingLine.sauce || PIZZA_SAUCES[0].name);
      setPicked(
        (editingLine.extraToppings || []).map((t) => AVAILABLE_TOPPINGS.find((a) => a.id === t.id) || t),
      );
      setExtraCheese(editingLine.extraCheese);
      setStep(4); // Go to cheese step (before bake)
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

  // Achievements
  useEffect(() => {
    if (step === 1) {
      setAchievement({ text: 'Base Selected!', emoji: '🎯' });
      setTimeout(() => setAchievement(null), 2000);
    } else if (step === 3 && picked.length === 0) {
      // Will trigger when reaching toppings
    } else if (step === 4) {
      setAchievement({ text: 'Toppings Master!', emoji: '🧑‍🍳' });
      setTimeout(() => setAchievement(null), 2000);
    }
  }, [step]);

  // Particle burst when picking toppings
  const spawnParticles = useCallback((emoji: string) => {
    const newP = Array.from({ length: 4 }, (_, i) => ({
      id: Date.now() + i,
      emoji,
      x: 30 + Math.random() * 40,
      delay: i * 0.1,
    }));
    setParticles((p) => [...p, ...newP]);
    setTimeout(() => setParticles((p) => p.filter((pp) => !newP.find((np) => np.id === pp.id))), 3000);
  }, []);

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

  const toggleTopping = (t: ExtraTopping) => {
    const isOn = picked.some((p) => p.id === t.id);
    if (isOn) {
      setPicked((prev) => prev.filter((p) => p.id !== t.id));
    } else {
      setPicked((prev) => [...prev, t]);
      spawnParticles(t.isVeg ? '🌿' : '🍗');
      // Achievement for max free toppings
      if (freeLeft === 1) {
        setTimeout(() => {
          setAchievement({ text: 'All Free Toppings Used!', emoji: '🎁' });
          setTimeout(() => setAchievement(null), 2000);
        }, 300);
      }
    }
  };

  const handleBakeComplete = useCallback(() => {
    setBakeComplete(true);
    setShowConfetti(true);
    setAchievement({ text: 'Pizza Baked to Perfection!', emoji: '🏆' });
    setTimeout(() => setAchievement(null), 3000);
  }, []);

  const finish = () => {
    if (Date.now() - openedAt.current < 700) return;
    if (!item) return;
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
      extraToppings: picked.map((t, i) => ({ ...t, price: toppingCharge(i, t) })),
      quantity: editingLine?.quantity ?? 1,
    });
    onClose();
  };

  const card = (selected: boolean) =>
    `w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all text-left cursor-pointer ${
      selected ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 ring-2 ring-orange-400/50 shadow-md shadow-orange-100' : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
    }`;
  const radio = (selected: boolean) => (
    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${selected ? 'border-orange-500 bg-orange-500 scale-110' : 'border-stone-300'}`}>
      {selected && <Check className="w-3 h-3 text-white stroke-[3]" />}
    </span>
  );
  const priceTag = (n: number, freeText = 'Free') => (
    <span className={`text-xs font-mono font-bold shrink-0 px-2 py-0.5 rounded-full ${n === 0 ? 'text-emerald-700 bg-emerald-50' : 'text-stone-800 bg-stone-100'}`}>{n === 0 ? freeText : `+₹${n}`}</span>
  );

  if (!isOpen || !item) return null;

  const toppingRow = (t: ExtraTopping) => {
    const idx = picked.findIndex((p) => p.id === t.id);
    const isOn = idx >= 0;
    const charge = isOn ? toppingCharge(idx, t) : freeLeft > 0 ? 0 : t.price;
    return (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-3.5 py-2.5 transition-all duration-200 ${isOn ? 'bg-gradient-to-r from-emerald-50/80 to-green-50/60' : 'hover:bg-stone-50'}`}
      >
        <VegNonVegIcon isVeg={t.isVeg} size="sm" />
        <span className="flex-1 min-w-0 text-sm font-bold text-stone-800 truncate">{t.name}</span>
        <span className={`text-xs font-mono font-bold shrink-0 px-1.5 py-0.5 rounded-full ${charge === 0 ? 'text-emerald-700 bg-emerald-50' : 'text-stone-500 bg-stone-50'}`}>
          {charge === 0 ? 'Free' : `+₹${charge}`}
        </span>
        <button
          id={`btn-wiz-topping-${t.id}`}
          onClick={() => toggleTopping(t)}
          aria-pressed={isOn}
          className={`h-8 min-w-[72px] px-3 rounded-full text-xs font-black cursor-pointer shrink-0 transition-all duration-200 ${
            isOn
              ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-200 scale-105'
              : 'bg-stone-900 text-white hover:bg-stone-700 hover:scale-105'
          }`}
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

  const isBakeStep = step === 5;
  const isLast = step === STEPS.length - 1;

  const STEP_TITLES = [
    '🍕 Pick your size',
    '🫓 Choose your crust',
    '🫙 Choose your sauce',
    '🧑‍🍳 Add toppings',
    '🧀 Choose your cheese',
    '🔥 Bake your pizza!',
  ];
  const STEP_HINTS = [
    'Required',
    'Required',
    'Tomato is free',
    `First ${FREE_TOPPINGS} free`,
    'Required',
    'Watch the magic!',
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Keyframe styles */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.5); }
        }
        @keyframes badgePop {
          0% { transform: translate(-50%, -20px) scale(0.5); opacity: 0; }
          60% { transform: translate(-50%, 0) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flicker {
          0% { transform: scaleY(1) scaleX(1); }
          100% { transform: scaleY(1.15) scaleX(0.92); }
        }
        @keyframes steamRise {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          30% { opacity: 0.8; transform: translateY(-15px) scale(0.8); }
          100% { opacity: 0; transform: translateY(-45px) scale(1.2); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(234,88,12,0.3); }
          50% { box-shadow: 0 0 25px rgba(234,88,12,0.5); }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Make your own pizza"
        className="bg-[#FDFBF7] w-full sm:max-w-lg h-[100dvh] sm:h-[min(800px,94vh)] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Achievement popup */}
        <AchievementBadge text={achievement?.text || ''} emoji={achievement?.emoji || ''} show={!!achievement} />

        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {Array.from({ length: 20 }, (_, i) => (
              <span
                key={i}
                className="absolute text-lg"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  animation: `confettiFall ${1.5 + Math.random()}s ease-out ${Math.random() * 0.5}s forwards`,
                }}
              >
                {['🎉', '🍕', '✨', '🧀', '🌟', '🔥'][i % 6]}
              </span>
            ))}
          </div>
        )}

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {particles.map((p) => (
            <FloatingParticle key={p.id} emoji={p.emoji} delay={p.delay} x={p.x} />
          ))}
        </div>

        {/* Header */}
        <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-stone-200/80 bg-gradient-to-b from-[#FAF7F0] to-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={item.image}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 text-sm">🍕</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <VegNonVegIcon isVeg={isVeg} size="sm" />
                <h2 className="font-display text-lg font-bold text-stone-900 truncate">{item.name}</h2>
              </div>
              <p className="text-[11px] text-stone-500 truncate">{summary}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center cursor-pointer shrink-0 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-3">
            <XPBar step={step} total={STEPS.length} />
          </div>

          {/* Step pills */}
          <div className="mt-2.5 flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => i < step && !isBakeStep && setStep(i)}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? 'bg-gradient-to-r from-orange-500 to-amber-500 cursor-pointer' :
                  i === step ? 'bg-orange-500 cursor-default' :
                  'bg-stone-200 cursor-default'
                }`}
                style={i === step ? { animation: 'pulse-glow 2s ease-in-out infinite' } : {}}
                tabIndex={-1}
              />
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-black text-stone-900">
              <span className="text-orange-600">Step {step + 1} of {STEPS.length}</span> · {STEP_TITLES[step]}
            </span>
            <span className="text-[11px] text-stone-400 font-medium">{STEP_HINTS[step]}</span>
          </div>
        </div>

        {/* Pizza Preview (show on steps 0-4, not on bake) */}
        {!isBakeStep && (
          <div className="shrink-0 bg-gradient-to-b from-amber-50/50 to-transparent px-4 py-2 border-b border-stone-100">
            <PizzaPreview
              image={item.image}
              size={size}
              crust={crust}
              sauce={sauce}
              toppings={picked}
              extraCheese={extraCheese}
              step={step}
            />
          </div>
        )}

        {/* Step body */}
        <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
          {/* Step 0: Size */}
          {step === 0 && (
            <div className="grid grid-cols-3 gap-2.5">
              {SIZES.map((s) => {
                const sel = size === s;
                const slices = s === 'Regular' ? 4 : s === 'Medium' ? 6 : 8;
                const circle = s === 'Regular' ? 'w-12 h-12' : s === 'Medium' ? 'w-16 h-16' : 'w-20 h-20';
                const sizeEmoji = s === 'Regular' ? '🤏' : s === 'Medium' ? '👌' : '🤩';
                return (
                  <button
                    key={s}
                    id={`btn-wiz-size-${s.toLowerCase()}`}
                    onClick={() => setSize(s)}
                    className={`rounded-2xl border p-3 flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 ${
                      sel
                        ? 'border-orange-500 bg-gradient-to-b from-orange-50 to-amber-50 ring-2 ring-orange-400/50 shadow-lg shadow-orange-100 scale-105'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-2xl mb-1">{sizeEmoji}</span>
                    <span className="h-20 flex items-center justify-center">
                      <span className={`${circle} relative block rounded-full overflow-hidden border-2 transition-all duration-300 ${sel ? 'border-orange-500' : 'border-stone-200 opacity-80'}`}>
                        <img src={item.image} alt="" className="w-full h-full object-cover scale-125" />
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                          {Array.from({ length: slices / 2 }, (_, i) => (
                            <line key={i} x1="50" y1="0" x2="50" y2="100" stroke="white" strokeOpacity="0.85" strokeWidth="2.5" transform={`rotate(${(180 / (slices / 2)) * i} 50 50)`} />
                          ))}
                        </svg>
                      </span>
                    </span>
                    <span className={`text-sm font-black transition-colors ${sel ? 'text-orange-700' : 'text-stone-800'}`}>{s}</span>
                    <span className="text-[11px] text-stone-500">Serves {s === 'Regular' ? 1 : s === 'Medium' ? 2 : 4} · {slices} slices</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${sel ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-700'}`}>₹{basePrice(s)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 1: Crust */}
          {step === 1 && (
            <div className="space-y-2.5">
              {CRUSTS.map((c) => (
                <button key={c.id} id={`btn-wiz-crust-${c.id.replace(/\s+/g, '-').toLowerCase()}`} onClick={() => setCrust(c.id)} className={card(crust === c.id)}>
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{c.emoji}</span>
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

          {/* Step 2: Sauce */}
          {step === 2 && (() => {
            const sauceEmojis: Record<string, string> = {
              'tomato': '🍅', 'schezwan': '🌶️', 'mexican': '🫑', 'tandoori': '🫙',
              'makhani': '🧈', 'achari': '🥒', 'hot-garlic': '🧄', 'peri-peri': '🔥', 'barbeque': '🍖',
            };
            const sauceRow = (s: (typeof PIZZA_SAUCES)[number]) => (
              <button key={s.id} id={`btn-wiz-sauce-${s.id}`} onClick={() => setSauce(s.name)} className={card(sauce === s.name)}>
                <span className="flex items-center gap-3">
                  <span className="text-xl">{sauceEmojis[s.id] || '🫙'}</span>
                  {radio(sauce === s.name)}
                  <span>
                    <span className="text-sm font-bold text-stone-900 block">{s.name}</span>
                    <span className="text-[11px] text-stone-500 block">{s.desc}</span>
                  </span>
                </span>
                {s.free ? <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">Included</span> : priceTag(SAUCE_PRICE)}
              </button>
            );
            return (
              <div className="space-y-2.5">
                {PIZZA_SAUCES.filter((s) => s.free).map(sauceRow)}
                <div className="pt-3 flex items-baseline justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Special sauces
                  </span>
                  <span className="text-xs font-bold text-stone-500">+₹{SAUCE_PRICE} each</span>
                </div>
                {PIZZA_SAUCES.filter((s) => !s.free).map(sauceRow)}
              </div>
            );
          })()}

          {/* Step 3: Toppings */}
          {step === 3 && (
            <div className="space-y-4">
              <div
                className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 ${
                  freeLeft > 0
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border border-emerald-200'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-200'
                }`}
              >
                <span className="text-base">{freeLeft > 0 ? '🎁' : '💰'}</span>
                {freeLeft > 0
                  ? `${picked.length} of ${FREE_TOPPINGS} free toppings used — ${freeLeft} more free!`
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
                  <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 overflow-hidden shadow-sm">{g.list.map(toppingRow)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Cheese */}
          {step === 4 && (
            <div className="space-y-2.5">
              {[
                { on: false, title: 'Normal cheese', desc: 'Our regular mozzarella layer', price: 0, emoji: '🧀' },
                { on: true, title: 'Extra cheese', desc: 'Double the cheese, extra stretchy 🤤', price: cheesePrice(size), emoji: '🧀🧀' },
              ].map((o) => (
                <button key={o.title} id={o.on ? 'btn-wiz-cheese-extra' : 'btn-wiz-cheese-normal'} onClick={() => setExtraCheese(o.on)} className={card(extraCheese === o.on)}>
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{o.emoji}</span>
                    {radio(extraCheese === o.on)}
                    <span>
                      <span className="text-sm font-bold text-stone-900 block">{o.title}</span>
                      <span className="text-[11px] text-stone-500 block">{o.desc}</span>
                    </span>
                  </span>
                  {priceTag(o.price, 'Included')}
                </button>
              ))}

              {/* Recap card */}
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-white to-amber-50/30 border border-stone-200 p-4 text-xs text-stone-700 space-y-1.5 shadow-sm">
                <div className="font-black text-stone-900 text-sm mb-2 flex items-center gap-2">
                  <span className="text-base">📋</span> Your pizza summary
                </div>
                <div className="flex justify-between"><span>🍕 {size} base</span><span className="font-mono">₹{basePrice(size)}</span></div>
                <div className="flex justify-between"><span>🫓 {crust}</span><span className="font-mono">{crustPrice(crust, size) ? `+₹${crustPrice(crust, size)}` : 'Free'}</span></div>
                <div className="flex justify-between"><span>🫙 {sauce}</span><span className="font-mono">{sauceCost(sauce) ? `+₹${sauceCost(sauce)}` : 'Included'}</span></div>
                <div className="flex justify-between gap-3"><span className="truncate">🧑‍🍳 {picked.length ? picked.map((t) => t.name).join(', ') : 'No toppings'}</span><span className="font-mono shrink-0">{toppingsTotal ? `+₹${toppingsTotal}` : 'Free'}</span></div>
                <div className="flex justify-between"><span>🧀 {extraCheese ? 'Extra cheese' : 'Normal cheese'}</span><span className="font-mono">{extraCheese ? `+₹${cheesePrice(size)}` : 'Included'}</span></div>
                <div className="border-t border-stone-200 mt-2 pt-2 flex justify-between font-black text-stone-900 text-sm">
                  <span>Total</span>
                  <span className="text-orange-600">₹{total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Bake */}
          {step === 5 && (
            <OvenAnimation
              pizzaImage={item.image}
              onComplete={handleBakeComplete}
              size={size}
              toppings={picked}
              extraCheese={extraCheese}
              sauce={sauce}
            />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-stone-200 bg-white px-4 sm:px-6 py-3.5 flex items-center gap-3">
          {isBakeStep ? (
            // Bake step footer
            bakeComplete ? (
              <button
                id="btn-wiz-add-to-cart"
                onClick={finish}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-95 text-white font-extrabold px-5 py-4 rounded-full shadow-lg shadow-emerald-300/30 text-sm cursor-pointer transition-all duration-200"
              >
                <Star className="w-4 h-4" />
                <span>{editingLine ? 'Update Item' : 'Add to Cart'} • ₹{total}</span>
                <span className="text-lg">🍕</span>
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 bg-stone-200 text-stone-400 font-extrabold px-5 py-4 rounded-full text-sm">
                <Flame className="w-4 h-4" style={{ animation: 'flicker 0.3s ease-in-out infinite alternate' }} />
                Baking in progress...
              </div>
            )
          ) : (
            <>
              {step > 0 ? (
                <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-3 rounded-full border border-stone-300 text-sm font-bold text-stone-700 cursor-pointer shrink-0 hover:bg-stone-50 transition-colors">
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
                onClick={() => setStep(step + 1)}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#e31837] to-[#c4122d] hover:from-[#c4122d] hover:to-[#a3102a] active:scale-95 text-white font-extrabold px-5 py-3.5 rounded-full shadow-lg shadow-red-900/20 text-sm cursor-pointer transition-all duration-200"
              >
                {step === 4 ? (
                  <>
                    <Flame className="w-4 h-4" />
                    <span>Bake It!</span>
                    <span className="text-base">🔥</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <span className="font-mono opacity-80">· ₹{total}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
