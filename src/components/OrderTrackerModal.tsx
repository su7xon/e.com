import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  Bike,
  ChefHat,
  Store,
  Home,
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

// Three customer-facing steps; kitchen sub-states (preparing / baking) collapse into one.
const STAGES = [
  {
    key: 'CONFIRMED',
    label: 'Order placed',
    desc: 'We have received your order',
    icon: CheckCircle,
  },
  {
    key: 'PREPARING',
    label: 'Restaurant accepted & preparing',
    desc: 'Your food is being prepared fresh',
    icon: ChefHat,
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for delivery',
    desc: 'Your order is on the way',
    icon: Bike,
  },
] as const;

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(1);
  // Ticks so the countdown stays current while the tracker is open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isOpen) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [isOpen]);

  useEffect(() => {
    if (!order) return;
    const stageMap: Record<ActiveOrder['status'], number> = {
      CONFIRMED: 0,
      PREPARING: 1,
      BAKING: 1,
      OUT_FOR_DELIVERY: 2,
      DELIVERED: 2,
    };
    setCurrentStageIndex(stageMap[order.status] ?? 0);
  }, [order]);

  if (!isOpen || !order) return null;

  const currentStage = STAGES[currentStageIndex];
  const isDelivered = order.status === 'DELIVERED';
  const isOnTheWay = order.status === 'OUT_FOR_DELIVERY';
  const minutesLeft = order.deliverBy
    ? Math.ceil((order.deliverBy - now) / 60_000)
    : order.estimatedMinutes;
  const etaText = isDelivered
    ? 'Delivered!'
    : minutesLeft <= 0
    ? 'Any minute now'
    : `${minutesLeft} min${minutesLeft === 1 ? '' : 's'}`;

  return (
    <div className="fixed inset-0 z-[58] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
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

          {/* ETA + store → home animation (illustrative; only the time is calculated) */}
          <div className="mt-4 bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 sm:p-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-red-100 font-medium block">
                  {isDelivered ? 'Your order' : isOnTheWay ? 'Arriving in' : 'Estimated delivery'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-sans tracking-tight">{etaText}</span>
              </div>
              <span className="text-[11px] text-red-100 text-right max-w-[45%]">
                {isDelivered ? 'Enjoy your meal!' : isOnTheWay ? 'Rider is on the way' : 'Rider leaves once your food is ready'}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0" title="Restaurant">
                <Store className="w-4 h-4 text-white" />
              </span>
              <div className="relative flex-1 h-8">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/30" />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg ${
                    isOnTheWay ? 'tracker-ride' : ''
                  }`}
                  style={isOnTheWay ? undefined : { left: isDelivered ? 'calc(100% - 2rem)' : '0%' }}
                >
                  <Bike className="w-4 h-4" />
                </div>
              </div>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDelivered ? 'bg-emerald-400 text-slate-900' : 'bg-white/15 text-white'}`}
                title="Your address"
              >
                <Home className="w-4 h-4" />
              </span>
            </div>
            <style>{`
              @keyframes tracker-ride { 0% { left: 0% } 85% { left: calc(100% - 2rem) } 100% { left: calc(100% - 2rem) } }
              .tracker-ride { animation: tracker-ride 4s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) { .tracker-ride { animation: none; left: 50%; } }
            `}</style>
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
            </div>

            <div className="space-y-3 relative pl-2">
              {/* Vertical line connecting steps */}
              <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-slate-200 -z-0" />

              {STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const IconComponent = stage.icon;

                return (
                  <div
                    key={stage.key}
                    id={`tracker-step-${idx}`}
                    className={`w-full flex items-start gap-3 p-2 rounded-xl text-left transition-all z-10 relative ${
                      isCurrent ? 'bg-red-50/80 border border-red-200' : ''
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
                  </div>
                );
              })}
            </div>
          </div>

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
