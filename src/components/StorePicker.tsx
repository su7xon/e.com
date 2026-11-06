import React from 'react';
import { MapPin, Phone, X } from 'lucide-react';
import { activeOutlets, formatHour, geoDistanceKm, isOutletOpen, useOutlets } from './admin/outlets';

interface StorePickerProps {
  isOpen: boolean;
  /** Customer's location, to sort stores by distance. */
  from: { lat: number; lng: number } | null;
  selectedId?: string;
  now: Date;
  onPick: (outletId: string) => void;
  onClose: () => void;
}

/** Choose a store to collect the order from. */
export const StorePicker: React.FC<StorePickerProps> = ({ isOpen, from, selectedId, now, onPick, onClose }) => {
  useOutlets();
  if (!isOpen) return null;

  const stores = activeOutlets()
    .map((o) => ({ o, km: from ? geoDistanceKm(from.lat, from.lng, o.lat, o.lng) : null }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));

  return (
    <div className="fixed inset-0 z-[62] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pick up from a store"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#ED1C24] text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-black leading-tight">Pick up from a store</h2>
            <p className="text-xs text-red-100">Order now and collect it yourself</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto">
          {stores.map(({ o, km }) => {
            const open = isOutletOpen(o, now);
            return (
              <button
                key={o.id}
                data-store-pick={o.id}
                onClick={() => onPick(o.id)}
                className={`w-full text-left rounded-2xl border p-3 cursor-pointer transition-colors ${
                  selectedId === o.id ? 'border-[#ED1C24] bg-red-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-black text-slate-900">{o.shortName}</span>
                  <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${open ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {open ? 'Open now' : `Opens ${formatHour(o.opensAt)}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 flex gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" />
                  {o.address}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {o.phone}
                  {km !== null && <span className="font-bold"> · {km.toFixed(1)} km away</span>}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
