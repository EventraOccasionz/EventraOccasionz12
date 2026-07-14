import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cake, Gift, Calendar, MapPin, Phone, Users, 
  ArrowRight, ArrowLeft, Loader2, Hotel, Car, Check, 
  ExternalLink, Sparkles, AlertCircle, FileText, CheckCircle, Lock
} from 'lucide-react';
import { Family } from '../../../types';
import BirthdayExperience from '../../birthday/BirthdayExperience';
import { dataService } from '../../../services/dataService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface BirthdayGuestExperienceProps {
  family: Family;
  event: any;
  eventId: string;
}

export default function BirthdayGuestExperience({ family, event, eventId }: BirthdayGuestExperienceProps) {
  const [view, setView] = useState<'dashboard' | 'invitation' | 'rsvp'>('dashboard');

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
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState('');

  // Extract variables
  const birthdayPerson = event?.bride || event?.birthdayPerson || 'Shivam';
  const eventName = event?.name || `${birthdayPerson}'s Grand Celebration`;
  
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
        console.error('[Birthday Portal] Error loading timeline:', err);
      } finally {
        setLoadingTimeline(false);
      }
    };

    fetchTimeline();
  }, [eventId]);

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
          setChildrenCount(existingRSVP.children_count || 0);
          setFamilyMembers(existingRSVP.family_members || []);
          setSpecialRequests(existingRSVP.special_requests || existingRSVP.custom_notes || '');
        } else {
          // Initialize empty family members inputs based on maximum guest count minus primary
          const initialCount = Math.max(0, (family.max_guests || 1) - 1);
          setFamilyMembers(Array.from({ length: initialCount }, () => ''));
        }
      } catch (err) {
        console.error('[Birthday Portal] Error loading logistics details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
  }, [family?.id, family?.max_guests]);

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
        email: rsvpData?.email || `${family.slug || 'guest'}@birthday-celebration.com`,
        attending,
        total_guests: attending ? adultsCount : 0,
        children_count: attending ? childrenCount : 0,
        events: attending ? ['Birthday Celebration'] : [],
        custom_notes: specialRequests,
        family_name: family.name,
        primary_guest: family.name,
        adults_count: attending ? adultsCount : 0,
        family_members: attending ? familyMembers.filter(Boolean) : [],
        functions_attending: attending ? ['Birthday Celebration'] : [],
        special_requests: specialRequests,
        updated_at: now,
        ...(rsvpData ? {} : { created_at: now })
      };

      await dataService.submitRSVP(rsvpPayload as any);
      setRsvpData(rsvpPayload);
      setRsvpSuccessMessage('Your RSVP response has been recorded successfully!');
      setTimeout(() => {
        setView('dashboard');
        setRsvpSuccessMessage('');
      }, 2000);
    } catch (err) {
      console.error('[Birthday Portal] Failed to save RSVP:', err);
      alert('Failed to save RSVP. Please check your network and try again.');
    } finally {
      setSavingRsvp(false);
    }
  };

  const isRsvpLocked = !!(family?.rsvp_locked || rsvpData?.rsvp_locked);

  // Directions map URL
  const mapUrl = event?.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.venue || '')}`;

  return (
    <div id="birthday-guest-portal-container" className="bg-[#080410] min-h-screen text-[#FDFBF7] font-sans selection:bg-amber-400 selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      
      {/* Background radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
      
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: MAIN DASHBOARD */}
        {view === 'dashboard' && (
          <motion.div
            key="birthday-dashboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 relative z-10 flex-grow"
          >
            {/* Top Header bar */}
            <div id="birthday-dashboard-header" className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-purple-500/10 pb-6 mb-8 gap-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full border border-amber-400/20 bg-amber-400/5 flex items-center justify-center shadow-lg shadow-purple-950/20">
                  <Cake size={20} className="text-amber-300 animate-pulse" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300 font-mono font-bold">Celebration Guest Portal</p>
                  <h1 className="font-serif text-xl text-amber-100 tracking-tight uppercase">
                    🎂 {birthdayPerson}'s Birthday
                  </h1>
                </div>
              </div>

              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Welcome, {family.name}
                </span>
              </div>
            </div>

            {/* Celebratory Intro Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="relative bg-gradient-to-br from-[#120a22]/90 to-[#1b0d30]/90 border border-amber-400/25 rounded-3xl p-6 sm:p-10 text-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden mb-8"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400/5 rounded-full filter blur-3xl pointer-events-none" />
              <Sparkles className="absolute top-4 right-4 text-amber-300/10 w-10 h-10 animate-spin" style={{ animationDuration: '60s' }} />
              
              <span className="text-[9px] uppercase tracking-[0.35em] text-amber-300 font-mono block mb-2">Exclusive Invitation Space</span>
              <h2 className="font-serif text-2xl sm:text-4xl text-amber-200 tracking-tight leading-tight mb-4">
                The Celebration Hub
              </h2>
              <p className="text-xs sm:text-sm text-[#FDFBF7]/85 font-mono tracking-wide leading-relaxed max-w-2xl mx-auto">
                Welcome to your guest portal for <span className="text-amber-300 font-bold">{eventName}</span>. We are absolutely thrilled to host you as a VIP guest. Coordinate your RSVP, review the party timeline, and access location maps directly below.
              </p>
            </motion.div>

            {/* Grid Layout for Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Birthday Invitation */}
              <div 
                id="card-birthday-invitation"
                onClick={() => setView('invitation')}
                className="bg-[#12081f]/60 border border-amber-400/10 p-6 rounded-2xl hover:border-amber-400/40 hover:bg-[#180a29]/70 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[180px]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full filter blur-xl group-hover:bg-amber-400/10 transition-colors pointer-events-none" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4 shadow-md shadow-amber-950/20">
                    <Gift size={18} />
                  </div>
                  <h3 className="font-serif text-lg text-amber-100 group-hover:text-amber-300 transition-colors font-semibold">Birthday Invitation</h3>
                  <p className="text-xs text-[#FDFBF7]/70 mt-2 leading-relaxed">Open your personalized celebration invitation, experience the countdown, and unveil design details.</p>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-amber-300 font-mono font-bold mt-4 flex items-center gap-1.5">
                  View Invitation <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              {/* Card 2: RSVP */}
              <div 
                id="card-birthday-rsvp"
                onClick={() => setView('rsvp')}
                className="bg-[#12081f]/60 border border-amber-400/10 p-6 rounded-2xl hover:border-amber-400/40 hover:bg-[#180a29]/70 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[180px]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full filter blur-xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-400/5 border border-purple-400/20 text-purple-300 flex items-center justify-center mb-4 shadow-md shadow-purple-950/20">
                    <FileText size={18} />
                  </div>
                  <h3 className="font-serif text-lg text-purple-200 group-hover:text-purple-300 transition-colors font-semibold">RSVP</h3>
                  <p className="text-xs text-[#FDFBF7]/70 mt-2 leading-relaxed">
                    {rsvpData ? 'Review or modify your recorded RSVP selection.' : 'Let us know if you\'ll be joining the celebration.'}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[9px] uppercase tracking-widest text-purple-300 font-mono font-bold flex items-center gap-1.5">
                    {isRsvpLocked ? 'View RSVP' : 'Manage RSVP'} <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  {rsvpData && (
                    <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      rsvpData.attending 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {rsvpData.attending ? 'Attending' : 'Declined'}
                    </span>
                  )}
                </div>
              </div>

              {/* Card 3: Party Schedule */}
              <div 
                id="card-birthday-schedule"
                className="bg-[#12081f]/40 border border-purple-500/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-400/5 border border-purple-400/20 text-purple-300 flex items-center justify-center mb-4 shadow-md shadow-purple-950/20">
                    <Calendar size={18} />
                  </div>
                  <h3 className="font-serif text-lg text-amber-100 font-semibold">Party Schedule</h3>
                  
                  {loadingTimeline ? (
                    <div className="flex items-center gap-2 mt-4 text-xs text-[#FDFBF7]/50 font-mono">
                      <Loader2 size={12} className="animate-spin text-amber-300" /> Loading schedule...
                    </div>
                  ) : timeline.length > 0 ? (
                    <div className="mt-3 space-y-2 max-h-[130px] overflow-y-auto pr-1">
                      {timeline.map((slot: any, idx: number) => (
                        <div key={idx} className="text-[11px] font-mono flex items-start gap-1.5 border-l-2 border-amber-400/20 pl-2">
                          <span className="text-amber-300 font-bold whitespace-nowrap">{slot.time}</span>
                          <span className="text-[#FDFBF7]/80">{slot.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#FDFBF7]/60 italic mt-3 font-mono leading-relaxed">Party schedule will be updated soon.</p>
                  )}
                </div>
                <span className="text-[8px] uppercase tracking-widest text-[#FDFBF7]/40 font-mono mt-4">
                  Timeline Itinerary
                </span>
              </div>

              {/* Card 4: Venue */}
              <div 
                id="card-birthday-venue"
                className="bg-[#12081f]/40 border border-purple-500/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-400/5 border border-purple-400/20 text-purple-300 flex items-center justify-center mb-4 shadow-md shadow-purple-950/20">
                    <MapPin size={18} />
                  </div>
                  <h3 className="font-serif text-lg text-amber-100 font-semibold">Venue</h3>
                  <div className="mt-2.5 font-mono text-xs text-[#FDFBF7]/80 space-y-0.5">
                    <p className="font-sans font-bold text-amber-100 leading-tight">{event?.venue || 'To Be Announced'}</p>
                    {event?.location && <p className="text-[11px] leading-tight text-[#FDFBF7]/60">{event.location}</p>}
                    {(event?.city || event?.state) && (
                      <p className="text-[10px] text-amber-300/80">{event.city}{event?.city && event?.state ? ', ' : ''}{event.state}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-[9px] uppercase font-mono text-[#FDFBF7]/40">Date: {formattedDate}</p>
                  <a 
                    href={mapUrl} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    rel="noreferrer" 
                    className="w-full py-2 border border-amber-400/20 hover:border-amber-400/50 hover:bg-amber-400/5 rounded-xl font-mono text-[9px] uppercase tracking-widest text-amber-300 flex items-center justify-center gap-1.5 transition-all"
                  >
                    Get Directions <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Card 5: Contact Host */}
              <div 
                id="card-birthday-contact"
                className="bg-[#12081f]/40 border border-purple-500/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-400/5 border border-purple-400/20 text-purple-300 flex items-center justify-center mb-4 shadow-md shadow-purple-950/20">
                    <Users size={18} />
                  </div>
                  <h3 className="font-serif text-lg text-amber-100 font-semibold">Contact Host</h3>
                  <div className="mt-2.5 font-mono text-xs space-y-1">
                    <p className="text-amber-300 uppercase text-[9px] font-bold">Celebration Support Desk</p>
                    {event?.contact_phone || event?.organizer_phone ? (
                      <p className="text-cream font-medium">{event?.contact_phone || event?.organizer_phone}</p>
                    ) : (
                      <p className="text-[#FDFBF7]/60 italic text-[11px]">Contact information is being set up.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  {(event?.contact_phone || event?.organizer_phone) && (
                    <>
                      <a 
                        href={`tel:${event?.contact_phone || event?.organizer_phone}`} 
                        className="text-[9px] font-mono uppercase font-bold text-amber-300 border border-amber-400/25 px-3 py-1.5 rounded-lg hover:bg-amber-400/5 flex items-center gap-1 transition-colors"
                      >
                        Call
                      </a>
                      <a 
                        href={`https://wa.me/${(event?.contact_phone || event?.organizer_phone).replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[9px] font-mono uppercase font-bold text-green-400 border border-green-400/25 px-3 py-1.5 rounded-lg hover:bg-green-400/5 flex items-center gap-1 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Card 6: Accommodation (Only shown conditionally) */}
              {roomBooking && (
                <div 
                  id="card-birthday-accommodation"
                  className="bg-[#12081f]/40 border border-amber-400/20 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4 shadow-md shadow-amber-950/20">
                      <Hotel size={18} />
                    </div>
                    <h3 className="font-serif text-lg text-cream font-semibold">Your Accommodation</h3>
                    <div className="mt-2 space-y-1 font-mono text-xs">
                      <p className="text-amber-300 font-bold">Stay Assignment Confirmed</p>
                      <p className="text-[#FDFBF7]/80">Hotel: <span className="text-[#FDFBF7] font-medium">{roomBooking.hotel_name || 'Allocated Luxury Resort'}</span></p>
                      <p className="text-[#FDFBF7]/80">Room: <span className="text-[#FDFBF7] font-medium">{roomBooking.room_number || 'TBD'}</span></p>
                      {roomBooking.floor && <p className="text-[#FDFBF7]/80">Floor: <span className="text-[#FDFBF7] font-medium">{roomBooking.floor}</span></p>}
                    </div>
                  </div>
                  <span className="text-[8px] uppercase tracking-widest text-[#FDFBF7]/40 font-mono mt-4">
                    Status: {roomBooking.status || 'Assigned'}
                  </span>
                </div>
              )}

              {/* Card 7: Transport (Only shown conditionally) */}
              {transport && (
                <div 
                  id="card-birthday-transport"
                  className="bg-[#12081f]/40 border border-amber-400/20 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4 shadow-md shadow-amber-950/20">
                      <Car size={18} />
                    </div>
                    <h3 className="font-serif text-lg text-cream font-semibold">Your Transport</h3>
                    <div className="mt-2 space-y-1 font-mono text-xs">
                      <p className="text-amber-300 font-bold">Dispatcher Updates</p>
                      {transport.driver_name ? (
                        <>
                          <p className="text-[#FDFBF7]/80">Driver: <span className="text-[#FDFBF7] font-medium">{transport.driver_name}</span></p>
                          <p className="text-[#FDFBF7]/80">Vehicle: <span className="text-[#FDFBF7] font-medium">{transport.vehicle_number || 'Allocated Private Car'}</span></p>
                          {transport.driver_contact && (
                            <div className="pt-2">
                              <a href={`tel:${transport.driver_contact}`} className="text-[10px] text-amber-300 border border-amber-400/25 px-2.5 py-1 rounded hover:bg-amber-400/10 inline-flex items-center gap-1">
                                <Phone size={10} /> Call Driver
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-[#FDFBF7]/60 italic text-[11px]">Private airport shuttle scheduled. Driver details pending.</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[8px] uppercase tracking-widest text-[#FDFBF7]/40 font-mono mt-4">
                    Pickup: {transport.pickup_location || 'Airport/Terminal'}
                  </span>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* VIEW 2: BIRTHDAY INVITATION EXPERIENCE */}
        {view === 'invitation' && (
          <motion.div
            key="birthday-invitation-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex-grow relative"
          >
            {/* Top Navigation Bar for pure local state back button */}
            <div className="sticky top-0 bg-[#080410]/95 border-b border-purple-500/10 py-4 px-6 flex justify-between items-center z-50 backdrop-blur-md">
              <button
                id="btn-back-to-portal-from-invite"
                onClick={() => setView('dashboard')}
                className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-xs rounded-xl hover:text-purple-200 transition-all font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <ArrowLeft size={14} /> Back to Portal
              </button>
              
              <span className="text-[10px] uppercase tracking-[0.25em] text-amber-300 font-mono font-bold hidden sm:inline">
                Invitation Screen
              </span>
            </div>

            {/* Renders existing Birthday Invitation Experience */}
            <BirthdayExperience family={family} currentEvent={event} />
          </motion.div>
        )}

        {/* VIEW 3: BIRTHDAY RSVP REGISTRY */}
        {view === 'rsvp' && (
          <motion.div
            key="birthday-rsvp-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 relative z-10 flex-grow"
          >
            {/* Back to Portal button */}
            <div className="mb-6">
              <button
                id="btn-back-to-portal-from-rsvp"
                onClick={() => setView('dashboard')}
                className="px-4 py-2 bg-[#120a1c] border border-amber-400/20 text-amber-300 text-xs rounded-xl hover:bg-amber-400/10 transition-all font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Portal
              </button>
            </div>

            {/* RSVP Form Container */}
            <div className="bg-[#120a1c]/95 border border-amber-400/20 p-6 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 via-amber-400 to-pink-500" />
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-purple-500/10 pb-5 mb-6 gap-3">
                <div>
                  <span className="text-amber-300 uppercase tracking-[0.2em] text-[10px] font-mono font-bold">Party Registry</span>
                  <h3 className="font-serif text-2xl text-amber-100 mt-1">RSVP Response</h3>
                  <p className="text-xs text-[#FDFBF7]/60 font-mono mt-0.5">Let us know if you will be joining the birthday festivities.</p>
                </div>
                
                {isRsvpLocked && (
                  <span className="w-max px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] uppercase tracking-wider font-mono font-bold rounded-lg flex items-center gap-1">
                    <Lock size={12} /> Registry Locked
                  </span>
                )}
              </div>

              {rsvpSuccessMessage ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-green-500/5 border border-green-500/20 rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="font-bold text-green-400 uppercase tracking-widest font-mono text-xs">RSVP Saved!</h4>
                  <p className="text-xs text-[#FDFBF7]/80 max-w-sm font-mono leading-relaxed">{rsvpSuccessMessage}</p>
                </motion.div>
              ) : loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="animate-spin text-amber-300" size={32} />
                  <p className="text-xs text-[#FDFBF7]/50 font-mono">Retrieving your responses...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveRsvp} className="space-y-6 text-xs sm:text-sm">
                  
                  {/* Attendance Switcher */}
                  <div className="space-y-3">
                    <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold block">Will you attend?</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        disabled={isRsvpLocked}
                        onClick={() => setAttending(true)}
                        className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all cursor-pointer ${
                          attending 
                            ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-400/10' 
                            : 'bg-black/40 border-amber-400/20 text-[#FDFBF7]/60 hover:border-amber-400/40'
                        }`}
                      >
                        Yes, I'll Be There! 🎉
                      </button>
                      <button
                        type="button"
                        disabled={isRsvpLocked}
                        onClick={() => setAttending(false)}
                        className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all cursor-pointer ${
                          !attending 
                            ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-400/10' 
                            : 'bg-black/40 border-amber-400/20 text-[#FDFBF7]/60 hover:border-amber-400/40'
                        }`}
                      >
                        Decline invitation
                      </button>
                    </div>
                  </div>

                  {attending && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6"
                    >
                      {/* Headcount Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold">Adults Attending</label>
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
                              // Sync other family members inputs size
                              setFamilyMembers(prev => {
                                const updated = [...prev];
                                while (updated.length < val - 1) updated.push('');
                                while (updated.length > val - 1) updated.pop();
                                return updated;
                              });
                            }}
                            className="w-full bg-black/40 border border-amber-400/20 rounded-xl p-3 text-amber-200 focus:border-amber-400 outline-none mt-1 transition-colors font-mono"
                          />
                          <p className="text-[10px] text-[#FDFBF7]/40 mt-1 font-mono">Maximum allowed headcount: {family.max_guests || 10} guests</p>
                        </div>
                        <div>
                          <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold">Children Attending</label>
                          <input
                            required
                            disabled={isRsvpLocked}
                            type="number"
                            min={0}
                            value={childrenCount}
                            onChange={e => setChildrenCount(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-black/40 border border-amber-400/20 rounded-xl p-3 text-amber-200 focus:border-amber-400 outline-none mt-1 transition-colors font-mono"
                          />
                        </div>
                      </div>

                      {/* Additional Family Members Names */}
                      {familyMembers.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold block">Other Family Member Names</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {familyMembers.map((member, idx) => (
                              <input
                                key={idx}
                                disabled={isRsvpLocked}
                                type="text"
                                placeholder={`Guest Name #${idx + 1}`}
                                value={member}
                                onChange={e => {
                                  const updated = [...familyMembers];
                                  updated[idx] = e.target.value;
                                  setFamilyMembers(updated);
                                }}
                                className="w-full bg-black/40 border border-amber-400/15 focus:border-amber-400 rounded-xl p-3 text-cream outline-none transition-all"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Special requests / Notes */}
                  <div>
                    <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold block">Dietary preferences & Notes</label>
                    <textarea
                      disabled={isRsvpLocked}
                      placeholder="Please note any dietary preferences, food allergies, or special requests here..."
                      value={specialRequests}
                      onChange={e => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-amber-400/20 rounded-xl p-3 text-cream focus:border-amber-400 outline-none mt-1 transition-all leading-relaxed"
                    />
                  </div>

                  {/* Submission Trigger */}
                  {!isRsvpLocked ? (
                    <button
                      type="submit"
                      disabled={savingRsvp}
                      className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {savingRsvp ? (
                        <>
                          <Loader2 className="animate-spin text-black" size={14} /> Recording Responses...
                        </>
                      ) : (
                        <>
                          Submit RSVP Registry <Check size={14} />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-xs font-mono">
                      <AlertCircle size={14} />
                      Your RSVP for this celebration has been locked. Please contact support desk to modify.
                    </div>
                  )}

                </form>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Elegant, humble, credit footer */}
      <div className="w-full py-8 text-center text-[9px] uppercase tracking-[0.25em] text-[#FDFBF7]/30 font-mono relative z-10 border-t border-purple-500/5 mt-10">
        Prasanna Celebrations Private Hub
      </div>

    </div>
  );
}
