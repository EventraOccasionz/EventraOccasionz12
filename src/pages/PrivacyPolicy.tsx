import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-8 md:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Legal</span>
          <h1 className="font-serif text-5xl md:text-6xl text-cream mb-8">
            Privacy <em className="italic text-gold">Policy</em>
          </h1>
          <div className="w-16 h-[1px] bg-gold mb-8" />

          <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
            {[
              { title: 'Information We Collect', text: 'We collect information you provide directly, including name, email address, phone number, and event details when you submit inquiries through our contact forms or RSVP for events.' },
              { title: 'How We Use Your Information', text: 'Your information is used to respond to inquiries, manage event RSVPs, improve our services, and send relevant communications about your events.' },
              { title: 'Data Protection', text: 'We implement industry-standard security measures to protect your personal data. Your information is stored securely and accessed only by authorized personnel.' },
              { title: 'Third-Party Services', text: 'We use Firebase (Google) for authentication and data storage. These services have their own privacy policies governing data handling.' },
              { title: 'Contact Us', text: 'If you have questions about this privacy policy, please contact us at eventraoccasionz@gmail.com.' },
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
              transition={{ delay: 0.5, duration: 0.5 }}
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
