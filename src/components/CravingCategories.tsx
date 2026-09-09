import React from 'react';
import { CRAVING_CATEGORIES } from '../data/mockData';
import { CategoryItem } from '../types';

interface CravingCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (filterKey: string) => void;
}

export const CravingCategories: React.FC<CravingCategoriesProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="bg-white py-5 px-3 sm:px-6 border-b border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-sans">
            What are you craving for?
          </h2>
          <button
            id="btn-category-reset-all"
            onClick={() => onSelectCategory('all')}
            className="text-xs font-bold text-[#ED1C24] hover:text-red-700 hover:underline cursor-pointer"
          >
            Explore All (50+ Items)
          </button>
        </div>

        {/* Categories Horizontal Scroll / Multi-row on Mobile */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4">
          {CRAVING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.filterKey;
            return (
              <button
                key={cat.id}
                id={`btn-craving-${cat.id}`}
                onClick={() => onSelectCategory(cat.filterKey)}
                className="group flex flex-col items-center text-center cursor-pointer transition-transform duration-200 hover:-translate-y-1 focus:outline-none"
              >
                {/* Round Image Container */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-1 transition-all">
                  {/* Outer active indicator ring */}
                  <div
                    className={`absolute inset-0 rounded-full transition-all ${
                      isSelected
                        ? 'ring-3 ring-[#ED1C24] ring-offset-2 scale-105 shadow-md'
                        : 'border border-slate-200 group-hover:border-amber-400'
                    }`}
                  />

                  {/* Food Image */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full shadow-inner transform group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Badge (NEW or 6 in 1 or starting price) */}
                  {cat.tag && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
                      {cat.tag}
                    </span>
                  )}
                  {cat.startingPrice && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                      @{cat.startingPrice}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`mt-2 text-xs sm:text-sm font-bold line-clamp-2 transition-colors ${
                    isSelected
                      ? 'text-[#ED1C24] font-black'
                      : 'text-slate-800 group-hover:text-[#ED1C24]'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
