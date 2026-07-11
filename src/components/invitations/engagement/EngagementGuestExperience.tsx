import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gem, Heart, Calendar, MapPin, Clock, Users, 
  ExternalLink, Loader2, Check, ArrowRight, ArrowLeft, 
  Info, CheckCircle, Lock, Star, Sparkles, Navigation,
  Hotel, Car, FileText
} from 'lucide-react';
import { Family } from '../../../types';
import { dataService } from '../../../lib/dataService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { EventExperienceConfig } from '../../../lib/eventExperience';

interface EngagementGuestExperienceProps {
  family: Family;
  event: any;
  eventId: string;
  experienceConfig?: EventExperienceConfig;
}

function EngagementCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTime();
    const interval = window.setInterval(calculateTime, 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds }
      ].map((item) => (
        <div key={item.label} className="rounded-2xl border border-[#d4af37]/20 bg-[#0f0f12] p-3 text-center">
          <p className="text-2xl font-serif text-[#e2d098]">{String(item.value).padStart(2, '0')}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-[#a0a0a0]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function EngagementGuestExperience({ family, event, eventId, experienceConfig }: EngagementGuestExperienceProps) {
  const [isUnveiled, setIsUnveiled] = useState(() => {
    return sessionStorage.getItem(`unveiled_engagement_${eventId}_${family.id}`) === 'true';
  });

  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  
  // Logistics & Accommodation
  const [roomBooking, setRoomBooking] = useState<any | null>(null);
  const [transport, setTransport] = useState<any | null>(null);
  const [rsvpData, setRsvpData] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // RSVP Form States
  const [attending, setAttending] = useState<boolean>(true);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [dietaryPreference, setDietaryPreference] = useState<string>('');
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [accommodationStay, setAccommodationStay] = useState<boolean>(false);
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState('');

  const coupleNames = event?.coupleName || (event?.bride && event?.groom ? `${event.bride} & ${event.groom}` : event?.bride || 'The Couple');
  const eventName = event?.name || 'Engagement Celebration';
  const formattedDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date to be Announced';
  const eventDescription = event?.description || event?.details || event?.shortDesc || event?.full_desc || '';
  const eventTheme = event?.theme || event?.themeName || event?.style || '';
  const eventLocation = [event?.city, event?.state].filter(Boolean).join(', ');
  const guestDocuments = Array.isArray(family?.documents) ? family.documents.filter(Boolean) : [];
  const galleryItems = Array.isArray(event?.gallery)
    ? event.gallery
    : Array.isArray(event?.media)
      ? event.media
      : Array.isArray(event?.images)
        ? event.images
        : [];
  const normalizedGallery = galleryItems
    .map((item: any) => (typeof item === 'string' ? item : item?.url || item?.image || item?.src || ''))
    .filter(Boolean);
  const supportContact = event?.contact || event?.supportContact || event?.planner_contact || event?.contactNumber || '';
  const targetDate = event?.date || event?.startDate || event?.start_date || event?.event_date;
  const mapUrl = event?.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.venue || '')}`;

  useEffect(() => {
    if (experienceConfig) { setTimeline(experienceConfig.scheduleItems.filter((item) => item.visible !== false)); setLoadingTimeline(false); return; }
    const fetchTimeline = async () => {
      if (!eventId) return;
      try {
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
      } catch (err) {
        console.error('Error loading timeline:', err);
      } finally {
        setLoadingTimeline(false);
      }
    };
    fetchTimeline();
  }, [eventId, experienceConfig]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!family?.id) return;
      try {
        // Room Assignment
        const rooms = await dataService.getRooms();
        const familyRoom = rooms.find((r: any) => r.family_id === family.id);
        if (familyRoom) setRoomBooking(familyRoom);

        // Transport
        const transports = await dataService.getTransports();
        const familyTransport = transports.find((t: any) => t.family_id === family.id);
        if (familyTransport) setTransport(familyTransport);

        // Fetch RSVP
        const rsvps = await dataService.getRSVPs();
        const existingRSVP = rsvps.find((r: any) => r.family_id === family.id);
        if (existingRSVP) {
            setRsvpData(existingRSVP);
            setAttending(existingRSVP.attending !== false);
            setAdultsCount(existingRSVP.adults_count || existingRSVP.total_guests || 1);
            setFamilyMembers(existingRSVP.family_members || []);
            setSpecialRequests(existingRSVP.special_requests || existingRSVP.custom_notes || '');
            setDietaryPreference(existingRSVP.dietary_requirements || existingRSVP.dietary_preference || '');
            setSelectedFunctions(existingRSVP.functions_attending || existingRSVP.events || []);
            setAccommodationStay(existingRSVP.accommodation_stay || false);
            setCustomAnswers(existingRSVP.customAnswers || {});
        } else {
            const initialCount = Math.max(0, (family.max_guests || 1) - 1);
            setFamilyMembers(Array.from({ length: initialCount }, () => ''));
        }
      } catch (err) {
        console.error('Error loading engagement details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [family?.id, family?.max_guests]);

  // Sync selectedFunctions when timeline is loaded and no RSVP is stored yet
  useEffect(() => {
    if (timeline.length > 0 && selectedFunctions.length === 0 && !rsvpData) {
      setSelectedFunctions(timeline.map((item: any) => item.name || item.title));
    }
  }, [timeline, rsvpData]);

  const handleSaveRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (family?.rsvp_locked || rsvpData?.rsvp_locked) return;
    setSavingRsvp(true);
    try {
        const now = new Date().toISOString();
        const payload = {
            family_id: family.id,
            event_id: eventId,
            guest_name: family.name,
            email: rsvpData?.email || `${family.slug || 'guest'}@engagement.com`,
            attending,
            total_guests: attending ? adultsCount : 0,
            children_count: 0,
            events: attending ? selectedFunctions : [],
            custom_notes: specialRequests,
            family_name: family.name,
            primary_guest: family.name,
            adults_count: attending ? adultsCount : 0,
            family_members: attending ? familyMembers.filter(Boolean) : [],
            functions_attending: attending ? selectedFunctions : [],
            special_requests: specialRequests,
            dietary_requirements: dietaryPreference,
            accommodation_stay: attending ? accommodationStay : false,
            customAnswers: attending ? customAnswers : {},
            updated_at: now,
            ...(rsvpData ? {} : { created_at: now })
        };
        await dataService.submitRSVP(payload as any);
        setRsvpData(payload);
        setRsvpSuccessMessage('Your RSVP for our engagement has been beautifully saved.');
        setTimeout(() => setRsvpSuccessMessage(''), 4000);
    } catch(e) {
        console.error('Failed to save RSVP:', e);
        alert('Error saving RSVP. Please try again.');
    } finally {
        setSavingRsvp(false);
    }
  };

  const isRsvpLocked = !!(family?.rsvp_locked || rsvpData?.rsvp_locked);

  if (!isUnveiled) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-[#e2d098] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-10 text-center max-w-sm"
        >
            <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 mx-auto mb-8 flex items-center justify-center rounded-full bg-[#1a1a1e] border border-[#d4af37]/30 shadow-xl shadow-[#d4af37]/10"
            >
                <Gem size={36} className="text-[#d4af37]" strokeWidth={1.5} />
            </motion.div>
            
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-[#d4af37] font-bold mb-4">You Are Invited</h2>
            <h1 className="text-4xl font-serif font-medium tracking-tight mb-2 text-[#e2d098]">{coupleNames}</h1>
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent mx-auto my-6" />
            <p className="text-xs text-[#a0a0a0] mb-10 font-mono tracking-wide">
                Dear {family.name}, {family.custom_greeting || `join us as we celebrate our engagement.`}
            </p>
            
            <button 
                onClick={() => { 
                    sessionStorage.setItem(`unveiled_engagement_${eventId}_${family.id}`, 'true'); 
                    setIsUnveiled(true); 
                }} 
                className="px-8 py-3.5 bg-[#d4af37] text-[#1a1a1e] uppercase font-bold tracking-widest text-[10px] hover:bg-[#b89f5c] transition-colors duration-500 rounded-sm shadow-lg group"
            >
                <span className="flex items-center gap-2">
                    Open Invitation 
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
                </span>
            </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-[#e2d098] font-sans selection:bg-[#d4af37]/20 selection:text-[#d4af37] relative">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1a1a1e] to-transparent pointer-events-none" />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 relative z-10 space-y-24">
        
        {/* Header / Hero */}
        {experienceConfig?.sectionVisibility?.invitationMessage !== false && (
          <motion.header 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }}
              className="text-center"
          >
              <div className="inline-flex items-center justify-center gap-3 mb-6">
                  <span className="w-8 h-[1px] bg-[#d4af37]/40"></span>
                  <Gem size={18} className="text-[#d4af37]" />
                  <span className="w-8 h-[1px] bg-[#d4af37]/40"></span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl font-serif font-medium text-[#e2d098] mb-4 tracking-tight">
                  {experienceConfig?.invitationContent?.heading || coupleNames}
              </h1>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#a0a0a0] mb-8 font-bold">Are Engaged</p>
              
              <div className="w-px h-16 bg-gradient-to-b from-[#d4af37]/50 to-transparent mx-auto mb-8" />
              
              <div className="bg-[#1a1a1e] border border-[#d4af37]/20 p-8 sm:p-10 shadow-xl shadow-black/[0.02] relative">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
                  <p className="text-base sm:text-lg font-serif italic text-[#d4af37] mb-8 leading-relaxed px-4">
                      "{experienceConfig?.invitationContent?.invitationText || "Two hearts, one beautiful beginning."}"
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-xs font-mono tracking-widest text-[#a0a0a0] uppercase">
                      <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-[#d4af37]" /> 
                          {formattedDate}
                      </div>
                      <span className="hidden sm:inline text-[#d4af37]/20">|</span>
                      <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#d4af37]" /> 
                          {event?.venue || 'Venue TBA'}
                      </div>
                  </div>
              </div>
          </motion.header>
        )}

        {experienceConfig?.sectionVisibility?.about !== false && (eventDescription || eventTheme || supportContact || eventLocation || targetDate) && (
            <motion.section 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }} 
                viewport={{ once: true, margin: '-80px' }}
                className="bg-[#1a1a1e] border border-[#d4af37]/20 p-8 sm:p-10 shadow-sm"
            >
                <div className="flex flex-col gap-6">
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#d4af37]">Celebration Details</p>
                        <h2 className="text-2xl font-serif text-[#e2d098]">A beautiful beginning awaits</h2>
                        {eventDescription && <p className="text-sm leading-relaxed text-[#a0a0a0]">{eventDescription}</p>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 text-sm text-[#a0a0a0]">
                        <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0f0f12] p-4">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37] mb-2">Date & Time</p>
                            <p className="font-medium text-[#e2d098]">{formattedDate}</p>
                            {event?.time && <p className="mt-1 text-xs">{event.time}</p>}
                        </div>
                        <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0f0f12] p-4">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37] mb-2">Venue</p>
                            <p className="font-medium text-[#e2d098]">{event?.venue || 'Venue to be announced'}</p>
                            {eventLocation && <p className="mt-1 text-xs">{eventLocation}</p>}
                        </div>
                    </div>
                    {eventTheme && (
                        <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#d4af37]/20 bg-[#0f0f12] px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-[#d4af37]">
                            <Sparkles size={12} /> {eventTheme}
                        </div>
                    )}
                </div>
            </motion.section>
        )}

        {experienceConfig?.sectionVisibility?.invitationMessage !== false && targetDate && (
            <motion.section 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }} 
                viewport={{ once: true, margin: '-80px' }}
                className="bg-[#1a1a1e] border border-[#d4af37]/20 p-8 sm:p-10 text-center"
            >
                <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#d4af37] mb-4">Count Down</p>
                <h3 className="text-2xl font-serif text-[#e2d098] mb-6">The celebration is drawing near</h3>
                <EngagementCountdown targetDate={targetDate} />
            </motion.section>
        )}

        {experienceConfig?.sectionVisibility?.gallery !== false && normalizedGallery.length > 0 && (
            <motion.section 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }} 
                viewport={{ once: true, margin: '-80px' }}
                className="space-y-6"
            >
                <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#d4af37] mb-2">Moments To Come</p>
                    <h2 className="text-2xl font-serif text-[#e2d098]">A glimpse of the celebration</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {normalizedGallery.slice(0, 4).map((image, idx) => (
                        <div key={`${image}-${idx}`} className="overflow-hidden rounded-3xl border border-[#d4af37]/20 bg-[#1a1a1e]">
                            <img src={image} alt={`Engagement highlight ${idx + 1}`} className="h-48 w-full object-cover" />
                        </div>
                    ))}
                </div>
            </motion.section>
        )}

        {/* Dynamic Timeline */}
        {experienceConfig?.sectionVisibility?.timeline !== false && timeline.length > 0 && (
            <motion.section 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }} 
                viewport={{ once: true, margin: "-100px" }}
                className="relative"
            >
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-serif text-[#1A1A1A] mb-3">The Celebration</h2>
                    <p className="text-xs font-mono uppercase tracking-widest text-[#999]">Order of Events</p>
                </div>
                
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#d4af37]/20 before:to-transparent">
                    {timeline.map((slot, idx) => (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#d4af37]/30 bg-[#0f0f12] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ml-0 md:ml-0">
                                <Clock size={14} className="text-[#d4af37]" />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-[#1a1a1e] border border-[#d4af37]/20 shadow-sm group-hover:border-[#d4af37]/40 transition-colors">
                                <div className="text-[10px] uppercase font-mono tracking-widest text-[#d4af37] font-bold mb-2">{slot.time || slot.startTime}</div>
                                <h3 className="font-serif text-lg font-medium text-[#e2d098] mb-2">{slot.name || slot.title}</h3>
                                {slot.description && <p className="text-xs text-[#a0a0a0] leading-relaxed">{slot.description}</p>}
                                {slot.venue && (
                                    <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#a0a0a0] uppercase bg-[#0f0f12] px-2 py-1 border border-[#d4af37]/20">
                                        <MapPin size={10} /> {slot.venue}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.section>
        )}

        {/* Accommodation & Transport (Conditional) */}
        {((roomBooking && experienceConfig?.sectionVisibility?.accommodation !== false) || (transport && experienceConfig?.sectionVisibility?.transport !== false)) && (
            <motion.section 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }} 
                viewport={{ once: true }}
                className="grid sm:grid-cols-2 gap-6"
            >
                {roomBooking && experienceConfig?.sectionVisibility?.accommodation !== false && (
                    <div className="bg-[#1a1a1e] border border-[#d4af37]/20 p-8 text-center shadow-sm">
                        <Hotel size={24} className="mx-auto mb-4 text-[#d4af37]" />
                        <h3 className="font-serif text-lg mb-4 text-[#e2d098]">Accommodation</h3>
                        <div className="space-y-2 font-mono text-xs text-[#a0a0a0]">
                            <p className="uppercase tracking-widest text-[#d4af37] font-bold text-[9px] mb-3">Room Assigned</p>
                            <p><strong className="text-[#e2d098] font-sans">Hotel:</strong> {roomBooking.hotel_name || 'Allocated'}</p>
                            <p><strong className="text-[#e2d098] font-sans">Room:</strong> {roomBooking.room_number || 'TBA'}</p>
                            {roomBooking.floor && <p><strong className="text-[#e2d098] font-sans">Floor:</strong> {roomBooking.floor}</p>}
                        </div>
                    </div>
                )}
                
                {transport && experienceConfig?.sectionVisibility?.transport !== false && (
                    <div className="bg-[#1a1a1e] border border-[#d4af37]/20 p-8 text-center shadow-sm">
                        <Car size={24} className="mx-auto mb-4 text-[#d4af37]" />
                        <h3 className="font-serif text-lg mb-4 text-[#e2d098]">Transport</h3>
                        <div className="space-y-2 font-mono text-xs text-[#a0a0a0]">
                            <p className="uppercase tracking-widest text-[#d4af37] font-bold text-[9px] mb-3">Driver Assigned</p>
                            {transport.driver_name ? (
                                <>
                                    <p><strong className="text-[#e2d098] font-sans">Driver:</strong> {transport.driver_name}</p>
                                    <p><strong className="text-[#e2d098] font-sans">Vehicle:</strong> {transport.vehicle_number || 'TBA'}</p>
                                    {transport.driver_contact && (
                                        <p className="mt-3"><a href={`tel:${transport.driver_contact}`} className="text-[#d4af37] hover:underline">Contact Driver</a></p>
                                    )}
                                </>
                            ) : (
                                <p className="italic text-[#a0a0a0]">Details will be updated soon.</p>
                            )}
                        </div>
                    </div>
                )}
            </motion.section>
        )}

        {/* RSVP Section */}
        <motion.section 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
            id="rsvp-section"
            className="bg-[#1a1a1e] p-8 sm:p-12 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4af37]/5 rounded-full filter blur-3xl" />
            
            <div className="relative z-10 max-w-lg mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-serif text-[#e2d098] mb-2">RSVP</h2>
                    <p className="text-xs font-mono uppercase tracking-widest text-[#d4af37]">Kindly Reply</p>
                </div>

                {rsvpSuccessMessage ? (
                    <div className="bg-[#0f0f12] border border-[#d4af37]/30 p-8 text-center backdrop-blur-sm">
                        <CheckCircle size={32} className="mx-auto mb-4 text-[#d4af37]" />
                        <h4 className="font-mono text-xs uppercase tracking-widest font-bold text-[#e2d098] mb-2">Received</h4>
                        <p className="text-sm text-[#a0a0a0] font-sans">{rsvpSuccessMessage}</p>
                    </div>
                ) : loadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="animate-spin text-[#d4af37]" size={24} />
                        <p className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0]">Loading registry...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSaveRsvp} className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] font-bold block text-center">Will you attend?</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    disabled={isRsvpLocked}
                                    onClick={() => setAttending(true)}
                                    className={`py-4 border text-[10px] uppercase font-mono tracking-widest transition-all ${
                                        attending 
                                            ? 'bg-[#d4af37] border-[#d4af37] text-[#1a1a1e] font-bold shadow-lg shadow-[#d4af37]/20' 
                                            : 'bg-transparent border-[#d4af37]/30 text-[#a0a0a0] hover:border-[#d4af37]/50'
                                    }`}
                                >
                                    Joyfully Accept
                                </button>
                                <button
                                    type="button"
                                    disabled={isRsvpLocked}
                                    onClick={() => setAttending(false)}
                                    className={`py-4 border text-[10px] uppercase font-mono tracking-widest transition-all ${
                                        !attending 
                                            ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#e2d098] font-bold' 
                                            : 'bg-transparent border-[#d4af37]/30 text-[#a0a0a0] hover:border-[#d4af37]/50'
                                    }`}
                                >
                                    Regretfully Decline
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {attending && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-6 overflow-hidden"
                                >
                                    {timeline.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-[#d4af37]/20">
                                            <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] font-bold block">Functions Attending</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {timeline.map((slot, idx) => {
                                                    const functionName = slot.name || slot.title;
                                                    const isSelected = selectedFunctions.includes(functionName);
                                                    return (
                                                        <label key={idx} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${isSelected ? 'border-[#d4af37]/50 bg-[#d4af37]/10' : 'border-[#d4af37]/20 hover:border-[#d4af37]/40'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                disabled={isRsvpLocked}
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedFunctions([...selectedFunctions, functionName]);
                                                                    else setSelectedFunctions(selectedFunctions.filter(f => f !== functionName));
                                                                }}
                                                                className="accent-[#d4af37] w-4 h-4"
                                                            />
                                                            <span className="text-xs text-[#e2d098] font-mono">{functionName}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {experienceConfig?.rsvpSettings?.askAttendeeNames !== false && (
                                        <div className="pt-2">
                                            <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] font-bold block mb-3">Number of Guests</label>
                                            <input
                                                required
                                                disabled={isRsvpLocked}
                                                type="number"
                                                min={1}
                                                max={family.max_guests || 10}
                                                value={adultsCount}
                                                onChange={e => {
                                                    const val = Math.max(1, Number(e.target.value));
                                                    setAdultsCount(val);
                                                    setFamilyMembers(prev => {
                                                        const updated = [...prev];
                                                        while (updated.length < val - 1) updated.push('');
                                                        while (updated.length > val - 1) updated.pop();
                                                        return updated;
                                                    });
                                                }}
                                                className="w-full bg-[#0f0f12] border border-[#d4af37]/30 p-4 text-[#e2d098] font-mono text-sm focus:border-[#d4af37] focus:outline-none transition-colors"
                                            />
                                        </div>
                                    )}

                                    {experienceConfig?.rsvpSettings?.askAttendeeNames !== false && familyMembers.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] font-bold block">Guest Names</label>
                                            {familyMembers.map((member, idx) => (
                                                <input
                                                    key={idx}
                                                    disabled={isRsvpLocked}
                                                    type="text"
                                                    placeholder={`Guest ${idx + 2} Name`}
                                                    value={member}
                                                    onChange={e => {
                                                        const updated = [...familyMembers];
                                                        updated[idx] = e.target.value;
                                                        setFamilyMembers(updated);
                                                    }}
                                                    className="w-full bg-[#0f0f12] border border-[#d4af37]/20 p-3 text-[#e2d098] font-mono text-xs focus:border-[#d4af37] focus:outline-none transition-colors"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Accommodation Request Toggle */}
                                    {experienceConfig?.rsvpSettings?.askAccommodation === true && (
                                        <div className="flex items-center gap-3 bg-[#0f0f12] border border-[#d4af37]/30 p-4 rounded-xl mt-3">
                                            <input 
                                                type="checkbox" 
                                                id="accommodation-stay-check"
                                                disabled={isRsvpLocked}
                                                className="accent-[#d4af37] w-4 h-4 cursor-pointer"
                                                checked={accommodationStay}
                                                onChange={e => setAccommodationStay(e.target.checked)}
                                            />
                                            <label htmlFor="accommodation-stay-check" className="text-xs text-[#a0a0a0] cursor-pointer select-none">
                                                We request accommodation / lodging arrangements for our stay.
                                            </label>
                                        </div>
                                    )}

                                    {/* Dynamic Custom RSVP Questions */}
                                    {experienceConfig?.customQuestions && experienceConfig.customQuestions.length > 0 && (
                                        <div className="space-y-4 pt-4 border-t border-[#d4af37]/20">
                                            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] font-bold">Custom Questions</h4>
                                            {experienceConfig.customQuestions.map((q: any) => (
                                                <div key={q.id} className="flex flex-col gap-1.5 text-left">
                                                    <label className="text-[#e2d098] text-xs font-medium">
                                                        {q.prompt} {q.required && <span className="text-red-400">*</span>}
                                                    </label>
                                                    
                                                    {q.type === 'short' && (
                                                        <input
                                                            required={q.required}
                                                            disabled={isRsvpLocked}
                                                            type="text"
                                                            className="w-full bg-[#0f0f12] border border-[#d4af37]/20 p-3 text-white outline-none focus:border-[#d4af37] transition-all font-mono text-xs"
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
                                                            disabled={isRsvpLocked}
                                                            rows={3}
                                                            className="w-full bg-[#0f0f12] border border-[#d4af37]/20 p-3 text-white outline-none focus:border-[#d4af37] transition-all font-mono text-xs leading-relaxed"
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
                                                                    disabled={isRsvpLocked}
                                                                    onClick={() => setCustomAnswers(prev => ({
                                                                        ...prev,
                                                                        [q.id]: opt
                                                                    }))}
                                                                    className={`py-2 rounded-lg border text-center font-bold tracking-wider uppercase font-mono text-[10px] transition-all cursor-pointer ${
                                                                        customAnswers?.[q.id] === opt 
                                                                            ? 'bg-[#d4af37] text-[#1a1a1e] border-[#d4af37]' 
                                                                            : 'bg-[#0f0f12] border-[#d4af37]/20 text-[#a0a0a0] hover:border-[#d4af37]/40'
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
                                                                        disabled={isRsvpLocked}
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
                                                                                ? 'bg-[#d4af37] text-[#1a1a1e] border-[#d4af37]'
                                                                                : 'bg-[#0f0f12] border-[#d4af37]/20 text-[#a0a0a0] hover:border-[#d4af37]/40'
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
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {experienceConfig?.rsvpSettings?.allowMessage !== false && (
                            <div className="space-y-4 pt-2 border-t border-[#d4af37]/20">
                                <div>
                                    <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] font-bold block mb-3">Dietary Preference</label>
                                    <input
                                        disabled={isRsvpLocked}
                                        type="text"
                                        value={dietaryPreference}
                                        onChange={e => setDietaryPreference(e.target.value)}
                                        placeholder="Vegetarian / Vegan / No restrictions"
                                        className="w-full bg-[#0f0f12] border border-[#d4af37]/30 p-4 text-[#e2d098] font-mono text-xs focus:border-[#d4af37] focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] font-bold block mb-3">Message for the couple</label>
                                    <textarea
                                        disabled={isRsvpLocked}
                                        value={specialRequests}
                                        onChange={e => setSpecialRequests(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#0f0f12] border border-[#d4af37]/30 p-4 text-[#e2d098] font-mono text-xs focus:border-[#d4af37] focus:outline-none transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {!isRsvpLocked ? (
                            <button
                                type="submit"
                                disabled={savingRsvp}
                                className="w-full py-4 bg-[#d4af37] text-[#1a1a1e] font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#b89f5c] transition-colors duration-300 flex items-center justify-center gap-2"
                            >
                                {savingRsvp ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                                {savingRsvp ? 'Saving...' : 'Send RSVP'}
                            </button>
                        ) : (
                            <div className="p-4 border border-[#d4af37]/20 bg-[#0f0f12] text-center text-[#a0a0a0] text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                                <Lock size={12} /> RSVP Locked by Admin
                            </div>
                        )}
                    </form>
                )}
            </div>
        </motion.section>

        {guestDocuments.length > 0 && (
            <motion.section 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }} 
                viewport={{ once: true }}
                className="bg-[#1a1a1e] border border-[#d4af37]/20 p-8 text-left"
            >
                <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#d4af37] mb-4">Documents</p>
                <div className="space-y-3">
                    {guestDocuments.map((doc: any, idx: number) => (
                        <div key={doc.id || idx} className="flex items-center justify-between rounded-2xl border border-[#d4af37]/20 bg-[#0f0f12] px-4 py-3 text-sm text-[#a0a0a0]">
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-[#d4af37]" />
                                <span>{doc.name || doc.fileName || 'Document'}</span>
                            </div>
                            {doc.url && (
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37]">View</a>
                            )}
                        </div>
                    ))}
                </div>
            </motion.section>
        )}

        {supportContact && (
            <motion.section 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }} 
                viewport={{ once: true }}
                className="bg-[#1a1a1e] border border-[#d4af37]/20 p-8 text-center"
            >
                <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#d4af37] mb-3">Need Support?</p>
                <p className="text-sm text-[#a0a0a0]">Please reach out to our celebration team at <a href={`tel:${supportContact}`} className="text-[#e2d098] underline">{supportContact}</a>.</p>
            </motion.section>
        )}

        {/* Map / Location */}
        {event?.venue && (
            <section className="text-center pb-8">
                <a 
                    href={mapUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-[#d4af37]/30 text-[10px] uppercase font-mono tracking-widest text-[#e2d098] hover:border-[#d4af37] hover:text-[#d4af37] transition-colors"
                >
                    <Navigation size={12} /> View Map Directions
                </a>
            </section>
        )}
      </div>
    </div>
  );
}
