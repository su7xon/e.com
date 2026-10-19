import React from 'react';
import { ArrowLeft, Check, Clock, Minus, Plus, Tag } from 'lucide-react';
import { Coupon, MenuItem } from '../types';
import { BannerSlide } from './HeroBanner';
import { OFFERS, OfferInfo } from '../lib/deals';
import { isScheduleActive } from '../utils/offerSchedule';
import { VegNonVegIcon } from './VegNonVegIcon';

interface OffersPageProps {
  now: Date;
  slides: BannerSlide[];
  lunchCombos: MenuItem[];
  coupons: Coupon[];
  appliedCode?: string;
  cartQty: (productId: string) => number;
  onAddCombo: (item: MenuItem) => void;
  /** Takes one of this combo out of the cart. */
  onRemoveCombo: (productId: string) => void;
  onApplyCoupon: (coupon: Coupon) => void;
  onBrowse: (categoryKey: string) => void;
  onBack: () => void;
}

/** All offers in one place: day deals, lunch combos, free cake / delivery and coupons. */
export const OffersPage: React.FC<OffersPageProps> = ({
  now,
  slides,
  lunchCombos,
  coupons,
  appliedCode,
  cartQty,
  onAddCombo,
  onRemoveCombo,
  onApplyCoupon,
  onBrowse,
  onBack,
}) => {
  const imageFor = (o: OfferInfo) =>
    o.slideSchedule
      ? slides.find((s) => s.schedule === o.slideSchedule)?.image
      : o.key === 'free-lava'
        ? slides.find((s) => s.id === 'slide-generic-free-lava')?.image
        : undefined;
  const lunchOn = isScheduleActive(OFFERS.find((o) => o.key === 'lunch')?.schedule, now);

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to menu"
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Offers</h1>
          <p className="text-xs text-slate-500">Deals of the day, combos and coupons</p>
        </div>
      </div>

      {OFFERS.map((o) => {
        const on = o.schedule ? isScheduleActive(o.schedule, now) : true;
        const img = imageFor(o);
        return (
          <section
            key={o.key}
            id={`offer-${o.key}`}
            className="scroll-mt-24 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {img && <img src={img} alt={o.name} className="w-full h-auto block" referrerPolicy="no-referrer" />}
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-black text-slate-900 leading-tight">{o.name}</h2>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full ${
                    on && o.schedule ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {on && o.schedule ? 'On now' : o.when}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{o.summary}</p>

              <ul className="mt-3 space-y-1.5">
                {o.perks.map((p) => (
                  <li key={p} className="flex gap-2 text-sm font-semibold text-slate-800">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>

              {o.key === 'lunch' && (
                <div className="mt-4 divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                  {lunchCombos.map((c) => {
                    const qty = cartQty(c.id);
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                        <img
                          src={c.image}
                          alt={c.name}
                          className="w-16 h-14 sm:w-20 sm:h-16 shrink-0 rounded-xl object-cover bg-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <VegNonVegIcon isVeg={c.isVeg} size="sm" />
                            {c.name.replace('Lunch Combo — ', '')}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{c.description}</p>
                        </div>
                        <span className="font-mono font-black text-sm text-slate-900">₹{c.price}</span>
                        {qty > 0 ? (
                          <div className="shrink-0 flex items-center bg-[#ED1C24] text-white rounded-lg overflow-hidden">
                            <button
                              id={`btn-offer-minus-${c.id}`}
                              onClick={() => onRemoveCombo(c.id)}
                              aria-label={`Remove one ${c.name}`}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#c91430] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <span className="min-w-6 text-center text-xs font-black font-mono">{qty}</span>
                            <button
                              id={`btn-offer-add-${c.id}`}
                              onClick={() => onAddCombo(c)}
                              disabled={!lunchOn}
                              aria-label={`Add one more ${c.name}`}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#c91430] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`btn-offer-add-${c.id}`}
                            onClick={() => onAddCombo(c)}
                            disabled={!lunchOn}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                              lunchOn
                                ? 'bg-[#ED1C24] hover:bg-[#c91430] text-white cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Add +
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {!lunchOn && (
                    <p className="px-3 py-2 text-[11px] font-bold text-amber-800 bg-amber-50 rounded-b-2xl">
                      Available 11 AM – 2 PM only
                    </p>
                  )}
                </div>
              )}

              {(o.key === 'tuesday' || o.key === 'friday') && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onBrowse('veg-pizza')}
                    className="py-2.5 rounded-xl bg-[#ED1C24] hover:bg-[#c91430] text-white text-xs font-black cursor-pointer"
                  >
                    Veg pizzas
                  </button>
                  <button
                    onClick={() => onBrowse('non-veg-pizza')}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer"
                  >
                    Non-veg pizzas
                  </button>
                </div>
              )}
              {o.key === 'free-lava' && (
                <button
                  onClick={() => onBrowse('all')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-[#ED1C24] hover:bg-[#c91430] text-white text-xs font-black cursor-pointer"
                >
                  Browse menu
                </button>
              )}

              <ul className="mt-3 space-y-0.5 text-[11px] text-slate-500">
                {o.terms.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      {coupons.length > 0 && (
        <section id="offer-coupons" className="scroll-mt-24">
          <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#ED1C24]" /> Coupons
          </h2>
          <div className="space-y-3">
            {coupons.map((c) => {
              const applied = appliedCode === c.code;
              return (
                <div key={c.code} className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono font-black text-xs text-[#ED1C24] bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                      {c.code}
                    </span>
                    <h3 className="mt-2 text-sm font-extrabold text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Min. order ₹{c.minOrder}</p>
                  </div>
                  <button
                    onClick={() => onApplyCoupon(c)}
                    disabled={applied}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-black ${
                      applied ? 'bg-emerald-600 text-white' : 'bg-[#ED1C24] hover:bg-[#c91430] text-white cursor-pointer'
                    }`}
                  >
                    {applied ? 'Applied ✓' : 'Apply'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
