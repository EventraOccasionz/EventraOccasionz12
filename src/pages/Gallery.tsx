import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import { GalleryItem } from '../types';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await dataService.getGallery();
        setItems(data.filter(item => item.visible !== false));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => (i.cat || '').toLowerCase() === filter);

  const categories = ['all', ...new Set(items.map(i => i.cat?.toLowerCase() || 'uncategorized'))];

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-8 md:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Portfolio</span>
          <h1 className="font-serif text-5xl md:text-7xl text-cream mb-6">
            Our <em className="italic text-gold">Gallery</em>
          </h1>
          <div className="w-16 h-[1px] bg-gold mx-auto mb-8" />
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 text-xs uppercase tracking-widest rounded-full border transition-all ${
                filter === cat
                  ? 'bg-gold text-dark border-gold font-bold hover:brightness-110'
                  : 'border-gold/20 text-text-secondary hover:border-gold/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="text-gold animate-spin" size={32} />
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelected(item)}
                className="group relative h-80 overflow-hidden rounded-xl border border-white/5 hover:border-gold/30 transition-colors duration-300 cursor-pointer"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.lbl}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: item.bg || 'linear-gradient(135deg,#2a1c10,#1a1008)' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div>
                    <span className="text-[0.55rem] tracking-[0.3em] uppercase text-gold">{item.cat}</span>
                    <h3 className="font-serif text-xl text-cream">{item.lbl}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-5xl max-h-[90vh]"
          >
            <img
              src={selected.image_url}
              alt={selected.lbl}
              className="w-full h-full object-contain hover:scale-[1.02] transition-transform duration-300"
              onClick={e => e.stopPropagation()}
            />
            <p className="text-center text-gold text-sm mt-4 uppercase tracking-widest hover:text-gold-light transition-colors">{selected.lbl}</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
