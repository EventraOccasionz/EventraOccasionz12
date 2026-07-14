import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Clock, Info, CheckCircle, ArrowRight, 
  Sparkles, Navigation, Hotel, Car, FileText, Lock, Loader2, Check
} from 'lucide-react';
import { Family } from '../../../types';
import { dataService } from '../../../services/dataService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface GenericGuestExperienceProps {
  family: Family;
  event: any;
  eventId: string;
}

export default function GenericGuestExperience({ family, event, eventId }: GenericGuestExperienceProps) {
  const [isUnveiled, setIsUnveiled] = useState(() => {
    return sessionStorage.getItem(`unveiled_generic_${eventId}_${family.id}`) === 'true';
  });

  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  
  const [rsvpData, setRsvpData] = useState<any | null>(null);
  const [attending, setAttending] = useState<boolean>(true);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState('');

  const eventName = event?.name || 'Celebration';
  const eventType = event?.type || event?.eventType || 'Event';
  const formattedDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date to be Announced';

  useEffect(() => {
    const loadDetails = async () => {
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
        
        // Load RSVP
        const rsvps = await dataService.getRSVPs();
        const existingRSVP = rsvps.find((r: any) => r.family_id === family.id);
        if (existingRSVP) {
            setRsvpData(existingRSVP);
            setAttending(existingRSVP.attending !== false);
            setAdultsCount(existingRSVP.adults_count || 1);
            setSpecialRequests(existingRSVP.special_requests || '');
            setSelectedFunctions(existingRSVP.functions_attending || []);
        }
      } catch (err) {
        console.error('Error loading details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [eventId, family.id]);

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
            updated_at: new Date().toISOString(),
        };
        await dataService.submitRSVP(payload as any);
        setRsvpData(payload);
        setRsvpSuccessMessage('Your RSVP has been confirmed.');
        setTimeout(() => setRsvpSuccessMessage(''), 4000);
    } catch(e) {
        console.error('RSVP Error:', e);
        alert('Error saving RSVP.');
    } finally {
        setSavingRsvp(false);
    }
  };

  if (!isUnveiled) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0%,transparent_70%)] pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="relative z-10 text-center max-w-sm">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-amber-300 font-bold mb-4">You Are Invited</h2>
            <h1 className="text-4xl font-serif font-medium tracking-tight mb-2 text-[#FDFBF7]">{eventName}</h1>
            <button 
                onClick={() => { sessionStorage.setItem(`unveiled_generic_${eventId}_${family.id}`, 'true'); setIsUnveiled(true); }} 
                className="mt-8 px-8 py-3.5 bg-amber-400 text-black uppercase font-bold tracking-widest text-[10px] hover:bg-amber-300 transition-colors duration-500 shadow-lg"
            >
                Open Invitation
            </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#FDFBF7] font-sans selection:bg-amber-400/20 selection:text-amber-300 relative">
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-20">
        <header className="text-center">
            <h1 className="text-5xl font-serif text-[#FDFBF7] mb-4">{eventName}</h1>
            <p className="text-amber-300 font-mono text-xs uppercase tracking-widest">{eventType}</p>
            <div className="mt-8 flex flex-col items-center gap-2 text-sm text-[#FDFBF7]/70 font-mono">
                <p>{formattedDate}</p>
                <p>{event?.venue || 'Venue TBA'}</p>
            </div>
        </header>

        {timeline.length > 0 && (
            <section>
                <h2 className="text-xl font-serif mb-8 text-center text-amber-300">Schedule</h2>
                <div className="space-y-4">
                    {timeline.map((slot, idx) => (
                        <div key={idx} className="bg-[#111317] border border-white/10 p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">{slot.name || slot.title}</h3>
                                <p className="text-xs text-[#FDFBF7]/60">{slot.description}</p>
                            </div>
                            <span className="text-xs font-mono text-amber-300">{slot.time}</span>
                        </div>
                    ))}
                </div>
            </section>
        )}

        <section id="rsvp-section" className="bg-[#111317] p-8 border border-white/5">
            <h2 className="text-2xl font-serif mb-6 text-center">RSVP</h2>
            {rsvpSuccessMessage ? (
                <div className="text-center text-amber-300 p-4 border border-amber-300/30">{rsvpSuccessMessage}</div>
            ) : (
                <form onSubmit={handleSaveRsvp} className="space-y-4">
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setAttending(true)} className={`flex-1 py-3 border ${attending ? 'border-amber-400 bg-amber-400/10' : 'border-white/20'}`}>Attending</button>
                        <button type="button" onClick={() => setAttending(false)} className={`flex-1 py-3 border ${!attending ? 'border-amber-400 bg-amber-400/10' : 'border-white/20'}`}>Not Attending</button>
                    </div>
                    {attending && (
                        <input type="number" min={1} value={adultsCount} onChange={e => setAdultsCount(Number(e.target.value))} className="w-full bg-[#07080a] p-3 border border-white/20" />
                    )}
                    <button type="submit" disabled={savingRsvp} className="w-full py-4 bg-amber-400 text-black font-bold uppercase tracking-widest text-xs">
                        {savingRsvp ? 'Saving...' : 'Submit'}
                    </button>
                </form>
            )}
        </section>
      </div>
    </div>
  );
}
