import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { Service } from '../types';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await dataService.getServices();
        setServices(data.filter(s => s.visible !== false));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-8 md:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Our Services</span>
          <h1 className="font-serif text-5xl md:text-7xl text-cream mb-6">
            Complete Event <em className="italic text-gold">Solutions</em>
          </h1>
          <div className="w-16 h-[1px] bg-gold mx-auto mb-8" />
          <p className="text-text-secondary text-lg max-w-2xl mx-auto font-light">
            From concept to execution, we offer comprehensive event services tailored to your vision.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="text-gold animate-spin" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white/5 border border-gold/10 rounded-2xl p-8 hover:border-gold/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <span className="text-4xl block mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">{service.ico || '✨'}</span>
                <h3 className="font-serif text-xl text-cream mb-3 group-hover:text-gold transition-colors">
                  {service.name}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  {service.desc}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs text-gold uppercase tracking-widest font-mono group-hover:text-gold-light transition-colors">
                    {service.starting_from ? `From ${service.starting_from}` : 'Bespoke'}
                  </span>
                  <ArrowRight size={16} className="text-text-secondary group-hover:text-gold transition-all group-hover:translate-x-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
