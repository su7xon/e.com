import React from 'react';
import { CRAVING_CATEGORIES } from '../data/mockData';
import { CategoryItem } from '../types';

interface CravingCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (filterKey: string) => void;
  categories?: CategoryItem[];
}



export const CravingCategories: React.FC<CravingCategoriesProps> = ({
  selectedCategory,
  onSelectCategory,
  categories = CRAVING_CATEGORIES,
}) => {
  return (
    <section className="bg-white py-6 px-3 sm:px-6 border-b border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-[11px] sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] text-stone-500">
            What are you craving for?
          </h2>
          <button
            id="btn-category-reset-all"
            onClick={() => onSelectCategory('all')}
            className="shrink-0 whitespace-nowrap text-xs font-bold text-[#ED1C24] hover:text-red-700 hover:underline cursor-pointer"
          >
            Explore All<span className="hidden sm:inline"> (50+ Items)</span>
          </button>
        </div>

        {/* Floating dishes grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-x-2 gap-y-6 sm:gap-x-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.filterKey;
            return (
              <button
                key={cat.id}
                id={`btn-craving-${cat.id}`}
                onClick={() => onSelectCategory(cat.filterKey)}
                className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
              >
                {/* Full dish image — no frame, no fade, no shadow */}
                <div
                  className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 transition-transform duration-300 ${
                    isSelected ? 'scale-105' : 'group-hover:scale-105 group-hover:-translate-y-1'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>

                {/* Label */}
                <span
                  className={`mt-1 text-xs sm:text-sm line-clamp-2 transition-colors ${
                    isSelected
                      ? 'text-[#ED1C24] font-black'
                      : 'font-bold text-stone-700 group-hover:text-[#ED1C24]'
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
