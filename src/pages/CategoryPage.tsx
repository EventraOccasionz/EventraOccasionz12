import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { eventData } from '../data/eventData';
import { dataService } from '../lib/dataService';
import { Category, Service } from '../types';

export default function CategoryPage() {
  const { category_slug } = useParams<{ category_slug: string }>();
  const [loading, setLoading] = useState(true);
  const [dbCategory, setDbCategory] = useState<Category | null>(null);
  const [dbServices, setDbServices] = useState<Service[]>([]);
  
  const staticData = category_slug ? eventData[category_slug] : null;

  useEffect(() => {
    async function fetchData() {
      if (!category_slug) return;
      setLoading(true);
      try {
        const [cats, allServices] = await Promise.all([
          dataService.getCategories(),
          dataService.getServices()
        ]);
        
        // Find matching category by slug
        const foundCat = cats.find(c => c.slug === category_slug);
        if (foundCat) {
          setDbCategory(foundCat);
          // Find services for this category
          const filteredServices = allServices.filter(s => 
            s.category_id === foundCat.id || s.category_slug === foundCat.slug
          );
          setDbServices(filteredServices);
        }
      } catch (err) {
        console.error('Error fetching category data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [category_slug]);

  if (loading) {
    return (
      <div className="bg-dark-2 min-h-screen flex items-center justify-center">
        <Loader2 className="text-gold animate-spin" size={40} />
      </div>
    );
  }

  // Final data determination: Prefer DB, fallback to Static
  const displayName = dbCategory?.name || staticData?.name || 'Category';
  const displayIntro = dbCategory?.full_desc 
    ? [dbCategory.full_desc] 
    : (staticData?.intro || ['Experience the pinnacle of luxury event planning with Eventra Occasionz.']);
  
  const displayBanner = dbCategory?.banner_image || dbCategory?.thumbnail_image || `/images/${category_slug}-banner.jpg`;
  
  // Combine services from DB and Static if needed, or prefer DB
  const expertiseItems = dbServices.length > 0 
    ? dbServices.map(s => ({
        name: s.name,
        desc: s.desc || s.full_desc || `With meticulous attention to detail, Eventra Occasionz provides tailored solutions for ${s.name.toLowerCase()}, ensuring that every aspect aligns perfectly with your vision for a grand and memorable celebration.`,
        image: s.thumbnail || s.banner || (s.gallery?.[0]) || null
      }))
    : (staticData?.services || []).map((s, idx) => ({
        name: s,
        desc: `With meticulous attention to detail, Eventra Occasionz provides tailored solutions for ${s.toLowerCase()}, ensuring that every aspect aligns perfectly with your vision for a grand and memorable celebration.`,
        image: `/images/placeholder-${(idx % 5) + 1}.jpg`
      }));

  if (!dbCategory && !staticData) {
    return (
      <div className="bg-dark-2 min-h-screen pt-32 pb-24 text-center px-6">
        <h2 className="font-serif text-3xl text-cream mb-6">Category Not Found</h2>
        <Link to="/" className="text-gold hover:underline">
          ← Back to All Services
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-dark-2 min-h-screen text-cream">
      {/* 1. Large Hero Banner */}
      <div className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center">
        <img
          src={displayBanner}
          alt={displayName}
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1600';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-2 via-dark-2/40 to-transparent" />

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold/80 hover:text-gold mb-8 font-mono border border-gold/20 hover:border-gold/50 px-4 py-2 rounded-full bg-dark-1/40 backdrop-blur-md transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-serif text-5xl md:text-8xl text-cream tracking-tight mb-8">
              {displayName}
            </h1>
            <div className="space-y-4">
              {displayIntro.map((p, idx) => (
                <p key={idx} className="text-lg md:text-xl text-text-secondary font-light leading-relaxed max-w-3xl mx-auto">
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2. Our Expertise - Storytelling Section */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-24">
            <h2 className="font-serif text-4xl md:text-5xl text-cream mb-6">Our Expertise</h2>
            <div className="w-24 h-[1px] bg-gold mx-auto" />
        </div>

        <div className="space-y-24">
          {expertiseItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-20 items-center`}
            >
              {/* Content Area */}
              <div className="flex-1 space-y-4">
                <h3 className="font-serif text-3xl md:text-4xl text-gold mb-6">{item.name}</h3>
                <p className="text-text-secondary text-base md:text-lg font-light leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Image Area */}
              <div className="flex-1 w-full">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
                    <img 
                        src={item.image || `/images/placeholder-${(idx % 5) + 1}.jpg`} 
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800`;
                        }}
                    />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Why Eventra Occasionz */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-5xl text-cream mb-8">WHY EVENTRA OCCASIONZ</h2>
            <p className="text-text-secondary text-lg font-light leading-relaxed mb-16">
                Every successful celebration is built on meticulous planning, flawless coordination and exceptional hospitality. At Eventra Occasionz, we focus on creating seamless experiences from the first conversation to the final farewell.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { title: 'End-to-End Event Planning', desc: 'From concept creation to final execution.' },
                    { title: 'Trusted Vendor Network', desc: 'Verified venues, decorators, photographers, entertainers and hospitality partners.' },
                    { title: 'Dedicated Hospitality Team', desc: 'Professional guest management, RSVP, help desk, runners and coordination.' },
                    { title: 'Luxury Event Experience', desc: 'Elegant décor, premium execution and unforgettable guest experiences.' },
                    { title: 'Transparent Communication', desc: 'Clear planning, regular updates and complete coordination.' },
                    { title: 'Flawless Execution', desc: 'Experienced on-ground team ensuring every event runs smoothly.' }
                ].map((item, i) => (
                    <div key={i} className="p-8 border border-gold/10 rounded-2xl bg-dark-1/50 flex flex-col items-center text-center">
                        <div className="text-gold mb-6 text-3xl">✨</div>
                        <h4 className="font-serif text-cream text-xl mb-2">{item.title}</h4>
                        <p className="text-text-secondary text-xs font-light">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. Final Luxury Section */}
      <section className="relative py-32 px-6 overflow-hidden">
        <img 
            src="/images/luxury-banner.jpg" 
            alt="Luxury Celebration" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-dark-2/80" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
            <p className="font-serif text-3xl md:text-5xl text-cream leading-relaxed mb-8">
                "We don't just organize events.<br/>We create timeless celebrations and unforgettable memories."
            </p>
            <div className="w-24 h-[1px] bg-gold mx-auto mb-8" />
            <p className="text-gold font-serif text-xl mb-2">Eventra Occasionz</p>
            <p className="text-text-secondary text-sm font-light">
                Crafting Premium Celebrations Across Chandigarh, Zirakpur, Mohali, Panchkula, Punjab and Destination Wedding Locations Across India.
            </p>
        </div>
      </section>
    </div>
  );
}
