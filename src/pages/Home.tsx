import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/home/Hero';
import AboutSection from '../components/home/About';
import ServicesSection from '../components/home/Services';
import GallerySection from '../components/home/Gallery';
import TestimonialsSection from '../components/home/Testimonials';
import ContactSection from '../components/home/Contact';

const faqs = [
  {
    q: 'What types of events do you manage?',
    a: 'We manage weddings, engagements, birthdays, anniversaries, baby showers, corporate events, and more. Every event type gets its own tailored RSVP experience.'
  },
  {
    q: 'How does the RSVP system work?',
    a: 'Each event generates a unique invitation page with a countdown, venue details, Google Maps, schedule, gallery, and a configurable RSVP form. Guests receive a QR pass upon confirmation.'
  },
  {
    q: 'Can I manage guests from the admin panel?',
    a: 'Yes. The admin panel provides full guest management: pending, confirmed, declined, and checked-in guests with search, filter, export, and QR check-in capabilities.'
  },
  {
    q: 'Do you offer custom RSVP questions?',
    a: 'Yes. You can configure questions like meal preference, hotel required, transport required, plus one, and custom questions. Different event types can have different question sets.'
  },
  {
    q: 'How do I get started?',
    a: 'Reach out through our contact form or WhatsApp. Our team will schedule a consultation to understand your requirements and create a tailored plan.'
  }
];

const faqQuestion = (q: string, a: string, i: number, open: number | null, toggle: (i: number) => void) => (
  <div key={i} className="border-b border-white/5">
    <button
      onClick={() => toggle(i)}
      className="w-full flex items-center justify-between py-5 text-left group hover:bg-white/[0.02] transition-colors px-3 -mx-3 rounded-lg"
    >
      <span className="font-serif text-lg text-cream group-hover:text-gold transition-colors">{q}</span>
      {open === i ? <ChevronUp size={18} className="text-gold group-hover:text-gold-light transition-colors" /> : <ChevronDown size={18} className="text-gold group-hover:text-gold-light transition-colors" />}
    </button>
    {open === i && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="pb-5"
      >
        <p className="text-text-secondary text-sm leading-relaxed">{a}</p>
      </motion.div>
    )}
  </div>
);

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="bg-dark py-24 px-8 md:px-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">FAQ</span>
          <h2 className="font-serif text-4xl md:text-6xl text-cream mb-6">Frequently Asked <em className="italic text-gold">Questions</em></h2>
          <div className="w-11 h-[1px] bg-gold mx-auto" />
        </motion.div>
        <div>{faqs.map((f, i) => faqQuestion(f.q, f.a, i, open, setOpen))}</div>
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section id="booking" className="bg-dark-2 py-24 px-8 md:px-20 border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Sparkles className="mx-auto text-gold mb-6 hover:scale-110 transition-transform duration-300" size={32} />
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Let's Create Something Extraordinary</span>
          <h2 className="font-serif text-4xl md:text-6xl text-cream mb-6 leading-tight">
            Ready to Plan Your <em className="italic text-gold">Perfect Event</em>?
          </h2>
          <p className="text-text-secondary text-lg font-light max-w-xl mx-auto mb-10">
            Whether it's an intimate gathering or a grand celebration, our team is here to bring your vision to life.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-3 px-10 py-4 bg-gold text-dark text-xs uppercase tracking-widest font-bold hover:bg-gold-light hover:-translate-y-0.5 transition-all"
          >
            Start Planning <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <AboutSection />
      <ServicesSection />
      <GallerySection />
      <TestimonialsSection />
      <FAQ />
      <ContactCTA />
      <ContactSection />
    </>
  );
}
