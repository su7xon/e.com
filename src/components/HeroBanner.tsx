import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Flame, Percent, Bike } from 'lucide-react';
import { MenuItem } from '../types';

interface HeroBannerProps {
  onSelectFeatured: (productId: string) => void;
  onOpenDeals: () => void;
}

interface BannerSlide {
  id: string;
  badge: string;
  titlePart1: string;
  titleHighlight: string;
  titlePart2: string;
  subtitle: string;
  priceOld: number;
  priceNew: number;
  promoCode?: string;
  feature1: string;
  feature2: string;
  bgGradient: string;
  image: string;
  productId: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: 'slide-7cheese-signature',
    badge: 'HOUSE SIGNATURE • 7 ARTISANAL CHEESES',
    titlePart1: 'The Original',
    titleHighlight: '7 CHEESE PIZZA',
    titlePart2: 'Special',
    subtitle: '7 Cheeses: Mozzarella, Cheddar, Gouda, Parmesan, Provolone, Fontina & Ricotta!',
    priceOld: 419,
    priceNew: 329,
    promoCode: '7CHEESE50',
    feature1: '7 Handcrafted Cheeses',
    feature2: 'Golden Garlic Butter Herb Crust',
    bgGradient: 'from-amber-950 via-[#1c0f05] to-[#0d0702]',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&auto=format&fit=crop&q=80',
    productId: 'p-7cheese-signature',
  },
  {
    id: 'slide-pan-mania',
    badge: 'VALUE PAN PIZZA MANIA',
    titlePart1: 'Crispy Pan Pizzas',
    titleHighlight: 'STARTING @ ₹79',
    titlePart2: 'Hot & Fresh',
    subtitle: 'Crispy pan crusts loaded with Onion, Capsicum, Golden Corn & Fresh Paneer!',
    priceOld: 99,
    priceNew: 79,
    feature1: 'Fresh Hand-Stretched Pan Base',
    feature2: 'Bubbly Hot Cheese',
    bgGradient: 'from-zinc-950 via-[#1f1610] to-[#0a0705]',
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=900&auto=format&fit=crop&q=80',
    productId: 'pan-onion',
  },
  {
    id: 'slide-tandoori-chicken',
    badge: 'TANDOORI GRILL SPECIAL',
    titlePart1: 'Clay-Oven',
    titleHighlight: 'TANDOORI CHICKEN',
    titlePart2: 'Feast',
    subtitle: 'Smoky spiced chicken tikka with roasted capsicum, onions & cheese sauce!',
    priceOld: 249,
    priceNew: 189,
    promoCode: 'CHEESEFEST',
    feature1: 'Smoky Tandoori Tikka',
    feature2: 'Authentic Desi Spices',
    bgGradient: 'from-red-950 via-[#26050a] to-[#120204]',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&auto=format&fit=crop&q=80',
    productId: 'p-tandoori-chicken',
  },
  {
    id: 'slide-wraps-burgers',
    badge: 'NEW CRAVINGS • WRAPS & BURGERS',
    titlePart1: 'Cheesy Wraps',
    titleHighlight: '& CRISPY BURGERS',
    titlePart2: 'From ₹50',
    subtitle: 'Tandoori, Schezwan, Makhani wraps & golden crumbed crispy burgers!',
    priceOld: 70,
    priceNew: 50,
    feature1: 'Signature Sauce Drizzles',
    feature2: '100% Fresh Ingredients',
    bgGradient: 'from-emerald-950 via-[#0a1f13] to-[#041009]',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=900&auto=format&fit=crop&q=80',
    productId: 'b-veg-normal',
  },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSelectFeatured, onOpenDeals }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const slide = SLIDES[currentSlide];

  return (
    <div className="w-full">
      {/* Main Hero Slider Container - Exactly 12:7 ratio on mobile */}
      <div
        className="relative w-full bg-slate-950 overflow-hidden select-none aspect-[12/7] sm:aspect-auto min-h-[190px] sm:min-h-[380px] md:min-h-[420px] flex items-center py-2 sm:py-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Gradient & Food Image */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} transition-colors duration-700`}
        />

        {/* Ambient Glow */}
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content Grid: Side-by-side on both mobile and laptop */}
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-6 w-full flex flex-row items-center justify-between gap-2.5 sm:gap-6">
          
          {/* Left Hero Texts */}
          <div className="flex-1 text-left z-10 min-w-0 pl-5 sm:pl-0">
            {/* Offer Tag */}
            <div className="inline-flex items-center gap-1 bg-[#e31837] text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-black tracking-wider uppercase shadow-md mb-1 sm:mb-2">
              <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current animate-bounce" />
              <span className="truncate max-w-[130px] sm:max-w-none">{slide.badge}</span>
            </div>

            {/* Main Title typography */}
            <h1 className="text-base xs:text-lg sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              <span className="text-amber-400 font-extrabold sm:font-black">{slide.titlePart1} </span>
              <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {slide.titleHighlight}
              </span>{' '}
              <span className="text-red-400 block text-xs xs:text-sm sm:text-3xl md:text-4xl font-extrabold">
                {slide.titlePart2}
              </span>
            </h1>

            <p className="mt-1 text-slate-300 text-[10px] sm:text-sm md:text-base max-w-md font-medium line-clamp-2 sm:line-clamp-none">
              {slide.subtitle}
            </p>

            {/* Callout pointers */}
            <div className="mt-1 sm:mt-3 flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-xs border border-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-semibold text-amber-300">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400" />
                {slide.feature1}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-white/10 backdrop-blur-xs border border-white/20 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold text-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                {slide.feature2}
              </span>
              {slide.promoCode && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-mono font-bold">
                  Code: {slide.promoCode}
                </span>
              )}
            </div>

            {/* Pricing & CTA */}
            <div className="mt-2 sm:mt-4 flex items-center gap-2 sm:gap-4">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-slate-400 line-through text-[11px] sm:text-base font-semibold">
                  ₹{slide.priceOld}
                </span>
                <span className="text-base sm:text-3xl md:text-4xl font-black text-amber-400">
                  ₹{slide.priceNew}
                  <span className="text-[10px] sm:text-xs text-slate-300 ml-0.5">*</span>
                </span>
              </div>

              <button
                id={`btn-hero-order-${slide.id}`}
                onClick={() => onSelectFeatured(slide.productId)}
                className="flex items-center gap-1 sm:gap-2 bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-black px-2.5 sm:px-6 py-1 sm:py-3 rounded-full shadow-lg shadow-red-950/50 transition-all text-[10px] sm:text-sm tracking-wide uppercase cursor-pointer shrink-0"
              >
                <span>ORDER NOW</span>
                <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Right Product Showcase Image */}
          <div className="relative shrink-0 w-28 xs:w-36 sm:w-80 md:w-96 lg:w-[420px] aspect-square flex items-center justify-center pr-5 sm:pr-0">
            {/* Spinning background badge */}
            <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/30 animate-spin-slow pointer-events-none" />
            
            <img
              src={slide.image}
              alt={slide.titleHighlight}
              className="w-full h-full object-cover rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-amber-400/30 transform hover:scale-105 transition-transform duration-500 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
              referrerPolicy="no-referrer"
            />

            {/* Special Floating Tag */}
            <div className="absolute -bottom-1.5 right-0 sm:-bottom-3 sm:right-4 bg-amber-400 text-slate-950 font-black px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-xl shadow-lg text-[8px] sm:text-xs flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              <span>7 Cheese Special</span>
            </div>
          </div>

        </div>

        {/* Carousel Arrows */}
        <button
          id="btn-hero-prev"
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))}
          className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors z-20"
          aria-label="Previous Offer"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>
        <button
          id="btn-hero-next"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
          className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors z-20"
          aria-label="Next Offer"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>

        {/* Slide Counter & Dots */}
        <div className="absolute bottom-1.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 bg-black/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-xs">
          <span className="text-[9px] sm:text-[11px] font-bold text-slate-200">
            {currentSlide + 1}/{SLIDES.length}
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all rounded-full ${
                  currentSlide === idx ? 'w-4 sm:w-5 h-1 sm:h-2 bg-amber-400' : 'w-1.5 sm:w-2 h-1 sm:h-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Free Delivery & Lowest Price Ribbon */}
      <div className="bg-[#18181b] text-white px-3 py-1.5 sm:py-2 text-xs font-bold border-t border-b border-white/10 shadow-xs overflow-hidden">
        {/* Mobile View: Exactly 1 single line continuous ticker */}
        <div className="sm:hidden relative w-full overflow-hidden flex items-center py-0.5">
          <div className="animate-ribbon-ticker flex items-center gap-3 whitespace-nowrap will-change-transform">
            {[1, 2].map((k) => (
              <div key={k} className="flex items-center gap-2 text-[11px] shrink-0">
                <span className="bg-[#ED1C24] text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                  GUARANTEE
                </span>
                <span className="text-zinc-200 shrink-0">
                  LOWEST PRICES ONLY ON 7 CHEESE PIZZA APP
                </span>
                <span className="text-zinc-500 shrink-0">|</span>
                <span className="text-amber-400 flex items-center gap-1 shrink-0">
                  <Bike className="w-3.5 h-3.5" />
                  EXPRESS DELIVERY ABOVE ₹99
                </span>
                <span className="text-zinc-500 shrink-0">|</span>
                <button
                  onClick={onOpenDeals}
                  className="text-amber-400 active:text-amber-300 underline flex items-center gap-0.5 font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  <span>View All 7 Cheese Coupons & Offers</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <span className="text-zinc-600 shrink-0 mx-2">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* Laptop / Desktop View: Completely unchanged */}
        <div className="hidden sm:flex max-w-7xl mx-auto items-center justify-between gap-1 text-left">
          <div className="flex items-center gap-2">
            <span className="bg-[#ED1C24] text-white px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
              GUARANTEE
            </span>
            <span className="text-zinc-200">
              LOWEST PRICES ONLY ON 7 CHEESE PIZZA APP
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-amber-400 flex items-center gap-1">
              <Bike className="w-3.5 h-3.5" />
              EXPRESS DELIVERY ABOVE ₹99
            </span>
          </div>

          <button
            id="btn-view-all-deals"
            onClick={onOpenDeals}
            className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-bold text-xs cursor-pointer"
          >
            <span>View All 7 Cheese Coupons & Offers</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Ribbon Ticker CSS Animation */}
      <style>{`
        @keyframes ribbonTicker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ribbon-ticker {
          animation: ribbonTicker 22s linear infinite;
          width: max-content;
        }
        .animate-ribbon-ticker:hover, .animate-ribbon-ticker:active {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
