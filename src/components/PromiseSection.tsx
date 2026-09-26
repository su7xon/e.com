import React from 'react';
import { BadgePercent, Gift, Wheat, Flame, Bike, Sparkles } from 'lucide-react';

interface PromiseSectionProps {
  onOpenDeals: () => void;
  onOpenRewards: () => void;
  onBrowseMenu: () => void;
}

interface PromiseCard {
  id: string;
  ribbon: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  action: 'deals' | 'rewards' | 'menu';
  actionLabel: string;
}

const CARDS: PromiseCard[] = [
  {
    id: 'lowest-pricing',
    ribbon: 'ONLY ON 7 CHEESE APP!',
    icon: <BadgePercent className="w-10 h-10 text-amber-500" />,
    iconBg: 'bg-amber-50',
    title: 'Lowest Pricing',
    subtitle: 'No Surge Fees, No Surprises',
    action: 'deals',
    actionLabel: 'Know More',
  },
  {
    id: 'rewards-offers',
    ribbon: 'ONLY ON 7 CHEESE APP!',
    icon: <Gift className="w-10 h-10 text-amber-500" />,
    iconBg: 'bg-amber-50',
    title: 'Rewards & Offers',
    subtitle: 'Earn Cheesy Rewards to Grab your Free Pizza!',
    action: 'rewards',
    actionLabel: 'Know More',
  },
  {
    id: 'authentic-flavour',
    ribbon: '7 ARTISANAL CHEESES!',
    icon: <Wheat className="w-10 h-10 text-amber-500" />,
    iconBg: 'bg-amber-50',
    title: 'Authentic Flavour',
    subtitle: 'Real Mozzarella, Cheddar & Gouda in Every Bite!',
    action: 'menu',
    actionLabel: 'Know More',
  },
  {
    id: 'freshly-baked',
    ribbon: 'BAKED ON ORDER!',
    icon: <Flame className="w-10 h-10 text-amber-500" />,
    iconBg: 'bg-amber-50',
    title: 'Freshly Baked, Not Frozen',
    subtitle: 'Pizza Baked on Order by Experts, Served Piping Hot!',
    action: 'menu',
    actionLabel: 'Know More',
  },
  {
    id: 'delivery-experts',
    ribbon: '30-MIN GUARANTEE!',
    icon: <Bike className="w-10 h-10 text-amber-500" />,
    iconBg: 'bg-amber-50',
    title: 'Pizza Delivery Experts',
    subtitle: 'Delivered by Our Own Riders — Hot, Fresh & Perfectly Packed!',
    action: 'menu',
    actionLabel: 'Know More',
  },
];

export const PromiseSection: React.FC<PromiseSectionProps> = ({
  onOpenDeals,
  onOpenRewards,
  onBrowseMenu,
}) => {
  const handleAction = (action: PromiseCard['action']) => {
    if (action === 'deals') onOpenDeals();
    else if (action === 'rewards') onOpenRewards();
    else onBrowseMenu();
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 mt-10 pb-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          7 Cheese <span className="text-[#005580]">Promise</span>
        </h2>
        <Sparkles className="w-4 h-4 text-amber-400" />
      </div>
      <p className="text-sm text-slate-600 mt-0.5">
        Where <span className="font-bold text-slate-900">quality food</span> meets{' '}
        <span className="font-bold text-slate-900">lowest prices!</span>
      </p>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="snap-start shrink-0 w-64 sm:w-72 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col items-center text-center"
          >
            <span className="bg-amber-50 border-b-2 border-amber-300 text-slate-800 text-[10px] font-black px-3 py-1 rounded-b-lg tracking-wide">
              {card.ribbon}
            </span>
            <div className={`mt-3 w-20 h-20 rounded-full ${card.iconBg} flex items-center justify-center`}>
              {card.icon}
            </div>
            <h3 className="mt-3 text-base font-black text-slate-900">{card.title}</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed min-h-8">{card.subtitle}</p>
            <button
              onClick={() => handleAction(card.action)}
              className="mt-2 text-xs font-bold text-[#005580] underline decoration-dotted underline-offset-2 hover:text-[#003d5c] cursor-pointer"
            >
              {card.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
