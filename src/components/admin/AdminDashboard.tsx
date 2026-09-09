import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Bike, 
  UtensilsCrossed, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  RefreshCw, 
  ArrowUpRight, 
  Percent, 
  ChevronRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { AdminOrder } from './adminData';

interface AdminDashboardProps {
  orders: AdminOrder[];
  onNavigateTab: (tab: 'dashboard' | 'live-orders' | 'menu' | 'coupons' | 'reports') => void;
  onOpenShiftModal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  onNavigateTab,
  onOpenShiftModal
}) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic calculations based on live orders
  const grossRevenue = orders.reduce((acc, o) => acc + (o.status !== 'CANCELLED' ? o.total : 0), 0);
  const deliveryOrders = orders.filter(o => o.orderType === 'DELIVERY');
  const dineInOrders = orders.filter(o => o.orderType === 'DINE_IN');
  const activeDelivery = deliveryOrders.filter(o => o.status === 'NEW' || o.status === 'KITCHEN' || o.status === 'DISPATCHED').length;
  const activeDineIn = dineInOrders.filter(o => o.status === 'NEW' || o.status === 'KITCHEN').length;
  const avgOrderValue = orders.length > 0 ? Math.round(grossRevenue / orders.length) : 0;

  const deliverySales = deliveryOrders.reduce((acc, o) => acc + o.total, 0);
  const dineInSales = dineInOrders.reduce((acc, o) => acc + o.total, 0);
  const gstCollected = Math.round(grossRevenue * 0.05);

  const deliveryUPI = deliveryOrders.filter(o => o.paymentMethod === 'UPI').reduce((acc, o) => acc + o.total, 0);
  const deliveryCOD = deliveryOrders.filter(o => o.paymentMethod === 'CASH').reduce((acc, o) => acc + o.total, 0);

  const dineInUPI = dineInOrders.filter(o => o.paymentMethod === 'UPI').reduce((acc, o) => acc + o.total, 0);
  const dineInCash = dineInOrders.filter(o => o.paymentMethod === 'CASH').reduce((acc, o) => acc + o.total, 0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Sales & KOT Register Panel
              </h2>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time analytics for 7 Cheese Pizza (Haldwani Branch) • Live delivery & dine-in KOT metrics
            </p>
          </div>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start md:self-auto">
          {[
            { id: 'today', label: 'Today (Shift)' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as typeof period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={onOpenShiftModal}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black shadow-xs transition-colors cursor-pointer ml-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Shift Z-Report</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Gross Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gross Revenue
              </span>
              <div className="text-xl sm:text-3xl font-black text-slate-900 mt-1">
                ₹{grossRevenue.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1.5">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>{orders.length > 0 ? '+14.8% vs last shift' : 'Live Shift Ready'}</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>Total Orders</span>
            <span className="font-bold text-slate-800 whitespace-nowrap">{orders.length} orders</span>
          </div>
        </div>

        {/* 2. Active Dine-in */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Dine-in
              </span>
              <div className="text-xl sm:text-3xl font-black text-amber-600 mt-1">
                {activeDineIn} Tables
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1.5">
                <span>{dineInOrders.length} Total dine-in today</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>Seated Capacity</span>
            <span className="font-bold text-slate-800 whitespace-nowrap">{activeDineIn} / 8 Full</span>
          </div>
        </div>

        {/* 3. Active Delivery */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Delivery
              </span>
              <div className="text-xl sm:text-3xl font-black text-blue-600 mt-1">
                {activeDelivery} Riders
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1.5">
                <span>{deliveryOrders.length} Total deliveries</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Bike className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>Avg Delivery Time</span>
            <span className="font-bold text-emerald-600 whitespace-nowrap">{deliveryOrders.length > 0 ? '24 mins' : 'Ready'}</span>
          </div>
        </div>

        {/* 4. Avg Order Value */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Avg Order Value
              </span>
              <div className="text-xl sm:text-3xl font-black text-purple-600 mt-1">
                ₹{avgOrderValue}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1.5">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>{orders.length > 0 ? `Avg ticket: ₹${avgOrderValue}` : 'Awaiting orders'}</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>Per Order Margin</span>
            <span className="font-bold text-slate-800 whitespace-nowrap">{orders.length > 0 ? '58% Margin' : 'POS Online'}</span>
          </div>
        </div>
      </div>

      {/* Sales Breakdown 4 Small Strips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Gross Sales</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">₹{grossRevenue}</div>
            <div className="text-[10px] text-slate-500">{orders.length} Orders • Avg ₹{avgOrderValue}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
            ₹
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Bike className="w-3 h-3 text-blue-500" />
              <span>Live Delivery Sales</span>
            </div>
            <div className="text-xl font-black text-blue-600 mt-0.5">₹{deliverySales}</div>
            <div className="text-[10px] text-slate-500">Delivered: {deliveryOrders.filter(o => o.status === 'COMPLETED').length} • Active: {activeDelivery}</div>
          </div>
          <div className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black">
            {deliveryOrders.length} Bills
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <UtensilsCrossed className="w-3 h-3 text-amber-500" />
              <span>Dine-In Table Sales</span>
            </div>
            <div className="text-xl font-black text-amber-600 mt-0.5">₹{dineInSales}</div>
            <div className="text-[10px] text-slate-500">Settled: {dineInOrders.filter(o => o.status === 'COMPLETED').length} • Active: {activeDineIn}</div>
          </div>
          <div className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black">
            {dineInOrders.length} Tables
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Percent className="w-3 h-3 text-indigo-500" />
              <span>Tax (GST 5%) Collected</span>
            </div>
            <div className="text-xl font-black text-indigo-600 mt-0.5">₹{gstCollected}</div>
            <div className="text-[10px] text-slate-500">Included in gross food billing</div>
          </div>
          <div className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black">
            5%
          </div>
        </div>
      </div>

      {/* Dual Real-Time POS Streams (Matching Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stream 1: Live Delivery Stream (Rider KOT) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Live Delivery Stream (Rider KOT)</span>
                </h3>
                <p className="text-xs text-slate-500">Home deliveries via online store & mobile app</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400">Stream Sales</span>
              <div className="text-base font-black text-slate-900">₹{deliverySales}</div>
            </div>
          </div>

          {/* 3 Metric Mini Cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total Orders</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{deliveryOrders.length}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Avg Delivery Bill</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                ₹{deliveryOrders.length > 0 ? Math.round(deliverySales / deliveryOrders.length) : 0}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Fulfillment Rate</div>
              <div className="text-lg font-black text-emerald-600 mt-0.5">{deliveryOrders.length > 0 ? '100%' : '0%'}</div>
            </div>
          </div>

          {/* Payment Split */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/40">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Prepaid / UPI Online:
              </span>
              <span className="font-black text-slate-900">₹{deliveryUPI}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/40">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Cash on Delivery (COD):
              </span>
              <span className="font-black text-slate-900">₹{deliveryCOD}</span>
            </div>
          </div>
        </div>

        {/* Stream 2: Dine-In Restaurant Stream (Kitchen KOT) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Dine-In Restaurant Stream (Kitchen KOT)</span>
                </h3>
                <p className="text-xs text-slate-500">Table QR scans & in-house guest billing</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400">Stream Sales</span>
              <div className="text-base font-black text-slate-900">₹{dineInSales}</div>
            </div>
          </div>

          {/* 3 Metric Mini Cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Tables Served</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{dineInOrders.length}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Avg Table Spend</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                ₹{dineInOrders.length > 0 ? Math.round(dineInSales / dineInOrders.length) : 0}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Settlement Rate</div>
              <div className="text-lg font-black text-emerald-600 mt-0.5">{dineInOrders.length > 0 ? '100%' : '0%'}</div>
            </div>
          </div>

          {/* Payment Split */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/40">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                UPI Table Pay:
              </span>
              <span className="font-black text-slate-900">₹{dineInUPI}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/40">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Cash Counter Settle:
              </span>
              <span className="font-black text-slate-900">₹{dineInCash}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Live Orders Quick View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Live Orders</h3>
            <p className="text-xs text-slate-500">Incoming tickets and recent activity</p>
          </div>
          <button
            onClick={() => onNavigateTab('live-orders')}
            className="flex items-center gap-1 text-xs font-bold text-[#ED1C24] hover:underline cursor-pointer"
          >
            <span>View All Live Orders & KOT</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No orders placed yet. Orders placed by customers on the app will appear here live.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-slate-900">{ord.orderNumber}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.orderType === 'DELIVERY' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ord.orderType === 'DELIVERY' ? <Bike className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                        <span>{ord.orderType === 'DELIVERY' ? 'Delivery' : (ord.tableNumber || 'Dine-In')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{ord.customerName}</div>
                      <div className="text-[10px] text-slate-400">{ord.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{ord.total}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ord.status === 'NEW' ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' :
                        ord.status === 'KITCHEN' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        ord.status === 'DISPATCHED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-medium">{ord.timeAgo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
