import React, { useState } from 'react';
import { X, Train, ArrowRight, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { TrainBookingInfo } from '../types';

interface TrainDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTrainDelivery: (info: TrainBookingInfo) => void;
}

export const TrainDeliveryModal: React.FC<TrainDeliveryModalProps> = ({
  isOpen,
  onClose,
  onConfirmTrainDelivery,
}) => {
  const [pnr, setPnr] = useState('2415893210');
  const [trainNumber, setTrainNumber] = useState('12040');
  const [trainName, setTrainName] = useState('Kathgodam Shatabdi Express');
  const [station, setStation] = useState('Haldwani (HDW)');
  const [coach, setCoach] = useState('C2');
  const [seat, setSeat] = useState('42');
  const [pnrVerified, setPnrVerified] = useState(true);

  if (!isOpen) return null;

  const handlePnrCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pnr.length >= 10) {
      setPnrVerified(true);
      setTrainName('Kathgodam Shatabdi Express (12040)');
      setStation('Haldwani Junction (HDW)');
    }
  };

  const handleConfirm = () => {
    onConfirmTrainDelivery({
      pnr,
      trainNumber,
      trainName,
      station,
      coach,
      seat,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-train-delivery"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-[#18181b] text-white p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                IRCTC & 7 Cheese Pizza Official Partner
              </span>
              <h2 className="text-base font-black tracking-tight">
                Deliver to Your Train Seat
              </h2>
            </div>
          </div>
          <button
            id="btn-close-train-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Get hot, oven-fresh 7 Cheese Pizza delivered directly to your train coach & seat when your train halts at the station!
            </p>
          </div>

          {/* PNR Form */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1">
              10-Digit PNR Number
            </label>
            <div className="flex gap-2">
              <input
                id="input-train-pnr"
                type="text"
                maxLength={10}
                value={pnr}
                onChange={(e) => setPnr(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit PNR"
                className="flex-1 bg-slate-100 text-sm font-mono font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
              />
              <button
                type="button"
                id="btn-verify-pnr"
                onClick={handlePnrCheck}
                className="bg-[#005580] hover:bg-[#003d5c] text-white text-xs font-black px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Fetch Details
              </button>
            </div>
          </div>

          {pnrVerified && (
            <div className="space-y-3 animate-in fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Train:</span>
                  <span className="font-bold text-slate-800">{trainName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Station:</span>
                  <span className="font-bold text-slate-800">{station}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1">
                    Coach Number
                  </label>
                  <input
                    id="input-train-coach"
                    type="text"
                    value={coach}
                    onChange={(e) => setCoach(e.target.value.toUpperCase())}
                    placeholder="e.g. B2, C1"
                    className="w-full bg-slate-100 text-sm font-bold uppercase px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1">
                    Berth / Seat No.
                  </label>
                  <input
                    id="input-train-seat"
                    type="text"
                    value={seat}
                    onChange={(e) => setSeat(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full bg-slate-100 text-sm font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Delivery confirmed at platform halt time (15 mins window)</span>
              </div>
            </div>
          )}

          <button
            id="btn-confirm-train-seat"
            onClick={handleConfirm}
            className="w-full bg-[#e31837] hover:bg-[#c4122d] text-white font-black py-3 rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed with Train Delivery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
