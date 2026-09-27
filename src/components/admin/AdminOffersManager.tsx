import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit3, Trash2, X } from 'lucide-react';
import { MenuItem } from '../../types';

interface AdminOffersManagerProps {
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
}

type VegFilter = 'all' | 'veg' | 'nonveg';

const FALLBACK_IMG = '/images/seven_cheese_pizza_1788869697088.jpg';

function discountPct(price: number, mrp?: number): number | null {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

export const AdminOffersManager: React.FC<AdminOffersManagerProps> = ({
  menuItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const combos = useMemo(() => menuItems.filter((m) => m.category === 'combos'), [menuItems]);

  const [query, setQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<VegFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const [form, setForm] = useState({ name: '', price: 199, originalPrice: 299, description: '', isVeg: true, image: '' });

  const stats = useMemo(() => {
    const veg = combos.filter((c) => c.isVeg).length;
    return { total: combos.length, veg, nonveg: combos.length - veg };
  }, [combos]);

  const filtered = combos.filter((c) => {
    if (vegFilter === 'veg' && !c.isVeg) return false;
    if (vegFilter === 'nonveg' && c.isVeg) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', price: 199, originalPrice: 299, description: '', isVeg: true, image: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice ?? item.price,
      description: item.description,
      isVeg: item.isVeg,
      image: item.image,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      onUpdateItem({
        ...editing,
        name: form.name.trim(),
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || undefined,
        description: form.description.trim(),
        isVeg: form.isVeg,
        image: form.image.trim() || editing.image,
        category: 'combos',
        isCustomizable: false,
      });
    } else {
      const id = `p-combo-${Date.now()}`;
      onAddItem({
        id,
        name: form.name.trim(),
        category: 'combos',
        subCategoryTitle: 'Combo Offers',
        isVeg: form.isVeg,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || undefined,
        description: form.description.trim() || 'Value combo meal.',
        image: form.image.trim() || FALLBACK_IMG,
        isCustomizable: false,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Combos &amp; Offers</h2>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-bold">
              {stats.total} live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Value combos and limited-time offer meals shown to customers under Party Combos.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Combo Offer</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total combos', value: stats.total },
          { label: 'Veg', value: stats.veg },
          { label: 'Non-veg', value: stats.nonveg },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 px-4 py-3">
            <div className="text-xl font-bold text-slate-900 tabular-nums">{s.value}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search combos…"
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'veg', label: 'Veg' },
              { id: 'nonveg', label: 'Non-veg' },
            ] as { id: VegFilter; label: string }[]
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setVegFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                vegFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase text-[10px] font-bold tracking-wide">
              <th className="py-3 px-4">Combo</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Price</th>
              <th className="py-3 px-3">Saving</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => {
              const off = discountPct(c.price, c.originalPrice);
              return (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.image}
                        alt={c.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          if (!el.src.endsWith(FALLBACK_IMG)) el.src = FALLBACK_IMG;
                        }}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${c.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="font-bold text-slate-900 truncate">{c.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">{c.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {c.subCategoryTitle || 'Combo'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900">₹{c.price}</span>
                    {c.originalPrice && c.originalPrice > c.price && (
                      <span className="text-[11px] text-slate-400 line-through ml-1.5">₹{c.originalPrice}</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {off !== null ? (
                      <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        {off}% off
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(c)}
                        title="Edit"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${c.name}"?`)) onDeleteItem(c.id);
                        }}
                        title="Delete"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-xs text-slate-500">
            No combos found. Adjust search or add a new combo offer.
          </div>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No combos found.
          </div>
        )}
        {filtered.map((c) => {
          const off = discountPct(c.price, c.originalPrice);
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  if (!el.src.endsWith(FALLBACK_IMG)) el.src = FALLBACK_IMG;
                }}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{c.description}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-slate-900 text-sm">₹{c.price}</span>
                  {off !== null && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {off}% off
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 rounded-lg bg-slate-100 text-slate-600 cursor-pointer"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${c.name}"?`)) onDeleteItem(c.id);
                  }}
                  className="p-2 rounded-lg bg-slate-100 text-slate-400 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 relative border border-slate-200 shadow-xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-900">{editing ? 'Edit combo offer' : 'New combo offer'}</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Saved to the shared menu under Party Combos.
            </p>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Lunch Combo — Medium Veg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What's included…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={form.isVeg ? 'veg' : 'nonveg'}
                    onChange={(e) => setForm({ ...form, isVeg: e.target.value === 'veg' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="veg">Veg</option>
                    <option value="nonveg">Non-veg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                  <input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {editing ? 'Save changes' : 'Add combo'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
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
