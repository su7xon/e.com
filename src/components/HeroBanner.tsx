import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Flame } from 'lucide-react';
import { MenuItem } from '../types';

interface HeroBannerProps {
  onSelectFeatured: (productId: string) => void;
  onOpenDeals: () => void;
  slides?: BannerSlide[];
}

export interface BannerSlide {
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
  fullImage?: boolean;
}

export const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: 'slide-hero-banner-1',
    badge: '7 CHEESE PIZZA',
    titlePart1: 'Banner',
    titleHighlight: '1',
    titlePart2: '',
    subtitle: '',
    priceOld: 419,
    priceNew: 329,
    feature1: '',
    feature2: '',
    bgGradient: 'from-amber-950 via-[#1c0f05] to-[#0d0702]',
    image: '/images/hero-banner-1.png',
    productId: 'p-7cheese-signature',
    fullImage: true,
  },
  {
    id: 'slide-hero-banner-2',
    badge: '7 CHEESE PIZZA',
    titlePart1: 'Banner',
    titleHighlight: '2',
    titlePart2: '',
    subtitle: '',
    priceOld: 99,
    priceNew: 79,
    feature1: '',
    feature2: '',
    bgGradient: 'from-zinc-950 via-[#1f1610] to-[#0a0705]',
    image: '/images/hero-banner-2.png',
    productId: 'pan-onion',
    fullImage: true,
  },
  {
    id: 'slide-hero-banner-3',
    badge: '7 CHEESE PIZZA',
    titlePart1: 'Banner',
    titleHighlight: '3',
    titlePart2: '',
    subtitle: '',
    priceOld: 249,
    priceNew: 189,
    feature1: '',
    feature2: '',
    bgGradient: 'from-red-950 via-[#26050a] to-[#120204]',
    image: '/images/hero-banner-3.png',
    productId: 'p-tandoori-chicken',
    fullImage: true,
  },
  {
    id: 'slide-hero-banner-4',
    badge: '7 CHEESE PIZZA',
    titlePart1: 'Banner',
    titleHighlight: '4',
    titlePart2: '',
    subtitle: '',
    priceOld: 70,
    priceNew: 50,
    feature1: '',
    feature2: '',
    bgGradient: 'from-emerald-950 via-[#0a1f13] to-[#041009]',
    image: '/images/hero-banner-4.png',
    productId: 'b-veg-normal',
    fullImage: true,
  },
  {
    id: 'slide-hero-banner-5',
    badge: '7 CHEESE PIZZA',
    titlePart1: 'Banner',
    titleHighlight: '5',
    titlePart2: '',
    subtitle: '',
    priceOld: 419,
    priceNew: 329,
    feature1: '',
    feature2: '',
    bgGradient: 'from-amber-950 via-[#1c0f05] to-[#0d0702]',
    image: '/images/hero-banner-5.png',
    productId: 'p-7cheese-signature',
    fullImage: true,
  },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSelectFeatured, onOpenDeals, slides = DEFAULT_SLIDES }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const safeSlides = slides.length > 0 ? slides : DEFAULT_SLIDES;

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % safeSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, safeSlides.length]);

  const slide = safeSlides[currentSlide % safeSlides.length];

  return (
    <div className="w-full">
      {/* Main Hero Slider Container - Exactly 12:7 ratio on mobile (text slides only) */}
      <div
        className={
          slide.fullImage
            ? 'relative w-full bg-slate-950 overflow-hidden select-none block'
            : 'relative w-full bg-slate-950 overflow-hidden select-none aspect-[12/7] sm:aspect-auto min-h-[190px] sm:min-h-[380px] md:min-h-[432px] sm:h-[380px] md:h-[432px] lg:h-[468px] flex items-center py-2 sm:py-0'
        }
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Gradient & Food Image */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} transition-colors duration-700`}
        />

        {/* Full banner image slide — zero crop, poori image dikhe (LUNCH text safe) */}
        {slide.fullImage && (
          <button
            id={`btn-hero-order-${slide.id}`}
            onClick={() => onSelectFeatured(slide.productId)}
            className="relative block w-full cursor-pointer"
            aria-label={`${slide.titlePart1} ${slide.titleHighlight} ${slide.titlePart2}`}
          >
            <img
              src={slide.image}
              alt={`${slide.titlePart1} ${slide.titleHighlight} ${slide.titlePart2}`}
              className="w-full h-auto object-contain block"
              referrerPolicy="no-referrer"
            />
          </button>
        )}

        {/* Ambient Glow */}
        <div className={`absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none ${slide.fullImage ? 'hidden' : ''}`} />

        {/* Content Grid: Side-by-side on both mobile and laptop */}
        <div className={`relative max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-6 w-full flex flex-row items-center justify-between gap-2.5 sm:gap-6 ${slide.fullImage ? 'hidden' : ''}`}>
          
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

        {/* Slide Dots only */}
        <div className="absolute bottom-1.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 bg-black/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-xs">
          <div className="flex items-center gap-1 sm:gap-1.5">
              {safeSlides.map((s, idx) => (
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

    </div>
  );
};
