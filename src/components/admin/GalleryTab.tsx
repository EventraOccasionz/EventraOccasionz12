import React, { useState } from 'react';
import { GalleryItem } from '../../types';
import { ArrowUp, ArrowDown, Eye, EyeOff, Edit, Trash2, Plus, XCircle, Upload, Save, Loader2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryTabProps {
  filteredGallery: GalleryItem[];
  gallery: GalleryItem[];
  handleShiftGalleryOrder: (index: number, direction: 'up' | 'down') => Promise<void>;
  toggleGalleryVisibility: (item: GalleryItem) => Promise<void>;
  handleDeleteGallery: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function GalleryTab({
  filteredGallery,
  gallery,
  handleShiftGalleryOrder,
  toggleGalleryVisibility,
  handleDeleteGallery,
  onRefresh
}: GalleryTabProps) {
  const [modal, setModal] = useState<{ show: boolean; mode: 'add' | 'edit'; data: Partial<GalleryItem> | null }>({
    show: false,
    mode: 'add',
    data: null
  });
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.data?.lbl) return;

    try {
      if (modal.mode === 'add') {
        await dataService.addGalleryItem(modal.data);
      } else {
        await dataService.updateGalleryItem(modal.data.id!, modal.data);
      }
      setModal({ show: false, mode: 'add', data: null });
      onRefresh();
    } catch (err) {
      alert('Save failed: ' + err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await dataService.uploadImage(file);
      setModal(prev => ({ ...prev, data: { ...prev.data, image_url: url } }));
    } catch (err) {
      alert('Upload failed: ' + err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setModal({ show: true, mode: 'add', data: { cat: 'wedding', visible: true, order_index: gallery.length } })}
          className="px-6 py-3 bg-gold text-dark text-[0.65rem] uppercase tracking-widest font-bold flex items-center gap-2 rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} /> Asset Upload
        </button>
      </div>

      <div className="overflow-x-auto">
        <table id="admin-gallery-table" className="w-full border-collapse min-w-[850px]">
          <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10">
            <tr>
              <th className="text-left py-4 px-4">Reorder</th>
              <th className="text-left py-4 px-4">Thumbnail Asset</th>
              <th className="text-left py-4 px-4">Category</th>
              <th className="text-left py-4 px-4">Display Status</th>
              <th className="text-right py-4 px-4">Control</th>
            </tr>
          </thead>
          <tbody className="text-xs text-text-secondary">
            {filteredGallery.map((item, index) => {
              const actualIndex = gallery.findIndex(g => g.id === item.id);
              return (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <button 
                        disabled={actualIndex === 0}
                        onClick={() => handleShiftGalleryOrder(actualIndex, 'up')}
                        className="p-1 text-text-secondary hover:text-gold disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        disabled={actualIndex === gallery.length - 1}
                        onClick={() => handleShiftGalleryOrder(actualIndex, 'down')}
                        className="p-1 text-text-secondary hover:text-gold disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <span className="font-mono text-[10px] text-text-secondary/40 ml-1">#{item.order_index}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0 border border-white/10 relative">
                        {item.image_url ? (
                          <img src={item.image_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full animate-pulse" style={{ background: item.bg || 'linear-gradient(135deg,#2a1c10,#1a1008)' }} />
                        )}
                      </div>
                      <p className="text-cream text-sm font-serif font-medium">{item.lbl}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 uppercase tracking-widest text-[10px] text-gold">{item.cat}</td>
                  <td className="py-4 px-4">
                    <button 
                      onClick={() => toggleGalleryVisibility(item)}
                      className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest cursor-pointer ${
                        item.visible !== false ? 'text-green-400' : 'text-red-400 opacity-60'
                      }`}
                    >
                      {item.visible !== false ? (
                        <><Eye size={12} /> Live</>
                      ) : (
                        <><EyeOff size={12} /> Stashed</>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setModal({ show: true, mode: 'edit', data: item })}
                        className="p-2 text-text-secondary hover:text-gold hover:bg-white/5 rounded cursor-pointer"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteGallery(item.id)}
                        className="p-2 text-text-secondary hover:text-red-400 hover:bg-white/5 rounded cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setModal({ show: false, mode: 'add', data: null })}
               className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#121212] border border-gold/30 p-8 z-[5001] rounded-2xl shadow-2xl"
            >
              <button onClick={() => setModal({ show: false, mode: 'add', data: null })} className="absolute top-6 right-6 text-text-secondary hover:text-gold cursor-pointer"><XCircle size={24} /></button>
              <h3 className="font-serif text-2xl text-gold mb-6 italic">
                {modal.mode === 'add' ? 'Add Showcase Asset' : 'Edit Showcase Item'}
              </h3>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6rem] uppercase tracking-widest text-gold/80 font-mono">Classification</label>
                  <select 
                    value={modal.data?.cat}
                    onChange={e => setModal(prev => ({ ...prev, data: { ...prev.data, cat: e.target.value } }))}
                    className="bg-white/5 border border-white/10 p-3 text-cream rounded-lg text-xs outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday</option>
                    <option value="corporate">Corporate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[0.6rem] uppercase tracking-widest text-text-secondary font-mono">Moment Title / Label</label>
                  <input 
                    required type="text"
                    placeholder="e.g. Royal Wedding Decor"
                    className="bg-white/5 border border-white/10 p-3 text-cream rounded-lg outline-none focus:border-gold text-sm"
                    value={modal.data?.lbl || ''}
                    onChange={e => setModal(prev => ({ ...prev, data: { ...prev.data, lbl: e.target.value } }))}
                  />
                </div>

                <div className="bg-black/40 border border-dashed border-gold/20 p-6 rounded-xl flex flex-col items-center justify-center gap-3">
                  <label className="text-xs uppercase tracking-widest text-gold cursor-pointer bg-white/5 px-4 py-2 border border-gold/20 rounded hover:bg-gold/10 transition-colors">
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : 'Choose Image File'}
                    <input 
                      type="file" accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden" disabled={uploading}
                    />
                  </label>
                  
                  {modal.data?.image_url ? (
                    <div className="mt-2 text-center">
                      <div className="w-32 h-20 rounded overflow-hidden mx-auto border border-white/10 shadow-lg">
                        <img src={modal.data.image_url} className="w-full h-full object-cover" alt="" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-text-secondary/60">No image uploaded</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-text-secondary font-mono">Sort Priority</label>
                    <input 
                      type="number" 
                      className="bg-white/5 border border-white/10 p-3 text-cream text-xs rounded-lg outline-none focus:border-gold"
                      value={modal.data?.order_index}
                      onChange={e => setModal(prev => ({ ...prev, data: { ...prev.data, order_index: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      type="checkbox" id="vis_check"
                      className="accent-gold h-4 w-4 rounded cursor-pointer"
                      checked={modal.data?.visible !== false}
                      onChange={e => setModal(prev => ({ ...prev, data: { ...prev.data, visible: e.target.checked } }))}
                    />
                    <label htmlFor="vis_check" className="text-[10px] uppercase tracking-widest text-gold cursor-pointer">Live on Site</label>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-gold text-dark text-xs uppercase tracking-[0.2em] font-bold mt-4 hover:brightness-110 transition-all rounded-lg flex items-center justify-center gap-2 shadow-xl cursor-pointer">
                   <Save size={16} /> Save Asset
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
