import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Link2, CheckCircle2, Loader2 } from 'lucide-react';
import { CategoryItem } from '../../types';
import { BannerSlide } from '../HeroBanner';
import { optimizeImage, blobToDataURL } from '../../lib/imageOptimize';

interface AdminStoreImagesProps {
  slides: BannerSlide[];
  onUpdateSlideImage: (id: string, image: string) => void;
  categories: CategoryItem[];
  onUpdateCategoryImage: (id: string, image: string) => void;
}

export const AdminStoreImages: React.FC<AdminStoreImagesProps> = ({
  slides,
  onUpdateSlideImage,
  categories,
  onUpdateCategoryImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileTarget, setFileTarget] = useState<{ kind: 'slide' | 'category'; id: string } | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState<string | null>(null);

  const applyImage = (kind: 'slide' | 'category', id: string, image: string) => {
    if (!image.trim()) return;
    if (kind === 'slide') onUpdateSlideImage(id, image.trim());
    else onUpdateCategoryImage(id, image.trim());
    setSavedTick(`${kind}-${id}`);
    setTimeout(() => setSavedTick(null), 2000);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileTarget) return;
    const key = `${fileTarget.kind}-${fileTarget.id}`;
    setUploadingId(key);
    try {
      const optimized = await optimizeImage(file);
      const dataUrl = await blobToDataURL(optimized.blob);
      applyImage(fileTarget.kind, fileTarget.id, dataUrl);
    } catch {
      // keep old image on failure
    } finally {
      setUploadingId(null);
      setFileTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const pickFile = (kind: 'slide' | 'category', id: string) => {
    setFileTarget({ kind, id });
    // Let state settle before opening the picker
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center">
            <ImageIcon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Store Images</h2>
            <p className="text-xs text-slate-500">Landing banner, craving & category photos — changes go live instantly.</p>
          </div>
        </div>
      </div>

      {/* Landing hero slides */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <h3 className="text-sm font-black text-slate-900">Landing Page Hero Banners</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">Top carousel slides on the customer home page.</p>
        <div className="space-y-3">
          {slides.map((s) => {
            const key = `slide-${s.id}`;
            return (
              <div key={s.id} className="flex flex-col sm:flex-row gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <img
                  src={s.image}
                  alt={s.titleHighlight}
                  className="w-full sm:w-32 h-24 sm:h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {s.titlePart1} {s.titleHighlight} {s.titlePart2}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{s.badge}</div>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        defaultValue={s.image.startsWith('data:') ? '' : s.image}
                        placeholder="Paste image URL, then tick ✓"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applyImage('slide', s.id, (e.target as HTMLInputElement).value);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value.trim() !== s.image) {
                            applyImage('slide', s.id, e.target.value);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => pickFile('slide', s.id)}
                      disabled={uploadingId === key}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0"
                    >
                      {uploadingId === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Upload</span>
                    </button>
                    {savedTick === key && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Live
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories (craving + marquee share these) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <h3 className="text-sm font-black text-slate-900">Category Images</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">Used in “What are you craving for?”, “Browse Our Category” and menu headers.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((c) => {
            const key = `category-${c.id}`;
            return (
              <div key={c.id} className="flex gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-16 h-16 rounded-full object-cover border border-slate-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">{c.name}</div>
                  <div className="flex gap-2 mt-1.5">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        defaultValue={c.image.startsWith('data:') ? '' : c.image}
                        placeholder="Paste image URL"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applyImage('category', c.id, (e.target as HTMLInputElement).value);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value.trim() !== c.image) {
                            applyImage('category', c.id, e.target.value);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => pickFile('category', c.id)}
                      disabled={uploadingId === key}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0"
                    >
                      {uploadingId === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </button>
                    {savedTick === key && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Live
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
