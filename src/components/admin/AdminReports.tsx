import React from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  DollarSign, 
  Bike, 
  UtensilsCrossed, 
  Receipt, 
  TrendingUp,
  Percent,
  X
} from 'lucide-react';
import { AdminOrder } from './adminData';

interface AdminReportsProps {
  orders: AdminOrder[];
  isOpen: boolean;
  onClose: () => void;
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  orders,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const grossSales = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.total : 0), 0);
  const deliveryOrders = orders.filter(o => o.orderType === 'DELIVERY' && o.status !== 'CANCELLED');
  const dineInOrders = orders.filter(o => o.orderType === 'DINE_IN' && o.status !== 'CANCELLED');

  const deliveryTotal = deliveryOrders.reduce((sum, o) => sum + o.total, 0);
  const dineInTotal = dineInOrders.reduce((sum, o) => sum + o.total, 0);

  const gstCollected = Math.round(grossSales * 0.05);
  const upiTotal = orders.filter(o => o.paymentMethod === 'UPI' && o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
  const cashTotal = orders.filter(o => o.paymentMethod === 'CASH' && o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#ED1C24] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
                Z-REPORT
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                End-of-Shift Register Report
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              7 Cheese Pizza (Haldwani Branch) • Shift Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Financial Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Gross Sales</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">₹{grossSales.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-1">100% Settle</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Delivery Sales</div>
            <div className="text-lg font-black text-blue-600 mt-0.5">₹{deliveryTotal.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-500 mt-1">{deliveryOrders.length} orders</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Dine-in Sales</div>
            <div className="text-lg font-black text-amber-600 mt-0.5">₹{dineInTotal.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-500 mt-1">{dineInOrders.length} tables</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase">GST 5%</div>
            <div className="text-lg font-black text-indigo-600 mt-0.5">₹{gstCollected}</div>
            <div className="text-[10px] text-slate-500 mt-1">Included</div>
          </div>
        </div>

        {/* Payment Settlement Split */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-5">
          <div className="text-xs font-bold text-slate-700 mb-3">Tender & Payment Settlement</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-800">Online UPI / Card</div>
                <div className="text-[10px] text-slate-400">Direct Merchant Bank Credit</div>
              </div>
              <div className="text-sm font-black text-emerald-600">₹{upiTotal}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-800">Cash in Drawer</div>
                <div className="text-[10px] text-slate-400">To be physically deposited</div>
              </div>
              <div className="text-sm font-black text-amber-600">₹{cashTotal}</div>
            </div>
          </div>
        </div>

        {/* Order Ledger snippet */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
          <div className="bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-slate-200">
            Shift Orders Ledger ({orders.length} transactions)
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
            {orders.map((o) => (
              <div key={o.id} className="px-4 py-2 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-800">{o.orderNumber}</span>
                  <span className="text-slate-400 ml-2">({o.customerName})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500">{o.paymentMethod}</span>
                  <span className="font-black text-slate-900">₹{o.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] text-white py-3 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Shift Z-Report</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
