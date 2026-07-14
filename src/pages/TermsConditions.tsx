import { motion } from 'framer-motion';

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-8 md:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Legal</span>
          <h1 className="font-serif text-5xl md:text-6xl text-cream mb-8">
            Terms & <em className="italic text-gold">Conditions</em>
          </h1>
          <div className="w-16 h-[1px] bg-gold mb-8" />

          <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
            {[
              { title: 'Acceptance of Terms', text: 'By accessing and using Eventra Occasionz services, you agree to be bound by these terms and conditions. If you do not agree, please refrain from using our services.' },
              { title: 'Services', text: 'We provide event management, RSVP coordination, guest management, and related services as described on our website. Service specifics are outlined in individual agreements.' },
              { title: 'User Responsibilities', text: 'Users agree to provide accurate information, maintain confidentiality of access credentials, and use the platform in compliance with applicable laws.' },
              { title: 'Intellectual Property', text: 'All content, designs, logos, and materials on this website are the property of Eventra Occasionz and may not be reproduced without permission.' },
              { title: 'Limitation of Liability', text: 'Eventra Occasionz shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.' },
              { title: 'Contact', text: 'For questions about these terms, contact: eventraoccasionz@gmail.com' },
            ].map((section, i) => (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <h2 className="font-serif text-2xl text-cream mb-4">{section.title}</h2>
                <p>{section.text}</p>
              </motion.section>
            ))}

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-xs text-text-secondary pt-8 border-t border-white/5"
            >
              Last updated: {new Date().toLocaleDateString()}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
