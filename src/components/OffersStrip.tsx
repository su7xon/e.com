import React from 'react';
import { Percent } from 'lucide-react';
import { Coupon } from '../types';
import { describeSchedule } from '../utils/offerSchedule';
import { OFFER_SCHEDULES } from '../utils/offerSchedule';

interface OffersStripProps {
  coupons: Coupon[];
  onView: (coupon: Coupon) => void;
}

/** "Offers for you" row: only coupons active right now (callers pass the already-filtered list). */
export const OffersStrip: React.FC<OffersStripProps> = ({ coupons, onView }) => {
  if (coupons.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
      <h2 className="text-lg font-black text-slate-900 mb-2">Offers for you</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x [scrollbar-width:none]">
        {coupons.map((c) => {
          const when = describeSchedule(c.days || c.startTime ? c : OFFER_SCHEDULES[c.code]);
          return (
            <div
              key={c.code}
              className="snap-start shrink-0 w-[85%] sm:w-80 bg-gradient-to-br from-[#f6ead6] to-[#efdcbc] text-[#3b2410] border border-[#e6cfa6] rounded-xl p-3 flex items-center gap-3"
            >
              <Percent className="w-6 h-6 shrink-0 text-[#8a5a2b]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold truncate">{c.title}</p>
                <p className="text-[11px] text-[#6b4a2a] line-clamp-2">
                  {when ? `${when} · ` : ''}Use {c.code} on orders ₹{c.minOrder}+
                </p>
              </div>
              <button
                onClick={() => onView(c)}
                className="shrink-0 border border-[#8a5a2b] text-[#5a3818] rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-[#8a5a2b]/10"
              >
                View
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
