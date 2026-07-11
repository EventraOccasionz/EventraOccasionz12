import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cake, Gift, Sparkles, Briefcase, Building, Heart, 
  Calendar, Flame, Baby, Smile, Gem, Info, Lock, KeyRound, 
  ArrowRight, MapPin, Clock, Users, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { Family } from '../../types';
import BirthdayGuestExperience from '../invitations/birthday/BirthdayGuestExperience';
import CorporateGuestExperienceComponent from '../invitations/corporate/CorporateGuestExperience';
import AnniversaryGuestExperienceComponent from '../invitations/anniversary/AnniversaryGuestExperience';
import BabyShowerGuestExperienceComponent from '../invitations/babyshower/BabyShowerGuestExperience';
import EngagementGuestExperienceComponent from '../invitations/engagement/EngagementGuestExperience';
import GenericGuestExperienceComponent from '../invitations/generic/GenericGuestExperience';
import { EventExperienceConfig } from '../../lib/eventExperience';

// Prop Interfaces
interface GuestExperienceProps {
  family: Family;
  event: any;
  eventId: string;
  experienceConfig?: EventExperienceConfig;
}

// 2. Corporate Guest Experience
export function CorporateGuestExperience({ family, event, eventId, experienceConfig }: GuestExperienceProps) {
  return <CorporateGuestExperienceComponent family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
}

// 3. Anniversary Guest Experience
export function AnniversaryGuestExperience({ family, event, eventId, experienceConfig }: GuestExperienceProps) {
  return <AnimatePresenceComponent family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
}

function AnimatePresenceComponent({ family, event, eventId, experienceConfig }: GuestExperienceProps) {
  return <AnniversaryGuestExperienceComponent family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
}

// 4. Baby Shower Guest Experience
export function BabyShowerGuestExperience({ family, event, eventId, experienceConfig }: GuestExperienceProps) {
  return <BabyShowerGuestExperienceComponent family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
}

// 5. Engagement Guest Experience
export function EngagementGuestExperience({ family, event, eventId, experienceConfig }: GuestExperienceProps) {
  return <EngagementGuestExperienceComponent family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
}

// 6. Generic Guest Experience
export function GenericGuestExperience({ family, event, eventId, experienceConfig }: GuestExperienceProps) {
  return <GenericGuestExperienceComponent family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
}

// 7. MAIN ROUTER COMPONENT
interface GuestExperienceRouterProps {
  family: Family;
  event: any;
  slug: string;
  experienceConfig?: EventExperienceConfig;
}

export default function GuestExperienceRouter({ family, event, slug, experienceConfig }: GuestExperienceRouterProps) {
  // Passcode gating handled dynamically in this component for non-wedding events
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem(`access_${slug}`) === 'true';
  });
  
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const eventId = family.event_id || event?.id || 'evt_unknown';

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;
    
    if (enteredCode.trim().toUpperCase() === family.access_code.toUpperCase()) {
      sessionStorage.setItem(`access_${slug}`, 'true');
      setIsAuthorized(true);
    } else {
      setCodeError('The invitation passcode is incorrect. Please try again.');
    }
  };

  // Safe normalization of Event Type
  const normalizeEventType = (rawType: unknown) => {
    return String(rawType ?? '')
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, ' ');
  };

  const rawEventType = event?.type || event?.eventType || '';
  const normalizedEventType = normalizeEventType(rawEventType);

  // Selected experience string resolution
  let selectedExperience = 'GenericGuestExperience';
  if (normalizedEventType === 'wedding') {
    selectedExperience = 'WeddingGuestExperience';
  } else if (normalizedEventType === 'birthday') {
    selectedExperience = 'BirthdayGuestExperience';
  } else if (normalizedEventType === 'corporate') {
    selectedExperience = 'CorporateGuestExperience';
  } else if (normalizedEventType === 'anniversary') {
    selectedExperience = 'AnniversaryGuestExperience';
  } else if (normalizedEventType === 'baby shower') {
    selectedExperience = 'BabyShowerGuestExperience';
  } else if (normalizedEventType === 'engagement') {
    selectedExperience = 'EngagementGuestExperience';
  } else {
    selectedExperience = 'GenericGuestExperience';
  }

  // Debug Console Logs exactly as specified:
  console.log('[Guest Router] Invite record:', family);
  console.log('[Guest Router] Linked event ID:', eventId);
  console.log('[Guest Router] Loaded event:', event);
  console.log('[Guest Router] Raw event type:', rawEventType);
  console.log('[Guest Router] Normalized event type:', normalizedEventType);
  console.log('[Guest Router] Selected experience:', selectedExperience);

  // Gated Passcode screen for non-wedding experiences
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#FDFBF7] flex items-center justify-center p-4 relative font-sans antialiased">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.04)_0%,transparent_85%)] pointer-events-none z-0" />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#111317] border border-amber-400/20 rounded-3xl p-8 sm:p-12 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          <div className="mb-8">
            <div className="w-14 h-14 mx-auto mb-4 border border-amber-400/20 rounded-full flex items-center justify-center bg-black/40 shadow-inner">
              <Lock className="text-amber-300 animate-pulse" size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80 block mb-1 font-mono">
              Private Invitation Space
            </span>
            <h2 className="font-serif text-2xl text-cream tracking-tight mb-2">
              Access Gated
            </h2>
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mx-auto mb-6" />
            <p className="text-xs text-[#FDFBF7]/80 leading-relaxed max-w-xs mx-auto font-sans">
              Welcome to the private celebration area. Please enter your passcode to reveal the registry for: <br />
              <span className="text-amber-300 font-bold tracking-wide italic font-serif text-sm block mt-1.5">
                {family.name}
              </span>
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-5 relative z-10 font-mono">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="ENTER ACCESS PASSCODE"
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value);
                    setCodeError('');
                  }}
                  className="w-full bg-[#08090b] border border-amber-400/20 rounded-xl py-4 px-4 text-center font-mono text-xs uppercase tracking-[0.25em] text-amber-200 placeholder-amber-400/20 focus:outline-none focus:border-amber-400/50 transition-all shadow-inner"
                />
              </div>
              {codeError && (
                <p className="text-[10px] text-red-400 text-center font-sans tracking-wide mt-1.5 leading-relaxed uppercase">
                  {codeError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              Unlock Invitation
              <ArrowRight size={14} />
            </button>
          </form>

          <p className="mt-8 text-[9px] text-[#FDFBF7]/40 uppercase tracking-[0.15em] max-w-xs mx-auto font-mono">
            Please refer to your invitation message for your passcode.
          </p>
        </motion.div>
      </div>
    );
  }

  // Route to the corresponding placeholder experience component
  switch (normalizedEventType) {
    case 'birthday':
      return <BirthdayGuestExperience family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
    case 'corporate':
      return <CorporateGuestExperience family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
    case 'anniversary':
      return <AnniversaryGuestExperience family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
    case 'baby shower':
    case 'baby_shower':
    case 'baby-shower':
      return <BabyShowerGuestExperience family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
    case 'engagement':
      return <EngagementGuestExperience family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
    default:
      return <GenericGuestExperience family={family} event={event} eventId={eventId} experienceConfig={experienceConfig} />;
  }
}
