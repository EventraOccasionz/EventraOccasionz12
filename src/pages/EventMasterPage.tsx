import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { dataService } from '../services/dataService';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, CheckCircle, LogOut, Users, MapPin, 
  Calendar, Phone, MessageSquare, Hotel, Car, 
  ArrowLeft, ExternalLink, QrCode, ShieldCheck
} from 'lucide-react';

interface Family {
  id: string;
  name: string;
  access_code: string;
  members?: { name: string; age?: string }[];
  rsvp_status?: string;
  confirmed_guests?: number;
  mobile?: string;
  room_details?: string;
  transport_details?: string;
  notes?: string;
  check_in_time?: string;
  check_out_time?: string;
  event_id: string;
}

export default function EventMasterPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [foundFamily, setFoundFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      setLoading(true);
      try {
        let allEvents: any[] = [];
        if (dataService.isConfigured()) {
          const eventsDoc = await getDoc(doc(db, 'venue_settings', 'events_config'));
          if (eventsDoc.exists()) {
            const data = eventsDoc.data();
            if (data && Array.isArray(data.events)) {
              allEvents = data.events;
            }
          }
        } else {
          const cached = localStorage.getItem('local_events');
          if (cached) {
            allEvents = JSON.parse(cached);
          }
        }
        
        const found = allEvents.find(e => String(e.id) === String(eventId));
        setEvent(found || null);
      } catch (err) {
        console.error('Failed to load event:', err);
      } finally {
        setLoading(false);
      }
    };

    // Real-time listener for guests in this event
    const q = query(collection(db, 'families'), where('event_id', '==', eventId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Family));
      setFamilies(data.sort((a, b) => a.name.localeCompare(b.name)));
    });

    fetchEvent();
    return () => unsubscribe();
  }, [eventId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const result = families.find(f => f.access_code.toUpperCase() === searchCode.toUpperCase());
    setFoundFamily(result || null);
    if (!result) {
      alert('No guest found with this access code for this event.');
    }
  };

  const handleCheckIn = async (family: Family) => {
    setIsProcessing(true);
    try {
      const docRef = doc(db, 'families', family.id);
      const checkInTime = new Date().toLocaleString();
      await updateDoc(docRef, { 
        check_in_time: checkInTime,
        check_out_time: null // Clear checkout if re-checking in
      });
      setFoundFamily(prev => prev ? { ...prev, check_in_time: checkInTime, check_out_time: undefined } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async (family: Family) => {
    setIsProcessing(true);
    try {
      const docRef = doc(db, 'families', family.id);
      const checkOutTime = new Date().toLocaleString();
      await updateDoc(docRef, { check_out_time: checkOutTime });
      setFoundFamily(prev => prev ? { ...prev, check_out_time: checkOutTime } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-cream">
      <h1 className="text-2xl font-serif mb-4">Event Not Found</h1>
      <button onClick={() => navigate('/admin')} className="text-gold flex items-center gap-2">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream selection:bg-gold selection:text-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-3 text-gold/60 hover:text-gold transition-all group py-2"
            >
              <div className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center group-hover:border-gold/50 group-hover:bg-gold/5 transition-all">
                <ArrowLeft size={20} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold hidden sm:inline">Back to Events</span>
            </button>

            <div className="h-10 w-[1px] bg-white/10 hidden sm:block" />

            <div className="flex flex-col">
              <h1 className="font-serif text-lg tracking-[0.1em] text-cream uppercase">Eventra Occasionz</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Master Event Hub</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">ID: {event.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-xs font-mono">
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">Guest List</span>
                <span className="text-gold font-bold text-base">{families.length}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/5" />
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">Checked In</span>
                <span className="text-green-400 font-bold text-base">
                  {families.filter(f => f.check_in_time && !f.check_out_time).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Search & Guest Detail */}
        <div className="lg:col-span-5 space-y-8">
          {/* Search Card */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <h2 className="text-sm font-serif text-gold mb-4 flex items-center gap-2">
              <QrCode size={18} /> Guest Access Code Search
            </h2>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Enter Access Code (e.g. AR-9932)"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-mono tracking-widest uppercase"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-gold text-black rounded-xl hover:bg-gold/90 transition-colors flex items-center justify-center"
              >
                <Search size={18} />
              </button>
            </form>
          </section>

          {/* Found Guest Detail */}
          <AnimatePresence mode="wait">
            {foundFamily ? (
              <motion.div
                key={foundFamily.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 border border-gold/30 rounded-3xl overflow-hidden"
              >
                <div className="p-6 border-b border-white/10 bg-gold/5 flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-serif text-gold mb-1">{foundFamily.name}</h3>
                    <span className="px-2 py-0.5 bg-gold/20 text-gold rounded text-[10px] font-mono tracking-widest uppercase">
                      Code: {foundFamily.access_code}
                    </span>
                  </div>
                  {foundFamily.check_in_time && !foundFamily.check_out_time ? (
                    <div className="flex items-center gap-2 text-green-400 font-mono text-[10px] bg-green-400/10 px-3 py-1.5 rounded-full">
                      <ShieldCheck size={14} /> LIVE: CHECKED IN
                    </div>
                  ) : foundFamily.check_out_time ? (
                    <div className="flex items-center gap-2 text-white/40 font-mono text-[10px] bg-white/5 px-3 py-1.5 rounded-full">
                      COMPLETED: CHECKED OUT
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gold/40 font-mono text-[10px] bg-gold/5 px-3 py-1.5 rounded-full">
                      AWAITING ARRIVAL
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Status Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-white/40 uppercase font-mono mb-1">RSVP Status</div>
                      <div className={`text-sm font-serif ${foundFamily.rsvp_status === 'Confirmed' ? 'text-green-400' : 'text-gold/60'}`}>
                        {foundFamily.rsvp_status || 'Pending'}
                      </div>
                    </div>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-white/40 uppercase font-mono mb-1">Confirmed Guests</div>
                      <div className="text-sm font-serif text-cream">{foundFamily.confirmed_guests || 0} People</div>
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                        <Users size={18} className="text-gold/60" />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-mono">Family Members</div>
                        <div className="text-sm text-white/80">
                          {foundFamily.members?.map(m => m.name).join(', ') || 'Only Primary Guest'}
                        </div>
                      </div>
                    </div>

                    {foundFamily.room_details && (
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                          <Hotel size={18} className="text-gold/60" />
                        </div>
                        <div>
                          <div className="text-[10px] text-white/40 uppercase font-mono">Room / Accommodation</div>
                          <div className="text-sm text-white/80">{foundFamily.room_details}</div>
                        </div>
                      </div>
                    )}

                    {foundFamily.transport_details && (
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                          <Car size={18} className="text-gold/60" />
                        </div>
                        <div>
                          <div className="text-[10px] text-white/40 uppercase font-mono">Transport Details</div>
                          <div className="text-sm text-white/80">{foundFamily.transport_details}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Section */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    {!foundFamily.check_in_time ? (
                      <button
                        onClick={() => handleCheckIn(foundFamily)}
                        disabled={isProcessing}
                        className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={20} /> Verify & Check In Now
                      </button>
                    ) : !foundFamily.check_out_time ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-green-400/10 border border-green-400/20 rounded-2xl text-center">
                          <p className="text-[10px] text-green-400 uppercase font-mono mb-1">Check-in Verified at</p>
                          <p className="text-sm font-serif text-cream">{foundFamily.check_in_time}</p>
                        </div>
                        <button
                          onClick={() => handleCheckOut(foundFamily)}
                          disabled={isProcessing}
                          className="w-full bg-white/10 text-cream py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/10"
                        >
                          <LogOut size={20} /> Complete Check Out
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                        <p className="text-[10px] text-white/40 uppercase font-mono mb-1">Final Check-out at</p>
                        <p className="text-sm font-serif text-cream">{foundFamily.check_out_time}</p>
                        <p className="text-[10px] text-gold mt-2">GUEST VISIT COMPLETED</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center opacity-40">
                <Users size={48} className="text-gold mb-4" />
                <p className="font-serif text-lg">Awaiting Guest Search</p>
                <p className="text-xs text-white/60 mt-2">Enter an access code to verify guest details</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Complete Guest List */}
        <div className="lg:col-span-7">
          <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-serif text-gold">Complete Guest Roster</h2>
              <span className="text-[10px] font-mono text-white/40">{families.length} Records</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                  <tr className="text-[10px] uppercase font-mono text-gold/60 tracking-wider">
                    <th className="px-6 py-4 border-b border-white/5">Guest / Code</th>
                    <th className="px-6 py-4 border-b border-white/5">RSVP</th>
                    <th className="px-6 py-4 border-b border-white/5">Status</th>
                    <th className="px-6 py-4 border-b border-white/5">Timing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {families.map(family => (
                    <tr 
                      key={family.id} 
                      className={`group hover:bg-white/5 transition-colors cursor-pointer ${foundFamily?.id === family.id ? 'bg-gold/5' : ''}`}
                      onClick={() => setFoundFamily(family)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-serif text-cream">{family.name}</div>
                        <div className="text-[10px] font-mono text-white/40">{family.access_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          family.rsvp_status === 'Confirmed' ? 'bg-green-400/10 text-green-400' : 'bg-gold/10 text-gold'
                        }`}>
                          {family.rsvp_status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {family.check_out_time ? (
                          <span className="text-[10px] text-white/30">Checked Out</span>
                        ) : family.check_in_time ? (
                          <span className="text-[10px] text-green-400 font-bold">In Event</span>
                        ) : (
                          <span className="text-[10px] text-white/20">Expected</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {family.check_in_time ? (
                          <div className="text-[9px] font-mono leading-tight">
                            <div className="text-white/60">IN: {family.check_in_time.split(',')[1]}</div>
                            {family.check_out_time && (
                              <div className="text-white/30">OUT: {family.check_out_time.split(',')[1]}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/10">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
