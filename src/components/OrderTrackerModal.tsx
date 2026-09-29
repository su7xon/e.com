import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Clock, 
  Bike, 
  Phone, 
  Flame, 
  Package, 
  ChefHat, 
  MapPin, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { ActiveOrder } from '../types';

interface OrderTrackerModalProps {
  order: ActiveOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceStatus?: (nextStatus: ActiveOrder['status']) => void;
}

const STAGES = [
  {
    key: 'CONFIRMED',
    label: 'Order Confirmed',
    desc: 'Store accepted your order & assigned chef',
    icon: CheckCircle,
    color: 'text-emerald-500',
  },
  {
    key: 'PREPARING',
    label: 'Preparing & Hand-Tossing',
    desc: 'Chef tossing fresh dough & layering sauces',
    icon: ChefHat,
    color: 'text-red-500',
  },
  {
    key: 'BAKING',
    label: 'Baking in Stone Oven',
    desc: 'Baking at 300°C for bubbly golden crust',
    icon: Flame,
    color: 'text-amber-500',
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    desc: 'Delivery partner on the way in thermal hot bag',
    icon: Bike,
    color: 'text-[#e31837]',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    desc: 'Enjoy your hot cheesy 7 Cheese Pizza!',
    icon: Package,
    color: 'text-emerald-600',
  },
] as const;

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  order,
  isOpen,
  onClose,
  onAdvanceStatus,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(1);
  const [callRiderMsg, setCallRiderMsg] = useState(false);

  useEffect(() => {
    if (!order) return;
    const stageMap: Record<ActiveOrder['status'], number> = {
      CONFIRMED: 0,
      PREPARING: 1,
      BAKING: 2,
      OUT_FOR_DELIVERY: 3,
      DELIVERED: 4,
    };
    setCurrentStageIndex(stageMap[order.status] ?? 1);
  }, [order]);

  if (!isOpen || !order) return null;

  const currentStage = STAGES[currentStageIndex];

  const handleStageClick = (index: number) => {
    setCurrentStageIndex(index);
    if (onAdvanceStatus) {
      onAdvanceStatus(STAGES[index].key);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-order-tracker"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
      >
        {/* Tracker Header */}
        <div className="bg-[#18181b] text-white p-4 sm:p-5 relative border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500/40 flex items-center justify-center">
                <Bike className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
                  7 Cheese Pizza Express Tracker
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Order #{order.orderId}
                </h2>
              </div>
            </div>
            <button
              id="btn-close-tracker"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live ETA Card */}
          <div className="mt-4 bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-red-100 font-medium block">
                Estimated Delivery
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-sans tracking-tight">
                {currentStageIndex === 4 ? 'Delivered!' : `${order.estimatedMinutes} Mins`}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping" />
                Live Tracking
              </span>
              <span className="text-xs text-red-100 block mt-1 font-mono">
                Hot & Fresh
              </span>
            </div>
          </div>
        </div>

        {/* Tracker Stages Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Active Status Highlight */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-sm">
              <currentStage.icon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider block">
                Current Status
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {currentStage.label}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {currentStage.desc}
              </p>
            </div>
          </div>

          {/* Interactive Steps Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Order Milestones
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                (Click any step to test tracker status)
              </span>
            </div>

            <div className="space-y-3 relative pl-2">
              {/* Vertical line connecting steps */}
              <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-slate-200 -z-0" />

              {STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const IconComponent = stage.icon;

                return (
                  <button
                    key={stage.key}
                    id={`btn-tracker-step-${idx}`}
                    onClick={() => handleStageClick(idx)}
                    className={`w-full flex items-start gap-3 p-2 rounded-xl text-left transition-all z-10 relative cursor-pointer ${
                      isCurrent
                        ? 'bg-red-50/80 border border-red-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                        isCurrent
                          ? 'border-[#ED1C24] bg-[#ED1C24] text-white ring-4 ring-red-100 scale-110'
                          : isPassed
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      <IconComponent className="w-3 h-3" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold leading-tight ${
                            isCurrent
                              ? 'text-[#ED1C24] font-black'
                              : isPassed
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                            NOW
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {stage.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Rider Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-700 shrink-0">
                🛵
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                    {order.riderName}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 rounded">
                    4.9 ★
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Delivery Partner • Contactless Delivery
                </span>
              </div>
            </div>

            <button
              id="btn-call-rider"
              onClick={() => {
                setCallRiderMsg(true);
                setTimeout(() => setCallRiderMsg(false), 3000);
              }}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </button>
          </div>

          {callRiderMsg && (
            <div className="bg-emerald-100 text-emerald-900 p-2.5 rounded-xl text-xs font-semibold text-center animate-in fade-in">
              Connecting call to {order.riderName} ({order.riderPhone})...
            </div>
          )}

          {/* Order Items Snapshot */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Items ({order.items.length})
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                Paid: ₹{order.total}
              </span>
            </div>

            {order.items.map((it) => (
              <div key={it.cartItemId} className="flex justify-between text-xs text-slate-600">
                <span className="truncate">
                  {it.quantity}x {it.name} {it.size ? `(${it.size})` : ''}
                </span>
                <span className="font-mono font-semibold shrink-0">
                  ₹{it.price * it.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Destination */}
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Delivering to: </span>
              <span>{order.address}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            id="btn-tracker-done"
            onClick={onClose}
            className="bg-[#ED1C24] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-[#c91430] transition-colors"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
