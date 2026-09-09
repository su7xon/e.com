import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  Percent, 
  DollarSign, 
  X,
  Copy,
  Gift,
  Flame,
  Clock
} from 'lucide-react';
import { Coupon } from '../../types';

interface AdminCouponManagerProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (code: string) => void;
}

export const AdminCouponManager: React.FC<AdminCouponManagerProps> = ({
  coupons,
  onAddCoupon,
  onDeleteCoupon
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    value: 20,
    minOrder: 299,
    maxDiscount: 100,
    tag: 'LIMITED OFFER',
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim() || !formData.value) return;

    const newCoupon: Coupon = {
      code: formData.code.trim().toUpperCase(),
      title: formData.title?.trim() || `${formData.value}% Flat Off on 7 Cheese`,
      description: formData.description?.trim() || `Valid on all pizzas above ₹${formData.minOrder || 199}.`,
      discountType: formData.discountType as 'percentage' | 'flat',
      value: Number(formData.value),
      minOrder: Number(formData.minOrder) || 199,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
      tag: formData.tag?.trim() || 'EXCLUSIVE',
    };

    onAddCoupon(newCoupon);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Add Coupon Button */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Coupons & Promo Offers Manager
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
              {coupons.length} Active Deals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage discount promo codes. New coupons immediately work at customer checkout.
          </p>
        </div>

        <button
          id="btn-admin-add-coupon"
          onClick={() => {
            setFormData({
              code: '',
              title: '',
              description: '',
              discountType: 'percentage',
              value: 25,
              minOrder: 299,
              maxDiscount: 150,
              tag: 'SPECIAL OFFER',
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm shadow-red-500/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all group relative overflow-hidden"
          >
            {/* Top Tag & Delete */}
            <div className="flex items-start justify-between">
              <span className="bg-gradient-to-r from-red-600 to-amber-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase shadow-xs">
                {c.tag || 'DEAL'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(c.code)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Copy Code"
                >
                  {copiedCode === c.code ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete coupon "${c.code}"?`)) {
                      onDeleteCoupon(c.code);
                    }
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Coupon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Coupon Code & Discount */}
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-black text-xl text-slate-900 tracking-wider">
                  {c.code}
                </span>
                <span className="text-emerald-600 text-xs font-black">
                  {c.discountType === 'percentage' ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}
                </span>
              </div>
              <div className="font-bold text-xs text-slate-800 mt-1">{c.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{c.description}</div>
            </div>

            {/* Rules / Min Order Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Min. Order: <strong className="text-slate-900">₹{c.minOrder}</strong></span>
              {c.maxDiscount && (
                <span>Max Cap: <strong className="text-slate-900">₹{c.maxDiscount}</strong></span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#ED1C24]" />
              <span>Create Promo Coupon</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter coupon details. Code will be validated live on customer checkout.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. HALDWANI50, FESTIVE7"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-black focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'flat' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.discountType === 'percentage' ? 'Discount % *' : 'Flat Value (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.value || ''}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minOrder || ''}
                    onChange={(e) => setFormData({ ...formData, minOrder: Number(e.target.value) })}
                    placeholder="299"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maxDiscount || ''}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                    placeholder="150"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
              </div>

              {/* Title & Tag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Flat 50% Off Special"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={formData.tag || ''}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                    placeholder="e.g. BEST OFFER"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Terms, exclusions, or promo details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-[#ED1C24] hover:bg-[#c91430] text-white py-2.5 rounded-xl text-xs font-black shadow-md shadow-red-500/20 transition-all cursor-pointer"
                >
                  Activate Coupon
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
