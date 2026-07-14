import React, { useEffect, useState } from 'react';
import { Loader2, Save, Palette, Globe2, Image as ImageIcon, SlidersHorizontal, Search, Share2 } from 'lucide-react';
import { cmsService } from '../../services/cmsService';
import { dataService } from '../../services/dataService';
import { CMSGlobalVariables, CMSPageSection, CMSSectionContent, CMSThemeTokens } from '../../types';

type EditableSectionKey = 'hero' | 'about' | 'services' | 'gallery' | 'testimonials' | 'faq' | 'contact' | 'footer';

interface WebsiteSettingsTabProps {
  showToast: (type: 'success' | 'error', message: string) => void;
}

const SECTION_LABELS: Record<EditableSectionKey, string> = {
  hero: 'Homepage',
  about: 'About',
  services: 'Services',
  gallery: 'Gallery',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  contact: 'Contact',
  footer: 'Footer'
};

const DEFAULT_CONTENT: Record<EditableSectionKey, any> = {
  hero: {
    heading: 'Luxury Events, Managed Beautifully',
    sub_heading: 'Eventra Occasionz',
    description: 'Premium planning, guest management, RSVP, logistics and celebration design for events that need absolute attention to detail.',
    image: '',
    cta_buttons: [
      { text: 'Plan My Event', link: '#contact', style: 'primary' },
      { text: 'View Services', link: '#services', style: 'outline' }
    ]
  },
  about: {
    heading: 'A calm, precise team behind unforgettable celebrations',
    tagline: 'About Eventra',
    text: 'We combine luxury event design with operational discipline: guest lists, RSVP, rooms, transport, timelines, vendors and on-ground check-in handled from one place.',
    image: ''
  },
  services: {
    heading: 'Premium Event Services',
    subtitle: 'From intimate family milestones to large-format destination celebrations.'
  },
  gallery: {
    heading: 'Signature Celebrations',
    subtitle: 'A curated view of decor, venues, moments and guest experiences.'
  },
  testimonials: {
    heading: 'Trusted by Families and Hosts',
    subtitle: 'Thoughtful planning, elegant execution and calm coordination.'
  },
  faq: {
    heading: 'Frequently Asked Questions',
    subtitle: 'Clear answers for hosts and guests before the celebration begins.'
  },
  contact: {
    heading: 'Start Planning Your Event',
    subtitle: 'Tell us about the occasion and our team will respond with next steps.'
  },
  footer: {
    heading: 'Eventra Occasionz',
    subtitle: 'Luxury event management, RSVP and guest logistics.'
  }
};

function sectionContentId(sectionId: string) {
  return `${sectionId}_content`;
}

function getFirstButton(content: any) {
  return content?.cta_buttons?.[0] || { text: 'Plan My Event', link: '#contact', style: 'primary' };
}

export default function WebsiteSettingsTab({ showToast }: WebsiteSettingsTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<EditableSectionKey>('hero');
  const [sections, setSections] = useState<CMSPageSection[]>([]);
  const [contentBlocks, setContentBlocks] = useState<Record<string, CMSSectionContent>>({});
  const [theme, setTheme] = useState<CMSThemeTokens>(cmsService.getDefaultThemeTokens());
  const [globals, setGlobals] = useState<CMSGlobalVariables>(cmsService.getDefaultGlobalVariables());
  const [seo, setSeo] = useState({
    title: 'Eventra Occasionz | Luxury Event Management',
    description: 'Premium event planning, RSVP, guest management and logistics for weddings, birthdays, corporate events and luxury celebrations.',
    keywords: 'event management, luxury wedding planner, RSVP management, guest management'
  });

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const [loadedSections, loadedTheme, loadedGlobals, homePage] = await Promise.all([
          cmsService.getPageSections('home_page'),
          cmsService.getThemeTokens(),
          cmsService.getGlobalVariables(),
          cmsService.getPageBySlug('/')
        ]);

        const existingSections = loadedSections.length > 0 ? loadedSections : [];
        const blocks: Record<string, CMSSectionContent> = {};

        for (const section of existingSections) {
          const content = await cmsService.getSectionContent(section.id);
          const sectionKey = section.type as EditableSectionKey;
          blocks[section.id] = content || {
            id: sectionContentId(section.id),
            section_id: section.id,
            content: DEFAULT_CONTENT[sectionKey] || {},
            last_updated: new Date().toISOString(),
            updated_by: 'admin'
          };
        }

        setSections(existingSections);
        setContentBlocks(blocks);
        setTheme(loadedTheme);
        setGlobals(loadedGlobals);
        if (homePage?.title) {
          setSeo(prev => ({ ...prev, title: homePage.title }));
        }
      } catch (err) {
        console.error(err);
        showToast('error', 'Website settings could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [showToast]);

  const activeCmsSection = sections.find(section => section.type === activeSection);
  const activeBlock = activeCmsSection ? contentBlocks[activeCmsSection.id] : null;
  const activeContent = activeBlock?.content || DEFAULT_CONTENT[activeSection];
  const firstButton = getFirstButton(activeContent);

  const updateActiveContent = (updates: Record<string, any>) => {
    if (!activeCmsSection) return;
    setContentBlocks(prev => {
      const current = prev[activeCmsSection.id] || {
        id: sectionContentId(activeCmsSection.id),
        section_id: activeCmsSection.id,
        content: {},
        last_updated: new Date().toISOString(),
        updated_by: 'admin'
      };

      return {
        ...prev,
        [activeCmsSection.id]: {
          ...current,
          content: {
            ...(current.content || {}),
            ...updates
          }
        }
      };
    });
  };

  const updatePrimaryButton = (updates: Record<string, string>) => {
    const nextButton = { ...firstButton, ...updates };
    const currentButtons = activeContent?.cta_buttons || [];
    updateActiveContent({ cta_buttons: [nextButton, ...currentButtons.slice(1)] });
  };

  const uploadBrandAsset = async (file: File, target: 'logo_dark' | 'logo_light' | 'favicon') => {
    try {
      const url = await dataService.uploadImage(file, true);
      setGlobals(prev => ({
        ...prev,
        branding: {
          ...prev.branding,
          [target]: url
        }
      }));
    } catch (err) {
      console.error(err);
      showToast('error', 'Image upload failed.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        const block = contentBlocks[section.id];
        if (!block) continue;
        await cmsService.saveSectionContent(block.id || sectionContentId(section.id), {
          ...block,
          section_id: section.id,
          updated_by: localStorage.getItem('user_email') || 'admin'
        });
      }

      await cmsService.saveThemeTokens(theme);
      await cmsService.saveGlobalVariables(globals);
      await cmsService.savePage({
        id: 'home_page',
        slug: '/',
        title: seo.title,
        seo_id: 'home_seo',
        layout_id: 'default_canvas',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_id: localStorage.getItem('user_email') || 'admin'
      });

      showToast('success', 'Website settings saved.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Website settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-gold" size={36} />
        <p className="text-xs uppercase tracking-widest text-text-secondary">Loading website controls...</p>
      </div>
    );
  }

  return (
    <div id="website-settings-panel" className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <h3 className="font-serif text-3xl text-cream">Website Settings</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Edit the public website with simple production forms. Advanced visual editing remains available only when needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-3 bg-gold text-dark rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Save Website
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <aside className="xl:col-span-3 bg-black/20 border border-white/5 rounded-2xl p-4 h-fit">
          <span className="text-[10px] uppercase tracking-widest text-gold/70 font-bold px-2">Website</span>
          <div className="mt-3 grid grid-cols-2 xl:grid-cols-1 gap-2">
            {(Object.keys(SECTION_LABELS) as EditableSectionKey[]).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`text-left px-4 py-3 rounded-xl text-xs transition-all ${
                  activeSection === key
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'bg-white/[0.03] text-text-secondary border border-transparent hover:text-cream'
                }`}
              >
                {SECTION_LABELS[key]}
              </button>
            ))}
          </div>
        </aside>

        <main className="xl:col-span-6 bg-black/20 border border-white/5 rounded-2xl p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <Globe2 className="text-gold" size={20} />
            <div>
              <h4 className="text-cream font-serif text-xl">{SECTION_LABELS[activeSection]}</h4>
              <p className="text-[11px] text-text-secondary">Client-safe fields only. No raw JSON or component editing.</p>
            </div>
          </div>

          <Field label="Section Title">
            <input
              value={activeContent.heading || ''}
              onChange={event => updateActiveContent({ heading: event.target.value })}
              className="admin-input"
              placeholder="Hero Title"
            />
          </Field>

          <Field label="Subtitle / Eyebrow">
            <input
              value={activeContent.sub_heading || activeContent.subtitle || activeContent.tagline || ''}
              onChange={event => updateActiveContent({ sub_heading: event.target.value, subtitle: event.target.value, tagline: event.target.value })}
              className="admin-input"
              placeholder="Short supporting line"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={activeContent.description || activeContent.text || ''}
              onChange={event => updateActiveContent({ description: event.target.value, text: event.target.value })}
              className="admin-input min-h-[120px] resize-y"
              placeholder="Write the section copy..."
            />
          </Field>

          {(activeSection === 'hero' || activeSection === 'about' || activeSection === 'gallery') && (
            <Field label="Background / Feature Image URL">
              <input
                value={activeContent.image || activeContent.background_image || ''}
                onChange={event => updateActiveContent({ image: event.target.value, background_image: event.target.value })}
                className="admin-input"
                placeholder="Paste image URL or upload through Gallery"
              />
            </Field>
          )}

          {activeSection === 'hero' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Button Text">
                <input
                  value={firstButton.text || ''}
                  onChange={event => updatePrimaryButton({ text: event.target.value })}
                  className="admin-input"
                  placeholder="Plan My Event"
                />
              </Field>
              <Field label="Button Link">
                <input
                  value={firstButton.link || ''}
                  onChange={event => updatePrimaryButton({ link: event.target.value })}
                  className="admin-input"
                  placeholder="#contact"
                />
              </Field>
            </div>
          )}
        </main>

        <aside className="xl:col-span-3 space-y-6">
          <SettingsCard title="Theme" icon={<Palette size={18} />}>
            <ColorInput label="Primary" value={theme.colors.primary} onChange={value => setTheme(prev => ({ ...prev, colors: { ...prev.colors, primary: value } }))} />
            <ColorInput label="Secondary" value={theme.colors.secondary} onChange={value => setTheme(prev => ({ ...prev, colors: { ...prev.colors, secondary: value } }))} />
            <ColorInput label="Accent" value={theme.colors.accent} onChange={value => setTheme(prev => ({ ...prev, colors: { ...prev.colors, accent: value } }))} />
            <Field label="Headings Font">
              <input value={theme.typography.headings_font} onChange={event => setTheme(prev => ({ ...prev, typography: { ...prev.typography, headings_font: event.target.value } }))} className="admin-input" />
            </Field>
            <Field label="Border Radius">
              <select value={theme.spacing.card_radius} onChange={event => setTheme(prev => ({ ...prev, spacing: { ...prev.spacing, card_radius: event.target.value as any, button_radius: event.target.value as any } }))} className="admin-input">
                <option value="none">Sharp</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </Field>
          </SettingsCard>

          <SettingsCard title="Brand" icon={<ImageIcon size={18} />}>
            {(['logo_dark', 'logo_light', 'favicon'] as const).map(target => (
              <Field key={target} label={target.replace('_', ' ')}>
                <input
                  value={globals.branding[target] || ''}
                  onChange={event => setGlobals(prev => ({ ...prev, branding: { ...prev.branding, [target]: event.target.value } }))}
                  className="admin-input"
                  placeholder="Image URL"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) uploadBrandAsset(file, target);
                  }}
                  className="mt-2 block w-full text-[10px] text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-dark"
                />
              </Field>
            ))}
          </SettingsCard>
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsCard title="SEO" icon={<Search size={18} />}>
          <Field label="SEO Title">
            <input value={seo.title} onChange={event => setSeo(prev => ({ ...prev, title: event.target.value }))} className="admin-input" />
          </Field>
          <Field label="SEO Description">
            <textarea value={seo.description} onChange={event => setSeo(prev => ({ ...prev, description: event.target.value }))} className="admin-input min-h-[90px]" />
          </Field>
          <Field label="SEO Keywords">
            <input value={seo.keywords} onChange={event => setSeo(prev => ({ ...prev, keywords: event.target.value }))} className="admin-input" />
          </Field>
        </SettingsCard>

        <SettingsCard title="Contact" icon={<SlidersHorizontal size={18} />}>
          <Field label="Phone">
            <input value={globals.contact.phone} onChange={event => setGlobals(prev => ({ ...prev, contact: { ...prev.contact, phone: event.target.value } }))} className="admin-input" />
          </Field>
          <Field label="Email">
            <input value={globals.contact.email} onChange={event => setGlobals(prev => ({ ...prev, contact: { ...prev.contact, email: event.target.value } }))} className="admin-input" />
          </Field>
          <Field label="Address">
            <textarea value={globals.contact.address} onChange={event => setGlobals(prev => ({ ...prev, contact: { ...prev.contact, address: event.target.value } }))} className="admin-input min-h-[90px]" />
          </Field>
        </SettingsCard>

        <SettingsCard title="Social & Footer" icon={<Share2 size={18} />}>
          <Field label="Instagram">
            <input value={globals.social_links.instagram || ''} onChange={event => setGlobals(prev => ({ ...prev, social_links: { ...prev.social_links, instagram: event.target.value } }))} className="admin-input" />
          </Field>
          <Field label="WhatsApp">
            <input value={globals.social_links.whatsapp || ''} onChange={event => setGlobals(prev => ({ ...prev, social_links: { ...prev.social_links, whatsapp: event.target.value } }))} className="admin-input" />
          </Field>
          <Field label="Copyright">
            <textarea value={globals.branding.copyright_text} onChange={event => setGlobals(prev => ({ ...prev, branding: { ...prev.branding, copyright_text: event.target.value } }))} className="admin-input min-h-[90px]" />
          </Field>
        </SettingsCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-[10px] uppercase tracking-widest text-gold/80 font-bold">{label}</span>
      {children}
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={event => onChange(event.target.value)} className="h-11 w-12 rounded-lg border border-white/10 bg-black/40" />
        <input value={value} onChange={event => onChange(event.target.value)} className="admin-input" />
      </div>
    </Field>
  );
}

function SettingsCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-gold">
        {icon}
        <h4 className="font-serif text-lg text-cream">{title}</h4>
      </div>
      {children}
    </section>
  );
}
