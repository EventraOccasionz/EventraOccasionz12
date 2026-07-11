import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  ExternalLink
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { EventData } from './EventDetailsDashboard';

interface InvitationContentSettings {
  title?: string;
  welcomeHeading?: string;
  heroHeading?: string;
  invitationMessage?: string;
  hostMessage?: string;
  personalizedGreeting?: string;
  closingMessage?: string;
  thankYouMessage?: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  mapUrl: string;
  description: string;
  dressCode: string;
  image: string;
  visible: boolean;
  rsvpEnabled: boolean;
  order: number;
}

interface RSVPSettings {
  enabled: boolean;
  deadline: string;
  allowAttending: boolean;
  allowNotAttending: boolean;
  askAttendeeNames: boolean;
  askDietaryPreference: boolean;
  askSpecialRequirements: boolean;
  askAccommodation: boolean;
  askTransport: boolean;
  allowMessage: boolean;
}

interface CustomQuestion {
  id: string;
  prompt: string;
  type: 'short' | 'long' | 'yesno' | 'single' | 'multiple';
  required: boolean;
  enabled: boolean;
  options: string;
  order: number;
}

interface SectionVisibility {
  hero: boolean;
  invitationMessage: boolean;
  countdown: boolean;
  timeline: boolean;
  gallery: boolean;
  venue: boolean;
  rsvp: boolean;
  accommodation: boolean;
  transport: boolean;
  contact: boolean;
  closing: boolean;
}

interface ExperienceConfig {
  invitationContent: InvitationContentSettings;
  scheduleItems: ScheduleItem[];
  rsvpSettings: RSVPSettings;
  customQuestions: CustomQuestion[];
  sectionVisibility: SectionVisibility;
}

interface EventExperienceSettingsPanelProps {
  event: EventData;
  showToast: (type: 'success' | 'error', message: string) => void;
  onBack?: () => void;
}

const buildDefaultConfig = (event: EventData): ExperienceConfig => {
  const eventType = String(event.type || 'Event').trim() || 'Event';
  return {
    invitationContent: {
      title: event.name || `${eventType} Celebration`,
      welcomeHeading: `Welcome to ${event.name || eventType}`,
      personalizedGreeting: `Dear {guestName},`,
      heroHeading: `You are warmly invited to ${event.name || eventType}`,
      invitationMessage: `We would be honored to have you join us for ${event.name || eventType}.`,
      hostMessage: `With warm regards, ${event.clientName || 'The hosts'}`,
      closingMessage: `Thank you for celebrating with us.`,
      thankYouMessage: `We look forward to sharing this special occasion with you.`
    },
    scheduleItems: [],
    rsvpSettings: {
      enabled: true,
      deadline: event.endDate || event.date || '',
      allowAttending: true,
      allowNotAttending: true,
      askAttendeeNames: false,
      askDietaryPreference: true,
      askSpecialRequirements: true,
      askAccommodation: false,
      askTransport: false,
      allowMessage: true
    },
    customQuestions: [],
    sectionVisibility: {
      hero: true,
      invitationMessage: true,
      countdown: true,
      timeline: true,
      gallery: true,
      venue: true,
      rsvp: true,
      accommodation: false,
      transport: false,
      contact: true,
      closing: true
    }
  };
};

export default function EventExperienceSettingsPanel({ event, showToast, onBack }: EventExperienceSettingsPanelProps) {
  const [config, setConfig] = useState<ExperienceConfig>(buildDefaultConfig(event));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        if (dataService.isConfigured()) {
          const docRef = doc(db, 'event_details', event.id);
          const detailsDoc = await getDoc(docRef);
          if (detailsDoc.exists()) {
            const data = detailsDoc.data();
            const existingConfig = data.experienceConfig as ExperienceConfig | undefined;
            if (existingConfig) {
              setConfig({
                invitationContent: { ...buildDefaultConfig(event).invitationContent, ...(existingConfig.invitationContent || {}) },
                scheduleItems: Array.isArray(existingConfig.scheduleItems) && existingConfig.scheduleItems.length > 0
                  ? existingConfig.scheduleItems.map((item: any, index: number) => ({
                      id: item.id || `schedule_${index + 1}`,
                      title: item.title || item.name || '',
                      date: item.date || event.date || '',
                      startTime: item.startTime || item.time || '',
                      endTime: item.endTime || '',
                      venue: item.venue || event.venue || '',
                      address: item.address || '',
                      mapUrl: item.mapUrl || '',
                      description: item.description || item.notes || '',
                      dressCode: item.dressCode || '',
                      image: item.image || '',
                      visible: item.visible !== false,
                      rsvpEnabled: item.rsvpEnabled !== false,
                      order: item.order ?? index
                    }))
                  : (Array.isArray(data.timeline) ? data.timeline.map((item: any, index: number) => ({
                      id: item.id || `schedule_${index + 1}`,
                      title: item.name || item.title || '',
                      date: item.date || event.date || '',
                      startTime: item.startTime || item.time || '',
                      endTime: item.endTime || '',
                      venue: item.venue || event.venue || '',
                      address: item.address || '',
                      mapUrl: item.mapUrl || '',
                      description: item.description || item.notes || '',
                      dressCode: item.dressCode || '',
                      image: item.image || '',
                      visible: item.visible !== false,
                      rsvpEnabled: item.rsvpEnabled !== false,
                      order: item.order ?? index
                    })) : []),
                rsvpSettings: { ...buildDefaultConfig(event).rsvpSettings, ...(existingConfig.rsvpSettings || {}) },
                customQuestions: Array.isArray(existingConfig.customQuestions) ? existingConfig.customQuestions.map((item: any, index: number) => ({
                  id: item.id || `question_${index + 1}`,
                  prompt: item.prompt || '',
                  type: item.type || 'short',
                  required: Boolean(item.required),
                  enabled: item.enabled !== false,
                  options: item.options || '',
                  order: item.order ?? index
                })) : [],
                sectionVisibility: { ...buildDefaultConfig(event).sectionVisibility, ...(existingConfig.sectionVisibility || {}) }
              });
              return;
            }
          }
        }

        const cached = localStorage.getItem(`event_details_${event.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const existingConfig = parsed.experienceConfig as ExperienceConfig | undefined;
          if (existingConfig) {
            setConfig({
              invitationContent: { ...buildDefaultConfig(event).invitationContent, ...(existingConfig.invitationContent || {}) },
              scheduleItems: Array.isArray(existingConfig.scheduleItems) ? existingConfig.scheduleItems : [],
              rsvpSettings: { ...buildDefaultConfig(event).rsvpSettings, ...(existingConfig.rsvpSettings || {}) },
              customQuestions: Array.isArray(existingConfig.customQuestions) ? existingConfig.customQuestions : [],
              sectionVisibility: { ...buildDefaultConfig(event).sectionVisibility, ...(existingConfig.sectionVisibility || {}) }
            });
          }
        }
      } catch (err) {
        console.error('Failed to load experience settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [event.id]);

  const updateInvitation = (field: keyof InvitationContentSettings, value: string) => {
    setConfig((current) => ({
      ...current,
      invitationContent: {
        ...current.invitationContent,
        [field]: value
      }
    }));
  };

  const updateScheduleItem = (id: string, field: keyof ScheduleItem, value: any) => {
    setConfig((current) => ({
      ...current,
      scheduleItems: current.scheduleItems.map((item) => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addScheduleItem = () => {
    setConfig((current) => ({
      ...current,
      scheduleItems: [
        ...current.scheduleItems,
        {
          id: `schedule_${Date.now()}`,
          title: '',
          date: event.date || '',
          startTime: '',
          endTime: '',
          venue: event.venue || '',
          address: '',
          mapUrl: '',
          description: '',
          dressCode: '',
          image: '',
          visible: true,
          rsvpEnabled: true,
          order: current.scheduleItems.length
        }
      ]
    }));
  };

  const removeScheduleItem = (id: string) => {
    setConfig((current) => ({
      ...current,
      scheduleItems: current.scheduleItems.filter((item) => item.id !== id)
    }));
  };

  const moveScheduleItem = (id: string, direction: 'up' | 'down') => {
    setConfig((current) => {
      const items = [...current.scheduleItems];
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) return current;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return current;
      const [item] = items.splice(index, 1);
      items.splice(targetIndex, 0, item);
      return { ...current, scheduleItems: items.map((entry, idx) => ({ ...entry, order: idx })) };
    });
  };

  const updateQuestion = (id: string, field: keyof CustomQuestion, value: any) => {
    setConfig((current) => ({
      ...current,
      customQuestions: current.customQuestions.map((item) => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addQuestion = () => {
    setConfig((current) => ({
      ...current,
      customQuestions: [
        ...current.customQuestions,
        {
          id: `question_${Date.now()}`,
          prompt: '',
          type: 'short' as const,
          required: false,
          enabled: true,
          options: '',
          order: current.customQuestions.length
        }
      ]
    }));
  };

  const removeQuestion = (id: string) => {
    setConfig((current) => ({
      ...current,
      customQuestions: current.customQuestions.filter((item) => item.id !== id)
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const timelinePayload = config.scheduleItems
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({
          id: item.id,
          name: item.title,
          time: [item.startTime, item.endTime].filter(Boolean).join(' – '),
          date: item.date || event.date || '',
          venue: item.venue || event.venue || '',
          notes: item.description || item.dressCode || '',
          visible: item.visible,
          rsvpEnabled: item.rsvpEnabled,
          order: index,
          address: item.address,
          mapUrl: item.mapUrl,
          description: item.description,
          dressCode: item.dressCode,
          image: item.image
        }));

      const payload = {
        experienceConfig: {
          ...config,
          scheduleItems: config.scheduleItems
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((item) => ({ ...item }))
        },
        timeline: timelinePayload
      };

      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'event_details', event.id), payload, { merge: true });
      } else {
        localStorage.setItem(`event_details_${event.id}`, JSON.stringify(payload));
      }

      showToast('success', 'Invitation and RSVP settings saved for this event.');
    } catch (err) {
      console.error('Failed to save invitation settings:', err);
      showToast('error', 'Failed to save invitation and RSVP settings.');
    } finally {
      setSaving(false);
    }
  };

  const previewSummary = useMemo(() => {
    return [
      config.invitationContent.title || event.name,
      config.invitationContent.welcomeHeading || 'Welcome',
      `${config.scheduleItems.filter((item) => item.visible).length} visible schedule item${config.scheduleItems.filter((item) => item.visible).length === 1 ? '' : 's'}`,
      `${config.customQuestions.filter((item) => item.enabled).length} custom RSVP question${config.customQuestions.filter((item) => item.enabled).length === 1 ? '' : 's'}`
    ];
  }, [config, event.name]);

  if (loading) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-text-secondary">Loading invitation settings…</div>;
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-xs uppercase tracking-widest font-mono font-bold transition-colors"
        >
          &larr; Back to Events
        </button>
      )}
      <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gold">
              <Sparkles size={12} /> EVENT EXPERIENCE SETTINGS
            </div>
            <div className="mt-2 text-sm text-text-secondary space-y-1">
              <p className="text-gold/80 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">Current Event:</p>
              <p className="flex items-center gap-2"><span className="text-white/40 font-mono text-xs w-28">Event Name:</span> <span className="text-cream font-serif text-lg font-bold">{event.name}</span></p>
              <p className="flex items-center gap-2"><span className="text-white/40 font-mono text-xs w-28">Event Type:</span> <span className="text-cream font-bold">{event.type || 'Custom'}</span></p>
              <p className="flex items-center gap-2"><span className="text-white/40 font-mono text-xs w-28">Event ID:</span> <span className="text-cream font-mono">{event.id}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowPreview((value) => !value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-secondary transition hover:text-gold"
            >
              {showPreview ? 'Hide Summary' : 'Preview Summary'}
            </button>
            <button
              type="button"
              onClick={() => {
                const previewUrl = `${window.location.origin}${window.location.pathname}#/invite/preview-${event.id}`;
                window.open(previewUrl, '_blank');
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10"
            >
              <ExternalLink size={14} /> Live Preview
            </button>
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-dark transition hover:brightness-110 disabled:opacity-70"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] border border-gold/20 bg-gold/10 p-5 text-sm text-cream">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-gold">Preview Summary</p>
          <ul className="space-y-2">
            {previewSummary.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2 text-gold">
              <MessageSquare size={16} />
              <h4 className="text-sm uppercase tracking-[0.25em]">Invitation Content</h4>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="text-sm text-text-secondary">
                <span className="mb-2 block">Invitation Title</span>
                <input value={config.invitationContent.title || ''} onChange={(e) => updateInvitation('title', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" />
              </label>
              <label className="text-sm text-text-secondary">
                <span className="mb-2 block">Welcome Heading</span>
                <input value={config.invitationContent.welcomeHeading || ''} onChange={(e) => updateInvitation('welcomeHeading', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" />
              </label>
              <label className="text-sm text-text-secondary">
                <span className="mb-2 block">Personalized Greeting Format</span>
                <input value={config.invitationContent.personalizedGreeting || ''} onChange={(e) => updateInvitation('personalizedGreeting', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" placeholder="Dear {guestName}," />
              </label>
              <label className="text-sm text-text-secondary">
                <span className="mb-2 block">Hero Heading</span>
                <input value={config.invitationContent.heroHeading || ''} onChange={(e) => updateInvitation('heroHeading', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" />
              </label>
              <label className="text-sm text-text-secondary">
                <span className="mb-2 block">Host / Family Message</span>
                <input value={config.invitationContent.hostMessage || ''} onChange={(e) => updateInvitation('hostMessage', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" />
              </label>
              <label className="text-sm text-text-secondary lg:col-span-2">
                <span className="mb-2 block">Invitation Message</span>
                <textarea rows={3} value={config.invitationContent.invitationMessage || ''} onChange={(e) => updateInvitation('invitationMessage', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" />
              </label>
              <label className="text-sm text-text-secondary lg:col-span-2">
                <span className="mb-2 block">Closing Message</span>
                <textarea rows={2} value={config.invitationContent.closingMessage || ''} onChange={(e) => updateInvitation('closingMessage', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" />
              </label>
              <label className="text-sm text-text-secondary lg:col-span-2">
                <span className="mb-2 block">Thank You Message</span>
                <textarea rows={2} value={config.invitationContent.thankYouMessage || ''} onChange={(e) => updateInvitation('thankYouMessage', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-gold">
                <Calendar size={16} />
                <h4 className="text-sm uppercase tracking-[0.25em]">Schedule / Functions</h4>
              </div>
              <button type="button" onClick={addScheduleItem} className="inline-flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold">
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {config.scheduleItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#111316] p-4 text-sm text-text-secondary">
                  Add a schedule or function item such as Jaggo, Anand Karaj, Reception or any custom programme segment.
                </div>
              )}
              {config.scheduleItems
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <div key={item.id} className="rounded-[1.25rem] border border-white/10 bg-[#111316] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <input value={item.title} onChange={(e) => updateScheduleItem(item.id, 'title', e.target.value)} placeholder="Function / Session / Activity" className="w-full max-w-[240px] rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => moveScheduleItem(item.id, 'up')} className="rounded-lg border border-white/10 bg-white/5 p-2 text-text-secondary"><ArrowUp size={14} /></button>
                        <button type="button" onClick={() => moveScheduleItem(item.id, 'down')} className="rounded-lg border border-white/10 bg-white/5 p-2 text-text-secondary"><ArrowDown size={14} /></button>
                        <button type="button" onClick={() => removeScheduleItem(item.id)} className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <label className="text-sm text-text-secondary">
                        <span className="mb-1 block">Date</span>
                        <input type="date" value={item.date} onChange={(e) => updateScheduleItem(item.id, 'date', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      </label>
                      <label className="text-sm text-text-secondary">
                        <span className="mb-1 block">Venue</span>
                        <input value={item.venue} onChange={(e) => updateScheduleItem(item.id, 'venue', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      </label>
                      <label className="text-sm text-text-secondary">
                        <span className="mb-1 block">Start Time</span>
                        <input value={item.startTime} onChange={(e) => updateScheduleItem(item.id, 'startTime', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      </label>
                      <label className="text-sm text-text-secondary">
                        <span className="mb-1 block">End Time</span>
                        <input value={item.endTime} onChange={(e) => updateScheduleItem(item.id, 'endTime', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      </label>
                      <label className="text-sm text-text-secondary lg:col-span-2">
                        <span className="mb-1 block">Address / Location</span>
                        <input value={item.address} onChange={(e) => updateScheduleItem(item.id, 'address', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      </label>
                      <label className="text-sm text-text-secondary lg:col-span-2">
                        <span className="mb-1 block">Description</span>
                        <textarea rows={2} value={item.description} onChange={(e) => updateScheduleItem(item.id, 'description', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      </label>
                      <label className="text-sm text-text-secondary">
                        <span className="mb-1 block">Google Maps Link</span>
                        <input value={item.mapUrl} onChange={(e) => updateScheduleItem(item.id, 'mapUrl', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      </label>
                      <label className="text-sm text-text-secondary">
                        <span className="mb-1 block">Dress Code</span>
                        <input value={item.dressCode} onChange={(e) => updateScheduleItem(item.id, 'dressCode', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-text-secondary">
                      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                        <input type="checkbox" checked={item.visible} onChange={(e) => updateScheduleItem(item.id, 'visible', e.target.checked)} />
                        Visible on Invitation
                      </label>
                      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                        <input type="checkbox" checked={item.rsvpEnabled} onChange={(e) => updateScheduleItem(item.id, 'rsvpEnabled', e.target.checked)} />
                        Ask Attendance in RSVP
                      </label>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2 text-gold">
              <Users size={16} />
              <h4 className="text-sm uppercase tracking-[0.25em]">RSVP Settings</h4>
            </div>
            <div className="space-y-3 text-sm text-text-secondary">
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>RSVP enabled</span>
                <input type="checkbox" checked={config.rsvpSettings.enabled} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, enabled: e.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>Allow attending</span>
                <input type="checkbox" checked={config.rsvpSettings.allowAttending} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, allowAttending: e.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>Allow not attending</span>
                <input type="checkbox" checked={config.rsvpSettings.allowNotAttending} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, allowNotAttending: e.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>Ask attendee names</span>
                <input type="checkbox" checked={config.rsvpSettings.askAttendeeNames} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, askAttendeeNames: e.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>Ask dietary preference</span>
                <input type="checkbox" checked={config.rsvpSettings.askDietaryPreference} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, askDietaryPreference: e.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>Ask special requirements</span>
                <input type="checkbox" checked={config.rsvpSettings.askSpecialRequirements} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, askSpecialRequirements: e.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>Ask accommodation</span>
                <input type="checkbox" checked={config.rsvpSettings.askAccommodation} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, askAccommodation: e.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>Ask transport</span>
                <input type="checkbox" checked={config.rsvpSettings.askTransport} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, askTransport: e.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                <span>Allow guest message</span>
                <input type="checkbox" checked={config.rsvpSettings.allowMessage} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, allowMessage: e.target.checked } }))} />
              </label>
              <label className="text-sm text-text-secondary">
                <span className="mb-2 block">RSVP deadline</span>
                <input type="date" value={config.rsvpSettings.deadline} onChange={(e) => setConfig((current) => ({ ...current, rsvpSettings: { ...current.rsvpSettings, deadline: e.target.value } }))} className="w-full rounded-xl border border-white/10 bg-[#111316] px-3 py-2 text-sm text-cream outline-none" />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-gold">
                <Sparkles size={16} />
                <h4 className="text-sm uppercase tracking-[0.25em]">Custom RSVP Questions</h4>
              </div>
              <button type="button" onClick={addQuestion} className="inline-flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold font-bold">
                <Plus size={14} /> ADD CUSTOM QUESTION
              </button>
            </div>
            <div className="space-y-3">
              {config.customQuestions.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#111316] p-4 text-sm text-text-secondary">Add custom questions like meal preference, arrival time, or special requests.</div>
              )}
              {config.customQuestions.map((question) => (
                <div key={question.id} className="rounded-[1.1rem] border border-white/10 bg-[#111316] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <input value={question.prompt} onChange={(e) => updateQuestion(question.id, 'prompt', e.target.value)} placeholder="Question Label" className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                    <button type="button" onClick={() => removeQuestion(question.id)} className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-text-secondary">
                      <span className="mb-1 block">Type</span>
                      <select value={question.type} onChange={(e) => updateQuestion(question.id, 'type', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none">
                        <option value="short">Short Text</option>
                        <option value="long">Long Text</option>
                        <option value="yesno">Yes / No</option>
                        <option value="single">Single Choice</option>
                        <option value="multiple">Multiple Choice</option>
                      </select>
                    </label>
                    <label className="text-sm text-text-secondary">
                      <span className="mb-1 block">Options</span>
                      <input value={question.options} onChange={(e) => updateQuestion(question.id, 'options', e.target.value)} placeholder="Option A, Option B" className="w-full rounded-xl border border-white/10 bg-[#07090c] px-3 py-2 text-sm text-cream outline-none" />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-text-secondary">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <input type="checkbox" checked={question.required} onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)} />
                      Required
                    </label>
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <input type="checkbox" checked={question.enabled} onChange={(e) => updateQuestion(question.id, 'enabled', e.target.checked)} />
                      Enabled
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2 text-gold">
              <Eye size={16} />
              <h4 className="text-sm uppercase tracking-[0.25em]">Section Visibility</h4>
            </div>
            <div className="grid gap-2 text-sm text-text-secondary">
              {Object.entries(config.sectionVisibility).map(([key, enabled]) => {
                const sectionLabels: Record<string, string> = {
                  hero: 'Hero',
                  invitationMessage: 'Invitation Message',
                  countdown: 'Countdown',
                  timeline: 'Event Timeline',
                  gallery: 'Gallery',
                  venue: 'Venue',
                  rsvp: 'RSVP',
                  accommodation: 'Accommodation',
                  transport: 'Transport',
                  contact: 'Contact',
                  closing: 'Closing Message'
                };
                return (
                  <label key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111316] px-3 py-3">
                    <span>{sectionLabels[key] || key}</span>
                    <input type="checkbox" checked={enabled} onChange={(e) => setConfig((current) => ({ ...current, sectionVisibility: { ...current.sectionVisibility, [key]: e.target.checked } }))} />
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
