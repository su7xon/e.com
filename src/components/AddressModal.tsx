import React, { useState } from 'react';
import { X, MapPin, Plus, Check, Home, Briefcase, Navigation, Compass, Pencil, Trash2 } from 'lucide-react';
import { UserAddress } from '../types';
import { InteractiveMapPicker } from './InteractiveMapPicker';
import { findNearestOutlet } from './admin/outlets';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: UserAddress[];
  currentAddress: UserAddress;
  onSelectAddress: (addr: UserAddress) => void;
  onAddNewAddress: (addr: UserAddress) => void;
  onUpdateAddress: (addr: UserAddress) => void;
  onDeleteAddress: (id: string) => void;
}

const getAddressIcon = (label: string) => {
  if (label === 'Home') return Home;
  if (label === 'Work') return Briefcase;
  return MapPin;
};

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  addresses,
  currentAddress,
  onSelectAddress,
  onAddNewAddress,
  onUpdateAddress,
  onDeleteAddress,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Haldwani');
  const [pincode, setPincode] = useState('263139');
  const [landmark, setLandmark] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setLabel('Home');
    setAddressLine('');
    setCity('Haldwani');
    setPincode('263139');
    setLandmark('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const startEdit = (addr: UserAddress) => {
    setLabel(addr.label);
    setAddressLine(addr.address);
    setCity(addr.city);
    setPincode(addr.pincode);
    setLandmark(addr.landmark || '');
    setEditingId(addr.id);
    setShowAddForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) return;

    if (editingId) {
      const existing = addresses.find((a) => a.id === editingId);
      const base: UserAddress = existing ?? { id: editingId, address: '', city: '', pincode: '' } as UserAddress;
      const updated: UserAddress = {
        ...base,
        id: editingId,
        label,
        address: addressLine,
        city,
        pincode,
        landmark,
      };
      // Compute live outlet distance from the GPS pin when available, else keep the saved value
      if (typeof base.lat === 'number' && typeof base.lng === 'number') {
        updated.distanceKm = findNearestOutlet(base.lat, base.lng).distanceKm;
      }
      onUpdateAddress(updated);
      if (currentAddress.id === editingId) onSelectAddress(updated);
    } else {
      const newAddr: UserAddress = {
        id: `addr-${Date.now()}`,
        label,
        address: addressLine,
        city,
        pincode,
        landmark,
      };
      onAddNewAddress(newAddr);
      onSelectAddress(newAddr);
    }
    resetForm();
    onClose();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this saved address?')) return;
    onDeleteAddress(id);
  };

  const handleMapAddressSelect = (newAddr: UserAddress) => {
    onAddNewAddress(newAddr);
    onSelectAddress(newAddr);
    setIsMapPickerOpen(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div
          id="modal-address-container"
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-[#ED1C24] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-300" />
              <h2 className="text-base font-black tracking-tight">
                Select Delivery Location
              </h2>
            </div>
            <button
              id="btn-close-address-modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Live Map GPS Detection Banner */}
            <div className="bg-gradient-to-r from-red-50 via-amber-50/50 to-red-50 p-3 rounded-2xl border border-red-200/80 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#ED1C24] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Navigation className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 leading-tight">
                    Exact Location on Live Map
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    GPS auto-detects your doorstep & pincode
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-open-live-map-modal"
                onClick={() => setIsMapPickerOpen(true)}
                className="bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 text-white text-xs font-black px-3 py-2 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Open Map</span>
              </button>
            </div>

            {!showAddForm ? (
              <>
                <div className="space-y-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    Saved Addresses
                  </span>

                  {addresses.map((addr) => {
                    const isSelected = currentAddress.id === addr.id;
                    const Icon = getAddressIcon(addr.label);
                    // Live outlet distance: GPS pin ho to compute karo, warna saved value
                    const liveKm =
                      typeof addr.lat === 'number' && typeof addr.lng === 'number'
                        ? findNearestOutlet(addr.lat, addr.lng).distanceKm
                        : addr.distanceKm;

                    return (
                      <div
                        key={addr.id}
                        className={`w-full p-3 rounded-2xl border flex items-start justify-between gap-2 transition-all ${
                          isSelected
                            ? 'border-[#ED1C24] bg-red-50/70 ring-2 ring-[#ED1C24]'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <button
                          id={`btn-select-addr-${addr.id}`}
                          onClick={() => {
                            onSelectAddress(addr);
                            onClose();
                          }}
                          className="flex-1 flex items-start gap-3 min-w-0 text-left cursor-pointer"
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#ED1C24] text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs sm:text-sm text-slate-900">
                                {addr.label}
                              </span>
                              {liveKm !== undefined && (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  {liveKm.toFixed(1)} km away
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {addr.address}, {addr.city} - {addr.pincode}
                            </p>
                            {addr.landmark && (
                              <p className="text-[11px] text-slate-400">
                                Landmark: {addr.landmark}
                              </p>
                            )}
                          </div>
                        </button>

                        <div className="flex flex-col gap-1 shrink-0">
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#ED1C24] self-center" />
                          )}
                          <button
                            id={`btn-edit-addr-${addr.id}`}
                            onClick={() => startEdit(addr)}
                            title="Edit address"
                            aria-label="Edit address"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-[#ED1C24] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-addr-${addr.id}`}
                            onClick={() => handleDelete(addr.id)}
                            title="Delete address"
                            aria-label="Delete address"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-[#ED1C24] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    id="btn-show-add-address"
                    onClick={() => setShowAddForm(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 hover:border-[#ED1C24] text-slate-700 hover:text-[#ED1C24] p-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enter Manually</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white p-2.5 rounded-2xl text-xs font-black transition-colors cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    <span>Locate on Map</span>
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSave} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{editingId ? 'Edit Address' : 'Add New Address'}</span>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="text-xs font-black text-[#ED1C24] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Pick on Map</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        label === l
                          ? 'bg-[#ED1C24] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Complete Address
                  </label>
                  <textarea
                    id="input-new-address"
                    required
                    rows={2}
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Flat No, Building, Street, Area"
                    className="w-full bg-slate-100 text-xs p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      City
                    </label>
                    <input
                      id="input-new-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-100 text-xs p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Pincode
                    </label>
                    <input
                      id="input-new-pincode"
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-slate-100 text-xs p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    id="input-new-landmark"
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite Metro Pillar 142"
                    className="w-full bg-slate-100 text-xs p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-save-new-address"
                    className="flex-1 bg-[#ED1C24] hover:bg-[#c91430] text-white font-black py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
                  >
                    {editingId ? 'Save Changes' : 'Save & Use Address'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Interactive Map Modal */}
      <InteractiveMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectAddress={handleMapAddressSelect}
        currentAddress={currentAddress}
      />
    </>
  );
};
