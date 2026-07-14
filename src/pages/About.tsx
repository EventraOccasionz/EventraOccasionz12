import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Compass, Briefcase, Heart, Award, Check } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function About() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const settings = await dataService.getAboutSettings();
        setData(settings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center pt-24">
        <Loader2 className="text-gold animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-8 md:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">About Us</span>
          <h1 className="font-serif text-5xl md:text-7xl text-cream mb-6">
            Crafting <em className="italic text-gold">Legends</em>
          </h1>
          <div className="w-16 h-[1px] bg-gold mb-8" />
          <p className="text-text-secondary text-lg max-w-3xl leading-relaxed font-light">
            Eventra Occasionz is a luxury event management company dedicated to creating unforgettable experiences. 
            From intimate gatherings to grand celebrations, we bring precision, creativity, and elegance to every event.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <img
              src={data?.founder_image || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800'}
              alt="Founder"
              className="w-full aspect-[3/4] object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col justify-center"
          >
            <h2 className="font-serif text-3xl text-cream mb-4">{data?.heading || 'Our Story'}</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              {data?.description || 'Founded with a passion for perfection, Eventra Occasionz has grown into a trusted name in luxury event management. Our team of dedicated professionals brings years of experience, creativity, and attention to detail to every project.'}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                { value: data?.stats?.years_experience || '10+', label: 'Years Experience' },
                { value: data?.stats?.events_managed || '500+', label: 'Events Managed' },
                { value: data?.stats?.trusted_vendors || '200+', label: 'Trusted Vendors' },
                { value: data?.stats?.happy_clients || '98%', label: 'Happy Clients' }
              ].map((s, i) => (
                <div key={i} className="group bg-white/5 border border-gold/10 p-4 rounded-xl text-center hover:border-gold/30 hover:bg-white/10 transition-all duration-300">
                  <h3 className="font-serif text-2xl text-gold group-hover:scale-105 transition-transform duration-300">{s.value}</h3>
                  <p className="text-[0.6rem] uppercase tracking-widest text-text-secondary mt-1 group-hover:text-text-primary transition-colors duration-300">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
