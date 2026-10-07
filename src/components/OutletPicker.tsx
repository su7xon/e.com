import React from 'react';
import { X, MapPin, Check, Navigation } from 'lucide-react';
import { OutletWithDistance } from './admin/outlets';

interface OutletPickerProps {
  isOpen: boolean;
  mode: 'TAKEAWAY' | 'DINE_IN';
  outlets: OutletWithDistance[];
  selectedId: string | null;
  hasLocation: boolean;
  locating: boolean;
  onDetectLocation: () => void;
  onSelect: (outletId: string) => void;
  onClose: () => void;
}

/** Store picker for Takeaway / Dine-in: outlets listed nearest first, nearest pre-highlighted. */
export const OutletPicker: React.FC<OutletPickerProps> = ({
  isOpen,
  mode,
  outlets,
  selectedId,
  hasLocation,
  locating,
  onDetectLocation,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;
  const highlighted = selectedId ?? outlets[0]?.outlet.id;

  return (
    <div className="fixed inset-0 z-[55] bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Select a store for {mode === 'TAKEAWAY' ? 'Takeaway' : 'Dine-in'}
            </h2>
            <p className="text-xs text-slate-500">
              {hasLocation ? 'Nearest stores first' : 'Turn on location to see the nearest store'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!hasLocation && (
          <button
            onClick={onDetectLocation}
            disabled={locating}
            className="mt-3 w-full flex items-center justify-center gap-1.5 bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-70"
          >
            <Navigation className="w-3.5 h-3.5" />
            {locating ? 'Detecting…' : 'Use my location'}
          </button>
        )}

        <div className="mt-3 space-y-2">
          {outlets.map(({ outlet, distanceKm }, idx) => {
            const isSel = outlet.id === highlighted;
            return (
              <button
                key={outlet.id}
                onClick={() => onSelect(outlet.id)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-colors ${
                  isSel ? 'border-[#ED1C24] bg-red-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <MapPin className="w-5 h-5 shrink-0 text-[#ED1C24]" />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <span className="truncate">{outlet.name}</span>
                    {hasLocation && idx === 0 && (
                      <span className="shrink-0 text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                        NEAREST
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-500 truncate">{outlet.area}</span>
                </span>
                {distanceKm !== null && (
                  <span className="shrink-0 text-xs font-bold text-slate-700">{distanceKm} km</span>
                )}
                {isSel && <Check className="w-4 h-4 shrink-0 text-[#ED1C24]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
