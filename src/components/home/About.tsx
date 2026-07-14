import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Sparkles, Compass, Briefcase, Heart, Award, MapPin, Loader2, Check 
} from 'lucide-react';
import { dataService } from '../../services/dataService';

interface AboutData {
  founder_name: string;
  founder_image: string;
  team_image?: string;
  heading: string;
  description: string;
  stats: {
    years_experience: string;
    events_managed: string;
    trusted_vendors: string;
    happy_clients: string;
  };
  features: string[];
}

export default function About() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAboutData() {
      try {
        const settings = await dataService.getAboutSettings();
        setData(settings);
      } catch (err) {
        console.error('Error fetching about settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAboutData();
  }, []);

  // Map key phrases to icons dynamically for a premium look
  const getFeatureIcon = (featureName: string) => {
    const lower = featureName.toLowerCase();
    if (lower.includes('management') || lower.includes('end-to-end')) {
      return <Sparkles className="text-gold" size={20} />;
    }
    if (lower.includes('planning') || lower.includes('creative')) {
      return <Compass className="text-gold" size={20} />;
    }
    if (lower.includes('execution') || lower.includes('professional')) {
      return <Briefcase className="text-gold" size={20} />;
    }
    if (lower.includes('personalized') || lower.includes('experience')) {
      return <Heart className="text-gold" size={20} />;
    }
    if (lower.includes('hospitality') || lower.includes('premium')) {
      return <Award className="text-gold" size={20} />;
    }
    if (lower.includes('wedding') || lower.includes('destination')) {
      return <MapPin className="text-gold" size={20} />;
    }
    return <Check className="text-gold" size={20} />;
  };

  const highlightText = (text: string, founderName: string) => {
    if (!text) return '';
    
    // Split text by paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((para, idx) => {
      // Highlight "Eventra Occasionz"
      // Highlight founderName & "Founder " + founderName
      let html = para;
      
      const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };

      // Match "Founder Shivam Chawla" or just "Shivam Chawla"
      const founderEscaped = escapeRegExp(founderName);
      const founderRegex = new RegExp(`(Founder\\s+)?${founderEscaped}`, 'g');
      
      html = html.replace(/Eventra Occasionz/g, '<span class="text-gold font-semibold">Eventra Occasionz</span>');
      html = html.replace(founderRegex, (match) => `<span class="text-gold font-semibold">${match}</span>`);

      return (
        <p 
          key={idx} 
          className="text-sm md:text-base text-text-secondary font-extralight leading-relaxed mb-6 last:mb-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  if (loading) {
    return (
      <div className="bg-dark py-20 flex items-center justify-center">
        <Loader2 className="text-gold animate-spin" size={32} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <section id="about" className="bg-dark py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-20 border-t border-white/5 relative overflow-hidden">
      {/* Background ambience */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-0 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Main Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-24">
          
          {/* Left Side: Images */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 flex flex-col gap-6 relative"
          >
            {/* Primary Portrait Card */}
            <div className="relative group overflow-hidden rounded-2xl border border-gold/15 bg-black/40 p-3 shadow-2xl">
              <div className="aspect-[4/5] overflow-hidden rounded-xl relative">
                <img 
                  src={data.founder_image || undefined} 
                  alt={data.founder_name} 
                  className="w-full h-full object-cover grayscale contrast-115 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                
                {/* Floating identity label */}
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="text-[0.6rem] tracking-[0.3em] uppercase text-gold block mb-1">Founder & Lead Curator</span>
                  <h4 className="font-serif text-2xl text-cream tracking-tight">{data.founder_name}</h4>
                </div>
              </div>
            </div>

            {/* Secondary Team / Event Image (Overlapping / Companion Card) */}
            {data.team_image && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="hidden lg:block absolute -bottom-10 -right-10 w-2/3 aspect-video rounded-xl overflow-hidden border border-gold/20 shadow-2xl p-2 bg-dark"
              >
                <div className="w-full h-full rounded-lg overflow-hidden relative">
                  <img 
                    src={data.team_image || undefined} 
                    alt="Eventra Occasionz Production" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent" />
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right Side: Content */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">
              ABOUT EVENTRA OCCASIONZ
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-cream mb-8 leading-tight">
              {data.heading}
            </h2>
            <div className="w-12 h-[1px] bg-gold mb-8" />
            
            <div className="mb-8">
              {highlightText(data.description, data.founder_name)}
            </div>
          </motion.div>

        </div>

        {/* Premium Statistic Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-20 lg:mb-24">
          {[
            { value: data.stats.years_experience, label: 'Years of Experience' },
            { value: data.stats.events_managed, label: 'Events Managed' },
            { value: data.stats.trusted_vendors, label: 'Trusted Vendors' },
            { value: data.stats.happy_clients, label: 'Happy Clients' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="bg-white/5 border border-gold/10 hover:border-gold/30 p-5 sm:p-8 rounded-2xl text-center group transition-all duration-300 relative overflow-hidden"
            >
              {/* Card inner glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
              
              <h3 className="font-serif text-3xl md:text-4xl text-gold font-bold tracking-tight mb-2 group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </h3>
              <p className="text-[0.68rem] tracking-[0.15em] uppercase text-text-secondary font-mono">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Premium Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-black/20 border border-white/5 p-6 sm:p-10 lg:p-12 rounded-3xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-50 rounded-3xl" />
          
          <div className="relative">
            <h4 className="text-[0.7rem] tracking-[0.35em] uppercase text-gold mb-8 text-center font-mono font-semibold">
              Signature Service Standards
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.features.map((feature, i) => (
                <motion.div 
                  key={feature}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                >
                  <div className="p-3 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center group-hover:bg-gold/20 group-hover:scale-110 transition-all duration-300">
                    {getFeatureIcon(feature)}
                  </div>
                  <span className="text-sm md:text-base font-light text-cream font-serif">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
