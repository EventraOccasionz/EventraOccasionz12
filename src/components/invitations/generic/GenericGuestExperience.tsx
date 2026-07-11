import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Clock, Info, CheckCircle, ArrowRight,
  Sparkles, Navigation, Hotel, Car, FileText, Loader2, Check, Users
} from 'lucide-react';
import { Family } from '../../../types';
import { dataService } from '../../../lib/dataService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { EventExperienceConfig } from '../../../lib/eventExperience';

interface GenericGuestExperienceProps {
  family: Family;
  event: any;
  eventId: string;
  experienceConfig?: EventExperienceConfig;
}

function getScheduleLabel(eventType: string) {
  const normalized = eventType.toLowerCase();
  if (normalized.includes('religious')) return 'Ceremony Schedule';
  if (normalized.includes('concert')) return 'Event Schedule';
  if (normalized.includes('retirement')) return 'Celebration Schedule';
  if (normalized.includes('school') || normalized.includes('college') || normalized.includes('seminar') || normalized.includes('conference') || normalized.includes('launch') || normalized.includes('award')) return 'Programme';
  if (normalized.includes('house') || normalized.includes('party')) return 'Celebration Schedule';
  return 'Event Schedule';
}

export default function GenericGuestExperience({ family, event, eventId, experienceConfig }: GenericGuestExperienceProps) {
  const [isUnveiled, setIsUnveiled] = useState(() => {
    return sessionStorage.getItem(`unveiled_generic_${eventId}_${family.id}`) === 'true';
  });

  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const [rsvpData, setRsvpData] = useState<any | null>(null);
  const [attending, setAttending] = useState<boolean>(true);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [dietaryPreference, setDietaryPreference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [transportRequired, setTransportRequired] = useState(false);
  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState('');

  const rawEventType = event?.type || event?.eventType || 'Custom Event';
  const eventName = event?.name || event?.title || 'Celebration';
  const eventTypeLabel = useMemo(() => {
    const typeLabel = String(rawEventType || 'Custom Event').trim();
    if (!typeLabel) return 'Custom Event';
    return typeLabel;
  }, [rawEventType]);
  const scheduleLabel = getScheduleLabel(eventTypeLabel);
  const eventDescription = event?.description || event?.details || event?.summary || '';
  const coverImage = event?.cover_image || event?.coverImage || event?.image || event?.hero_image || event?.banner_image || '';
  const galleryItems = useMemo(() => {
    const sources = [event?.gallery, event?.images, event?.media].filter(Boolean);
    const flattened = sources.flatMap((entry: any) => (Array.isArray(entry) ? entry : [entry])).filter(Boolean);
    return flattened.filter((item: any) => typeof item === 'string' || (item && typeof item === 'object' && (item.url || item.src || item.image)));
  }, [event]);
  const formattedDate = event?.date || event?.start_date || event?.event_date
    ? new Date(event?.date || event?.start_date || event?.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date to be announced';
  const venue = event?.venue || event?.location || event?.address || '';
  const city = event?.city || event?.location_city || '';
  const state = event?.state || event?.location_state || '';
  const hostName = event?.host_name || event?.hostName || event?.organizer || event?.client_name || event?.clientName || '';
  const participantName = event?.participant_name || event?.participantName || event?.celebrant_name || event?.celebrantName || '';
  const eventTheme = event?.theme || event?.themeName || event?.style || '';
  const supportContact = event?.contact_name || event?.support_contact || event?.support_name || event?.contact || '';
  const mapUrl = event?.map_url || event?.google_maps_url || (venue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}` : '');
  const startTime = event?.start_time || event?.time || event?.start || '';
  const endTime = event?.end_time || event?.end || '';
  const documentItems = Array.isArray(event?.documents) ? event.documents : [];

  useEffect(() => {
    const loadDetails = async () => {
      try {
        if (experienceConfig) {
          setTimeline(experienceConfig.scheduleItems.filter((item) => item.visible !== false));
        } else {
        if (dataService.isConfigured()) {
          const docRef = doc(db, 'event_details', eventId);
          const detailsDoc = await getDoc(docRef);
          if (detailsDoc.exists()) {
            const data = detailsDoc.data();
            if (Array.isArray(data.timeline)) {
              setTimeline(data.timeline);
            }
          }
        }
        }

        const rsvps = await dataService.getRSVPs();
        const existingRSVP = rsvps.find((r: any) => r.family_id === family.id && (r.event_id === eventId || !r.event_id));
        if (existingRSVP) {
          setRsvpData(existingRSVP);
          setAttending(existingRSVP.attending !== false);
          setAdultsCount(existingRSVP.adults_count || 1);
          setSpecialRequests(existingRSVP.special_requests || '');
          setDietaryPreference(existingRSVP.dietary_preference || existingRSVP.dietary_requirements || '');
          setNotes(existingRSVP.message || existingRSVP.note || existingRSVP.notes || '');
          setSelectedFunctions(existingRSVP.functions_attending || []);
          setTransportRequired(Boolean(existingRSVP.transport_required));
          setAccommodationRequired(Boolean(existingRSVP.accommodation_required || existingRSVP.accommodation_stay));
          setCustomAnswers(existingRSVP.customAnswers || {});
        }
      } catch (err) {
        console.error('Error loading generic event details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [eventId, family.id, experienceConfig]);

  useEffect(() => {
    if (timeline.length > 0 && selectedFunctions.length === 0 && !rsvpData) {
      setSelectedFunctions(timeline.map((item: any) => item.name || item.title || item.activity || item.session || '').filter(Boolean));
    }
  }, [timeline, rsvpData, selectedFunctions.length]);

  const handleSaveRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (family?.rsvp_locked || rsvpData?.rsvp_locked) return;
    setSavingRsvp(true);
    try {
      const payload = {
        family_id: family.id,
        event_id: eventId,
        attending,
        adults_count: attending ? adultsCount : 0,
        functions_attending: attending ? selectedFunctions : [],
        special_requests: specialRequests,
        dietary_preference: dietaryPreference,
        transport_required: transportRequired,
        accommodation_required: accommodationRequired,
        accommodation_stay: attending ? accommodationRequired : false,
        customAnswers: attending ? customAnswers : {},
        message: notes,
        updated_at: new Date().toISOString(),
      };
      await dataService.submitRSVP(payload as any);
      setRsvpData(payload);
      setRsvpSuccessMessage('Your RSVP has been saved successfully.');
      window.setTimeout(() => setRsvpSuccessMessage(''), 5000);
    } catch (err) {
      console.error('RSVP Error:', err);
      alert('We could not save your RSVP right now. Please try again.');
    } finally {
      setSavingRsvp(false);
    }
  };

  const detailRows = [
    { label: 'Date', value: formattedDate },
    { label: 'Time', value: [startTime, endTime].filter(Boolean).join(' – ') || 'To be announced' },
    { label: 'Venue', value: venue || 'To be announced' },
    { label: 'Location', value: [city, state].filter(Boolean).join(', ') || 'To be announced' },
  ].filter((row) => row.value);

  if (!isUnveiled) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0%,transparent_70%)] pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center max-w-md w-full">
          <div className="inline-flex items-center justify-center rounded-full border border-amber-400/25 bg-[#111317]/70 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-amber-300/80 mb-6">
            You Are Invited
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight mb-4 text-[#FDFBF7]">{eventName}</h1>
          <p className="text-sm text-[#FDFBF7]/70 mb-8">{eventTypeLabel}</p>
          <div className="mx-auto mb-8 h-px w-16 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <button
            onClick={() => {
              sessionStorage.setItem(`unveiled_generic_${eventId}_${family.id}`, 'true');
              setIsUnveiled(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.25em] text-black transition hover:bg-amber-300"
          >
            Open Invitation
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#FDFBF7] font-sans selection:bg-amber-400/20 selection:text-amber-300 relative">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#111317] via-[#0b0c10] to-transparent pointer-events-none" />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 md:px-8 lg:px-10 lg:py-16">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111317]/90 shadow-[0_0_60px_rgba(0,0,0,0.25)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="flex flex-col justify-center">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-300">
                <Sparkles size={12} />
                {eventTypeLabel}
              </div>
              <h1 className="font-serif text-4xl leading-tight text-[#FDFBF7] sm:text-5xl">{eventName}</h1>
              {eventTheme && (
                <p className="mt-4 text-sm text-[#FDFBF7]/70">Theme: {eventTheme}</p>
              )}
              <p className="mt-6 max-w-xl text-sm leading-7 text-[#FDFBF7]/70">
                {eventDescription || `We are delighted to welcome you to ${eventName}. Your presence will make this occasion truly special.`}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#FDFBF7]/70">
                <div className="rounded-full border border-white/10 bg-[#07080a]/70 px-4 py-2">
                  <span className="text-amber-300">Hosted by</span> {hostName || family.name}
                </div>
                {participantName && (
                  <div className="rounded-full border border-white/10 bg-[#07080a]/70 px-4 py-2">
                    <span className="text-amber-300">For</span> {participantName}
                  </div>
                )}
              </div>
            </div>
            <div className="flex min-h-[280px] items-center justify-center rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#1b1d24] to-[#0d0f13] p-4">
              {coverImage ? (
                <img src={coverImage} alt={eventName} className="h-full w-full rounded-[1.2rem] object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.2rem] border border-dashed border-amber-400/20 bg-[#07080a]/70 px-6 text-center">
                  <Sparkles className="mb-4 text-amber-300" size={24} />
                  <p className="text-sm uppercase tracking-[0.25em] text-amber-300">A thoughtfully curated celebration</p>
                  <p className="mt-3 text-sm text-[#FDFBF7]/70">The details of this event will be shared here as they are confirmed.</p>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        <section className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-[#111317]/80 p-6 shadow-[0_0_40px_rgba(0,0,0,0.2)] sm:grid-cols-2 lg:grid-cols-4">
          {detailRows.map((row) => (
            <div key={row.label} className="rounded-[1.2rem] border border-white/10 bg-[#07080a]/60 p-4">
              <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-amber-300">{row.label}</p>
              <p className="text-sm text-[#FDFBF7]/90">{row.value}</p>
            </div>
          ))}
        </section>

        {eventDescription && experienceConfig?.sectionVisibility?.about !== false && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[1.75rem] border border-white/10 bg-[#111317]/80 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-amber-400/10 p-2 text-amber-300"><Info size={16} /></div>
              <h2 className="text-xl font-serif text-[#FDFBF7]">About the Occasion</h2>
            </div>
            <p className="text-sm leading-8 text-[#FDFBF7]/70">{eventDescription}</p>
          </motion.section>
        )}

        {experienceConfig?.sectionVisibility?.timeline !== false && timeline.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-[1.75rem] border border-white/10 bg-[#111317]/80 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300">Programme</p>
                <h2 className="text-xl font-serif text-[#FDFBF7]">{scheduleLabel}</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-[#07080a]/70 px-3 py-1 text-xs text-[#FDFBF7]/60">{timeline.length} item{timeline.length > 1 ? 's' : ''}</div>
            </div>
            <div className="space-y-4">
              {timeline.map((item: any, idx: number) => (
                <div key={`${item.name || item.title || idx}-${idx}`} className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[#FDFBF7]">{item.name || item.title || item.activity || item.session || `Activity ${idx + 1}`}</h3>
                      {item.description && <p className="mt-2 text-sm text-[#FDFBF7]/65">{item.description}</p>}
                    </div>
                    <div className="text-sm text-[#FDFBF7]/65">
                      {(item.start_time || item.time || item.start) && <p className="flex items-center gap-2"><Clock size={14} />{item.start_time || item.time || item.start}</p>}
                      {(item.end_time || item.end) && <p className="mt-1 flex items-center gap-2"><Clock size={14} />{item.end_time || item.end}</p>}
                    </div>
                  </div>
                  {item.venue && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-[#FDFBF7]/60"><MapPin size={14} />{item.venue}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {experienceConfig?.sectionVisibility?.gallery !== false && galleryItems.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-[1.75rem] border border-white/10 bg-[#111317]/80 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-amber-400/10 p-2 text-amber-300"><Sparkles size={16} /></div>
              <h2 className="text-xl font-serif text-[#FDFBF7]">Moments to Look Forward To</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {galleryItems.slice(0, 4).map((item: any, idx: number) => {
                const imageSrc = typeof item === 'string' ? item : item?.url || item?.src || item?.image;
                return (
                  <div key={`${imageSrc}-${idx}`} className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#07080a]/70">
                    <img src={imageSrc} alt={`Gallery ${idx + 1}`} className="h-48 w-full object-cover" />
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {experienceConfig?.sectionVisibility?.venue !== false && (venue || mapUrl) && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-[1.75rem] border border-white/10 bg-[#111317]/80 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-amber-400/10 p-2 text-amber-300"><Navigation size={16} /></div>
              <h2 className="text-xl font-serif text-[#FDFBF7]">Venue & Directions</h2>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-5">
              <p className="font-semibold text-[#FDFBF7]">{venue || 'Venue to be announced'}</p>
              {(city || state) && <p className="mt-2 text-sm text-[#FDFBF7]/70">{[city, state].filter(Boolean).join(', ')}</p>}
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300">
                  View location <ArrowRight size={14} />
                </a>
              )}
            </div>
          </motion.section>
        )}

        {experienceConfig?.rsvpSettings?.enabled !== false && experienceConfig?.sectionVisibility?.rsvp !== false && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} id="rsvp-section" className="rounded-[1.75rem] border border-white/10 bg-[#111317]/80 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-amber-400/10 p-2 text-amber-300"><CheckCircle size={16} /></div>
              <h2 className="text-xl font-serif text-[#FDFBF7]">RSVP</h2>
            </div>
            <AnimatePresence mode="wait">
              {rsvpSuccessMessage ? (
                <motion.div key="success" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-[1.25rem] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                  {rsvpSuccessMessage}
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} onSubmit={handleSaveRsvp} className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => setAttending(true)} className={`rounded-[1rem] border px-4 py-3 text-sm transition ${attending ? 'border-amber-400 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-[#07080a]/70 text-[#FDFBF7]/70'}`}>
                      Attending
                    </button>
                    <button type="button" onClick={() => setAttending(false)} className={`rounded-[1rem] border px-4 py-3 text-sm transition ${!attending ? 'border-amber-400 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-[#07080a]/70 text-[#FDFBF7]/70'}`}>
                      Not Attending
                    </button>
                  </div>

                  {attending && (
                    <>
                      {experienceConfig?.rsvpSettings?.askAttendeeNames !== false && (
                        <div className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-4">
                          <label className="mb-2 flex items-center gap-2 text-sm text-[#FDFBF7]/70">
                            <Users size={14} /> Number of guests
                          </label>
                          <input type="number" min={1} value={adultsCount} onChange={(e) => setAdultsCount(Number(e.target.value))} className="w-full rounded-[0.9rem] border border-white/10 bg-[#111317] px-3 py-3 text-sm text-[#FDFBF7] outline-none" />
                        </div>
                      )}

                      {timeline.length > 0 && (
                        <div className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-4">
                          <label className="mb-3 flex items-center gap-2 text-sm text-[#FDFBF7]/70">
                            <Calendar size={14} /> Activities you plan to attend
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {timeline.map((item: any, idx: number) => {
                              const optionName = item.name || item.title || item.activity || item.session || `Activity ${idx + 1}`;
                              const checked = selectedFunctions.includes(optionName);
                              return (
                                <button key={optionName} type="button" onClick={() => {
                                  setSelectedFunctions((prev) => checked ? prev.filter((entry) => entry !== optionName) : [...prev, optionName]);
                                }} className={`rounded-full border px-3 py-2 text-sm transition ${checked ? 'border-amber-400 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-[#111317] text-[#FDFBF7]/70'}`}>
                                  {optionName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {experienceConfig?.rsvpSettings?.allowMessage !== false && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-4">
                            <label className="mb-2 block text-sm text-[#FDFBF7]/70">Dietary preference</label>
                            <input value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value)} className="w-full rounded-[0.9rem] border border-white/10 bg-[#111317] px-3 py-3 text-sm text-[#FDFBF7] outline-none" placeholder="Vegetarian, vegan, gluten-free..." />
                          </div>
                          <div className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-4">
                            <label className="mb-2 block text-sm text-[#FDFBF7]/70">Special requests</label>
                            <input value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} className="w-full rounded-[0.9rem] border border-white/10 bg-[#111317] px-3 py-3 text-sm text-[#FDFBF7] outline-none" placeholder="Accessibility, seating, etc." />
                          </div>
                        </div>
                      )}

                      {((experienceConfig?.rsvpSettings?.askTransport !== false && transportRequired) || (experienceConfig?.rsvpSettings?.askAccommodation === true)) && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {experienceConfig?.rsvpSettings?.askTransport !== false && transportRequired && (
                            <label className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-4 text-sm text-[#FDFBF7]/80">
                              <input type="checkbox" checked={transportRequired} onChange={() => setTransportRequired((prev) => !prev)} className="h-4 w-4 rounded border-white/20 bg-[#111317]" />
                              <span className="flex items-center gap-2"><Car size={14} /> Transport assistance needed</span>
                            </label>
                          )}
                          {experienceConfig?.rsvpSettings?.askAccommodation === true && (
                            <label className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-4 text-sm text-[#FDFBF7]/80">
                              <input type="checkbox" checked={accommodationRequired} onChange={() => setAccommodationRequired((prev) => !prev)} className="h-4 w-4 rounded border-white/20 bg-[#111317]" />
                              <span className="flex items-center gap-2"><Hotel size={14} /> Accommodation arrangements needed</span>
                            </label>
                          )}
                        </div>
                      )}

                      {/* Dynamic Custom RSVP Questions */}
                      {experienceConfig?.customQuestions && experienceConfig.customQuestions.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-white/10 text-left">
                          <h4 className="text-[10px] uppercase tracking-widest text-[#a0a0a0] font-bold">Custom Questions</h4>
                          {experienceConfig.customQuestions.map((q: any) => (
                            <div key={q.id} className="flex flex-col gap-1.5">
                              <label className="text-[#FDFBF7]/80 text-xs font-medium">
                                {q.prompt} {q.required && <span className="text-red-400">*</span>}
                              </label>
                              
                              {q.type === 'short' && (
                                <input
                                  required={q.required}
                                  type="text"
                                  className="w-full rounded-[0.9rem] border border-white/10 bg-[#111317] px-3 py-3 text-sm text-[#FDFBF7] outline-none"
                                  value={customAnswers?.[q.id] || ''}
                                  onChange={e => setCustomAnswers(prev => ({
                                    ...prev,
                                    [q.id]: e.target.value
                                  }))}
                                />
                              )}

                              {q.type === 'long' && (
                                <textarea
                                  required={q.required}
                                  rows={3}
                                  className="w-full rounded-[0.9rem] border border-white/10 bg-[#111317] px-3 py-3 text-sm text-[#FDFBF7] outline-none leading-relaxed"
                                  value={customAnswers?.[q.id] || ''}
                                  onChange={e => setCustomAnswers(prev => ({
                                    ...prev,
                                    [q.id]: e.target.value
                                  }))}
                                />
                              )}

                              {q.type === 'yesno' && (
                                <div className="grid grid-cols-2 gap-3">
                                  {['Yes', 'No'].map(opt => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setCustomAnswers(prev => ({
                                        ...prev,
                                        [q.id]: opt
                                      }))}
                                      className={`py-2 rounded-lg border text-center font-bold tracking-wider uppercase font-mono text-[10px] transition-all cursor-pointer ${
                                        customAnswers?.[q.id] === opt 
                                          ? 'border-amber-400 bg-amber-400/10 text-amber-200' 
                                          : 'border-white/10 bg-[#0f0f12] text-[#a0a0a0] hover:border-white/20'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {(q.type === 'single' || q.type === 'multiple') && (
                                <div className="flex flex-wrap gap-2">
                                  {q.options?.split(',').map((opt: string) => {
                                    const cleanOpt = opt.trim();
                                    const isSelected = q.type === 'single'
                                      ? customAnswers?.[q.id] === cleanOpt
                                      : Array.isArray(customAnswers?.[q.id]) && customAnswers[q.id].includes(cleanOpt);
                                    return (
                                      <button
                                        key={cleanOpt}
                                        type="button"
                                        onClick={() => {
                                          if (q.type === 'single') {
                                            setCustomAnswers(prev => ({ ...prev, [q.id]: cleanOpt }));
                                          } else {
                                            const currentList = Array.isArray(customAnswers?.[q.id]) ? [...customAnswers[q.id]] : [];
                                            const newList = currentList.includes(cleanOpt)
                                              ? currentList.filter(item => item !== cleanOpt)
                                              : [...currentList, cleanOpt];
                                            setCustomAnswers(prev => ({ ...prev, [q.id]: newList }));
                                          }
                                        }}
                                        className={`py-1.5 px-3 rounded-lg border text-[10px] uppercase font-mono transition-all cursor-pointer ${
                                          isSelected
                                            ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                                            : 'border-white/10 bg-[#0f0f12] text-[#a0a0a0] hover:border-white/20'
                                        }`}
                                      >
                                        {cleanOpt}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {experienceConfig?.rsvpSettings?.allowMessage !== false && (
                    <div className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-4">
                      <label className="mb-2 block text-sm text-[#FDFBF7]/70">Message for the host</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-[0.9rem] border border-white/10 bg-[#111317] px-3 py-3 text-sm text-[#FDFBF7] outline-none" placeholder="Share a note if you would like." />
                    </div>
                  )}

                  <button type="submit" disabled={savingRsvp} className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black transition hover:bg-amber-300 disabled:opacity-70">
                    {savingRsvp ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} {savingRsvp ? 'Saving...' : 'Submit RSVP'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {(supportContact || documentItems.length > 0) && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-[#111317]/80 p-6 sm:grid-cols-2 sm:p-8">
            {supportContact && (
              <div className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-amber-300">Contact</p>
                <p className="font-semibold text-[#FDFBF7]">{supportContact}</p>
              </div>
            )}
            {documentItems.length > 0 && (
              <div className="rounded-[1.25rem] border border-white/10 bg-[#07080a]/70 p-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-amber-300">Documents</p>
                <div className="space-y-2 text-sm text-[#FDFBF7]/70">
                  {documentItems.map((docItem: any, idx: number) => (
                    <div key={`${docItem?.name || docItem?.title || idx}`} className="flex items-center gap-2"><FileText size={14} /> {docItem?.name || docItem?.title || 'Document'} </div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}
      </div>
    </div>
  );
}
