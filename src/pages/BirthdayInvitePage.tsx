import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, Cake, Sparkles, Bell, Volume2, VolumeX, 
  ArrowRight, Loader2, ArrowLeft, Calendar, MapPin, 
  Users, Lock, CheckCircle2, FileText, Phone, Check,
  Car, Hotel
} from 'lucide-react';
import { Family, RoomBooking, TransportRequest } from '../types';
import BirthdayExperience from '../components/birthday/BirthdayExperience';
import { dataService } from '../lib/dataService';

interface BirthdayInvitePageProps {
  family: Family;
  currentEvent: {
    id: string;
    name: string;
    bride: string; // Repurposed for Birthday Person Name
    date: string;
    venue: string;
    city?: string;
    state?: string;
  };
  slug: string;
}

// Sparkly floating stars for access gate
function FloatingConfetti() {
  const particles = Array.from({ length: 15 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => {
        const size = Math.random() * 3 + 2;
        const delay = Math.random() * 5;
        const duration = Math.random() * 6 + 6;
        const left = Math.random() * 100;
        return (
          <motion.div
            key={i}
            className="absolute rounded-sm bg-gradient-to-tr from-amber-400 via-pink-400 to-purple-400 opacity-30 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: '-10px',
            }}
            animate={{
              y: ['-105vh', '5vh'],
              x: [0, Math.cos(i) * 30, 0],
              opacity: [0, 0.4, 0.2, 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

export default function BirthdayInvitePage({ family, currentEvent, slug }: BirthdayInvitePageProps) {
  // Authorization State
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem(`access_${slug}`) === 'true';
  });
  
  // Notification Gate
  const [hasGrantedNotification, setHasGrantedNotification] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return true; // Fallback
  });
  const [permissionError, setPermissionError] = useState('');

  // Step state within the cinematic flow: 'access' -> 'notification' -> 'unveiling' -> 'unveiled'
  const [step, setStep] = useState<'access' | 'notification' | 'unveiling' | 'unveiled'>(() => {
    const auth = sessionStorage.getItem(`access_${slug}`) === 'true';
    if (!auth) return 'access';
    
    // Check notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      return 'notification';
    }
    
    const unveiled = sessionStorage.getItem(`unveiled_${slug}`) === 'true';
    return unveiled ? 'unveiled' : 'unveiling';
  });

  const [birthdayView, setBirthdayView] = useState<'dashboard' | 'invitation' | 'rsvp'>('dashboard');

  // Loading States for Additional Database Records
  const [roomBooking, setRoomBooking] = useState<RoomBooking | null>(null);
  const [transport, setTransport] = useState<TransportRequest | null>(null);
  const [rsvp, setRsvp] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Form inputs for Birthday RSVP
  const [attending, setAttending] = useState<boolean>(true);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [savingRsvp, setSavingRsvp] = useState(false);

  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isOpeningGift, setIsOpeningGift] = useState(false);

  const birthdayPerson = currentEvent.bride || 'Shivam';
  const eventName = currentEvent.name || `${birthdayPerson}'s Grand Celebration`;

  // Fetch transport, rooms and RSVP info once authorized
  useEffect(() => {
    const loadDetails = async () => {
      try {
        // Rooms
        const rooms = await dataService.getRooms();
        const familyRoom = rooms.find((r: any) => r.family_id === family.id);
        if (familyRoom) {
          setRoomBooking(familyRoom);
        }

        // Transports
        const transports = await dataService.getTransports();
        const familyTransport = transports.find((t: any) => t.family_id === family.id);
        if (familyTransport) {
          setTransport(familyTransport);
        }

        // RSVP
        const rsvps = await dataService.getRSVPs();
        const existingRSVP = rsvps.find((r: any) => r.family_id === family.id);
        if (existingRSVP) {
          setRsvp(existingRSVP);
          setAttending(existingRSVP.attending !== false);
          setAdultsCount(existingRSVP.total_guests || existingRSVP.adults_count || 1);
          setChildrenCount(existingRSVP.children_count || 0);
          setFamilyMembers(existingRSVP.family_members || []);
          setSpecialRequests(existingRSVP.special_requests || existingRSVP.custom_notes || '');
        } else {
          // Initialize empty family members based on family max count
          setFamilyMembers(Array.from({ length: Math.max(0, family.max_guests - 1) }, () => ''));
        }
      } catch (err) {
        console.error('Failed to load birthday database records:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    if (isAuthorized) {
      loadDetails();
    }
  }, [isAuthorized, family.id, family.max_guests]);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;
    
    if (enteredCode.trim().toUpperCase() === family.access_code.toUpperCase()) {
      sessionStorage.setItem(`access_${slug}`, 'true');
      setIsAuthorized(true);
      
      // Determine next step
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
        setStep('notification');
      } else {
        setStep('unveiling');
      }
    } else {
      setCodeError('The invitation passcode is incorrect. Please try again.');
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setHasGrantedNotification(true);
      setStep('unveiling');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setHasGrantedNotification(true);
        setStep('unveiling');
      } else {
        setPermissionError('Notification permission is required to keep you updated. Please enable it to proceed.');
      }
    } catch (err) {
      setHasGrantedNotification(true);
      setStep('unveiling');
    }
  };

  const handleUnveilInvitation = () => {
    setIsOpeningGift(true);
    setTimeout(() => {
      sessionStorage.setItem(`unveiled_${slug}`, 'true');
      setStep('unveiled');
    }, 1800);
  };

  const handleSaveRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rsvp?.rsvp_locked || family.rsvp_locked) return;
    setSavingRsvp(true);

    try {
      const now = new Date().toISOString();
      const rsvpPayload = {
        family_id: family.id,
        event_id: family.event_id || 'evt_001',
        guest_name: family.name,
        email: rsvp?.email || `${family.slug}@birthdaycelebration.com`,
        attending,
        total_guests: adultsCount,
        children_count: childrenCount,
        events: ['Birthday Celebration'],
        custom_notes: specialRequests,
        family_name: family.name,
        primary_guest: family.name,
        adults_count: adultsCount,
        family_members: familyMembers.filter(Boolean),
        functions_attending: ['Birthday Celebration'],
        special_requests: specialRequests,
        updated_at: now,
        ...(rsvp ? {} : { created_at: now })
      };

      await dataService.submitRSVP(rsvpPayload as any);
      setRsvp(rsvpPayload);
      alert('Your Birthday RSVP information has been successfully saved!');
      setBirthdayView('dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save RSVP. Please check inputs and try again.');
    } finally {
      setSavingRsvp(false);
    }
  };

  const isRsvpLocked = !!(family.rsvp_locked || rsvp?.rsvp_locked);

  const formattedDate = currentEvent.date 
    ? new Date(currentEvent.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Date to be Announced';

  return (
    <div className="bg-[#0b0512] min-h-screen text-[#FDFBF7] font-sans antialiased overflow-x-hidden relative flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      
      <AnimatePresence mode="wait">
        
        {/* Step 1: Passcode Gate */}
        {step === 'access' && (
          <motion.div
            key="birthday-access-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 relative"
          >
            <FloatingConfetti />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-[#130b1c]/95 border border-amber-400/20 rounded-3xl p-8 sm:p-12 text-center shadow-[0_0_50px_rgba(21,13,30,0.8)] overflow-hidden"
            >
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-amber-400/30 rounded-tl" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-amber-400/30 rounded-tr" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-amber-400/30 rounded-bl" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-amber-400/30 rounded-br" />

              <div className="mb-8">
                <div className="w-14 h-14 mx-auto mb-4 border border-amber-400/20 rounded-full flex items-center justify-center bg-black/40 shadow-inner">
                  <Cake className="text-amber-300 animate-pulse" size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80 block mb-1">
                  Private Celebration
                </span>
                <h2 className="font-serif text-2xl text-amber-100 tracking-tight mb-2">
                  Birthday Invitation
                </h2>
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mx-auto mb-6" />
                <p className="text-xs text-[#FDFBF7]/80 leading-relaxed max-w-xs mx-auto">
                  Welcoming the honorable members of <br />
                  <span className="text-amber-300 font-bold tracking-wide italic font-serif text-sm block mt-1">
                    {family.name}
                  </span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-5 relative z-10">
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="ENTER SACRED ACCESS CODE"
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value)}
                      className="w-full bg-[#08030d] border border-amber-400/20 rounded-xl py-3.5 px-4 text-center font-mono text-xs uppercase tracking-[0.25em] text-amber-200 placeholder-amber-400/20 focus:outline-none focus:border-amber-400/50 transition-all shadow-inner"
                    />
                  </div>
                  {codeError && (
                    <p className="text-[10px] text-red-400 text-center font-sans tracking-wide mt-1.5 leading-relaxed">
                      {codeError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2"
                >
                  Unlock Invitation
                  <ArrowRight size={14} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Notification Permission Gate */}
        {step === 'notification' && (
          <motion.div
            key="birthday-notification-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 relative"
          >
            <FloatingConfetti />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-[#130b1c]/95 border border-amber-400/20 rounded-3xl p-8 sm:p-12 text-center shadow-[0_0_50px_rgba(21,13,30,0.8)] overflow-hidden"
            >
              <div className="mb-8">
                <div className="w-14 h-14 mx-auto mb-4 border border-amber-400/20 rounded-full flex items-center justify-center bg-black/40 shadow-inner">
                  <Bell className="text-amber-300" size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80 block mb-1">
                  Stay Informed
                </span>
                <h2 className="font-serif text-2xl text-amber-100 tracking-tight mb-2">
                  Enable Celebration Alerts
                </h2>
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mx-auto mb-6" />
                <p className="text-xs text-[#FDFBF7]/80 leading-relaxed max-w-xs mx-auto">
                  Please enable notifications to receive key updates on birthday celebrations, program scheduling, and coordinate details.
                </p>
              </div>

              <div className="space-y-4">
                {permissionError && (
                  <p className="text-[10px] text-red-400 text-center font-sans tracking-wide leading-relaxed">
                    {permissionError}
                  </p>
                )}

                <button
                  onClick={handleRequestNotificationPermission}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2"
                >
                  Allow Alerts
                </button>
                
                <button
                  onClick={() => setStep('unveiling')}
                  className="w-full py-3 border border-amber-400/20 text-amber-300 hover:bg-amber-400/5 font-mono text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Skip for Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Step 3: Interactive Unboxing Sequence */}
        {step === 'unveiling' && (
          <motion.div
            key="birthday-unveiling-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 relative"
          >
            <FloatingConfetti />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-center max-w-sm w-full bg-[#130b1c]/80 border border-amber-400/20 rounded-3xl p-8 sm:p-12 shadow-2xl relative"
            >
              <Sparkles className="absolute -top-3 -left-3 text-amber-300/20 w-8 h-8 animate-pulse" />
              <Sparkles className="absolute -bottom-3 -right-3 text-amber-300/20 w-8 h-8 animate-pulse" />

              <span className="text-[10px] uppercase tracking-[0.35em] text-amber-300/70 font-mono block mb-2">A Special Box Awaits</span>
              <h2 className="font-sans text-xl font-bold text-amber-100 mb-6">A Gift of Joy for {family.name}</h2>

              {/* Cinematic Gift Box Animation */}
              <div className="flex justify-center mb-8">
                <motion.button
                  onClick={handleUnveilInvitation}
                  disabled={isOpeningGift}
                  className="relative cursor-pointer focus:outline-none"
                  animate={isOpeningGift ? {
                    scale: [1, 1.15, 0.9, 1.25, 0],
                    rotate: [0, -10, 10, -15, 180],
                    opacity: [1, 1, 1, 1, 0],
                  } : {
                    y: [0, -8, 0],
                  }}
                  transition={isOpeningGift ? {
                    duration: 1.8,
                    ease: 'easeInOut',
                  } : {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="absolute inset-0 bg-amber-400/25 rounded-full filter blur-xl animate-pulse" />
                  <div className="relative w-28 h-28 bg-[#251535] border border-amber-400/30 rounded-2xl flex items-center justify-center shadow-lg hover:border-amber-400/60 transition-all">
                    <Gift className="text-amber-300 animate-bounce" size={48} strokeWidth={1.2} />
                  </div>
                </motion.button>
              </div>

              <p className="text-xs text-[#FDFBF7]/70 font-mono tracking-wide leading-relaxed max-w-xs mx-auto">
                {isOpeningGift ? "Unveiling Shivam's Grand Birthday Invitation..." : "Tap the magical gift box above to unwrap and unveil your exclusive invitation!"}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Step 4: Unveiled Experience / Birthday Guest Portal */}
        {step === 'unveiled' && (
          <motion.div
            key="birthday-experience-views"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full flex-grow flex flex-col"
          >
            {birthdayView === 'dashboard' && (
              <div className="min-h-screen bg-[#07000c] text-[#FDFBF7] pb-24 relative overflow-hidden flex-grow">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_85%)] pointer-events-none z-0" />
                
                {/* Main Content Container */}
                <div className="max-w-6xl mx-auto px-6 relative z-10 pt-8">
                  
                  {/* Dashboard Top Header bar */}
                  <div className="flex justify-between items-center border-b border-amber-400/10 pb-6 mb-8">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full border border-amber-400/20 bg-amber-400/5 flex items-center justify-center">
                        <Cake size={18} className="text-amber-300 animate-pulse" />
                      </span>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300 font-mono font-bold">Celebration Guest Portal</p>
                        <h4 className="font-serif text-lg text-cream tracking-tight">The {family.name} Hub</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10px] text-amber-300 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        Live Hub
                      </span>
                    </div>
                  </div>

                  {/* Portal Header Greeting Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-[#150d1e]/85 border border-amber-400/20 rounded-3xl p-6 sm:p-10 text-center shadow-2xl backdrop-blur-md overflow-hidden mb-8"
                  >
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl" />
                    <Sparkles className="absolute top-4 right-4 text-amber-400/15 w-8 h-8" />
                    
                    <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80 font-mono block mb-2">Welcome Back</span>
                    <h1 className="font-sans text-2xl sm:text-3xl font-black text-amber-200 tracking-tight leading-none mb-3">
                      {family.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#FDFBF7]/85 font-mono tracking-wide leading-relaxed max-w-xl mx-auto">
                      Welcome to your exclusive celebration dashboard! Join us in honor of <span className="text-amber-300 font-bold">{birthdayPerson}</span>. Below you can view your custom invitation, manage your RSVP registry, view party timelines, and find location details.
                    </p>
                  </motion.div>

                  {/* Grid Layout for Dashboard Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 1. Birthday Invitation Card */}
                    <div 
                      onClick={() => setBirthdayView('invitation')}
                      className="bg-[#120a1c]/60 border border-amber-400/10 p-6 rounded-2xl hover:border-amber-400/40 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[170px]"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/5 rounded-full filter blur-xl group-hover:bg-amber-400/10 transition-colors" />
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
                          <Gift size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream group-hover:text-amber-300 transition-colors">Grand Invitation</h4>
                        <p className="text-xs text-[#FDFBF7]/70 mt-1.5 leading-relaxed">Read the custom birthday announcement, unwrap details, and start the party countdown.</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-amber-300 font-mono font-bold mt-4 flex items-center gap-1.5">
                        Open Invitation <ArrowRight size={10} />
                      </span>
                    </div>

                    {/* 2. Birthday RSVP Registry Card */}
                    <div 
                      onClick={() => setBirthdayView('rsvp')}
                      className="bg-[#120a1c]/60 border border-amber-400/10 p-6 rounded-2xl hover:border-amber-400/40 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[170px]"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/5 rounded-full filter blur-xl group-hover:bg-amber-400/10 transition-colors" />
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
                          <FileText size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream group-hover:text-amber-300 transition-colors">Guest RSVP Registry</h4>
                        <p className="text-xs text-[#FDFBF7]/70 mt-1.5 leading-relaxed">
                          {isRsvpLocked ? 'Your celebration RSVP has been finalized.' : 'Confirm family attendance, headcount, and specific requests.'}
                        </p>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-amber-300 font-mono font-bold mt-4 flex items-center gap-1.5">
                        {isRsvpLocked ? 'View RSVP' : 'Manage RSVP'} <ArrowRight size={10} />
                      </span>
                    </div>

                    {/* 3. Event Schedule Card */}
                    <div className="bg-[#120a1c]/40 border border-amber-400/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[170px]">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
                          <Calendar size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream">Party Program</h4>
                        <div className="mt-2 text-xs space-y-1 font-mono text-[#FDFBF7]/70">
                          <p><span className="text-amber-300 font-bold">07:30 PM</span> - Grand Entry & Welcome</p>
                          <p><span className="text-amber-300 font-bold">08:15 PM</span> - Cake Ceremony</p>
                          <p><span className="text-amber-300 font-bold">09:00 PM</span> - DJ Music & Dance</p>
                          <p><span className="text-amber-300 font-bold">10:00 PM</span> - Luxury Buffet</p>
                        </div>
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-[#FDFBF7]/40 font-mono mt-4">
                        Evening Timeline
                      </span>
                    </div>

                    {/* 4. Venue Location Card */}
                    <div className="bg-[#120a1c]/40 border border-amber-400/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[170px]">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
                          <MapPin size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream">Celebration Venue</h4>
                        <p className="text-xs text-[#FDFBF7]/70 mt-1 font-mono leading-tight">{currentEvent.venue || 'To Be Announced'}</p>
                        {currentEvent.city && (
                          <p className="text-[10px] text-[#FDFBF7]/50 font-mono">{currentEvent.city}, {currentEvent.state || ''}</p>
                        )}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-[#FDFBF7]/40 font-mono mt-4">
                        Date: {formattedDate}
                      </span>
                    </div>

                    {/* 5. Contact Planners Card */}
                    <div className="bg-[#120a1c]/40 border border-amber-400/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[170px]">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
                          <Users size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream">Contact Planners</h4>
                        <div className="mt-2 space-y-1 font-mono text-xs">
                          <p className="text-amber-300 uppercase text-[9px] font-bold">Event Host Help Desk</p>
                          <p className="text-cream font-medium">+91 98765 43211</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <a href="tel:+919876543211" className="text-[9px] text-amber-300 border border-amber-400/25 px-2.5 py-1 rounded hover:bg-amber-400/5 flex items-center gap-1 font-mono uppercase font-bold">
                          Call
                        </a>
                        <a href="https://wa.me/919876543211" target="_blank" rel="noreferrer" className="text-[9px] text-green-400 border border-green-400/25 px-2.5 py-1 rounded hover:bg-green-400/5 flex items-center gap-1 font-mono uppercase font-bold">
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* 6. Accommodations Card - Rendered ONLY if data actually exists */}
                    {roomBooking && (
                      <div className="bg-[#120a1c]/40 border border-amber-400/10 p-6 rounded-2xl relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[170px]">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
                            <Hotel size={20} />
                          </div>
                          <h4 className="font-serif text-lg text-cream">Your Accommodations</h4>
                          
                          <div className="mt-2 space-y-1 font-mono text-xs">
                            <p className="text-amber-300 font-bold">Room Assigned!</p>
                            <p className="text-[#FDFBF7]/80">Hotel: <span className="text-[#FDFBF7] font-medium">{roomBooking.hotel_name || 'Allocated Luxury Hotel'}</span></p>
                            <p className="text-[#FDFBF7]/80">Room: <span className="text-[#FDFBF7] font-medium">{roomBooking.room_number || 'TBD'}</span></p>
                            {roomBooking.floor && <p className="text-[#FDFBF7]/80 font-medium">Floor: <span className="text-text-secondary">{roomBooking.floor}</span></p>}
                          </div>
                        </div>
                        <span className="text-[8px] uppercase tracking-widest text-[#FDFBF7]/40 font-mono mt-4">
                          Status: {roomBooking.status || 'Assigned'}
                        </span>
                      </div>
                    )}

                    {/* 7. Transport Card - Rendered ONLY if data actually exists */}
                    {transport?.driver_name && (
                      <div className="bg-[#120a1c]/40 border border-amber-400/10 p-6 rounded-2xl relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[170px]">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
                            <Car size={20} />
                          </div>
                          <h4 className="font-serif text-lg text-cream">Your Driver & Vehicle</h4>
                          
                          <div className="mt-2 space-y-1 font-mono text-xs">
                            <p className="text-amber-300 font-bold">Driver Dispatched!</p>
                            <p className="text-[#FDFBF7]/80">Driver: <span className="text-[#FDFBF7] font-medium">{transport.driver_name}</span></p>
                            <p className="text-[#FDFBF7]/80">Vehicle: <span className="text-[#FDFBF7] font-medium">{transport.vehicle_number}</span></p>
                            {transport.driver_contact && (
                              <div className="pt-2">
                                <a href={`tel:${transport.driver_contact}`} className="text-[10px] text-amber-300 border border-amber-400/25 px-2 py-1 rounded hover:bg-amber-400/10 flex items-center gap-1 w-max">
                                  <Phone size={10} /> Call Driver
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[8px] uppercase tracking-widest text-[#FDFBF7]/40 font-mono mt-4">
                          Pickup Location: {transport.pickup_location || 'Airport'}
                        </span>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            )}

            {/* View Invitation experience */}
            {birthdayView === 'invitation' && (
              <div className="relative flex-grow">
                {/* Floating Back Button */}
                <div className="fixed top-6 left-6 z-50">
                  <button
                    onClick={() => setBirthdayView('dashboard')}
                    className="px-4 py-2 bg-black/80 backdrop-blur border border-amber-400/30 text-amber-300 text-xs rounded-xl hover:bg-amber-400 hover:text-black transition-all font-mono uppercase tracking-widest flex items-center gap-1.5 shadow-2xl"
                  >
                    <ArrowLeft size={14} /> Back to Dashboard
                  </button>
                </div>
                
                <BirthdayExperience family={family} currentEvent={currentEvent} />
              </div>
            )}

            {/* View RSVP placeholder/form */}
            {birthdayView === 'rsvp' && (
              <div className="min-h-screen bg-[#07000c] text-[#FDFBF7] pb-24 relative overflow-hidden flex-grow pt-10 px-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_85%)] pointer-events-none z-0" />
                
                <div className="max-w-3xl mx-auto relative z-10">
                  {/* Back button */}
                  <div className="mb-6">
                    <button
                      onClick={() => setBirthdayView('dashboard')}
                      className="px-4 py-2 bg-[#120a1c] border border-amber-400/20 text-amber-300 text-xs rounded-xl hover:bg-amber-400/10 transition-all font-mono uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                  </div>

                  {/* Form container */}
                  <div className="bg-[#120a1c]/90 border border-amber-400/20 p-8 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 via-amber-400 to-pink-500" />
                    
                    <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-6">
                      <div>
                        <span className="text-amber-300 uppercase tracking-[0.2em] text-[10px] font-mono font-bold">Party Registry</span>
                        <h3 className="font-serif text-2xl text-cream mt-1">RSVP Response</h3>
                        <p className="text-xs text-[#FDFBF7]/60">Confirm attendance and help us curate the perfect experience for you.</p>
                      </div>
                      
                      {isRsvpLocked && (
                        <span className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] uppercase tracking-wider font-mono font-bold rounded-lg flex items-center gap-1">
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </div>

                    {loadingDetails ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="animate-spin text-amber-300" size={32} />
                        <p className="text-xs text-[#FDFBF7]/50 font-mono">Retrieving your responses...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveRsvp} className="space-y-6 text-xs sm:text-sm">
                        
                        {/* Attendance options */}
                        <div className="space-y-3">
                          <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold">Are you attending the celebration?</label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              disabled={isRsvpLocked}
                              onClick={() => setAttending(true)}
                              className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all ${
                                attending 
                                  ? 'bg-amber-400 text-black border-amber-400 shadow-lg' 
                                  : 'bg-black/40 border-amber-400/20 text-[#FDFBF7]/60 hover:border-amber-400/40'
                              }`}
                            >
                              Yes, I'll Be There! 🎉
                            </button>
                            <button
                              type="button"
                              disabled={isRsvpLocked}
                              onClick={() => setAttending(false)}
                              className={`py-3.5 rounded-xl border text-center font-bold tracking-wider uppercase font-mono text-xs transition-all ${
                                !attending 
                                  ? 'bg-amber-400 text-black border-amber-400 shadow-lg' 
                                  : 'bg-black/40 border-amber-400/20 text-[#FDFBF7]/60 hover:border-amber-400/40'
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
                                  max={family.max_guests}
                                  value={adultsCount}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setAdultsCount(val);
                                    // Update other family members input array size
                                    setFamilyMembers(prev => {
                                      const updated = [...prev];
                                      while (updated.length < val - 1) updated.push('');
                                      while (updated.length > val - 1) updated.pop();
                                      return updated;
                                    });
                                  }}
                                  className="w-full bg-black/40 border border-amber-400/20 rounded-xl p-3 text-cream focus:border-amber-400 outline-none mt-1 transition-colors font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold">Children Attending</label>
                                <input
                                  required
                                  disabled={isRsvpLocked}
                                  type="number"
                                  min={0}
                                  value={childrenCount}
                                  onChange={e => setChildrenCount(Number(e.target.value))}
                                  className="w-full bg-black/40 border border-amber-400/20 rounded-xl p-3 text-cream focus:border-amber-400 outline-none mt-1 transition-colors font-mono"
                                />
                              </div>
                            </div>

                            {/* Family members names input */}
                            {familyMembers.length > 0 && (
                              <div className="space-y-2">
                                <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold">Other Guest Names</label>
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
                                      className="w-full bg-black/40 border border-amber-400/15 rounded-xl p-3 text-cream focus:border-amber-400 outline-none transition-colors"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Special requests / dietary preferences */}
                        <div>
                          <label className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-wider font-mono font-bold">Special Requests / Dietary Preferences</label>
                          <textarea
                            disabled={isRsvpLocked}
                            placeholder="Please let us know if there is anything we can do to make your experience outstanding..."
                            value={specialRequests}
                            onChange={e => setSpecialRequests(e.target.value)}
                            rows={3}
                            className="w-full bg-black/40 border border-amber-400/20 rounded-xl p-3 text-cream focus:border-amber-400 outline-none mt-1 transition-colors leading-relaxed"
                          />
                        </div>

                        {/* Submit button */}
                        {!isRsvpLocked && (
                          <button
                            type="submit"
                            disabled={savingRsvp}
                            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2"
                          >
                            {savingRsvp ? (
                              <>
                                <Loader2 className="animate-spin" size={14} />
                                Saving RSVP...
                              </>
                            ) : (
                              'Save RSVP Response'
                            )}
                          </button>
                        )}

                      </form>
                    )}

                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
