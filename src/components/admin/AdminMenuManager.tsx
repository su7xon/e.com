import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Image as ImageIcon, 
  Pizza,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { MenuItem, MenuCategoryType } from '../../types';
import { PRESET_PIZZA_IMAGES } from './adminData';
import { optimizeImage, blobToDataURL } from '../../lib/imageOptimize';
import { isLocalPhoto } from '../../lib/imageUpload';

interface AdminMenuManagerProps {
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export const AdminMenuManager: React.FC<AdminMenuManagerProps> = ({
  menuItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    category: 'signature-7-cheese',
    isVeg: true,
    price: 299,
    originalPrice: 399,
    description: '',
    image: PRESET_PIZZA_IMAGES[0].url,
    badge: 'NEW',
    isCustomizable: true,
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'signature-7-cheese', label: '7 Cheese Special' },
    { id: 'veg-pizza', label: 'Veg Pizzas' },
    { id: 'non-veg-pizza', label: 'Non-Veg Pizzas' },
    { id: 'burgers', label: 'Burgers' },
    { id: 'wraps', label: 'Wraps' },
    { id: 'sides', label: 'Sides & Breads' },
    { id: 'drinks', label: 'Beverages' },
    { id: 'desserts', label: 'Desserts' },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const resetUploadState = () => {
    setIsUploading(false);
    setUploadPct(0);
    setUploadNote(null);
    setUploadError(null);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    resetUploadState();
    setFormData({
      name: '',
      category: 'signature-7-cheese',
      isVeg: true,
      price: 299,
      originalPrice: 399,
      description: '',
      image: PRESET_PIZZA_IMAGES[0].url,
      badge: 'NEW',
      isCustomizable: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    resetUploadState();
    setFormData(item);
    setIsAddModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadPct(20);
    setUploadError(null);
    setUploadNote('Photo 200-300KB me optimize ho rahi...');
    try {
      // 200-300KB optimize (browser me, turant) → data URL → Firestore doc me save hoga
      const optimized = await optimizeImage(file);
      setUploadPct(70);
      setUploadNote(`Optimize done (${optimized.sizeKB}KB) — photo taiyaar...`);
      const dataUrl = await blobToDataURL(optimized.blob);
      setUploadPct(100);
      setUploadNote(`Ready! ${optimized.sizeKB}KB — Publish dabate hi Firestore me save hoga.`);
      setFormData((prev) => ({ ...prev, image: dataUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Photo add fail ho gaya.');
      setUploadNote(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.price) return;

    if (editingItem) {
      // Update existing
      onUpdateItem({
        ...editingItem,
        ...formData,
      } as MenuItem);
    } else {
      // Add new
      const newItem: MenuItem = {
        id: `custom-${Date.now()}`,
        name: formData.name.trim(),
        category: (formData.category || 'signature-7-cheese') as MenuCategoryType,
        isVeg: formData.isVeg ?? true,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        description: formData.description?.trim() || 'Delicious artisanal preparation made fresh with authentic ingredients.',
        image: formData.image || PRESET_PIZZA_IMAGES[0].url,
        badge: formData.badge as MenuItem['badge'],
        isCustomizable: formData.isCustomizable ?? true,
        defaultSize: 'Medium',
        defaultCrust: 'New Hand Tossed',
      };
      onAddItem(newItem);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Add Item Button */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Menu Catalog & Stock Manager
            </h2>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-black">
              {menuItems.length} Total Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add new pizzas, burgers, wraps, drinks and manage pricing & live availability
          </p>
        </div>

        <button
          id="btn-admin-add-item"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm shadow-red-500/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Menu Item</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name..."
            className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] shadow-xs"
          />
        </div>
      </div>

      {/* Items Table (desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3">Badge Tag</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Image & Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          if (!el.src.endsWith('/images/seven_cheese_pizza_1788869697088.jpg')) {
                            el.src = '/images/seven_cheese_pizza_1788869697088.jpg';
                          }
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 line-clamp-1">{item.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {item.category.replace(/-/g, ' ')}
                    </span>
                  </td>

                  {/* Veg / Non-Veg */}
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.isVeg ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3">
                    <div className="font-black text-slate-900 text-sm">₹{item.price}</div>
                    {item.originalPrice && (
                      <div className="text-[10px] text-slate-400 line-through">₹{item.originalPrice}</div>
                    )}
                  </td>

                  {/* Badge */}
                  <td className="py-3 px-3">
                    {item.badge ? (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                        {item.badge}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${item.name}" from catalog?`)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Items Cards (mobile) */}
      <div className="md:hidden space-y-2.5">
        {filteredItems.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
            Koi item nahi mila. Search ya category badlo.
          </div>
        )}
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 flex items-center gap-3"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                if (!el.src.endsWith('/images/seven_cheese_pizza_1788869697088.jpg')) {
                  el.src = '/images/seven_cheese_pizza_1788869697088.jpg';
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-bold text-slate-900 text-xs truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="capitalize px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold">
                  {item.category.replace(/-/g, ' ')}
                </span>
                {item.badge && (
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-black text-slate-900 text-sm">₹{item.price}</span>
                {item.originalPrice && (
                  <span className="text-[10px] text-slate-400 line-through">₹{item.originalPrice}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-2 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Edit Item"
                aria-label={`Edit ${item.name}`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${item.name}" from catalog?`)) {
                    onDeleteItem(item.id);
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 active:bg-red-50 text-slate-400 active:text-red-600 transition-colors cursor-pointer"
                title="Delete Item"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <Pizza className="w-5 h-5 text-[#ED1C24]" />
              <span>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Items added here will immediately appear in the customer store for ordering.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Truffle Mushroom 7 Cheese Pizza"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                />
              </div>

              {/* Category & Veg/Non-Veg */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuCategoryType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  >
                    <option value="signature-7-cheese">7 Cheese Special</option>
                    <option value="veg-pizza">Veg Pizza</option>
                    <option value="non-veg-pizza">Non-Veg Pizza</option>
                    <option value="burgers">Burgers</option>
                    <option value="wraps">Wraps</option>
                    <option value="sides">Sides & Breads</option>
                    <option value="drinks">Drinks & Shakes</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dietary Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVeg: true })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        formData.isVeg ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Veg 🟢
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVeg: false })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        !formData.isVeg ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Non-Veg 🔴
                    </button>
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="299"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    placeholder="399"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                <div className="flex flex-wrap gap-1.5">
                  {['NEW', 'BESTSELLER', 'CHEF SPECIAL', '7 CHEESE', 'MUST TRY'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormData({ ...formData, badge: b as MenuItem['badge'] })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                        formData.badge === b
                          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload (device photo, no server) + URL & Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Photo <span className="text-slate-400 font-medium">(auto 200-300KB, Firestore me save)</span>
                </label>

                {/* Live preview */}
                {formData.image ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 mb-2 bg-slate-100">
                    <img
                      src={formData.image}
                      alt="preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-black">{uploadPct}%{uploadNote ? ` — ${uploadNote}` : ''}</span>
                        <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 transition-all"
                            style={{ width: `${uploadPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 mb-2">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[11px] font-bold">Koi photo nahi — upload karo ya URL dalo</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploading ? 'Optimize...' : 'Device se Photo Lagao'}</span>
                  </button>
                  {isLocalPhoto(formData.image) && !isUploading && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Firestore Ready
                    </span>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-start gap-1.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-2.5 py-2 mb-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://... (ya upar se upload karo)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] mb-2"
                />
                <div className="text-[10px] text-slate-400 mb-1">Or choose a high-quality preset photo:</div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PIZZA_IMAGES.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: p.url })}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                        formData.image === p.url
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients, toppings, and taste notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-[#ED1C24] hover:bg-[#c91430] text-white py-2.5 rounded-xl text-xs font-black shadow-md shadow-red-500/20 transition-all cursor-pointer"
                >
                  {editingItem ? 'Save Item Changes' : 'Publish to Store Menu'}
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
