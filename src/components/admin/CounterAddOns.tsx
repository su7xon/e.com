import React from 'react';
import { X } from 'lucide-react';
import { POS_ADDONS, addOnsPrice, isPizzaSize, type AddOnChoice, type PosAddOn } from '../../data/posCatalog';

interface CounterAddOnsProps {
  name: string;
  size: string;
  baseRate: number;
  choice: AddOnChoice;
  onChange: (choice: AddOnChoice) => void;
  onClose: () => void;
}

/** Crust, extra cheese and toppings for one pizza on the bill, priced for its size. */
export const CounterAddOns: React.FC<CounterAddOnsProps> = ({ name, size, baseRate, choice, onChange, onClose }) => {
  if (!isPizzaSize(size)) return null;
  const toppings = choice.toppingIds ?? [];
  const toggleTopping = (id: string) =>
    onChange({ ...choice, toppingIds: toppings.includes(id) ? toppings.filter((t) => t !== id) : [...toppings, id] });

  const chip = (a: PosAddOn, on: boolean, onClick: () => void) => (
    <button
      key={a.id}
      id={`btn-${a.id}`}
      onClick={onClick}
      aria-pressed={on}
      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
        on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {a.name} +₹{a.prices[size]}
    </button>
  );
  const group = (title: string, kind: PosAddOn['kind']) => (
    <div>
      <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {POS_ADDONS.filter((a) => a.kind === kind).map((a) => chip(a, toppings.includes(a.id), () => toggleTopping(a.id)))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add on"
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 truncate">{name}</div>
            <div className="text-xs text-slate-500">{size}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Crust</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              id="btn-addon-hand-tossed"
              onClick={() => onChange({ ...choice, crustId: undefined })}
              aria-pressed={!choice.crustId}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                !choice.crustId ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Hand Tossed
            </button>
            {POS_ADDONS.filter((a) => a.kind === 'crust').map((a) =>
              chip(a, choice.crustId === a.id, () => onChange({ ...choice, crustId: a.id })),
            )}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Cheese</div>
          <div className="flex flex-wrap gap-1.5">
            {POS_ADDONS.filter((a) => a.kind === 'cheese').map((a) =>
              chip(a, !!choice.extraCheese, () => onChange({ ...choice, extraCheese: !choice.extraCheese })),
            )}
          </div>
        </div>

        {group('Veg toppings', 'veg-topping')}
        {group('Non-veg toppings', 'nonveg-topping')}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <span className="text-sm font-black text-slate-900">₹{baseRate + addOnsPrice(size, choice)} each</span>
          <button id="btn-addon-done" onClick={onClose} className="bg-[#ED1C24] hover:bg-[#c91430] text-white px-5 py-2 rounded-lg text-xs font-black cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
