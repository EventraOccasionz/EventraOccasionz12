import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { eventData } from '../../data/eventData';
import { dataService } from '../../lib/dataService';
import { Category } from '../../types';

export default function Services() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      try {
        const dbCats = await dataService.getCategories();
        if (dbCats.length > 0) {
          // Map DB categories to the shape we need
          const mapped = dbCats.map(cat => ({
            slug: cat.slug,
            name: cat.name,
            thumbnail: cat.thumbnail_image || cat.banner_image || `/images/${cat.slug}-thumb.jpg`,
            shortDesc: cat.short_desc
          }));
          setCategories(mapped);
        } else {
          // Fallback to static
          setCategories(Object.entries(eventData).map(([slug, cat]) => ({
            slug,
            ...cat
          })));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        // Fallback to static
        setCategories(Object.entries(eventData).map(([slug, cat]) => ({
          slug,
          ...cat
        })));
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  return (
    <section id="services" className="bg-dark-2 py-24 sm:py-32 px-4 sm:px-8 lg:px-20 border-b border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Our Expertise</span>
          <h2 className="font-serif text-4xl sm:text-6xl text-cream mb-6">COMPLETE EVENT SOLUTIONS</h2>
          <div className="w-16 h-[1px] bg-gold mx-auto mb-8" />
          <p className="text-base text-text-secondary font-light leading-relaxed max-w-2xl mx-auto">
            Eventra Occasionz delivers complete event planning, creative execution, hospitality management and on-ground coordination for every celebration. From intimate gatherings to grand celebrations, we manage every detail with professionalism, creativity and precision.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="text-gold animate-spin" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <motion.div
                key={`${cat.slug}-${i}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-gold/10 bg-dark-1/20"
              >
                {/* Premium Image */}
                <img
                  src={cat.thumbnail || `/images/placeholder-${(i % 5) + 1}.jpg`}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800`;
                  }}
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-2 via-dark-2/40 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <h3 className="font-serif text-3xl text-cream mb-3 group-hover:text-gold transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-text-secondary font-light mb-6 line-clamp-2">
                      {cat.shortDesc}
                  </p>
                  <Link
                    to={`/services/${cat.slug}`}
                    className="inline-block px-8 py-3 bg-gold/10 hover:bg-gold hover:text-dark text-gold transition-all duration-300 border border-gold/30 rounded-full text-xs uppercase tracking-widest font-semibold"
                  >
                    Explore
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
