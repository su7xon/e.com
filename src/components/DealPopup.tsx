import React from 'react';
import { X, Clock } from 'lucide-react';

export interface TimedDeal {
  id: string;
  title: string;
  subtitle: string;
  when: string;
  image?: string;
  ctaLabel: string;
  onCta: () => void;
}

interface DealPopupProps {
  deal: TimedDeal | null;
  onClose: () => void;
}

/** Pop-up for the time-bound deals (Tuesday, Friday, lunch) while they are running. */
export const DealPopup: React.FC<DealPopupProps> = ({ deal, onClose }) => {
  if (!deal) return null;
  return (
    <div className="fixed inset-0 z-[58] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={deal.title}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {deal.image ? (
          <img src={deal.image} alt="" className="w-full aspect-[16/9] object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full aspect-[16/7] bg-gradient-to-br from-[#ED1C24] to-amber-500 flex items-center justify-center px-6">
            <span className="text-2xl sm:text-3xl font-black text-white text-center leading-tight">{deal.title}</span>
          </div>
        )}

        <div className="p-4 sm:p-5">
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#ED1C24] bg-red-50 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" /> {deal.when}
          </span>
          <h2 className="mt-2 text-lg font-black text-slate-900 leading-tight">{deal.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{deal.subtitle}</p>

          <button
            onClick={deal.onCta}
            className="mt-4 w-full py-3 rounded-xl bg-[#ED1C24] hover:bg-[#c91430] text-white text-sm font-black cursor-pointer"
          >
            {deal.ctaLabel}
          </button>
          <button
            onClick={onClose}
            className="mt-2 w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
