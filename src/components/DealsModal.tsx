import React from 'react';
import { X, Tag, Copy, Check, Percent, Sparkles, Flame, ArrowRight } from 'lucide-react';
import { COUPONS } from '../data/mockData';
import { Coupon } from '../types';

interface DealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon: (coupon: Coupon) => void;
  appliedCouponCode?: string;
  coupons?: Coupon[];
}

export const DealsModal: React.FC<DealsModalProps> = ({
  isOpen,
  onClose,
  onApplyCoupon,
  appliedCouponCode,
  coupons,
}) => {
  if (!isOpen) return null;

  const couponList = coupons || COUPONS;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-deals-container"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="bg-[#ED1C24] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                7 Cheese Exclusive Coupons
              </h2>
              <p className="text-xs text-red-100">
                Unlock instant discounts on your order
              </p>
            </div>
          </div>

          <button
            id="btn-close-deals-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {couponList.map((coupon) => {
            const isApplied = appliedCouponCode === coupon.code;
            return (
              <div
                key={coupon.code}
                className="border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50/60 rounded-2xl p-4 transition-colors relative overflow-hidden"
              >
                {coupon.tag && (
                  <span className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-2.5 py-0.5 rounded-bl-xl shadow-xs">
                    {coupon.tag}
                  </span>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#ED1C24] bg-red-100 px-2 py-0.5 rounded-lg border border-red-200">
                        {coupon.code}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-2">
                      {coupon.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {coupon.description}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                      Min order value: ₹{coupon.minOrder}
                    </span>
                  </div>

                  <button
                    id={`btn-apply-modal-${coupon.code}`}
                    onClick={() => {
                      onApplyCoupon(coupon);
                      onClose();
                    }}
                    className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                      isApplied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#e31837] hover:bg-[#c4122d] text-white shadow-xs'
                    }`}
                  >
                    {isApplied ? 'Applied ✓' : 'Apply Coupon'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
