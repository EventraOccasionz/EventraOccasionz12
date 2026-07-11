import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Sparkles, Volume2, VolumeX, Gift, Cake, 
  Clock, Map, Phone, Share2, Star, Users
} from 'lucide-react';
import { Family } from '../../types';

interface BirthdayExperienceProps {
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
  experienceConfig?: any;
}

// Sparkle particle effect for a festive celebration vibe
function SparkleParticles() {
  const particles = Array.from({ length: 30 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => {
        const size = Math.random() * 4 + 2;
        const delay = Math.random() * 6;
        const duration = Math.random() * 8 + 8;
        const left = Math.random() * 100;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-tr from-amber-400 via-pink-400 to-indigo-200 opacity-40 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: '-10px',
            }}
            animate={{
              y: ['-105vh', '5vh'],
              x: [0, Math.sin(i) * 45, 0],
              opacity: [0, 0.6, 0.4, 0],
              rotate: [0, 360],
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

// Interactive Floating Ornaments
function DecorativeCirclet({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`w-16 h-16 text-amber-400/20 ${className}`} style={style} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
      <circle cx="50" cy="50" r="40" strokeDasharray="5,5" />
      <circle cx="50" cy="50" r="32" />
      <path d="M 50 10 L 50 20 M 50 80 L 50 90 M 10 50 L 20 50 M 80 50 L 90 50" />
    </svg>
  );
}

// Birthday Countdown Timer
function BirthdayCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasLapsed, setHasLapsed] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setHasLapsed(true);
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
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (hasLapsed) {
    return (
      <div className="text-center py-2">
        <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-medium animate-pulse">
          ✨ The Celebration has begun! ✨
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2.5 max-w-sm mx-auto py-2">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Mins', value: timeLeft.minutes },
        { label: 'Secs', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="bg-gradient-to-b from-[#1a1424] to-[#0f0a17] border border-amber-400/20 rounded-xl p-2.5 text-center shadow-lg relative overflow-hidden">
          <span className="font-sans text-xl sm:text-2xl text-amber-300 font-bold block">{String(item.value).padStart(2, '0')}</span>
          <span className="text-[7.5px] uppercase tracking-widest text-[#FDFBF7]/60 mt-0.5 block">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function BirthdayExperience({ family, currentEvent, experienceConfig }: BirthdayExperienceProps) {
  const birthdayPerson = experienceConfig?.invitation?.partner1Name || currentEvent.bride || 'Shivam';
  const eventName = experienceConfig?.invitationContent?.heading || currentEvent.name || `${birthdayPerson}'s Grand Celebration`;
  
  const targetDate = experienceConfig?.countdown?.date || currentEvent.date;
  const formattedDate = targetDate 
    ? new Date(targetDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Date to be Announced';

  return (
    <div className="relative min-h-screen bg-[#0d0714] text-[#FDFBF7] font-sans overflow-hidden py-12 px-4 selection:bg-amber-400 selection:text-[#0d0714]">
      <SparkleParticles />

      {/* Main Container */}
      <div className="relative z-10 max-w-2xl mx-auto">
        
        {/* Top Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative bg-[#150d1e]/80 border border-amber-400/30 rounded-3xl p-6 sm:p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden mb-8"
        >
          {/* Decorative Corner Borders */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400/40 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400/40 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-400/40 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-400/40 rounded-br-lg" />

          {/* Sparkles Emblem */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <DecorativeCirclet className="absolute -top-5 -left-5 w-24 h-24 text-amber-300/10 animate-spin" style={{ animationDuration: '25s' }} />
              <div className="relative w-14 h-14 rounded-full border border-amber-400/40 bg-gradient-to-tr from-[#251535] to-[#150d1e] flex items-center justify-center shadow-lg">
                <Cake className="text-amber-300 animate-bounce" size={24} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <span className="text-[10px] uppercase tracking-[0.35em] text-amber-300/80 font-mono block mb-2">
            You Are Cordially Invited
          </span>
          
          <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-black text-amber-200 tracking-tight leading-none mb-3">
            {eventName}
          </h1>

          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mx-auto mb-6" />

          <p className="text-xs sm:text-sm text-[#FDFBF7]/85 font-mono tracking-wide leading-relaxed max-w-lg mx-auto mb-6">
            {experienceConfig?.invitationContent?.invitationText || (
              <>
                Dear <span className="text-amber-300 font-bold font-sans italic tracking-wide">{family.name}</span>, we are absolutely thrilled to welcome you in grand style as we celebrate milestone moments and beautiful memories of our beloved <span className="text-amber-200 font-bold">{birthdayPerson}</span>!
              </>
            )}
          </p>

          {/* Countdown Module */}
          {targetDate && experienceConfig?.countdown?.show !== false && (
            <div className="mt-8 bg-black/20 border border-amber-400/10 rounded-2xl p-4 max-w-md mx-auto backdrop-blur-sm">
              <span className="text-[9px] uppercase tracking-[0.25em] text-amber-300/60 font-mono block mb-2">{experienceConfig?.countdown?.heading || "COUNTDOWN TO CELEBRATION"}</span>
              <BirthdayCountdown targetDate={targetDate} />
            </div>
          )}
        </motion.div>

        {/* Schedule & Venue Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {/* Date & Time */}
          <div className="bg-[#150d1e]/80 border border-amber-400/20 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
                <Calendar size={20} />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#FDFBF7]/50 font-mono block">WHEN</span>
                <h3 className="text-base font-bold text-amber-100 mt-0.5">{formattedDate}</h3>
                <p className="text-xs text-[#FDFBF7]/70 mt-1 font-mono">Evening Reception & Celebrations</p>
              </div>
            </div>
          </div>

          {/* Venue Details */}
          {experienceConfig?.sectionVisibility?.venue !== false && (
            <div className="bg-[#150d1e]/80 border border-amber-400/20 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-lg flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-[#FDFBF7]/50 font-mono block">WHERE</span>
                  <h3 className="text-base font-bold text-amber-100 mt-0.5">{currentEvent.venue || 'To Be Announced'}</h3>
                  {currentEvent.city && (
                    <p className="text-xs text-[#FDFBF7]/70 mt-1 font-mono">{currentEvent.city}, {currentEvent.state || ''}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Dynamic Greeting & Photo section */}
        {family.custom_greeting && experienceConfig?.sectionVisibility?.invitationMessage !== false && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-[#150d1e]/80 border border-amber-400/20 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-lg text-center relative overflow-hidden mb-8"
          >
            <Sparkles className="absolute top-4 right-4 text-amber-300/10 w-12 h-12" />
            <span className="text-[9px] uppercase tracking-[0.25em] text-amber-300/70 font-mono block mb-2">Personal Message</span>
            <p className="text-sm font-serif italic text-cream leading-relaxed max-w-lg mx-auto">
              "{family.custom_greeting}"
            </p>
          </motion.div>
        )}

        {/* Guest Curation / Program Details */}
        {experienceConfig?.sectionVisibility?.timeline !== false && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-[#150d1e]/80 border border-amber-400/20 rounded-3xl p-6 sm:p-10 backdrop-blur-md shadow-lg relative overflow-hidden mb-8"
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 via-amber-400 to-pink-500" />
            
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80 font-mono">The Celebration</span>
              <h2 className="font-sans text-2xl font-black text-amber-100 mt-1">Evening Program</h2>
              <div className="w-12 h-[1px] bg-amber-400/30 mx-auto mt-2" />
            </div>

            <div className="space-y-6">
              {(experienceConfig?.hasSavedConfig
                ? experienceConfig.scheduleItems.filter((f: any) => f.visible)
                : [
                    { startTime: '07:30 PM', name: 'Grand Entrance & Welcome Drink', description: 'Sip on handcrafted custom cocktails while welcoming guests to the red-carpet reception.' },
                    { startTime: '08:15 PM', name: 'Cake Cutting Ceremony & Roasts', description: 'A grand celebration with high-definition laser lighting shows and heartfelt messages.' },
                    { startTime: '09:00 PM', name: 'Lively Dance & Entertainment', description: 'A custom energetic musical session led by high-profile guest DJs & entertainment artists.' },
                    { startTime: '10:00 PM', name: 'Luxury Buffet Dinner', description: 'Indulge in a curated international luxury dinner menu.' }
                  ]
              ).map((prog: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-start pb-5 border-b border-white/5 last:border-0 last:pb-0">
                  <span className="text-xs font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-md font-bold whitespace-nowrap">
                    {prog.startTime || prog.time}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-amber-100">{prog.name}</h4>
                    <p className="text-xs text-[#FDFBF7]/70 mt-1 font-mono leading-relaxed">{prog.description || prog.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* RSVP Gate Indicator */}
        {experienceConfig?.rsvpSettings?.enabled !== false && experienceConfig?.sectionVisibility?.rsvp !== false && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-gradient-to-br from-[#1b0d29]/90 to-[#0e0717]/90 border border-amber-400/20 rounded-3xl p-8 text-center backdrop-blur-md shadow-lg relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-400/5 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />

            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80 font-mono block mb-2">Guest Reservation</span>
            <h3 className="text-lg font-bold text-amber-100">RSVP Portal</h3>
            <p className="text-xs text-[#FDFBF7]/70 font-mono mt-1.5 max-w-sm mx-auto leading-relaxed">
              Confirm your attendance, accommodation requirements, travel schedule, and food preferences.
            </p>
            {experienceConfig?.rsvpSettings?.deadline && (
              <p className="text-[9px] uppercase font-mono tracking-widest text-amber-300 font-bold mt-2">
                RSVP Deadline: {new Date(experienceConfig.rsvpSettings.deadline).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </motion.div>
        )}

        {/* Footer Credit */}
        {experienceConfig?.sectionVisibility?.closing !== false && (
          <div className="text-center mt-12 mb-6">
            <p className="text-[10px] text-amber-300/80 font-mono italic max-w-md mx-auto mb-4">
              {experienceConfig?.invitationContent?.closingMessage || ""}
            </p>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#FDFBF7]/40 font-mono">
              Crafted with sophistication by Eventra Occasionz
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
