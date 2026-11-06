import React, { useEffect, useState } from 'react';
import { X, Copy, Check, CheckCircle2 } from 'lucide-react';
import { Coupon } from '../types';
import { describeSchedule, OFFER_SCHEDULES } from '../utils/offerSchedule';

interface OfferDetailSheetProps {
  coupon: Coupon | null;
  cartTotal: number;
  appliedCode?: string;
  onApply: (coupon: Coupon) => void;
  onSeeAll: () => void;
  onClose: () => void;
}

/** Details for the one offer tapped in "Offers for you": terms, cart progress and Apply. */
export const OfferDetailSheet: React.FC<OfferDetailSheetProps> = ({
  coupon,
  cartTotal,
  appliedCode,
  onApply,
  onSeeAll,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [coupon?.code]);

  if (!coupon) return null;

  const isApplied = appliedCode === coupon.code;
  const shortBy = Math.max(0, coupon.minOrder - cartTotal);
  const progress = coupon.minOrder > 0 ? Math.min(100, (cartTotal / coupon.minOrder) * 100) : 100;
  const schedule = describeSchedule(
    coupon.days || coupon.startTime ? coupon : OFFER_SCHEDULES[coupon.code],
  );
  const discountText =
    coupon.discountType === 'percentage'
      ? `${coupon.value}% off${coupon.maxDiscount ? `, up to ₹${coupon.maxDiscount}` : ''}`
      : `Flat ₹${coupon.value} off`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
    } catch {
      // clipboard blocked; the code is still visible to type
    }
  };

  return (
    <div className="fixed inset-0 z-[57] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={coupon.title}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {coupon.tag && (
              <span className="inline-block mb-1 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                {coupon.tag}
              </span>
            )}
            <h2 className="text-base font-black text-slate-900 leading-tight">{coupon.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono font-black text-sm text-[#ED1C24] bg-red-50 border border-dashed border-red-300 px-3 py-1.5 rounded-lg">
            {coupon.code}
          </span>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {coupon.description && <p className="mt-3 text-sm text-slate-600">{coupon.description}</p>}

        <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
          <li className="flex gap-2"><span className="text-[#ED1C24]">•</span>{discountText}</li>
          <li className="flex gap-2"><span className="text-[#ED1C24]">•</span>Minimum order ₹{coupon.minOrder}</li>
          <li className="flex gap-2"><span className="text-[#ED1C24]">•</span>{schedule ? `Valid ${schedule}` : 'Valid every day'}</li>
        </ul>

        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
          {shortBy > 0 ? (
            <>
              <p className="text-xs font-bold text-slate-700">Add ₹{shortBy} more to unlock this offer</p>
              <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#ED1C24] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Your cart qualifies for this offer
            </p>
          )}
        </div>

        <button
          onClick={() => onApply(coupon)}
          disabled={isApplied}
          className={`mt-4 w-full py-3 rounded-xl text-sm font-black cursor-pointer transition-colors ${
            isApplied ? 'bg-emerald-600 text-white cursor-default' : 'bg-[#ED1C24] hover:bg-[#c91430] text-white'
          }`}
        >
          {isApplied ? 'Applied ✓' : 'Apply offer'}
        </button>
        <button
          onClick={onSeeAll}
          className="mt-2 w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          See all offers ›
        </button>
      </div>
    </div>
  );
};
