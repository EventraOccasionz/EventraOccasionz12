import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Baby, Sparkles, Heart, Gift, MapPin, Calendar, Clock, Phone, Users, 
  ExternalLink, Loader2, Hotel, Car, Check, ArrowRight, ArrowLeft, 
  MessageSquare, ClipboardList, Info, Star, ChevronDown, CheckCircle, Lock
} from 'lucide-react';
import { Family, RSVP } from '../../../types';
import { dataService } from '../../../services/dataService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface BabyShowerGuestExperienceProps {
  family: Family;
  event: any;
  eventId: string;
}

export default function BabyShowerGuestExperience({ family, event, eventId }: BabyShowerGuestExperienceProps) {
  // Gating personalized opening reveal
  const [isUnveiled, setIsUnveiled] = useState(() => {
    return sessionStorage.getItem(`unveiled_shower_${eventId}_${family.id}`) === 'true';
  });

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
  const [dietaryRequirements, setDietaryRequirements] = useState<string>('');
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState('');

  // Countdown State
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  // Wording & Metadata Extraction
  const motherName = event?.bride || event?.motherName || 'Our Mother-to-Be';
  const partnerName = event?.groom || event?.fatherName || '';
  const familyHeadline = event?.familyName || event?.name || `Baby Shower of ${motherName}`;
  const parentNames = partnerName ? `${motherName} & ${partnerName}` : motherName;
  const eventName = event?.name || `Baby Shower Celebration`;
  
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
        console.error('[Baby Shower Portal] Error loading timeline:', err);
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
          setSpecialRequests(existingRSVP.special_requests || existingRSVP.custom_notes || '');
          setDietaryRequirements(existingRSVP.dietary_requirements || '');
          setSelectedFunctions(existingRSVP.functions_attending || existingRSVP.events || []);
          
          const storedMembers = existingRSVP.family_members || [];
          const maxAllowed = Math.max(0, (family.max_guests || 1) - 1);
          const alignedMembers = [...storedMembers];
          while (alignedMembers.length < maxAllowed) alignedMembers.push('');
          setFamilyMembers(alignedMembers);
        } else {
          // Initialize empty family members inputs based on maximum guest count minus primary
          const initialCount = Math.max(0, (family.max_guests || 1) - 1);
          setFamilyMembers(Array.from({ length: initialCount }, () => ''));
        }
      } catch (err) {
        console.error('[Baby Shower Portal] Error loading details:', err);
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

  // 3. Countdown timer calculations
  useEffect(() => {
    if (!event?.date) return;
    const targetDate = new Date(event.date);
    
    const updateTimer = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      setTimeLeft({ days, hours, minutes });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, [event?.date]);

  // 4. Handle RSVP Submission
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
        email: rsvpData?.email || `${family.slug || 'guest'}@baby-shower.com`,
        attending,
        total_guests: attending ? adultsCount : 0,
        children_count: attending ? childrenCount : 0,
        events: attending ? selectedFunctions : [],
        custom_notes: specialRequests,
        family_name: family.name,
        primary_guest: family.name,
        adults_count: attending ? adultsCount : 0,
        family_members: attending ? familyMembers.filter(Boolean) : [],
        functions_attending: attending ? selectedFunctions : [],
        special_requests: specialRequests,
        dietary_requirements: dietaryRequirements,
        updated_at: now,
        ...(rsvpData ? {} : { created_at: now })
      };

      await dataService.submitRSVP(rsvpPayload as any);
      setRsvpData(rsvpPayload);
      setRsvpSuccessMessage('Your Baby Shower RSVP and celebration preferences have been recorded successfully!');
      
      // Auto refresh list from local memory or database
      const rsvps = await dataService.getRSVPs();
      const updated = rsvps.find((r: any) => r.family_id === family.id);
      if (updated) {
        setRsvpData(updated);
      }
    } catch (err) {
      console.error('[Baby Shower Portal] Failed to save RSVP:', err);
      alert('Failed to save RSVP. Please check your connection and try again.');
    } finally {
      setSavingRsvp(false);
    }
  };

  const handleUnveil = () => {
    sessionStorage.setItem(`unveiled_shower_${eventId}_${family.id}`, 'true');
    setIsUnveiled(true);
  };

  const toggleFunctionSelection = (funcName: string) => {
    if (family?.rsvp_locked || rsvpData?.rsvp_locked) return;
    setSelectedFunctions(prev => 
      prev.includes(funcName)
        ? prev.filter(name => name !== funcName)
        : [...prev, funcName]
    );
  };

  const isRsvpLocked = !!(family?.rsvp_locked || rsvpData?.rsvp_locked);
  const mapUrl = event?.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.venue || '')}`;

  // ----------------------------------------------------
  // PERSONALIZED CINEMATIC GATING (Unveiling screen)
  // ----------------------------------------------------
  if (!isUnveiled) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] text-[#2C3830] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans antialiased">
        {/* Soft, whimsical celebration backdrops */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#E8EDE9] rounded-full filter blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F3EFE6] rounded-full filter blur-3xl opacity-70 pointer-events-none" />
        
        {/* Soft floating celestial particles */}
        <div className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-[#C2A468]/30 animate-pulse pointer-events-none" />
        <div className="absolute top-2/3 right-10 w-3 h-3 rounded-full bg-[#5D6E63]/20 animate-pulse pointer-events-none" />
        <div className="absolute top-12 right-1/4 w-2 h-2 rounded-full bg-[#C2A468]/20 animate-pulse pointer-events-none" />
        <div className="absolute bottom-16 left-1/3 w-3.5 h-3.5 rounded-full bg-[#5D6E63]/10 animate-bounce pointer-events-none" />

        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white border border-[#E8EDE9] rounded-[2rem] p-8 sm:p-12 text-center shadow-[0_15px_40px_rgba(93,110,99,0.06)] overflow-hidden"
        >
          {/* Accent colored top ribbon */}
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#5D6E63] via-[#C2A468] to-[#E8EDE9]" />
          
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-5 border border-[#E8EDE9] rounded-full flex items-center justify-center bg-[#FBF9F6] shadow-inner">
              <Baby className="text-[#5D6E63]" size={28} strokeWidth={1.5} />
            </div>
            
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C2A468] block mb-2 font-mono font-bold">
              Private Baby Shower Space
            </span>
            
            <h2 className="font-serif text-3xl text-[#1F2922] font-bold tracking-tight mb-2 leading-tight">
              {eventName}
            </h2>
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#C2A468]/40 to-transparent mx-auto mb-6" />
            
            <p className="text-xs text-[#2C3830]/80 leading-relaxed font-mono">
              Welcoming the beloved <br />
              <span className="text-[#5D6E63] font-bold tracking-wide italic font-serif text-lg block my-2">
                {family.name}
              </span>
              to our baby shower registry.
            </p>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E8EDE9] rounded-2xl p-5 mb-8 text-left space-y-3 font-mono text-xs">
            <div className="flex items-center gap-3 text-[#2C3830]/70">
              <Calendar size={14} className="text-[#5D6E63]" />
              <span>Date: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-[#2C3830]/70">
              <MapPin size={14} className="text-[#5D6E63]" />
              <span>Venue: {event?.venue || 'To Be Announced'}</span>
            </div>
            {parentNames && (
              <div className="flex items-center gap-3 text-[#2C3830]/70">
                <Users size={14} className="text-[#5D6E63]" />
                <span>Parents: <span className="font-semibold text-[#1F2922]">{parentNames}</span></span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs italic text-[#2C3830]/60 max-w-xs mx-auto leading-relaxed">
              "A little one is on the way, bringing joy and light. We cannot wait to share this beautiful day with you."
            </p>

            <button
              onClick={handleUnveil}
              className="w-full py-4 bg-gradient-to-r from-[#5D6E63] to-[#4F5D54] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-98 transition-all shadow-md shadow-[#5D6E63]/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              Reveal Celebration Details
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN SCROLLING CELEBRATION JOURNEY
  // ----------------------------------------------------
  return (
    <div id="babyshower-guest-portal" className="bg-[#FAF8F5] min-h-screen text-[#2C3830] font-sans flex flex-col justify-between relative overflow-x-hidden selection:bg-[#5D6E63]/20 selection:text-[#1F2922]">
      
      {/* Decorative Warm Visual Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(93,110,99,0.06)_0%,transparent_60%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#5D6E63]/20 to-transparent pointer-events-none" />

      {/* Floating stars details */}
      <div className="absolute top-20 left-10 w-2.5 h-2.5 rounded-full bg-[#C2A468]/30 animate-pulse pointer-events-none" />
      <div className="absolute top-48 right-12 w-3.5 h-3.5 rounded-full bg-[#5D6E63]/20 animate-pulse pointer-events-none" />
      <div className="absolute bottom-36 left-8 w-2 h-2 rounded-full bg-[#C2A468]/20 animate-ping duration-1000 pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 relative z-10 flex-grow">
        
        {/* Top Header bar */}
        <div id="babyshower-header" className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-[#E8EDE9] pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-full border border-[#5D6E63]/20 bg-[#F3EFE6] flex items-center justify-center shadow-sm">
              <Baby size={18} className="text-[#5D6E63]" />
            </span>
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#C2A468] font-mono font-bold">A New Beginning</p>
              <h1 className="font-serif text-lg font-bold text-[#1F2922] tracking-tight">
                {parentNames}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sessionStorage.removeItem(`unveiled_shower_${eventId}_${family.id}`);
                setIsUnveiled(false);
              }}
              className="px-3 py-1.5 bg-white border border-[#E8EDE9] text-[#2C3830]/80 text-[10px] font-mono rounded-lg hover:bg-[#FAF8F5] transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={12} /> Opening Page
            </button>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E8EDE9]/50 border border-[#E8EDE9] text-[10px] text-[#5D6E63] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5D6E63] animate-pulse" />
              Guest: {family.name}
            </span>
          </div>
        </div>

        {/* Dynamic Hero Cover Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white border border-[#E8EDE9] rounded-3xl p-6 sm:p-10 shadow-[0_15px_40px_rgba(93,110,99,0.04)] overflow-hidden mb-8 text-center sm:text-left"
        >
          <div className="absolute top-0 right-0 w-82 h-82 bg-[#E8EDE9]/50 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F3EFE6]/60 rounded-full filter blur-2xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
            <div className="max-w-2xl">
              <span className="text-[9px] font-mono tracking-[0.3em] text-[#C2A468] uppercase font-bold bg-[#FAF8F5] px-3.5 py-1 rounded-full border border-[#E8EDE9] inline-block mb-4 shadow-sm">
                A Beautiful Day Awaits
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F2922] leading-tight">
                {eventName}
              </h2>
              
              <p className="text-xs sm:text-sm text-[#2C3830]/80 mt-4 leading-relaxed font-sans max-w-xl">
                We invite you to share in our celebration of family, community, and the precious new soul preparing to join us. Your love, support, and blessings mean the world to our growing family. Let us celebrate this magical milestone together.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-8 justify-center sm:justify-start">
                <a 
                  href="#rsvp-section"
                  className="px-6 py-3 bg-[#5D6E63] hover:bg-[#4F5D54] text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {rsvpData ? 'Review / Update RSVP' : 'Submit Attendance RSVP'} <ArrowRight size={13} />
                </a>
                <a 
                  href="#timeline-section"
                  className="px-6 py-3 bg-white hover:bg-[#FAF8F5] border border-[#E8EDE9] text-[#2C3830] font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Clock size={13} /> Explore Schedule
                </a>
              </div>
            </div>

            {/* Main Gathering Info Card */}
            <div className="bg-[#FAF8F5] border border-[#E8EDE9] rounded-2xl p-6 min-w-[280px] lg:max-w-sm space-y-4 text-left shadow-sm">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#C2A468] font-bold pb-2 border-b border-[#E8EDE9]">Celebration Info</p>
              <div className="space-y-3 font-mono text-xs text-[#2C3830]/80">
                <div className="flex gap-2.5 items-start">
                  <Calendar size={14} className="text-[#5D6E63] mt-0.5" />
                  <div>
                    <p className="text-[#C2A468] text-[9px] font-bold">DATE</p>
                    <p className="text-[#1F2922] font-sans text-xs font-semibold mt-0.5">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <MapPin size={14} className="text-[#5D6E63] mt-0.5" />
                  <div>
                    <p className="text-[#C2A468] text-[9px] font-bold">VENUE</p>
                    <p className="text-[#1F2922] font-sans text-xs font-semibold mt-0.5">{event?.venue || 'TBA'}</p>
                  </div>
                </div>
                {partnerName && (
                  <div className="flex gap-2.5 items-start">
                    <Users size={14} className="text-[#5D6E63] mt-0.5" />
                    <div>
                      <p className="text-[#C2A468] text-[9px] font-bold">PARENTS</p>
                      <p className="text-[#1F2922] font-sans text-xs font-semibold mt-0.5">{parentNames}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personalized Guest Welcome Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <div className="lg:col-span-2 bg-white border border-[#E8EDE9] p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgba(93,110,99,0.02)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8EDE9]/30 rounded-full filter blur-xl pointer-events-none" />
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#C2A468] font-bold">Personal Invitation</span>
              <h3 className="font-serif text-2xl font-bold text-[#1F2922] mt-1">
                Welcome, {family.name}
              </h3>
              
              {family.custom_greeting ? (
                <p className="text-xs sm:text-sm text-[#2C3830]/80 leading-relaxed font-sans mt-3 italic">
                  "{family.custom_greeting}"
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-[#2C3830]/80 leading-relaxed font-sans mt-3">
                  We are delighted to share the invite for {family.name}. We look forward to gathering with you as we anticipate the arrival of our precious bundle of joy. 
                </p>
              )}

              {family.custom_title && (
                <div className="mt-4 px-3 py-1.5 bg-[#FAF8F5] border border-[#E8EDE9] rounded-lg inline-block text-[10px] font-mono text-[#5D6E63]">
                  Host Note: <span className="font-bold text-[#1F2922]">{family.custom_title}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8EDE9] flex flex-wrap gap-4 text-xs font-mono text-[#2C3830]/70">
              <div>
                <span>Invitation Capacity: </span>
                <span className="text-[#1F2922] font-bold">{family.max_guests || 1} {family.max_guests === 1 ? 'Guest' : 'Guests'}</span>
              </div>
              <div>
                <span>Access Passcode: </span>
                <span className="text-[#5D6E63] font-bold bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8EDE9] uppercase">{family.access_code}</span>
              </div>
            </div>
          </div>

          {/* Countdown Clock Widget */}
          <div className="bg-white border border-[#E8EDE9] p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgba(93,110,99,0.02)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F3EFE6]/50 rounded-full filter blur-xl pointer-events-none" />
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#C2A468] font-bold">Celebration Countdown</span>
              <h3 className="font-serif text-xl font-bold text-[#1F2922] mt-1">Awaited Journey</h3>
              
              {timeLeft ? (
                <div className="grid grid-cols-3 gap-3 text-center mt-6">
                  <div className="bg-[#FAF8F5] border border-[#E8EDE9] p-3 rounded-2xl shadow-sm">
                    <p className="text-2xl font-serif font-bold text-[#5D6E63]">{timeLeft.days}</p>
                    <p className="text-[9px] font-mono text-[#2C3830]/60 uppercase tracking-wider mt-0.5">Days</p>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E8EDE9] p-3 rounded-2xl shadow-sm">
                    <p className="text-2xl font-serif font-bold text-[#5D6E63]">{timeLeft.hours}</p>
                    <p className="text-[9px] font-mono text-[#2C3830]/60 uppercase tracking-wider mt-0.5">Hours</p>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E8EDE9] p-3 rounded-2xl shadow-sm">
                    <p className="text-2xl font-serif font-bold text-[#5D6E63]">{timeLeft.minutes}</p>
                    <p className="text-[9px] font-mono text-[#2C3830]/60 uppercase tracking-wider mt-0.5">Mins</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#5D6E63] font-mono">
                  ✨ The celebration is underway! ✨
                </div>
              )}
            </div>

            <p className="text-[10px] font-mono text-[#2C3830]/50 uppercase tracking-wider mt-6">
              A Little One is on the Way
            </p>
          </div>

        </div>

        {/* Event Story and Description if available */}
        {event?.description && (
          <div className="bg-white border border-[#E8EDE9] p-6 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgba(93,110,99,0.02)] mb-8 text-center max-w-4xl mx-auto">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#C2A468] font-bold">Message from the Parents</span>
            <h3 className="font-serif text-2xl font-bold text-[#1F2922] mt-1 mb-4">Celebrating A New Life</h3>
            <div className="w-10 h-[1px] bg-[#C2A468] mx-auto mb-5" />
            <p className="text-xs sm:text-sm text-[#2C3830]/80 leading-relaxed font-sans max-w-2xl mx-auto whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Dynamic Timeline / Schedule Section */}
        <div id="timeline-section" className="bg-white border border-[#E8EDE9] p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgba(93,110,99,0.02)] mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-[#E8EDE9] pb-4 mb-6 gap-3">
            <div>
              <span className="text-[#C2A468] text-[9px] font-mono uppercase tracking-widest font-bold">Itinerary program</span>
              <h3 className="font-serif text-2xl font-bold text-[#1F2922] mt-1">Celebration Timeline</h3>
            </div>
            
            <div className="py-1 px-3 bg-[#E8EDE9] rounded-lg border border-[#E8EDE9] text-[10px] text-[#5D6E63] font-mono">
              Live updates
            </div>
          </div>

          {loadingTimeline ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin text-[#5D6E63]" size={24} />
              <p className="text-xs text-[#2C3830]/50 font-mono">Loading itinerary events...</p>
            </div>
          ) : timeline.length > 0 ? (
            <div className="relative border-l border-[#E8EDE9] pl-6 ml-4 space-y-6">
              {timeline.map((slot: any, idx: number) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#5D6E63] ring-4 ring-[#FAF8F5]" />
                  
                  <div className="bg-[#FAF8F5] border border-[#E8EDE9] rounded-xl p-4 sm:p-5 max-w-xl transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-[#E8EDE9]/40 pb-2 mb-2 font-mono">
                      <span className="text-[#C2A468] text-xs font-bold flex items-center gap-1.5">
                        <Clock size={12} className="text-[#5D6E63]" />
                        {slot.time || 'Schedule TBA'}
                      </span>
                      {slot.location && (
                        <span className="text-[10px] text-[#2C3830]/60 flex items-center gap-1">
                          <MapPin size={10} className="text-[#5D6E63]" />
                          {slot.location}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-serif text-sm font-bold text-[#1F2922]">{slot.name || slot.title || 'Special Celebration'}</h4>
                    {slot.description && (
                      <p className="text-xs text-[#2C3830]/80 mt-1 leading-relaxed font-sans">{slot.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xs text-[#2C3830]/60 italic font-mono max-w-md mx-auto">
                The timeline and programs list is being finalized by planners. Typically includes guest welcomes, Godh Bharai ceremonies, special meals, and baby showers programs.
              </p>
            </div>
          )}
        </div>

        {/* bento grid widgets for logistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Venue & directions */}
          <div className="bg-white border border-[#E8EDE9] p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8EDE9] text-[#5D6E63] flex items-center justify-center mb-4 shadow-inner">
                <MapPin size={18} />
              </div>
              <h3 className="font-serif text-lg text-[#1F2922] font-bold">Gathering Venue</h3>
              <p className="text-xs text-[#2C3830]/80 mt-1 leading-relaxed font-sans">
                {event?.venue || 'Venue Address TBA'} {event?.city ? `, ${event.city}` : ''} {event?.state ? `, ${event.state}` : ''}
              </p>
            </div>

            <div className="pt-4">
              <a 
                href={mapUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                rel="noreferrer" 
                className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 border border-[#E8EDE9] rounded-xl font-mono text-[9px] uppercase tracking-widest text-[#5D6E63] flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                Get Google Directions <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Card 2: Contact Host */}
          <div className="bg-white border border-[#E8EDE9] p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8EDE9] text-[#5D6E63] flex items-center justify-center mb-4 shadow-inner">
                <Users size={18} />
              </div>
              <h3 className="font-serif text-lg text-[#1F2922] font-bold">Contact / Support</h3>
              <div className="mt-2.5 font-mono text-xs space-y-1">
                <p className="text-[#C2A468] uppercase text-[9px] font-bold">Celebration Support</p>
                {event?.contact_phone || event?.organizer_phone ? (
                  <p className="text-[#1F2922] font-bold">{event?.contact_phone || event?.organizer_phone}</p>
                ) : (
                  <p className="text-[#2C3830]/60 italic text-[11px]">Contact information is pending.</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {(event?.contact_phone || event?.organizer_phone) && (
                <>
                  <a 
                    href={`tel:${event?.contact_phone || event?.organizer_phone}`} 
                    className="text-[9px] font-mono uppercase font-bold text-[#5D6E63] border border-[#E8EDE9] px-3.5 py-2 rounded-lg hover:bg-[#FAF8F5] flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    Call Host
                  </a>
                  <a 
                    href={`https://wa.me/${(event?.contact_phone || event?.organizer_phone).replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[9px] font-mono uppercase font-bold text-green-700 border border-green-200 bg-green-50/20 px-3.5 py-2 rounded-lg hover:bg-green-100/30 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Card 3: Accommodation (Shown Conditionally) */}
          {roomBooking ? (
            <div className="bg-white border border-[#E8EDE9] p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[190px]">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8EDE9] text-[#5D6E63] flex items-center justify-center mb-4 shadow-inner">
                  <Hotel size={18} />
                </div>
                <h3 className="font-serif text-lg text-[#1F2922] font-bold">Stay Assignment</h3>
                <div className="mt-2 space-y-1 font-mono text-xs text-[#2C3830]/80">
                  <p className="text-[#C2A468] font-bold">Stay Assignment Confirmed</p>
                  <p>Hotel: <span className="text-[#1F2922] font-semibold">{roomBooking.hotel_name || 'Allocated Luxury Resort'}</span></p>
                  <p>Room: <span className="text-[#1F2922] font-semibold">{roomBooking.room_number || 'Allocated Room'}</span></p>
                </div>
              </div>
              <span className="text-[8px] uppercase tracking-widest text-[#2C3830]/40 font-mono mt-4">
                Status: {roomBooking.status || 'Assigned'}
              </span>
            </div>
          ) : (
            <div className="bg-[#E8EDE9]/30 border border-dashed border-[#E8EDE9] p-6 rounded-3xl flex flex-col items-center justify-center text-center p-6 min-h-[190px]">
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#E8EDE9] text-[#2C3830]/40 mb-2">
                <Hotel size={14} />
              </span>
              <p className="text-[10px] font-mono text-[#2C3830]/50 uppercase tracking-wider font-bold">No Accommodation Assignment</p>
              <p className="text-[10px] text-[#2C3830]/40 mt-1 max-w-xs font-sans">Guests handle lodging or no stay is allocated.</p>
            </div>
          )}

          {/* Card 4: Transport (Shown Conditionally) */}
          {transport ? (
            <div className="bg-white border border-[#E8EDE9] p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[190px]">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8EDE9] text-[#5D6E63] flex items-center justify-center mb-4 shadow-inner">
                  <Car size={18} />
                </div>
                <h3 className="font-serif text-lg text-[#1F2922] font-bold">Your Transport</h3>
                <div className="mt-2 space-y-1 font-mono text-xs text-[#2C3830]/80">
                  <p className="text-[#C2A468] font-bold">Dispatcher Updates</p>
                  {transport.driver_name ? (
                    <>
                      <p>Driver: <span className="text-[#1F2922] font-semibold">{transport.driver_name}</span></p>
                      <p>Vehicle: <span className="text-[#1F2922] font-semibold">{transport.vehicle_number || 'Allocated Private Car'}</span></p>
                      {transport.driver_contact && (
                        <div className="pt-2">
                          <a href={`tel:${transport.driver_contact}`} className="text-[10px] text-[#5D6E63] border border-[#E8EDE9] px-2.5 py-1 rounded hover:bg-[#FAF8F5] inline-flex items-center gap-1">
                            <Phone size={10} /> Call Driver
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[#2C3830]/50 italic text-[11px]">Airport shuttle pickup scheduled. Driver info pending.</p>
                  )}
                </div>
              </div>
              <span className="text-[8px] uppercase tracking-widest text-[#2C3830]/40 font-mono mt-4">
                Pickup: {transport.pickup_location || 'Airport / Terminal'}
              </span>
            </div>
          ) : (
            <div className="bg-[#E8EDE9]/30 border border-dashed border-[#E8EDE9] p-6 rounded-3xl flex flex-col items-center justify-center text-center p-6 min-h-[190px]">
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#E8EDE9] text-[#2C3830]/40 mb-2">
                <Car size={14} />
              </span>
              <p className="text-[10px] font-mono text-[#2C3830]/50 uppercase tracking-wider font-bold">No Transport Assignment</p>
              <p className="text-[10px] text-[#2C3830]/40 mt-1 max-w-xs font-sans">Self-transit is selected or shuttle not configured.</p>
            </div>
          )}

        </div>

        {/* RSVP Form Section */}
        <div id="rsvp-section" className="bg-white border border-[#E8EDE9] p-6 sm:p-10 rounded-3xl shadow-[0_15px_40px_rgba(93,110,99,0.03)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#5D6E63] to-[#C2A468]" />
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-[#E8EDE9] pb-5 mb-6 gap-3">
            <div>
              <span className="text-[#C2A468] uppercase tracking-[0.2em] text-[10px] font-mono font-bold">Celebration Registry</span>
              <h3 className="font-serif text-2xl text-[#1F2922] mt-1">Baby Shower RSVP</h3>
              <p className="text-xs text-[#2C3830]/60 font-mono mt-0.5">Please share your response with us.</p>
            </div>
            
            {isRsvpLocked && (
              <span className="w-max px-3 py-1.5 bg-red-500/10 text-red-700 border border-red-500/20 text-[9px] uppercase tracking-wider font-mono font-bold rounded-lg flex items-center gap-1">
                <Lock size={12} /> Registry Locked
              </span>
            )}
          </div>

          {rsvpSuccessMessage ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
                <CheckCircle size={24} />
              </div>
              <h4 className="font-bold text-emerald-700 uppercase tracking-widest font-mono text-xs">RSVP Saved!</h4>
              <p className="text-xs text-[#2C3830]/80 max-w-sm font-mono leading-relaxed">{rsvpSuccessMessage}</p>
              
              <button 
                type="button"
                onClick={() => setRsvpSuccessMessage('')}
                className="mt-4 px-4 py-2 bg-[#FAF8F5] border border-[#E8EDE9] text-[#2C3830] font-mono text-[10px] uppercase rounded-lg hover:bg-[#E8EDE9] transition-all"
              >
                View / Edit Response
              </button>
            </motion.div>
          ) : loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-[#5D6E63]" size={32} />
              <p className="text-xs text-[#2C3830]/50 font-mono">Retrieving your responses...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveRsvp} className="space-y-6 text-xs sm:text-sm">
              
              {/* Attendance Selector */}
              <div className="space-y-3">
                <label className="text-[#2C3830]/60 text-[10px] uppercase tracking-wider font-mono font-bold block">Are you attending the baby shower?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled={isRsvpLocked}
                    onClick={() => setAttending(true)}
                    className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all cursor-pointer ${
                      attending 
                        ? 'bg-[#5D6E63] text-white border-[#5D6E63] shadow-md shadow-[#5D6E63]/10' 
                        : 'bg-[#FAF8F5] border-[#E8EDE9] text-[#2C3830]/60 hover:border-[#5D6E63]/30'
                    }`}
                  >
                    Yes, I'll Be There! 👶
                  </button>
                  <button
                    type="button"
                    disabled={isRsvpLocked}
                    onClick={() => setAttending(false)}
                    className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all cursor-pointer ${
                      !attending 
                        ? 'bg-[#5D6E63] text-white border-[#5D6E63] shadow-md shadow-[#5D6E63]/10' 
                        : 'bg-[#FAF8F5] border-[#E8EDE9] text-[#2C3830]/60 hover:border-[#5D6E63]/30'
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
                  {/* Headcount Limits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#2C3830]/60 text-[10px] uppercase tracking-wider font-mono font-bold">Adults Attending</label>
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
                          // Align members arrays
                          setFamilyMembers(prev => {
                            const updated = [...prev];
                            while (updated.length < val - 1) updated.push('');
                            while (updated.length > val - 1) updated.pop();
                            return updated;
                          });
                        }}
                        className="w-full bg-[#FAF8F5] border border-[#E8EDE9] rounded-xl p-3 text-[#1F2922] focus:border-[#5D6E63] outline-none mt-1 transition-colors font-mono"
                      />
                      <p className="text-[10px] text-[#2C3830]/40 mt-1 font-mono">Allowed invitation limit: {family.max_guests || 10} guests</p>
                    </div>
                    
                    <div>
                      <label className="text-[#2C3830]/60 text-[10px] uppercase tracking-wider font-mono font-bold">Children Attending</label>
                      <input
                        required
                        disabled={isRsvpLocked}
                        type="number"
                        min={0}
                        value={childrenCount}
                        onChange={e => setChildrenCount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#FAF8F5] border border-[#E8EDE9] rounded-xl p-3 text-[#1F2922] focus:border-[#5D6E63] outline-none mt-1 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Additional Members Inputs */}
                  {familyMembers.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <label className="text-[#2C3830]/60 text-[10px] uppercase tracking-wider font-mono font-bold block">Other family / group members' names</label>
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
                            className="w-full bg-[#FAF8F5] border border-[#E8EDE9] focus:border-[#5D6E63] rounded-xl p-3 text-[#1F2922] outline-none transition-all"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Select programs to attend */}
                  {timeline.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <label className="text-[#2C3830]/60 text-[10px] uppercase tracking-wider font-mono font-bold block">Select functions to join</label>
                      <p className="text-[11px] text-[#2C3830]/50 mt-0.5 leading-tight">Please select which programs or sessions your group plans to join:</p>
                      
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
                                  ? 'bg-[#E8EDE9] border-[#5D6E63]/40 text-[#1F2922]' 
                                  : 'bg-[#FAF8F5] border-[#E8EDE9] text-[#2C3830]/60 hover:border-[#5D6E63]/30'
                              }`}
                            >
                              <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center mt-0.5 transition-all ${
                                isChecked ? 'bg-[#5D6E63] border-[#5D6E63] text-white' : 'border-[#E8EDE9]'
                              }`}>
                                {isChecked && <Check size={12} strokeWidth={3} />}
                              </div>
                              <div>
                                <p className="font-semibold text-xs leading-tight">{funcName}</p>
                                <p className="text-[10px] font-mono text-[#2C3830]/60 mt-1">{slot.time}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dietary Preference Input */}
                  <div>
                    <label className="text-[#2C3830]/60 text-[10px] uppercase tracking-wider font-mono font-bold block">Dietary Preferences</label>
                    <input
                      disabled={isRsvpLocked}
                      type="text"
                      placeholder="e.g. Vegetarian, Gluten-free, Allergies..."
                      value={dietaryRequirements}
                      onChange={e => setDietaryRequirements(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E8EDE9] rounded-xl p-3 text-[#1F2922] focus:border-[#5D6E63] outline-none mt-1 transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              {/* Message to Parents / Special requirements */}
              <div>
                <label className="text-[#2C3830]/60 text-[10px] uppercase tracking-wider font-mono font-bold block">
                  {attending ? 'Blessings, wishes, or Special requests' : 'Message to the Parents / Family'}
                </label>
                <textarea
                  disabled={isRsvpLocked}
                  rows={3}
                  placeholder="Share a sweet blessing, wish message, or leave any custom note for the host."
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8EDE9] rounded-xl p-3 text-[#1F2922] focus:border-[#5D6E63] outline-none mt-1 transition-colors"
                />
              </div>

              {/* Submit Buttons */}
              {!isRsvpLocked ? (
                <button
                  type="submit"
                  disabled={savingRsvp}
                  className="w-full py-4 bg-[#5D6E63] hover:bg-[#4F5D54] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md shadow-[#5D6E63]/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingRsvp ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Recording Response...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Save Celebration Preferences
                    </>
                  )}
                </button>
              ) : (
                <p className="text-center text-[10px] font-mono text-red-500 uppercase font-semibold">
                  RSVP changes are currently locked by the administrator. Contact host support for adjustments.
                </p>
              )}
            </form>
          )}

          {/* Render saved RSVP state for confidence */}
          {rsvpData && !rsvpSuccessMessage && (
            <div className="mt-8 pt-6 border-t border-[#E8EDE9] bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8EDE9]">
              <span className="text-[#5D6E63] uppercase font-bold font-mono text-[9px] tracking-wider block">Your Saved Reservation Status</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-xs leading-relaxed font-sans">
                <div>
                  <p className="text-[#2C3830]/60 font-mono text-[9px] uppercase font-semibold">ATTENDANCE</p>
                  <p className={`font-bold mt-1 inline-flex items-center gap-1 ${rsvpData.attending ? 'text-emerald-700' : 'text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${rsvpData.attending ? 'bg-emerald-600' : 'bg-red-500'}`} />
                    {rsvpData.attending ? 'Attending Celebration' : 'Declined Invitation'}
                  </p>
                </div>
                {rsvpData.attending && (
                  <>
                    <div>
                      <p className="text-[#2C3830]/60 font-mono text-[9px] uppercase font-semibold">HEADCOUNT</p>
                      <p className="text-[#1F2922] font-semibold mt-1">
                        {rsvpData.total_guests || rsvpData.adults_count || 1} { (rsvpData.total_guests || rsvpData.adults_count || 1) === 1 ? 'Adult' : 'Adults' } 
                        { rsvpData.children_count > 0 && ` & ${rsvpData.children_count} ${rsvpData.children_count === 1 ? 'Child' : 'Children'}` }
                      </p>
                    </div>
                    <div>
                      <p className="text-[#2C3830]/60 font-mono text-[9px] uppercase font-semibold">PARTICIPATION</p>
                      <p className="text-[#1F2922] font-semibold mt-1">
                        {rsvpData.functions_attending?.length || rsvpData.events?.length || 0} Scheduled programs joined
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Elegant minimalist footer */}
      <footer className="border-t border-[#E8EDE9] bg-white py-8 text-center text-xs text-[#2C3830]/50 font-mono">
        <p className="uppercase tracking-[0.2em] font-bold text-[#5D6E63] text-[9px]">Eventra Occasionz</p>
        <p className="mt-1">Celebrating Life's Most Beautiful Moments</p>
      </footer>

    </div>
  );
}
