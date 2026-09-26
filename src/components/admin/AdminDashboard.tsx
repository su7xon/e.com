import React, { useState } from 'react';
import { AdminOrder, formatTimeAgo } from './adminData';

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

  const grossRevenue = orders.reduce((acc, o) => acc + (o.status !== 'CANCELLED' ? o.total : 0), 0);
  const deliveryOrders = orders.filter(o => o.orderType === 'DELIVERY');
  const dineInOrders = orders.filter(o => o.orderType === 'DINE_IN');
  const activeDelivery = deliveryOrders.filter(o => o.status === 'NEW' || o.status === 'KITCHEN' || o.status === 'DISPATCHED').length;
  const activeDineIn = dineInOrders.filter(o => o.status === 'NEW' || o.status === 'KITCHEN').length;
  const avgOrderValue = orders.length > 0 ? Math.round(grossRevenue / orders.length) : 0;

  const deliverySales = deliveryOrders.reduce((acc, o) => acc + o.total, 0);
  const dineInSales = dineInOrders.reduce((acc, o) => acc + o.total, 0);
  const gstCollected = Math.round(grossRevenue * 0.05);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">Today's Sales</h2>
          <p className="text-[11px] text-slate-500">
            {orders.length} orders • Live updating
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="text-[11px] font-medium border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={onOpenShiftModal}
            className="text-[11px] font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg cursor-pointer"
          >
            Day Close Report
          </button>
        </div>
      </div>

      {/* 4 numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="text-[11px] text-slate-500">Total Sale</div>
          <div className="text-xl font-bold text-slate-900 leading-tight">₹{grossRevenue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500">{orders.length} orders</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="text-[11px] text-slate-500">Dine-In (Running)</div>
          <div className="text-xl font-bold text-slate-900 leading-tight">{activeDineIn}</div>
          <div className="text-[11px] text-slate-500">{dineInOrders.length} tables today</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="text-[11px] text-slate-500">Delivery (Running)</div>
          <div className="text-xl font-bold text-slate-900 leading-tight">{activeDelivery}</div>
          <div className="text-[11px] text-slate-500">{deliveryOrders.length} deliveries today</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="text-[11px] text-slate-500">Average Bill</div>
          <div className="text-xl font-bold text-slate-900 leading-tight">₹{avgOrderValue}</div>
          <div className="text-[11px] text-slate-500">per order</div>
        </div>
      </div>

      {/* Sale split */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5">
          <div className="text-[11px] text-slate-500">Delivery Sale</div>
          <div className="text-base font-bold text-slate-900 leading-tight">₹{deliverySales}</div>
          <div className="text-[11px] text-slate-500">{deliveryOrders.length} bills</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5">
          <div className="text-[11px] text-slate-500">Dine-In Sale</div>
          <div className="text-base font-bold text-slate-900 leading-tight">₹{dineInSales}</div>
          <div className="text-[11px] text-slate-500">{dineInOrders.length} tables</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5">
          <div className="text-[11px] text-slate-500">GST (5%)</div>
          <div className="text-base font-bold text-slate-900 leading-tight">₹{gstCollected}</div>
          <div className="text-[11px] text-slate-500">included in bill</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5">
          <div className="text-[11px] text-slate-500">Total Orders</div>
          <div className="text-base font-bold text-slate-900 leading-tight">{orders.length}</div>
          <div className="text-[11px] text-slate-500">delivery + dine-in</div>
        </div>
      </div>

      {/* Delivery vs Dine-in */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="text-xs font-bold text-slate-900">Delivery <span className="font-normal text-slate-500">• Home delivery</span></h3>
            <div className="text-xs font-bold text-slate-900">₹{deliverySales}</div>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-2 text-[11px]">
            <div className="flex justify-between gap-1">
              <span className="text-slate-500">Orders</span>
              <span className="font-bold">{deliveryOrders.length}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-500">Avg bill</span>
              <span className="font-bold">₹{deliveryOrders.length > 0 ? Math.round(deliverySales / deliveryOrders.length) : 0}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-500">Running</span>
              <span className="font-bold">{activeDelivery}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="text-xs font-bold text-slate-900">Dine-In <span className="font-normal text-slate-500">• Table orders</span></h3>
            <div className="text-xs font-bold text-slate-900">₹{dineInSales}</div>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-2 text-[11px]">
            <div className="flex justify-between gap-1">
              <span className="text-slate-500">Tables</span>
              <span className="font-bold">{dineInOrders.length}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-500">Avg bill</span>
              <span className="font-bold">₹{dineInOrders.length > 0 ? Math.round(dineInSales / dineInOrders.length) : 0}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-500">Running</span>
              <span className="font-bold">{activeDineIn}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-900">Recent Orders</h3>
          <button
            onClick={() => onNavigateTab('live-orders')}
            className="text-[11px] font-bold text-slate-900 underline underline-offset-2 cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="py-1 px-2 font-medium">Order</th>
                <th className="py-1 px-2 font-medium">Type</th>
                <th className="py-1 px-2 font-medium">Customer</th>
                <th className="py-1 px-2 font-medium hidden md:table-cell">Items</th>
                <th className="py-1 px-2 font-medium">Amount</th>
                <th className="py-1 px-2 font-medium">Status</th>
                <th className="py-1 px-2 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 3).map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-1.5 px-2 font-bold">{ord.orderNumber}</td>
                    <td className="py-1.5 px-2 text-slate-600">
                      {ord.orderType === 'DELIVERY' ? 'Delivery' : (ord.tableNumber || 'Dine-In')}
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="font-medium">{ord.customerName}</span>
                      <span className="text-slate-400"> • {ord.customerPhone}</span>
                    </td>
                    <td className="py-1.5 px-2 text-slate-600 max-w-[220px] truncate hidden md:table-cell">
                      {(ord.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-1.5 px-2 font-bold">₹{ord.total}</td>
                    <td className="py-1.5 px-2 text-slate-600">{ord.status}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{formatTimeAgo(ord.id, ord.timeAgo)}</td>
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
