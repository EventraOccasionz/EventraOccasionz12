import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Calendar, MapPin, Phone, Users, 
  ArrowRight, ArrowLeft, Loader2, Hotel, Car, Check, 
  ExternalLink, Sparkles, AlertCircle, FileText, CheckCircle, Lock,
  QrCode, ClipboardList, Shield, Music, GlassWater
} from 'lucide-react';
import { Family } from '../../../types';
import { dataService } from '../../../lib/dataService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { EventExperienceConfig } from '../../../lib/eventExperience';

interface AnniversaryGuestExperienceProps {
  family: Family;
  event: any;
  eventId: string;
  experienceConfig?: EventExperienceConfig;
}

export default function AnniversaryGuestExperience({ family, event, eventId, experienceConfig }: AnniversaryGuestExperienceProps) {
  const [view, setView] = useState<'dashboard' | 'rsvp'>('dashboard');

  // Dynamic Event Details & Timeline State
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  // Logistics & Accommodation States
  const [roomBooking, setRoomBooking] = useState<any | null>(null);
  const [transport, setTransport] = useState<any | null>(null);
  const [rsvpData, setRsvpData] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // RSVP Form States
  const [attending, setAttending] = useState<boolean>(true);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [accommodationStay, setAccommodationStay] = useState<boolean>(false);
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState('');

  // Extra modal for digital VIP entry pass
  const [showPassModal, setShowPassModal] = useState(false);

  // Couple / celebrant names extraction
  const coupleName = event?.coupleName || (event?.bride && event?.groom ? `${event.bride} & ${event.groom}` : event?.bride || 'Our Couple');
  const eventName = event?.name || `${coupleName}'s Milestone Anniversary`;
  const anniversaryMilestone = event?.anniversaryMilestone || event?.milestone || '';

  const formattedDate = event?.date 
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Date to be Announced';

  // 1. Fetch Dynamic Event Timeline
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
        } else {
          const cached = localStorage.getItem(`event_details_${eventId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed.timeline)) {
              setTimeline(parsed.timeline);
            }
          }
        }
      } catch (err) {
        console.error('[Anniversary Portal] Error loading timeline:', err);
      } finally {
        setLoadingTimeline(false);
      }
    };

    fetchTimeline();
  }, [eventId, experienceConfig]);

  // 2. Fetch Accommodations, Transport & RSVP status
  useEffect(() => {
    const loadDetails = async () => {
      if (!family?.id) return;
      try {
        // Room Assignment
        const rooms = await dataService.getRooms();
        const familyRoom = rooms.find((r: any) => r.family_id === family.id);
        if (familyRoom) {
          setRoomBooking(familyRoom);
        }

        // Transport
        const transports = await dataService.getTransports();
        const familyTransport = transports.find((t: any) => t.family_id === family.id);
        if (familyTransport) {
          setTransport(familyTransport);
        }

        // RSVP status
        const rsvps = await dataService.getRSVPs();
        const existingRSVP = rsvps.find((r: any) => r.family_id === family.id);
        if (existingRSVP) {
          setRsvpData(existingRSVP);
          setAttending(existingRSVP.attending !== false);
          setAdultsCount(existingRSVP.adults_count || existingRSVP.total_guests || 1);
          setFamilyMembers(existingRSVP.family_members || []);
          setSpecialRequests(existingRSVP.special_requests || existingRSVP.custom_notes || '');
          setSelectedFunctions(existingRSVP.functions_attending || existingRSVP.events || []);
          setAccommodationStay(existingRSVP.accommodation_stay || false);
          setCustomAnswers(existingRSVP.customAnswers || {});
        } else {
          // Initialize empty family members inputs based on maximum guest count minus primary
          const initialCount = Math.max(0, (family.max_guests || 1) - 1);
          setFamilyMembers(Array.from({ length: initialCount }, () => ''));
        }
      } catch (err) {
        console.error('[Anniversary Portal] Error loading logistics details:', err);
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

  // 3. Handle RSVP Submission
  const handleSaveRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (family?.rsvp_locked || rsvpData?.rsvp_locked) return;
    setSavingRsvp(true);
    setRsvpSuccessMessage('');

    try {
      const now = new Date().toISOString();
      const rsvpPayload = {
        family_id: family.id,
        event_id: eventId,
        guest_name: family.name,
        email: rsvpData?.email || `${family.slug || 'guest'}@anniversary-celebration.com`,
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
        accommodation_stay: attending ? accommodationStay : false,
        customAnswers: attending ? customAnswers : {},
        updated_at: now,
        ...(rsvpData ? {} : { created_at: now })
      };

      await dataService.submitRSVP(rsvpPayload as any);
      setRsvpData(rsvpPayload);
      setRsvpSuccessMessage('Your celebration registration and preferences have been received joyfully!');
      setTimeout(() => {
        setView('dashboard');
        setRsvpSuccessMessage('');
      }, 2000);
    } catch (err) {
      console.error('[Anniversary Portal] Failed to save RSVP:', err);
      alert('Failed to save RSVP. Please check your connection and try again.');
    } finally {
      setSavingRsvp(false);
    }
  };

  const isRsvpLocked = !!(family?.rsvp_locked || rsvpData?.rsvp_locked);

  // Directions map URL
  const mapUrl = event?.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.venue || '')}`;

  const toggleFunctionSelection = (funcName: string) => {
    if (isRsvpLocked) return;
    setSelectedFunctions(prev => 
      prev.includes(funcName)
        ? prev.filter(name => name !== funcName)
        : [...prev, funcName]
    );
  };

  return (
    <div id="anniversary-guest-portal" className="bg-[#1a080d] min-h-screen text-[#fcfaf6] font-sans flex flex-col justify-between relative overflow-x-hidden selection:bg-rose-500 selection:text-white">
      
      {/* Decorative Warm Visual Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.07)_0%,transparent_60%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent pointer-events-none" />

      {/* Elegant Rose Gold particle ambient animation wrapper */}
      <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-rose-400/20 animate-ping duration-1000 pointer-events-none" />
      <div className="absolute top-48 right-12 w-3 h-3 rounded-full bg-amber-400/10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-36 left-8 w-2 h-2 rounded-full bg-rose-400/10 animate-pulse pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: LUXURY DASHBOARD */}
        {view === 'dashboard' && (
          <motion.div
            key="anniversary-dashboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 relative z-10 flex-grow"
          >
            {/* Top Navigation Row */}
            <div id="anniversary-header" className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-rose-950 pb-6 mb-8 gap-4">
              <div className="flex items-center gap-3.5">
                <span className="w-11 h-11 rounded-full border border-rose-500/30 bg-rose-500/5 flex items-center justify-center shadow-lg shadow-rose-950/20">
                  <Heart size={18} className="text-rose-400 animate-pulse" />
                </span>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-rose-400 font-mono font-bold">Years of Togetherness</p>
                  <h1 className="font-serif text-lg font-bold text-rose-100 tracking-tight">
                    {coupleName}
                  </h1>
                </div>
              </div>

              <div className="flex items-center">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/40 border border-rose-900/30 text-[10px] text-rose-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  Honored Guest: {family.name}
                </span>
              </div>
            </div>

            {/* Magnificent Hero Invitation Cover */}
            {experienceConfig?.sectionVisibility?.invitationMessage !== false && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.5 }}
                className="relative bg-gradient-to-br from-[#240c13] to-[#16060a] border border-rose-950 rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden mb-8 text-center sm:text-left"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full filter blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
                
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
                  <div className="max-w-2xl">
                    {anniversaryMilestone ? (
                      <span className="text-[10px] font-mono tracking-[0.3em] text-rose-300 uppercase font-semibold bg-rose-500/10 px-3.5 py-1 rounded-full border border-rose-500/20 inline-block mb-4">
                        Celebrating {anniversaryMilestone} Years
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono tracking-[0.3em] text-rose-300 uppercase font-semibold bg-rose-500/10 px-3.5 py-1 rounded-full border border-rose-500/20 inline-block mb-4">
                        Milestone Anniversary
                      </span>
                    )}
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-cream leading-tight">
                      {experienceConfig?.invitationContent?.heading || `Celebrating a Beautiful Journey of Love`}
                    </h2>
                    <p className="text-xs sm:text-sm text-rose-200/80 mt-4 leading-relaxed font-sans max-w-xl">
                      {experienceConfig?.invitationContent?.invitationText || `We invite you to share in our celebration of togetherness, joy, and beautiful memories. Join us at the grand reception of ${coupleName}. Your presence on this momentous occasion is a true blessing to our lives.`}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 mt-8 justify-center sm:justify-start">
                      <button 
                        onClick={() => setView('rsvp')}
                        className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        {rsvpData ? 'Modify Celebration RSVP' : 'Share Blessings & Attend'} <ArrowRight size={13} />
                      </button>
                      <button 
                        onClick={() => setShowPassModal(true)}
                        className="px-6 py-3 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900 text-rose-300 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode size={13} /> Celebration Pass
                      </button>
                    </div>
                  </div>

                  {/* Celebration Details Card */}
                  <div className="bg-black/45 border border-rose-950 rounded-2xl p-6 min-w-[280px] lg:max-w-sm space-y-4 text-left">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold pb-2 border-b border-rose-900/40">Gathering Details</p>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex gap-2.5 items-start">
                        <Calendar size={14} className="text-rose-400 mt-0.5" />
                        <div>
                          <p className="text-rose-400/80 text-[10px]">CELEBRATION DATE</p>
                          <p className="text-rose-100 font-sans text-xs font-semibold mt-0.5">{formattedDate}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <MapPin size={14} className="text-rose-400 mt-0.5" />
                        <div>
                          <p className="text-rose-400/80 text-[10px]">GRAND VENUE</p>
                          <p className="text-rose-100 font-sans text-xs font-semibold mt-0.5">{event?.venue || 'TBA'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <Users size={14} className="text-rose-400 mt-0.5" />
                        <div>
                          <p className="text-rose-400/80 text-[10px]">ORGANIZER</p>
                          <p className="text-rose-100 font-sans text-xs font-semibold mt-0.5">{event?.bride || event?.organizerName || 'Family & Planners'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Interactive Experience Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: RSVP Registry Status */}
              {experienceConfig?.rsvpSettings?.enabled !== false && experienceConfig?.sectionVisibility?.rsvp !== false && (
                <div 
                  id="card-anniversary-rsvp"
                  onClick={() => setView('rsvp')}
                  className="bg-rose-950/10 border border-rose-950 p-6 rounded-2xl hover:border-rose-500/30 hover:bg-rose-950/20 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-xl group-hover:bg-rose-500/10 transition-colors pointer-events-none" />
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                      <ClipboardList size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">Celebration RSVP</h3>
                    <p className="text-xs text-rose-200/70 mt-2 leading-relaxed">
                      {rsvpData 
                        ? 'Review or modify your attendance headcount and celebration preferences.' 
                        : 'Please join us on our auspicious celebration. RSVP before the milestone ceremony.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold flex items-center gap-1">
                      {isRsvpLocked ? 'Review Details' : 'Submit RSVP'} <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    {rsvpData && (
                      <span className={`text-[9px] font-mono uppercase px-2.5 py-0.5 rounded ${
                        rsvpData.attending 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {rsvpData.attending ? 'Attending' : 'Declined'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Card 2: Celebration Timeline */}
              {experienceConfig?.sectionVisibility?.timeline !== false && (
                <div 
                  id="card-anniversary-timeline"
                  className="bg-rose-950/5 border border-rose-950 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-400 flex items-center justify-center mb-4">
                      <Calendar size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Event Itinerary</h3>
                    
                    {loadingTimeline ? (
                      <div className="flex items-center gap-2 mt-4 text-xs text-rose-400/60 font-mono">
                        <Loader2 size={12} className="animate-spin text-rose-400" /> Connecting agenda...
                      </div>
                    ) : timeline.length > 0 ? (
                      <div className="mt-3.5 space-y-2.5 max-h-[130px] overflow-y-auto pr-1">
                        {timeline.map((slot: any, idx: number) => (
                          <div key={idx} className="text-xs font-mono flex items-start gap-2 border-l-2 border-rose-500/20 pl-2.5 py-0.5">
                            <span className="text-rose-400 font-bold whitespace-nowrap">{slot.time || slot.startTime}</span>
                            <span className="text-rose-200/90 font-sans truncate">{slot.name || slot.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-400/60 italic mt-3 font-mono">Ceremonies details will be released soon.</p>
                    )}
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-rose-500/60 mt-4 block">
                    Auspicious Program Timeline
                  </span>
                </div>
              )}

              {/* Card 3: Stay details (Conditional) */}
              {roomBooking && experienceConfig?.sectionVisibility?.accommodation !== false && (
                <div 
                  id="card-anniversary-room"
                  className="bg-rose-950/10 border border-rose-500/20 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-sm">
                      <Hotel size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Suite Assignment</h3>
                    <div className="mt-3 space-y-1.5 font-mono text-xs">
                      <p className="text-rose-300 font-bold">Suite Reserved</p>
                      <p className="text-rose-200">Hotel: <span className="text-white font-medium">{roomBooking.hotel_name || 'Premium Partner Hotel'}</span></p>
                      <p className="text-rose-200">Room No: <span className="text-white font-medium">{roomBooking.room_number || 'TBD'}</span></p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-rose-400 font-bold mt-4 block">
                    Status: {roomBooking.status || 'Confirmed'}
                  </span>
                </div>
              )}

              {/* Card 3 Alternate: Location Map directions */}
              {!roomBooking && experienceConfig?.sectionVisibility?.venue !== false && (
                <div 
                  id="card-anniversary-venue"
                  className="bg-rose-950/5 border border-rose-950 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-400 flex items-center justify-center mb-4">
                      <MapPin size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Venue Directions</h3>
                    <div className="mt-2 text-xs text-rose-200/70">
                      <p className="font-semibold text-rose-100">{event?.venue || 'TBD'}</p>
                      {event?.location && <p className="text-[11px] mt-0.5 leading-tight">{event.location}</p>}
                      {(event?.city || event?.state) && (
                        <p className="text-[11px] text-rose-400 mt-0.5">{event.city}{event?.city && event?.state ? ', ' : ''}{event.state}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <a 
                      href={mapUrl} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      rel="noreferrer" 
                      className="w-full py-2 bg-black/40 hover:bg-rose-950/30 border border-rose-900/40 hover:border-rose-900 rounded-xl font-mono text-[10px] uppercase tracking-widest text-rose-300 flex items-center justify-center gap-1.5 transition-all"
                    >
                      Open in Maps <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}

              {/* Card 4: Transport (Conditional) */}
              {transport && experienceConfig?.sectionVisibility?.transport !== false && (
                <div 
                  id="card-anniversary-transport"
                  className="bg-rose-950/10 border border-rose-500/20 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-sm">
                      <Car size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Transport Support</h3>
                    <div className="mt-3 space-y-1.5 font-mono text-xs">
                      <p className="text-rose-300 font-bold">Chauffeur Scheduled</p>
                      {transport.driver_name ? (
                        <>
                          <p className="text-rose-200">Driver: <span className="text-white font-medium">{transport.driver_name}</span></p>
                          <p className="text-rose-200">Vehicle: <span className="text-white font-medium">{transport.vehicle_number || 'Premium Sedan'}</span></p>
                        </>
                      ) : (
                        <p className="text-rose-400 italic text-[11px] leading-relaxed">Arrival transport assistance is allocated. Driver assignment pending.</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-rose-500 mt-4 block">
                    Pickup: {transport.pickup_location || 'Airport/Station'}
                  </span>
                </div>
              )}

              {/* Card 5: Host Contact Support */}
              {experienceConfig?.sectionVisibility?.contact !== false && (
                <div 
                  id="card-anniversary-contact"
                  className="bg-rose-950/5 border border-rose-950 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-400 flex items-center justify-center mb-4">
                      <Shield size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Celebration Desk</h3>
                    <div className="mt-2.5 font-mono text-xs space-y-1 leading-relaxed">
                      <p className="text-rose-400 uppercase text-[9px] font-bold">Host Liaison Helpline</p>
                      {event?.contact_phone || event?.organizer_phone ? (
                        <p className="text-rose-200 font-medium">{event?.contact_phone || event?.organizer_phone}</p>
                      ) : (
                        <p className="text-rose-500 italic text-[11px]">Help hotline is being structured.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2.5 mt-4">
                    {(event?.contact_phone || event?.organizer_phone) && (
                      <>
                        <a 
                          href={`tel:${event?.contact_phone || event?.organizer_phone}`} 
                          className="text-[9px] font-mono uppercase font-bold text-rose-300 border border-rose-900/40 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 flex items-center gap-1 transition-colors"
                        >
                          Call
                        </a>
                        <a 
                          href={`https://wa.me/${(event?.contact_phone || event?.organizer_phone).replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[9px] font-mono uppercase font-bold text-emerald-400 border border-emerald-900/40 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 flex items-center gap-1 transition-colors"
                        >
                          WhatsApp
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Card 6: Secondary Location Map directions (rendered if stay is active, keeps layout clean) */}
              {roomBooking && experienceConfig?.sectionVisibility?.venue !== false && (
                <div 
                  id="card-anniversary-venue-secondary"
                  className="bg-rose-950/5 border border-rose-950 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-400 flex items-center justify-center mb-4">
                      <MapPin size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Event Venue</h3>
                    <div className="mt-2 text-xs text-rose-200/70">
                      <p className="font-semibold text-rose-100">{event?.venue || 'TBD'}</p>
                      {event?.location && <p className="text-[11px] mt-0.5 leading-tight">{event.location}</p>}
                    </div>
                  </div>
                  <div className="mt-4">
                    <a 
                      href={mapUrl} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      rel="noreferrer" 
                      className="w-full py-2 bg-black/40 hover:bg-rose-950/30 border border-rose-900/40 hover:border-rose-900 rounded-xl font-mono text-[10px] uppercase tracking-widest text-rose-300 flex items-center justify-center gap-1.5 transition-all"
                    >
                      Open in Maps <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* VIEW 2: ROYAL RSVP SHEET */}
        {view === 'rsvp' && (
          <motion.div
            key="anniversary-rsvp-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 relative z-10 flex-grow"
          >
            {/* Back to portal trigger */}
            <div className="mb-6">
              <button
                id="btn-back-to-portal-from-rsvp"
                onClick={() => setView('dashboard')}
                className="px-4 py-2 bg-[#20070e] border border-rose-950 text-rose-300 text-xs rounded-xl hover:bg-rose-950 transition-all font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <ArrowLeft size={14} /> Return to Portal
              </button>
            </div>

            {/* RSVP Form Card */}
            <div className="bg-[#1e070e] border border-rose-950 p-6 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500" />
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-rose-950 pb-5 mb-6 gap-3">
                <div>
                  <span className="text-rose-400 uppercase tracking-[0.25em] text-[10px] font-mono font-bold bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/15 inline-block">Milestone Registry</span>
                  <h3 className="text-2xl font-serif font-bold text-cream mt-2">RSVP & Ceremony Attendance</h3>
                  <p className="text-xs text-rose-300/60 font-mono mt-1">Please confirm your presence to assist our milestone arrangements.</p>
                </div>
                
                {isRsvpLocked && (
                  <span className="w-max px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] uppercase tracking-wider font-mono font-bold rounded-lg flex items-center gap-1.5">
                    <Lock size={12} /> RSVP Locked
                  </span>
                )}
              </div>

              {rsvpSuccessMessage ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center gap-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="font-bold text-emerald-400 uppercase tracking-widest font-mono text-xs">Registry Updated Successfully!</h4>
                  <p className="text-xs text-rose-100 max-w-sm font-mono leading-relaxed">{rsvpSuccessMessage}</p>
                </motion.div>
              ) : loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="animate-spin text-rose-400" size={32} />
                  <p className="text-xs text-rose-400/50 font-mono">Loading registry record...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveRsvp} className="space-y-6 text-xs sm:text-sm">
                  
                  {/* Attendance Selector */}
                  <div className="space-y-3">
                    <label className="text-rose-400/80 text-[10px] uppercase tracking-wider font-mono font-bold block">Will your family join us?</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        disabled={isRsvpLocked}
                        onClick={() => setAttending(true)}
                        className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all cursor-pointer ${
                          attending 
                            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/10' 
                            : 'bg-black/40 border-rose-950 text-rose-400/60 hover:border-rose-900'
                        }`}
                      >
                        Joyfully Accept <Check size={12} className="inline ml-1" />
                      </button>
                      <button
                        type="button"
                        disabled={isRsvpLocked}
                        onClick={() => setAttending(false)}
                        className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all cursor-pointer ${
                          !attending 
                            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/10' 
                            : 'bg-black/40 border-rose-950 text-rose-400/60 hover:border-rose-900'
                        }`}
                      >
                        Regretfully Decline
                      </button>
                    </div>
                  </div>

                  {attending && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6 animate-none"
                    >
                      {/* Attendance count */}
                      {experienceConfig?.rsvpSettings?.askAttendeeNames !== false && (
                        <div>
                          <label className="text-rose-400/80 text-[10px] uppercase tracking-wider font-mono font-bold">Total Celebration Attendees</label>
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
                              // Sync family members array size
                              setFamilyMembers(prev => {
                                const updated = [...prev];
                                while (updated.length < val - 1) updated.push('');
                                while (updated.length > val - 1) updated.pop();
                                return updated;
                              });
                            }}
                            className="w-full bg-black/40 border border-rose-950 rounded-xl p-3 text-rose-200 focus:border-rose-500 outline-none mt-1 transition-colors font-mono"
                          />
                          <p className="text-[10px] text-rose-400/40 mt-1 font-mono">Approved capacity limit: {family.max_guests || 10} guests</p>
                        </div>
                      )}

                      {/* Additional guest names */}
                      {experienceConfig?.rsvpSettings?.askAttendeeNames !== false && familyMembers.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <label className="text-rose-400/80 text-[10px] uppercase tracking-wider font-mono font-bold block">Celebration Guest Names</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {familyMembers.map((member, idx) => (
                              <input
                                key={idx}
                                disabled={isRsvpLocked}
                                type="text"
                                placeholder={`Guest #${idx + 1} Full Name`}
                                value={member}
                                onChange={e => {
                                  const updated = [...familyMembers];
                                  updated[idx] = e.target.value;
                                  setFamilyMembers(updated);
                                }}
                                className="w-full bg-black/40 border border-rose-950/80 focus:border-rose-500 rounded-xl p-3 text-white outline-none transition-all font-sans"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DYNAMIC CEREMONIES CHECKLIST */}
                      {timeline.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-rose-950/60">
                          <label className="text-rose-400/80 text-[10px] uppercase tracking-wider font-mono font-bold block">Ceremony Track Selection</label>
                          <p className="text-[11px] text-rose-400/50 leading-tight">Please select which functions or programs your party intends to join:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            {timeline.map((slot: any, idx: number) => {
                              const funcName = slot.name || slot.title;
                              const isChecked = selectedFunctions.includes(funcName);
                              return (
                                <div 
                                  key={idx}
                                  onClick={() => toggleFunctionSelection(funcName)}
                                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                    isChecked 
                                      ? 'bg-rose-500/5 border-rose-500/40 text-white' 
                                      : 'bg-black/30 border-rose-950 text-rose-400/60 hover:border-rose-900'
                                  }`}
                                >
                                  <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center mt-0.5 transition-all ${
                                    isChecked ? 'bg-rose-500 border-rose-500 text-white' : 'border-rose-900'
                                  }`}>
                                    {isChecked && <Check size={12} strokeWidth={3} />}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-xs leading-tight">{funcName}</p>
                                    <p className="text-[10px] font-mono text-rose-400/80 mt-1">{slot.time || slot.startTime}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Accommodation Request Toggle */}
                      {experienceConfig?.rsvpSettings?.askAccommodation === true && (
                        <div className="flex items-center gap-3 bg-black/40 border border-rose-950/80 p-4 rounded-xl mt-3">
                          <input 
                            type="checkbox" 
                            id="accommodation-stay-check"
                            disabled={isRsvpLocked}
                            className="accent-rose-500 w-4 h-4 cursor-pointer"
                            checked={accommodationStay}
                            onChange={e => setAccommodationStay(e.target.checked)}
                          />
                          <label htmlFor="accommodation-stay-check" className="text-xs text-rose-300 cursor-pointer select-none">
                            We request accommodation / lodging arrangements for our stay.
                          </label>
                        </div>
                      )}

                      {/* Dietary preferences / custom notes */}
                      {experienceConfig?.rsvpSettings?.allowMessage !== false && (
                        <div>
                          <label className="text-rose-400/80 text-[10px] uppercase tracking-wider font-mono font-bold block">Dietary Preferences & Celebration Notes</label>
                          <textarea
                            disabled={isRsvpLocked}
                            placeholder="Please indicate vegetarian options, food allergies, or special celebratory warm wishes..."
                            value={specialRequests}
                            onChange={e => setSpecialRequests(e.target.value)}
                            rows={3}
                            className="w-full bg-black/40 border border-rose-950 rounded-xl p-3 text-rose-200 focus:border-rose-500 outline-none mt-1 transition-all leading-relaxed font-sans"
                          />
                        </div>
                      )}

                      {/* Dynamic Custom RSVP Questions */}
                      {experienceConfig?.customQuestions && experienceConfig.customQuestions.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-rose-950/60">
                          <h4 className="text-rose-400/80 text-[10px] uppercase tracking-wider font-mono font-bold">Custom Questions</h4>
                          {experienceConfig.customQuestions.map((q: any) => (
                            <div key={q.id} className="flex flex-col gap-1.5">
                              <label className="text-rose-300 text-xs font-medium">
                                {q.prompt} {q.required && <span className="text-red-400">*</span>}
                              </label>
                              
                              {q.type === 'short' && (
                                <input
                                  required={q.required}
                                  disabled={isRsvpLocked}
                                  type="text"
                                  className="w-full bg-black/40 border border-rose-950/80 focus:border-rose-500 rounded-xl p-3 text-white outline-none transition-all"
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
                                  className="w-full bg-black/40 border border-rose-950/80 focus:border-rose-500 rounded-xl p-3 text-white outline-none transition-all leading-relaxed"
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
                                          ? 'bg-rose-500 text-white border-rose-500' 
                                          : 'bg-black/40 border-rose-950 text-rose-400/60 hover:border-rose-900'
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
                                            ? 'bg-rose-500 text-white border-rose-500'
                                            : 'bg-black/40 border-rose-950 text-rose-400/60 hover:border-rose-900'
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

                  {/* Submit buttons */}
                  {!isRsvpLocked ? (
                    <button
                      type="submit"
                      disabled={savingRsvp}
                      className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {savingRsvp ? (
                        <>
                          <Loader2 className="animate-spin text-white" size={14} /> Recording Invitation Profile...
                        </>
                      ) : (
                        <>
                          Submit Celebration RSVP <Check size={14} />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs font-mono">
                      <AlertCircle size={14} />
                      Your RSVP is locked. Please connect with celebration liaisons to coordinate custom updates.
                    </div>
                  )}

                </form>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Entry pass gate overlay */}
      <AnimatePresence>
        {showPassModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setShowPassModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e070e] border border-rose-950 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl text-center"
            >
              <div className="absolute top-0 left-0 w-full h-[4px] bg-rose-400" />
              
              <span className="text-[10px] tracking-[0.25em] font-mono text-rose-400 font-bold uppercase block mb-1">Pass Registry</span>
              <h3 className="font-serif font-bold text-cream text-lg">Digital Invitation Pass</h3>
              <p className="text-xs text-rose-300/60 mt-0.5">Please show this barcode pass upon security gate checkpoint arrival.</p>

              {/* QR pass representation */}
              <div className="bg-black/40 rounded-2xl p-6 border border-rose-950 my-5 space-y-4">
                <div className="w-40 h-40 bg-zinc-950 border border-rose-950/80 rounded-xl mx-auto flex items-center justify-center relative overflow-hidden">
                  <QrCode size={120} className="text-rose-100/80" />
                  <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
                </div>
                
                <div className="space-y-1 text-center font-mono">
                  <p className="text-rose-400/80 text-[10px]">SECURITY ENTRY ID</p>
                  <p className="text-rose-100 font-bold tracking-widest text-sm uppercase">{family.access_code}</p>
                </div>

                <div className="border-t border-rose-950/60 pt-3 flex justify-between text-[11px] font-mono text-left">
                  <div>
                    <p className="text-rose-400/60 text-[9px]">GUEST FAMILY</p>
                    <p className="text-cream font-bold leading-tight font-sans mt-0.5">{family.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-rose-400/60 text-[9px]">ATTENDEES</p>
                    <p className="text-cream font-bold mt-0.5">{rsvpData?.total_guests || family.max_guests} Guests</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowPassModal(false)}
                className="w-full py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-200 font-bold font-mono text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
              >
                Close Pass
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Footer */}
      <div className="w-full py-8 text-center text-[9px] uppercase tracking-[0.3em] text-rose-400/40 font-mono relative z-10 border-t border-rose-950/20 mt-10 bg-black/10">
        Prasanna Celebrations Milestone Liaison Panel
      </div>

    </div>
  );
}
