import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Building, Calendar, MapPin, Phone, Users, 
  ArrowRight, ArrowLeft, Loader2, Hotel, Car, Check, 
  ExternalLink, Sparkles, AlertCircle, FileText, CheckCircle, Lock,
  QrCode, ClipboardList, Shield, Award, ChevronRight
} from 'lucide-react';
import { Family } from '../../../types';
import { dataService } from '../../../lib/dataService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { EventExperienceConfig } from '../../../lib/eventExperience';

interface CorporateGuestExperienceProps {
  family: Family;
  event: any;
  eventId: string;
  experienceConfig?: EventExperienceConfig;
}

export default function CorporateGuestExperience({ family, event, eventId, experienceConfig }: CorporateGuestExperienceProps) {
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
  const [attendeesCount, setAttendeesCount] = useState<number>(1);
  const [delegateNames, setDelegateNames] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [accommodationStay, setAccommodationStay] = useState<boolean>(false);
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState('');
  
  // Extra modal for digital VIP pass
  const [showPassModal, setShowPassModal] = useState(false);

  // Extract variables
  const eventName = event?.name || 'Executive Global Summit';
  const organizerName = event?.bride || event?.organizerName || 'Eventra Occasionz';
  const companyLogoText = eventName.split(' ').map((w: string) => w[0]).join('').substring(0, 3).toUpperCase();
  
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
        console.error('[Corporate Portal] Error loading timeline:', err);
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
          setAttendeesCount(existingRSVP.total_guests || 1);
          setDelegateNames(existingRSVP.family_members || []);
          setSpecialRequests(existingRSVP.special_requests || existingRSVP.custom_notes || '');
          setCompanyName(existingRSVP.family_name || '');
          setDesignation(existingRSVP.primary_guest || '');
          setSelectedSessions(existingRSVP.functions_attending || []);
          setAccommodationStay(existingRSVP.accommodation_stay || false);
          setCustomAnswers(existingRSVP.customAnswers || {});
        } else {
          // Initialize delegate names inputs based on maximum guest count minus primary
          const initialCount = Math.max(0, (family.max_guests || 1) - 1);
          setDelegateNames(Array.from({ length: initialCount }, () => ''));
        }
      } catch (err) {
        console.error('[Corporate Portal] Error loading details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
  }, [family?.id, family?.max_guests]);

  // Sync selectedSessions when timeline is loaded and no RSVP is stored yet
  useEffect(() => {
    if (timeline.length > 0 && selectedSessions.length === 0 && !rsvpData) {
      setSelectedSessions(timeline.filter((item: any) => item.rsvpEnabled !== false).map((item: any) => item.name || item.title));
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
        email: rsvpData?.email || `${family.slug || 'guest'}@corporate-summit.com`,
        attending,
        total_guests: attending ? attendeesCount : 0,
        children_count: 0,
        events: attending ? selectedSessions : [],
        custom_notes: specialRequests,
        family_name: companyName, // Map company name
        primary_guest: designation, // Map job designation
        adults_count: attending ? attendeesCount : 0,
        family_members: attending ? delegateNames.filter(Boolean) : [],
        functions_attending: attending ? selectedSessions : [],
        scheduleResponses: attending ? Object.fromEntries(timeline.filter((item: any) => item.rsvpEnabled !== false && selectedSessions.includes(item.name || item.title)).map((item: any) => [item.id, { attending: true, titleSnapshot: item.name || item.title }])) : {},
        special_requests: specialRequests,
        accommodation_stay: attending ? accommodationStay : false,
        customAnswers: attending ? customAnswers : {},
        updated_at: now,
        ...(rsvpData ? {} : { created_at: now })
      };

      await dataService.submitRSVP(rsvpPayload as any);
      setRsvpData(rsvpPayload);
      setRsvpSuccessMessage('Your registration and session planner have been successfully submitted!');
      setTimeout(() => {
        setView('dashboard');
        setRsvpSuccessMessage('');
      }, 2000);
    } catch (err) {
      console.error('[Corporate Portal] Failed to save RSVP:', err);
      alert('Failed to save RSVP. Please check your network and try again.');
    } finally {
      setSavingRsvp(false);
    }
  };

  const isRsvpLocked = !!(family?.rsvp_locked || rsvpData?.rsvp_locked);

  // Directions map URL
  const mapUrl = event?.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.venue || '')}`;

  const toggleSessionSelection = (sessionName: string) => {
    if (isRsvpLocked) return;
    setSelectedSessions(prev => 
      prev.includes(sessionName)
        ? prev.filter(name => name !== sessionName)
        : [...prev, sessionName]
    );
  };

  return (
    <div id="corporate-delegate-portal" className="bg-[#0b0f19] min-h-screen text-[#f3f4f6] font-sans flex flex-col justify-between relative overflow-x-hidden selection:bg-cyan-400 selection:text-black">
      
      {/* Visual background architecture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.08)_0%,transparent_60%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: EXECUTIVE DASHBOARD */}
        {view === 'dashboard' && (
          <motion.div
            key="corporate-dashboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 relative z-10 flex-grow"
          >
            {/* Top Corporate bar */}
            <div id="corporate-header" className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-800 pb-6 mb-8 gap-4">
              <div className="flex items-center gap-3.5">
                <span className="w-11 h-11 rounded-lg border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-center shadow-lg shadow-cyan-950/20 font-bold text-cyan-400 font-mono tracking-wider">
                  {companyLogoText}
                </span>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.35em] text-cyan-400 font-mono font-bold">Executive Delegate Space</p>
                  <h1 className="font-sans text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                    <Building size={16} className="text-cyan-500" /> {eventName}
                  </h1>
                </div>
              </div>

              <div className="flex items-center">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Welcome, Delegate {family.name}
                </span>
              </div>
            </div>

            {/* Premium Hero Invitation Panel */}
            {experienceConfig?.sectionVisibility?.invitationMessage !== false && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.5 }}
                className="relative bg-gradient-to-br from-slate-900 to-[#121826] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden mb-8"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full filter blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-800/20 rounded-full filter blur-2xl pointer-events-none" />
                
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
                  <div className="max-w-2xl">
                    <span className="text-[10px] font-mono tracking-[0.3em] text-cyan-400 uppercase font-semibold bg-cyan-500/10 px-3 py-1 rounded-md border border-cyan-500/20 inline-block mb-4">
                      VIP Delegate Invitation
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                      {experienceConfig?.invitationContent?.heading || `Welcome to the Global Executive Experience`}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-sans max-w-xl">
                      {experienceConfig?.invitationContent?.invitationText || `Prasanna Celebrations is honored to host your delegation at ${eventName}. Utilize this modern portal to configure your attendance preferences, agenda planners, private shuttle logistics, and hotel stays.`}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 mt-6">
                      <button 
                        onClick={() => setView('rsvp')}
                        className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        {rsvpData ? 'Modify Registration' : 'Confirm Attendance'} <ArrowRight size={13} />
                      </button>
                      <button 
                        onClick={() => setShowPassModal(true)}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode size={13} /> View Gate Pass
                      </button>
                    </div>
                  </div>

                  {/* Event Summary Side Panel */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 min-w-[280px] lg:max-w-sm space-y-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold pb-2 border-b border-slate-800">Summit Overview</p>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex gap-2.5 items-start">
                        <Calendar size={14} className="text-cyan-400 mt-0.5" />
                        <div>
                          <p className="text-slate-400 text-[10px]">CONFERENCE DATE</p>
                          <p className="text-white font-sans text-xs font-semibold mt-0.5">{formattedDate}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <MapPin size={14} className="text-cyan-400 mt-0.5" />
                        <div>
                          <p className="text-slate-400 text-[10px]">EXECUTIVE VENUE</p>
                          <p className="text-white font-sans text-xs font-semibold mt-0.5">{event?.venue || 'TBA'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <Users size={14} className="text-cyan-400 mt-0.5" />
                        <div>
                          <p className="text-slate-400 text-[10px]">ORGANIZING SECRETARY</p>
                          <p className="text-white font-sans text-xs font-semibold mt-0.5">{organizerName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: RSVP Registry Status */}
              <div 
                id="card-corp-rsvp"
                onClick={() => setView('rsvp')}
                className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[190px]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full filter blur-xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
                <div>
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                    <ClipboardList size={16} />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">Session Planner & RSVP</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {rsvpData 
                      ? 'Review or adjust your selected schedule tracks and attendee roster.' 
                      : 'Confirm your formal attendance and choose desired breakout sessions.'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1">
                    {isRsvpLocked ? 'Review Planner' : 'Configure RSVP'} <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  {rsvpData && (
                    <span className={`text-[9px] font-mono uppercase px-2.5 py-0.5 rounded ${
                      rsvpData.attending 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {rsvpData.attending ? 'Registered' : 'Declined'}
                    </span>
                  )}
                </div>
              </div>

              {/* Card 2: Summit Agenda Timeline */}
              <div 
                id="card-corp-agenda"
                className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between min-h-[190px]"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mb-4">
                    <Calendar size={16} />
                  </div>
                  <h3 className="text-base font-bold text-white">Event Agenda</h3>
                  
                  {loadingTimeline ? (
                    <div className="flex items-center gap-2 mt-4 text-xs text-slate-500 font-mono">
                      <Loader2 size={12} className="animate-spin text-cyan-400" /> Syncing agenda...
                    </div>
                  ) : timeline.length > 0 ? (
                    <div className="mt-3.5 space-y-2.5 max-h-[130px] overflow-y-auto pr-1">
                      {timeline.map((slot: any, idx: number) => (
                        <div key={idx} className="text-xs font-mono flex items-start gap-2 border-l-2 border-cyan-500/20 pl-2.5 py-0.5">
                          <span className="text-cyan-400 font-bold whitespace-nowrap">{slot.time}</span>
                          <span className="text-slate-300 font-sans truncate">{slot.name || slot.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic mt-3 font-mono">Detailed itinerary will be released soon.</p>
                  )}
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-4 block">
                  Official Schedule Tracker
                </span>
              </div>

              {/* Card 3: Logistics - Room Stay (Conditional) */}
              {roomBooking ? (
                <div 
                  id="card-corp-room"
                  className="bg-slate-900/50 border border-cyan-500/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 shadow-sm">
                      <Hotel size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Stay Allocation</h3>
                    <div className="mt-3 space-y-1.5 font-mono text-xs">
                      <p className="text-cyan-400 font-bold">Luxury Suite Booked</p>
                      <p className="text-slate-300">Resort: <span className="text-white font-medium">{roomBooking.hotel_name || 'Premium Partner Resort'}</span></p>
                      <p className="text-slate-300">Room: <span className="text-white font-medium">{roomBooking.room_number || 'TBD'}</span></p>
                      {roomBooking.floor && <p className="text-slate-300">Floor: <span className="text-white font-medium">{roomBooking.floor}</span></p>}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 font-bold mt-4 block">
                    Status: {roomBooking.status || 'Confirmed'}
                  </span>
                </div>
              ) : (
                /* Card 3 Alternative: Venue & Directions Card */
                <div 
                  id="card-corp-venue"
                  className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mb-4">
                      <MapPin size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Directions & Map</h3>
                    <div className="mt-2 text-xs text-slate-400">
                      <p className="font-semibold text-slate-200">{event?.venue || 'TBD'}</p>
                      {event?.location && <p className="text-[11px] mt-0.5 leading-tight">{event.location}</p>}
                      {(event?.city || event?.state) && (
                        <p className="text-[11px] text-cyan-400 mt-0.5">{event.city}{event?.city && event?.state ? ', ' : ''}{event.state}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <a 
                      href={mapUrl} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      rel="noreferrer" 
                      className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl font-mono text-[10px] uppercase tracking-widest text-cyan-400 flex items-center justify-center gap-1.5 transition-all"
                    >
                      Launch GPS Nav <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}

              {/* Card 4: Logistics - Private Shuttle (Conditional) */}
              {transport && (
                <div 
                  id="card-corp-transport"
                  className="bg-slate-900/50 border border-cyan-500/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 shadow-sm">
                      <Car size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Shuttle & Transport</h3>
                    <div className="mt-3 space-y-1.5 font-mono text-xs">
                      <p className="text-cyan-400 font-bold">Chauffeur Scheduled</p>
                      {transport.driver_name ? (
                        <>
                          <p className="text-slate-300">Driver: <span className="text-white font-medium">{transport.driver_name}</span></p>
                          <p className="text-slate-300">Vehicle: <span className="text-white font-medium">{transport.vehicle_number || 'Luxury Executive Sedan'}</span></p>
                          {transport.driver_contact && (
                            <div className="pt-1.5">
                              <a href={`tel:${transport.driver_contact}`} className="text-[10px] text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded hover:bg-cyan-500/10 inline-flex items-center gap-1 font-semibold">
                                <Phone size={10} /> Contact Driver
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] leading-relaxed">Airport private transfer is booked. Dispatch logs pending.</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-4 block">
                    Pickup: {transport.pickup_location || 'Airport Arrival Terminal'}
                  </span>
                </div>
              )}

              {/* Card 5: Organizer Contact Support Desk */}
              <div 
                id="card-corp-contact"
                className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between min-h-[190px]"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mb-4">
                    <Shield size={16} />
                  </div>
                  <h3 className="text-base font-bold text-white">Delegate Desk</h3>
                  <div className="mt-2.5 font-mono text-xs space-y-1 leading-relaxed">
                    <p className="text-cyan-400 uppercase text-[9px] font-bold">Executive Liaison Hotline</p>
                    {event?.contact_phone || event?.organizer_phone ? (
                      <p className="text-slate-200 font-medium">{event?.contact_phone || event?.organizer_phone}</p>
                    ) : (
                      <p className="text-slate-500 italic text-[11px]">Help desk contact info pending release.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2.5 mt-4">
                  {(event?.contact_phone || event?.organizer_phone) && (
                    <>
                      <a 
                        href={`tel:${event?.contact_phone || event?.organizer_phone}`} 
                        className="text-[9px] font-mono uppercase font-bold text-cyan-400 border border-cyan-500/25 px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 flex items-center gap-1 transition-colors"
                      >
                        Call
                      </a>
                      <a 
                        href={`https://wa.me/${(event?.contact_phone || event?.organizer_phone).replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[9px] font-mono uppercase font-bold text-emerald-400 border border-emerald-400/25 px-3 py-1.5 rounded-lg hover:bg-emerald-400/10 flex items-center gap-1 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Card 6: Venue GPS Address (Only if Room Assignment was active, so card layout remains tidy) */}
              {roomBooking && (
                <div 
                  id="card-corp-venue-secondary"
                  className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mb-4">
                      <MapPin size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white">Summit Location</h3>
                    <div className="mt-2 text-xs text-slate-400">
                      <p className="font-semibold text-slate-200">{event?.venue || 'TBD'}</p>
                      {event?.location && <p className="text-[11px] mt-0.5 leading-tight">{event.location}</p>}
                    </div>
                  </div>
                  <div className="mt-4">
                    <a 
                      href={mapUrl} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      rel="noreferrer" 
                      className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl font-mono text-[10px] uppercase tracking-widest text-cyan-400 flex items-center justify-center gap-1.5 transition-all"
                    >
                      Get Directions <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* VIEW 2: EXECUTIVE RSVP REGISTER */}
        {view === 'rsvp' && (
          <motion.div
            key="corporate-rsvp-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 relative z-10 flex-grow"
          >
            {/* Nav Back block */}
            <div className="mb-6">
              <button
                id="btn-back-to-portal-from-rsvp"
                onClick={() => setView('dashboard')}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-cyan-400 text-xs rounded-xl hover:bg-slate-800 transition-all font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <ArrowLeft size={14} /> Back to Portal
              </button>
            </div>

            {/* Form sheet */}
            <div className="bg-[#0e1422] border border-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-slate-800 pb-5 mb-6 gap-3">
                <div>
                  <span className="text-cyan-400 uppercase tracking-[0.25em] text-[10px] font-mono font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/15 inline-block">Official Registry</span>
                  <h3 className="text-2xl font-bold text-white mt-2">Delegate RSVP & Session Track Planner</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">Configure your formal credential details and sessions attendance below.</p>
                </div>
                
                {isRsvpLocked && (
                  <span className="w-max px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] uppercase tracking-wider font-mono font-bold rounded-lg flex items-center gap-1.5">
                    <Lock size={12} /> Registry Locked
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
                  <h4 className="font-bold text-emerald-400 uppercase tracking-widest font-mono text-xs">Registry Updated!</h4>
                  <p className="text-xs text-slate-300 max-w-sm font-mono leading-relaxed">{rsvpSuccessMessage}</p>
                </motion.div>
              ) : loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="animate-spin text-cyan-400" size={32} />
                  <p className="text-xs text-slate-500 font-mono">Synchronizing records...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveRsvp} className="space-y-6 text-xs sm:text-sm">
                  
                  {/* Attendance Switcher */}
                  <div className="space-y-3">
                    <label className="text-slate-400 text-[10px] uppercase tracking-wider font-mono font-bold block">Will your delegation attend?</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        disabled={isRsvpLocked}
                        onClick={() => setAttending(true)}
                        className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all cursor-pointer ${
                          attending 
                            ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        Confirm Attendance <Check size={12} className="inline ml-1" />
                      </button>
                      <button
                        type="button"
                        disabled={isRsvpLocked}
                        onClick={() => setAttending(false)}
                        className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all cursor-pointer ${
                          !attending 
                            ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        Decline Invitation
                      </button>
                    </div>
                  </div>

                  {attending && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6"
                    >
                      {/* Company & Designation Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-slate-400 text-[10px] uppercase tracking-wider font-mono font-bold block">Company / Business Name</label>
                          <input
                            disabled={isRsvpLocked}
                            type="text"
                            placeholder="e.g. Acme Corporation"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 focus:border-cyan-500 outline-none mt-1 transition-colors font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px] uppercase tracking-wider font-mono font-bold block">Delegate Job Title / Designation</label>
                          <input
                            disabled={isRsvpLocked}
                            type="text"
                            placeholder="e.g. Chief Operating Officer"
                            value={designation}
                            onChange={e => setDesignation(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 focus:border-cyan-500 outline-none mt-1 transition-colors font-sans"
                          />
                        </div>
                      </div>

                      {/* Headcount Inputs */}
                      {experienceConfig?.rsvpSettings?.askAttendeeNames !== false && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 text-[10px] uppercase tracking-wider font-mono font-bold">Total Delegation Size</label>
                            <input
                              required
                              disabled={isRsvpLocked}
                              type="number"
                              min={1}
                              max={family.max_guests || 10}
                              value={attendeesCount}
                              onChange={e => {
                                const val = Math.max(1, Number(e.target.value));
                                setAttendeesCount(val);
                                // Sync other delegate names inputs size
                                setDelegateNames(prev => {
                                  const updated = [...prev];
                                  while (updated.length < val - 1) updated.push('');
                                  while (updated.length > val - 1) updated.pop();
                                  return updated;
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 focus:border-cyan-500 outline-none mt-1 transition-colors font-mono"
                            />
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">Maximum approved headcount: {family.max_guests || 10} guests</p>
                          </div>
                        </div>
                      )}

                      {/* Team Member Names */}
                      {experienceConfig?.rsvpSettings?.askAttendeeNames !== false && delegateNames.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <label className="text-slate-400 text-[10px] uppercase tracking-wider font-mono font-bold block">Additional Team Member Names</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {delegateNames.map((member, idx) => (
                              <input
                                key={idx}
                                disabled={isRsvpLocked}
                                type="text"
                                placeholder={`Team Delegate #${idx + 1}`}
                                value={member}
                                onChange={e => {
                                  const updated = [...delegateNames];
                                  updated[idx] = e.target.value;
                                  setDelegateNames(updated);
                                }}
                                className="w-full bg-slate-950 border border-slate-800/80 focus:border-cyan-500 rounded-xl p-3 text-white outline-none transition-all"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* INTERACTIVE TRACK / SESSIONS CHECKLIST (DYNAMIC AGENDA) */}
                      {timeline.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-slate-800/80">
                          <label className="text-slate-400 text-[10px] uppercase tracking-wider font-mono font-bold block">Breakout Session Track Planner</label>
                          <p className="text-[11px] text-slate-500 leading-tight">Select which dynamic agenda tracks your delegation plans to participate in:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            {timeline.map((slot: any, idx: number) => {
                              const sessionName = slot.name || slot.title;
                              const isChecked = selectedSessions.includes(sessionName);
                              return (
                                <div 
                                  key={idx}
                                  onClick={() => toggleSessionSelection(sessionName)}
                                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                    isChecked 
                                      ? 'bg-cyan-500/5 border-cyan-500/40 text-white' 
                                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                  }`}
                                >
                                  <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center mt-0.5 transition-all ${
                                    isChecked ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700'
                                  }`}>
                                    {isChecked && <Check size={12} strokeWidth={3} />}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-xs leading-tight">{sessionName}</p>
                                    <p className="text-[10px] font-mono text-cyan-400/80 mt-1">{slot.time || slot.startTime}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Accommodation Request Toggle */}
                      {experienceConfig?.rsvpSettings?.askAccommodation === true && (
                        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl mt-3">
                          <input 
                            type="checkbox" 
                            id="accommodation-stay-check"
                            disabled={isRsvpLocked}
                            className="accent-cyan-400 w-4 h-4 cursor-pointer"
                            checked={accommodationStay}
                            onChange={e => setAccommodationStay(e.target.checked)}
                          />
                          <label htmlFor="accommodation-stay-check" className="text-xs text-slate-300 cursor-pointer select-none">
                            We request accommodation / lodging arrangements for our stay.
                          </label>
                        </div>
                      )}

                      {/* Special requests / Diet preferences */}
                      {experienceConfig?.rsvpSettings?.allowMessage !== false && (
                        <div>
                          <label className="text-slate-400 text-[10px] uppercase tracking-wider font-mono font-bold block">Dietary preferences & Accommodation demands</label>
                          <textarea
                            disabled={isRsvpLocked}
                            placeholder="Please note any dietary allergies, vegetarian preferences, or accessibility requirements..."
                            value={specialRequests}
                            onChange={e => setSpecialRequests(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-cyan-500 outline-none mt-1 transition-all leading-relaxed font-sans"
                          />
                        </div>
                      )}

                      {/* Dynamic Custom RSVP Questions */}
                      {experienceConfig?.customQuestions && experienceConfig.customQuestions.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-800/80">
                          <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-mono font-bold">Custom Questions</h4>
                          {experienceConfig.customQuestions.map((q: any) => (
                            <div key={q.id} className="flex flex-col gap-1.5">
                              <label className="text-slate-300 text-xs font-medium">
                                {q.prompt} {q.required && <span className="text-red-400">*</span>}
                              </label>
                              
                              {q.type === 'short' && (
                                <input
                                  required={q.required}
                                  disabled={isRsvpLocked}
                                  type="text"
                                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-cyan-500 rounded-xl p-3 text-white outline-none transition-all"
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
                                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-cyan-500 rounded-xl p-3 text-white outline-none transition-all leading-relaxed"
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
                                          ? 'bg-cyan-500 text-slate-950 border-cyan-500' 
                                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
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
                                            ? 'bg-cyan-500 text-slate-950 border-cyan-500'
                                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
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

                  {/* Submit Button */}
                  {!isRsvpLocked ? (
                    <button
                      type="submit"
                      disabled={savingRsvp}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {savingRsvp ? (
                        <>
                          <Loader2 className="animate-spin text-slate-950" size={14} /> Saving Credential Profiles...
                        </>
                      ) : (
                        <>
                          Submit Credential Registry <Check size={14} />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs font-mono">
                      <AlertCircle size={14} />
                      Your delegation profile RSVP is locked. Please contact help desk to make custom adjustments.
                    </div>
                  )}

                </form>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Pass Gate Modal Overlay */}
      <AnimatePresence>
        {showPassModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setShowPassModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl text-center"
            >
              <div className="absolute top-0 left-0 w-full h-[4px] bg-cyan-400" />
              
              <span className="text-[10px] tracking-[0.25em] font-mono text-cyan-400 font-bold uppercase block mb-1">Gate Pass Registry</span>
              <h3 className="font-bold text-white text-lg">Official Digital Entry Pass</h3>
              <p className="text-xs text-slate-400 mt-0.5">Show this pass barcode/QR upon arrival at security checkpoint.</p>

              {/* Pass representation */}
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 my-5 space-y-4">
                <div className="w-40 h-40 bg-slate-900 border border-slate-800/80 rounded-xl mx-auto flex items-center justify-center relative overflow-hidden group">
                  <QrCode size={120} className="text-white/80" />
                  <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                </div>
                
                <div className="space-y-1 text-center font-mono">
                  <p className="text-slate-400 text-[10px]">DELEGATE ID</p>
                  <p className="text-white font-bold tracking-widest text-sm uppercase">{family.access_code}</p>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex justify-between text-[11px] font-mono text-left">
                  <div>
                    <p className="text-slate-500 text-[9px]">GUEST DELEGATION</p>
                    <p className="text-white font-bold leading-tight font-sans mt-0.5">{family.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-[9px]">APPROVED SIZE</p>
                    <p className="text-white font-bold mt-0.5">{rsvpData?.total_guests || family.max_guests} Guests</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowPassModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
              >
                Close Pass
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant minimalist credit footer */}
      <div className="w-full py-8 text-center text-[9px] uppercase tracking-[0.3em] text-slate-500 font-mono relative z-10 border-t border-slate-900 mt-10 bg-slate-950/20">
        Prasanna Celebrations Executive Coordination Hub
      </div>

    </div>
  );
}
