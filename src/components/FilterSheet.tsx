import React from 'react';
import { X } from 'lucide-react';

export type SortOption = 'popular' | 'price-low' | 'price-high' | 'rating';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  vegOnly: boolean;
  setVegOnly: (v: boolean) => void;
  nonVegOnly: boolean;
  setNonVegOnly: (v: boolean) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  /** Resets every menu filter (food type, sort, category, search) and closes the sheet. */
  onClearAll: () => void;
  /** Name of the selected menu category, shown so users see what Clear all resets. */
  activeCategoryName?: string;
  onClearCategory?: () => void;
}

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Popularity' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

/** Bottom-bar "Filter" sheet: food type + sort. Changes apply immediately. */
export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  vegOnly,
  setVegOnly,
  nonVegOnly,
  setNonVegOnly,
  sortBy,
  setSortBy,
  onClearAll,
  activeCategoryName,
  onClearCategory,
}) => {
  if (!isOpen) return null;

  const chip = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-colors ${
      active ? 'border-[#ED1C24] bg-red-50 text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'
    }`;

  return (
    <div className="fixed inset-0 z-[57] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter menu"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">Filter & Sort</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeCategoryName && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
            <span className="text-slate-500">
              Category: <b className="text-slate-900">{activeCategoryName}</b>
            </span>
            {onClearCategory && (
              <button onClick={onClearCategory} aria-label="Clear category" className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Food type</p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => {
              setVegOnly(!vegOnly);
              if (!vegOnly) setNonVegOnly(false);
            }}
            className={chip(vegOnly)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Veg
          </button>
          <button
            onClick={() => {
              setNonVegOnly(!nonVegOnly);
              if (!nonVegOnly) setVegOnly(false);
            }}
            className={chip(nonVegOnly)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Non-Veg
          </button>
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sort by</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SORTS.map((s) => (
            <button key={s.value} onClick={() => setSortBy(s.value)} className={chip(sortBy === s.value)}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClearAll}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 cursor-pointer"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#ED1C24] hover:bg-[#c91430] text-white text-sm font-black cursor-pointer"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
};
