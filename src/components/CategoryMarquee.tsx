import React from 'react';
import { CRAVING_CATEGORIES } from '../data/mockData';
import { CategoryItem } from '../types';

interface CategoryMarqueeProps {
  onSelectCategory: (filterKey: string) => void;
  categories?: CategoryItem[];
}

export const CategoryMarquee: React.FC<CategoryMarqueeProps> = ({ onSelectCategory, categories = CRAVING_CATEGORIES }) => {
  // Double the items for seamless infinite scroll
  const items = [...categories.filter(c => c.filterKey !== 'all'), ...categories.filter(c => c.filterKey !== 'all')];

  return (
    <section className="bg-white py-6 sm:py-8 border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 mb-4 sm:mb-5">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          <span className="italic">Browse Our Category</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 text-center mt-1 font-medium">
          Explore our handcrafted menu — pizzas, burgers, wraps & more
        </p>
      </div>

      {/* Marquee Container */}
      <div
        className="relative group"
        style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}
      >
        <div className="flex gap-4 sm:gap-5 animate-marquee group-hover:[animation-play-state:paused]">
          {items.map((cat, idx) => (
            <button
              key={`${cat.id}-${idx}`}
              onClick={() => {
                onSelectCategory(cat.filterKey);
                const el = document.getElementById('menu-items-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="shrink-0 group/card relative w-44 sm:w-52 md:w-60 aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] cursor-pointer border border-slate-200 hover:border-amber-400"
            >
              {/* Category Image — marquee card photo (bannerImage), craving cutout nahi */}
              <img
                src={cat.bannerImage || cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                referrerPolicy="no-referrer"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Tag Badge */}
              {cat.tag && (
                <span className="absolute top-2.5 left-2.5 bg-[#ED1C24] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  {cat.tag}
                </span>
              )}

              {/* Bottom Text */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-3.5">
                <h3 className="text-white text-sm sm:text-base font-black leading-tight drop-shadow-lg">
                  {cat.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Marquee CSS Animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
          width: max-content;
        }
      `}</style>
    </section>
  );
};
