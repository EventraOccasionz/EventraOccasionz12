import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import eventraLogo from '../../assets/images/eventra_logo_1783423905494.jpg';

const socialLinks = [
  { Icon: Facebook, url: 'https://www.facebook.com/share/17yRD9f7T5/', label: 'Facebook' },
  { Icon: Instagram, url: 'https://www.instagram.com/eventra_occasionz?igsh=c2Izd2dxZW50bHlp', label: 'Instagram' },
  { Icon: Linkedin, url: 'https://www.linkedin.com/in/shivam-chawla-9ab87b3a1?utm_source=share_via&utm_content=profile&utm_medium=member_android', label: 'LinkedIn' }
];

const quickLinks = [
  { name: 'Home', to: '/' },
  { name: 'About', to: '/about' },
  { name: 'Services', to: '/services' },
  { name: 'Gallery', to: '/gallery' },
  { name: 'Contact', to: '/contact' },
];

const serviceLinks = ['Wedding Planning', 'Birthday Décor', 'Balloon Décor', 'Photography', 'Catering', 'Corporate Events'];

function FadeUp({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-4 border-t border-gold/20 pt-20 pb-8 px-8 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
        <FadeUp>
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 font-serif text-2xl tracking-widest text-gold mb-2 group">
              <img 
                src={eventraLogo} 
                alt="Eventra Occasionz Logo" 
                className="w-12 h-12 object-contain bg-transparent group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <span>Eventra <em className="italic text-gold-light">Occasionz</em></span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Crafting luxury events with elegance, passion, and meticulous attention to every detail. Your celebration, our canvas.
            </p>
            <div className="flex gap-3 mt-4">
              {socialLinks.map(({ Icon, url, label }, i) => (
                <motion.a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.1, borderColor: '#D4AF37', color: '#D4AF37' }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 border border-gold/20 flex items-center justify-center text-text-secondary transition-colors"
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="flex flex-col">
            <h5 className="text-[0.62rem] uppercase tracking-[0.28em] text-gold mb-6 font-medium">Quick Links</h5>
            <ul className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <Link to={link.to} className="text-sm text-text-secondary hover:text-gold transition-colors">
                    {link.name}
                  </Link>
                </motion.li>
              ))}
              <li>
                <Link to="/admin" className="text-sm text-text-secondary hover:text-gold transition-colors font-medium flex items-center gap-1 mt-1">
                  ✦ Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="flex flex-col">
            <h5 className="text-[0.62rem] uppercase tracking-[0.28em] text-gold mb-6 font-medium">Services</h5>
            <ul className="flex flex-col gap-3">
              {serviceLinks.map((item) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Link to="/services" className="text-sm text-text-secondary hover:text-gold transition-colors">
                    {item}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="flex flex-col">
            <h5 className="text-[0.62rem] uppercase tracking-[0.28em] text-gold mb-6 font-medium">Luxury Invitation</h5>
            <p className="text-sm text-text-secondary mb-4">
              Are you a guest? Enter your access code here to view your personalized invitation.
            </p>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/invite-access"
                className="block px-6 py-2 border border-gold/40 text-gold text-[0.7rem] uppercase tracking-widest text-center hover:bg-gold hover:text-dark transition-all"
              >
                Access My Invitation
              </Link>
            </motion.div>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/privacy-policy" className="text-[0.6rem] tracking-wider text-text-secondary hover:text-gold transition-colors uppercase">
                Privacy Policy
              </Link>
              <Link to="/terms-conditions" className="text-[0.6rem] tracking-wider text-text-secondary hover:text-gold transition-colors uppercase">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </FadeUp>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="max-w-7xl mx-auto border-t border-gold/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[0.72rem] text-text-secondary"
      >
        <p>© {currentYear} <span className="text-gold hover:text-gold-light transition-colors">Eventra Occasionz</span>. All rights reserved.</p>
        <p>Crafted with <span className="text-gold hover:text-gold-light transition-colors">✦</span> for extraordinary moments</p>
      </motion.div>
    </footer>
  );
}
