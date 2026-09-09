import React from 'react';
import { X, Award, Gift, Sparkles, Check, ArrowRight } from 'lucide-react';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
  onRedeemReward: (title: string, discountVal: number) => void;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  points,
  onRedeemReward,
}) => {
  if (!isOpen) return null;

  const TIERS = [
    {
      required: 150,
      title: 'Free Creamy Cheesy Dip',
      desc: 'Rich cheesy dip for dipping hot crusts',
      value: 30,
    },
    {
      required: 300,
      title: 'Free Cheesy Garlic Bread Sticks',
      desc: 'Golden baked herb bread with melted cheese',
      value: 119,
    },
    {
      required: 450,
      title: 'Free Molten Lava Cake',
      desc: 'Warm cake with hot molten chocolate center',
      value: 99,
    },
    {
      required: 600,
      title: 'Free 7 Cheese Signature Pizza',
      desc: 'Authentic 7-cheese blend on golden crust',
      value: 329,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-rewards-container"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 p-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-slate-950 fill-current" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block text-slate-900">
                  7 Cheese Pizza Rewards
                </span>
                <h2 className="text-lg font-black tracking-tight leading-tight">
                  Cheesy Club Points
                </h2>
              </div>
            </div>
            <button
              id="btn-close-rewards-modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 bg-slate-950/10 backdrop-blur-xs border border-slate-950/20 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Current Cheesy Balance
              </span>
              <span className="text-3xl font-black text-slate-950 font-mono">
                {points} / 600 Pts
              </span>
            </div>
            <span className="bg-slate-950 text-amber-300 text-xs font-black px-2.5 py-1 rounded-full uppercase">
              Silver Tier
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-950/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-slate-950 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (points / 600) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            Available Rewards to Unlock
          </span>

          {TIERS.map((tier) => {
            const isUnlocked = points >= tier.required;
            return (
              <div
                key={tier.title}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  isUnlocked
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-slate-200 bg-slate-50 opacity-75'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnlocked ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {tier.title}
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-1 rounded">
                        {tier.required} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{tier.desc}</p>
                  </div>
                </div>

                <button
                  id={`btn-redeem-${tier.required}`}
                  disabled={!isUnlocked}
                  onClick={() => {
                    onRedeemReward(tier.title, tier.value);
                    onClose();
                  }}
                  className={`text-xs font-black px-3 py-1.5 rounded-xl shrink-0 transition-colors ${
                    isUnlocked
                      ? 'bg-[#e31837] text-white hover:bg-[#c4122d] shadow-xs cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isUnlocked ? 'Redeem' : `${tier.required - points} more`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
