import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../services/dataService';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Family, RSVP, TransportRequest, RoomBooking, Inquiry, Service, GalleryItem, EventData } from '../types';
import { 
  Users, UserCheck, Clock, Car, Hotel, Search, Plus, 
  Trash2, Download, LogOut, CheckCircle2,
  XCircle, Loader2, RefreshCcw, Database,
  Briefcase, Image, Edit, FileText, Save, Eye, EyeOff,
  PlusCircle, ArrowUp, ArrowDown, Shield, Map, QrCode, MapPin, Heart, Sparkles, MessageSquare, PieChart, DollarSign,
  Menu, X, Layout
} from 'lucide-react';


// Lazy Loaded Modular Panels
const AnalyticsPanel = React.lazy(() => import('../components/admin/AnalyticsPanel'));
const InquiriesTab = React.lazy(() => import('../components/admin/InquiriesTab'));
const ServicesTab = React.lazy(() => import('../components/admin/ServicesTab'));
const GalleryTab = React.lazy(() => import('../components/admin/GalleryTab'));
const GuestsTab = React.lazy(() => import('../components/admin/GuestsTab'));
const FamiliesTab = React.lazy(() => import('../components/admin/FamiliesTab'));
const TransportTab = React.lazy(() => import('../components/admin/TransportTab'));
const RoomsTab = React.lazy(() => import('../components/admin/RoomsTab'));
const AuditTab = React.lazy(() => import('../components/admin/AuditTab'));
const StaffTab = React.lazy(() => import('../components/admin/StaffTab'));
const AboutTab = React.lazy(() => import('../components/admin/AboutTab'));
const DocumentsTab = React.lazy(() => import('../components/admin/DocumentsTab'));
const SecurityTab = React.lazy(() => import('../components/admin/SecurityTab'));

const EventsTab = React.lazy(() => import('../components/admin/EventsTab'));
const CheckinTab = React.lazy(() => import('../components/admin/CheckinTab'));
const NotificationsTab = React.lazy(() => import('../components/admin/NotificationsTab'));
const ReportsTab = React.lazy(() => import('../components/admin/ReportsTab'));
const WebsiteSettingsTab = React.lazy(() => import('../components/admin/WebsiteSettingsTab'));

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<Family[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [transports, setTransports] = useState<TransportRequest[]>([]);
  const [rooms, setRooms] = useState<RoomBooking[]>([]);
  
  // New CMS States
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const [isConfigured, setIsConfigured] = useState(dataService.isConfigured());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const [events, setEvents] = useState<EventData[]>([
    { id: 'evt_001', name: 'Royal Rajput Wedding', bride: 'Priya', groom: 'Rahul', date: '2026-10-15', venue: 'Umaid Bhawan Palace', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Wedding' },
    { id: 'evt_002', name: 'Beachfront Nuptials', bride: 'Anjali', groom: 'Vikram', date: '2026-11-20', venue: 'Taj Exotica, Goa', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Wedding' },
    { id: 'evt_003', name: 'Sangeet Night', bride: 'Sneha', groom: 'Arjun', date: '2026-12-05', venue: 'Rambagh Palace', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Sangeet' },
    { id: 'evt_004', name: 'Mehendi Celebration', bride: 'Kriti', groom: 'Rohan', date: '2027-01-12', venue: 'Suryagarh Jaisalmer', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Mehendi' },
    { id: 'evt_005', name: 'Haldi Ceremony', bride: 'Meera', groom: 'Kabir', date: '2027-02-14', venue: 'The Oberoi Udaivilas', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Haldi' },
    { id: 'evt_006', name: 'Grand Reception', bride: 'Riya', groom: 'Aditya', date: '2027-03-22', venue: 'St. Regis Mumbai', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Reception' },
    { id: 'evt_007', name: 'Engagement Soiree', bride: 'Nisha', groom: 'Dev', date: '2027-04-10', venue: 'Taj Andaman', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Engagement' },
    { id: 'evt_008', name: 'Birthday Bash', bride: 'Pooja', date: '2027-05-18', venue: 'Khyber, Gulmarg', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Birthday' },
    { id: 'evt_009', name: 'Anniversary Dinner', date: '2027-06-25', venue: 'Sula Vineyards', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Anniversary' },
    { id: 'evt_010', name: 'Corporate Gala', date: '2027-07-30', venue: 'Falaknuma Palace', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'Corporate Event' },
    { id: 'evt_011', name: 'House Warming Party', date: '2027-08-15', venue: 'Garden Terrace', status: 'Active', created_at: '2026-07-09T00:00:00Z', type: 'House Warming' }
  ]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Mobile drawer sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search / Tab States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'inquiries' | 'services' | 'gallery' | 'guests' | 'families' | 'transport' | 'rooms' | 'audit' | 'map' | 'about' | 'documents' | 'staff' | 'security' | 'checkin' | 'notifications' | 'reports' | 'website' | 'settings' | 'analytics'>('dashboard');

  // Modals & Editors
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamily, setNewFamily] = useState({ name: '', max_guests: 1, access_code: '', slug: '' });

  useEffect(() => {
    let active = true;
    let unsubscribeInquiries: any = null;

    const verifyAdmin = async (user: any) => {
      try {
        if (!user) {
          localStorage.removeItem('is_admin');
          if (active) navigate('/admin/login');
          return;
        }

        // 1. Fetch registered_accounts profile to check role
        const profileDoc = await getDoc(doc(db, 'registered_accounts', user.uid));
        const isAdminProfile = profileDoc.exists() && profileDoc.data()?.role === 'admin';

        // 2. Check if admin_users collection contains the user
        let isAdminInCollection = false;
        try {
          const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
          if (adminDoc.exists()) {
            isAdminInCollection = true;
          }
        } catch (_) {}

        // 3. Check whitelist
        const whitelist = await dataService.getAdminWhitelist();
        const isDevAdmin = user.email ? whitelist.includes(user.email.toLowerCase().trim()) : false;

        if (isAdminProfile || isAdminInCollection || isDevAdmin) {
          localStorage.setItem('is_admin', 'true');
          if (active) {
            fetchData();
          }
        } else {
          localStorage.removeItem('is_admin');
          if (active) navigate('/admin/login');
        }
      } catch (err) {
        console.error('Verify admin failed:', err);
        localStorage.removeItem('is_admin');
        if (active) navigate('/admin/login');
      }
    };

    // Listen to real-time authentication session state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        verifyAdmin(user);
      } else {
        localStorage.removeItem('is_admin');
        if (active) navigate('/admin/login');
      }
    });

    // Enable Firestore live snapshot for instant desktop-audio push alerts on new leads
    if (dataService.isConfigured()) {
      try {
        let isInitialLoad = true;
        unsubscribeInquiries = onSnapshot(collection(db, 'inquiries'), (snapshot) => {
          if (isInitialLoad) {
            isInitialLoad = false;
            return;
          }
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const d = change.doc.data();
              try {
                // Use AudioContext for a simple beep instead of external URL to avoid 403 errors
                try {
                  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                  if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.5);
                  }
                } catch (e) { console.warn(e); }
              } catch (_) {}

              setFeedback({
                type: 'success',
                message: `🔔 REAL-TIME: New Event Enquiry received from ${d.name || 'Visitor'} for ${d.service_selected || 'Services'}!`
              });
              fetchData();
            }
          });
        });
      } catch (e) {
        console.warn('Real-time snapshot binding skipped:', e);
      }
    }

    return () => {
      active = false;
      unsubscribeAuth();
      if (unsubscribeInquiries) unsubscribeInquiries();
    };
  }, [navigate]);

  // Handle auto-redirection to Event selection/management tab if selectedEventId becomes null
  useEffect(() => {
    if (!selectedEventId && ['guests', 'families', 'transport', 'rooms', 'documents', 'checkin', 'notifications', 'reports'].includes(activeTab)) {
      setActiveTab('events');
    }
  }, [selectedEventId, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [f, r, t, rm, inq, srv, gal] = await Promise.all([
        dataService.getFamilies(),
        dataService.getRSVPs(),
        dataService.getTransports(),
        dataService.getRooms(),
        dataService.getInquiries(),
        dataService.getServices(),
        dataService.getGallery()
      ]);

      setFamilies(f);
      setRsvps(r);
      setTransports(t);
      setRooms(rm);
      setInquiries(inq);
      setServices(srv);
      setGallery(gal);

      // Fetch dynamic events
      try {
        if (dataService.isConfigured()) {
          const eventsDoc = await getDoc(doc(db, 'venue_settings', 'events_config'));
          if (eventsDoc.exists()) {
            const data = eventsDoc.data();
            if (data && Array.isArray(data.events)) {
              setEvents(data.events);
            }
          }
        } else {
          const cached = localStorage.getItem('local_events');
          if (cached) {
            setEvents(JSON.parse(cached));
          }
        }
      } catch (err) {
        console.warn('Failed loading events config:', err);
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      showToast('error', `Database Fetch Failure: ${err?.message || 'Firebase service is currently unavailable.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (newEvent: Omit<EventData, 'id' | 'created_at'>) => {
    const createdEvent: EventData = {
      ...newEvent,
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    const updatedEvents = [...events, createdEvent];
    setEvents(updatedEvents);

    try {
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'venue_settings', 'events_config'), { events: updatedEvents });
      } else {
        localStorage.setItem('local_events', JSON.stringify(updatedEvents));
      }
      showToast('success', `Event "${newEvent.name}" registered successfully.`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to persist new event in cloud.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const updatedEvents = events.filter(e => e.id !== id);
    setEvents(updatedEvents);
    if (selectedEventId === id) {
      setSelectedEventId(null);
    }

    try {
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'venue_settings', 'events_config'), { events: updatedEvents });
        
        // Cascade delete associated event records securely
        const familiesToDelete = families.filter(f => f.event_id === id);
        for (const f of familiesToDelete) {
          await deleteDoc(doc(db, 'families', f.id));
        }

        const rsvpsToDelete = rsvps.filter(r => r.event_id === id || familiesToDelete.some(f => f.id === r.family_id));
        for (const r of rsvpsToDelete) {
          await deleteDoc(doc(db, 'rsvp', r.id));
        }

        const transportsToDelete = transports.filter(t => t.event_id === id || familiesToDelete.some(f => f.id === t.family_id));
        for (const t of transportsToDelete) {
          await deleteDoc(doc(db, 'transport_requests', t.id));
        }

        const roomsToDelete = rooms.filter(rm => rm.event_id === id || familiesToDelete.some(f => f.id === rm.family_id));
        for (const rm of roomsToDelete) {
          await deleteDoc(doc(db, 'room_bookings', rm.id));
        }

        try {
          const docsSnapshot = await getDocs(collection(db, 'guest_documents'));
          docsSnapshot.forEach(async (docSnap) => {
            const docData = docSnap.data();
            if (docData.event_id === id || familiesToDelete.some(f => f.id === docData.family_id)) {
              await deleteDoc(doc(db, 'guest_documents', docSnap.id));
            }
          });
        } catch (e) {
          console.warn('Failed guest documents clean up:', e);
        }

        showToast('success', 'Event and its guest rosters deleted.');
      } else {
        localStorage.setItem('local_events', JSON.stringify(updatedEvents));
        
        // Clean up memory cache fallback lists
        const familiesToDelete = families.filter(f => f.event_id === id);
        try {
          const deletedFamilyIds = JSON.parse(sessionStorage.getItem('deleted_family_ids') || '[]');
          familiesToDelete.forEach(f => {
            if (!deletedFamilyIds.includes(f.id)) {
              deletedFamilyIds.push(f.id);
            }
          });
          sessionStorage.setItem('deleted_family_ids', JSON.stringify(deletedFamilyIds));

          const localRSVPs = JSON.parse(sessionStorage.getItem('local_rsvps') || '[]');
          const filteredRSVPs = localRSVPs.filter((r: any) => r.event_id !== id && !familiesToDelete.some(f => f.id === r.family_id));
          sessionStorage.setItem('local_rsvps', JSON.stringify(filteredRSVPs));

          const deletedRoomIds = JSON.parse(sessionStorage.getItem('deleted_room_ids') || '[]');
          const roomsToDelete = rooms.filter(rm => rm.event_id === id || familiesToDelete.some(f => f.id === rm.family_id));
          roomsToDelete.forEach(rm => {
            if (!deletedRoomIds.includes(rm.id)) {
              deletedRoomIds.push(rm.id);
            }
          });
          sessionStorage.setItem('deleted_room_ids', JSON.stringify(deletedRoomIds));
        } catch (e) {
          console.warn('Local session cleanup failed:', e);
        }

        showToast('success', 'Event deleted.');
      }
      fetchData(); // Trigger data refresh
    } catch (err) {
      showToast('error', 'Failed to delete event and its associated data.');
    }
  };

  const handleUpdateEventStatus = async (id: string, newStatus: 'Upcoming' | 'Ongoing' | 'Completed' | 'Archived' | 'Active') => {
    const updatedEvents = events.map(e => {
      if (e.id === id) {
        if (newStatus === 'Archived') {
          const prev = e.status !== 'Archived' ? e.status : (e.previousStatus || 'Upcoming');
          return { ...e, status: newStatus, previousStatus: prev };
        } else {
          return { ...e, status: newStatus };
        }
      }
      return e;
    });
    setEvents(updatedEvents);

    try {
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'venue_settings', 'events_config'), { events: updatedEvents });
      } else {
        localStorage.setItem('local_events', JSON.stringify(updatedEvents));
      }
      showToast('success', `Event status updated to ${newStatus}.`);
    } catch (err) {
      showToast('error', 'Failed to update event status.');
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventData) => {
    const updatedEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    setEvents(updatedEvents);

    try {
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'venue_settings', 'events_config'), { events: updatedEvents });
      } else {
        localStorage.setItem('local_events', JSON.stringify(updatedEvents));
      }
    } catch (err) {
      console.error('Failed to save updated event roster:', err);
    }
  };

  const handleToggleCheckin = async (id: string, currentStatus: boolean, checkinTime?: string) => {
    const updatedStatus = !currentStatus;
    const timeToSave = updatedStatus ? (checkinTime || new Date().toISOString()) : null;
    try {
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'rsvp', id), { 
          checked_in: updatedStatus, 
          checked_in_at: timeToSave 
        }, { merge: true });
      } else {
        const sessionMock = JSON.parse(sessionStorage.getItem('mock_rsvps') || '[]');
        const exists = sessionMock.some((r: any) => r.id === id);
        let updatedMock;
        if (exists) {
          updatedMock = sessionMock.map((r: any) => r.id === id ? { ...r, checked_in: updatedStatus, checked_in_at: timeToSave } : r);
        } else {
          const matched = rsvps.find(r => r.id === id);
          if (matched) {
            sessionMock.push({ ...matched, checked_in: updatedStatus, checked_in_at: timeToSave });
          }
          updatedMock = sessionMock;
        }
        sessionStorage.setItem('mock_rsvps', JSON.stringify(updatedMock));
      }
      setRsvps(prev => prev.map(r => r.id === id ? { ...r, checked_in: updatedStatus, checked_in_at: timeToSave || undefined } : r));
      showToast('success', updatedStatus ? 'Guest marked as checked in.' : 'Guest check-in cleared.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed updating check-in status.');
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: null, message: '' });
    }, 4000);
  };

  // Families
  const handleAddFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newFamily.slug || (newFamily.name || '').toLowerCase().replace(/ /g, '-');
    const code = newFamily.access_code || Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
      await dataService.addFamily({
        name: newFamily.name,
        max_guests: newFamily.max_guests,
        slug,
        access_code: code,
        event_id: selectedEventId || undefined,
        eventId: selectedEventId || undefined
      });
      
      setShowAddFamily(false);
      setNewFamily({ name: '', max_guests: 1, access_code: '', slug: '' });
      showToast('success', 'Invitation family profile registered successfully.');
      fetchData();
    } catch (err) {
      showToast('error', 'Failed adding group. Verify slug uniqueness.');
    }
  };

  const handleDeleteFamily = async (id: string) => {
    if (!confirm('Are you sure you want to delete this family? All linked RSVPs and data will be lost.')) return;
    try {
      await dataService.deleteFamily(id);
      showToast('success', 'Group deleted.');
      fetchData();
    } catch (err: any) {
      if (err?.message?.includes('Permission Denied') || String(err).includes('Missing or insufficient permissions')) {
        setFamilies(prev => prev.filter(f => f.id !== id));
        showToast('success', 'Group deleted (Preview Mode).');
      } else {
        showToast('error', 'Error deleting family.');
      }
    }
  };

  // Inquiries methods
  const handleUpdateInquiryStatus = async (id: string, nextStatus: 'Pending' | 'Contacted' | 'Completed') => {
    try {
      await dataService.updateInquiryStatus(id, nextStatus);
      showToast('success', `Inquiry is now marked ${nextStatus}`);
      fetchData();
    } catch (err) {
      showToast('error', 'Status modification failed.');
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Permanently delete this customer inquiry?')) return;
    try {
      await dataService.deleteInquiry(id);
      showToast('success', 'Inquiry deleted.');
      fetchData();
    } catch (err: any) {
      if (err?.message?.includes('Permission Denied') || String(err).includes('Missing or insufficient permissions')) {
        setInquiries(prev => prev.filter(i => i.id !== id));
        showToast('success', 'Inquiry deleted (Preview Mode).');
      } else {
        showToast('error', 'Delete operation failed.');
      }
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service? It will disappear from the showcase.')) return;
    try {
      await dataService.deleteService(id);
      showToast('success', 'Service removed.');
      fetchData();
    } catch (err: any) {
      if (err?.message?.includes('Permission Denied') || String(err).includes('Missing or insufficient permissions')) {
        setServices(prev => prev.filter(s => s.id !== id));
        showToast('success', 'Service removed (Preview Mode).');
      } else {
        showToast('error', 'Deleteme call failed.');
      }
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Delete this showcase photo?')) return;
    try {
      await dataService.deleteGalleryItem(id);
      showToast('success', 'Gallery item deleted.');
      fetchData();
    } catch (err: any) {
      if (err?.message?.includes('Permission Denied') || String(err).includes('Missing or insufficient permissions')) {
        setGallery(prev => prev.filter(g => g.id !== id));
        showToast('success', 'Gallery item deleted (Preview Mode).');
      } else {
        showToast('error', 'Delete operation failed.');
      }
    }
  };

  // Universal sorting changer elements helper functions
  const handleShiftServiceOrder = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= services.length) return;

    const itemA = services[idx];
    const itemB = services[targetIdx];

    try {
      await dataService.updateService(itemA.id, { order_index: itemB.order_index });
      await dataService.updateService(itemB.id, { order_index: itemA.order_index });
      fetchData();
    } catch (err) {
      showToast('error', 'Reorder failed.');
    }
  };

  const handleShiftGalleryOrder = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= gallery.length) return;

    const itemA = gallery[idx];
    const itemB = gallery[targetIdx];

    try {
      await dataService.updateGalleryItem(itemA.id, { order_index: itemB.order_index });
      await dataService.updateGalleryItem(itemB.id, { order_index: itemA.order_index });
      fetchData();
    } catch (err) {
      showToast('error', 'Reorder failed.');
    }
  };

  const toggleServiceVisibility = async (serv: Service) => {
    const nextVis = serv.visible === false;
    try {
      await dataService.updateService(serv.id, { visible: nextVis });
      showToast('success', `${serv.name} visibility updated.`);
      fetchData();
    } catch (err) {
      showToast('error', 'Toggle visibility failed.');
    }
  };

  const toggleGalleryVisibility = async (item: GalleryItem) => {
    const nextVis = item.visible === false;
    try {
      await dataService.updateGalleryItem(item.id, { visible: nextVis });
      showToast('success', `${item.lbl} visibility updated.`);
      fetchData();
    } catch (err) {
      showToast('error', 'Toggle visibility failed.');
    }
  };

  // --- RSVP Event Filtering ---
  const isRsvpTab = ['guests', 'families', 'transport', 'rooms', 'documents', 'countdown', 'checkin', 'notifications', 'reports'].includes(activeTab);
  const displayFamilies = selectedEventId ? families.filter(f => f.event_id === selectedEventId) : families;
  const validFamilyIds = new Set(displayFamilies.map(f => f.id));
  
  const displayRsvps = selectedEventId ? rsvps.filter(r => r.event_id === selectedEventId || validFamilyIds.has(r.family_id)) : rsvps;
  const displayTransports = selectedEventId ? transports.filter(t => t.event_id === selectedEventId || validFamilyIds.has(t.family_id)) : transports;
  const displayRooms = selectedEventId ? rooms.filter(r => r.event_id === selectedEventId || validFamilyIds.has(r.family_id)) : rooms;

  // Exporters
  const handleExport = (explicitType?: 'guests' | 'families' | 'transport' | 'rooms') => {
    const targetType = explicitType || activeTab;
    let dataToExport: any[] = [];
    let headers: string[] = [];
    let fileName = `eventra_export_${targetType}.csv`;

    if (targetType === 'guests') {
      headers = ['Name', 'Email', 'Attending', 'Adult Guests', 'Kids', 'Dietary Requirements', 'Events', 'Last Updated'];
      dataToExport = displayRsvps.map(r => [
        r.guest_name, 
        r.email, 
        r.attending ? 'Yes' : 'No', 
        r.total_guests, 
        r.children_count,
        r.dietary_requirements || 'None',
        (r.events || []).join('; '),
        new Date(r.updated_at || r.created_at).toLocaleString()
      ]);
    } else if (targetType === 'families') {
      headers = ['Family', 'Slug', 'Access Code', 'Capacity'];
      dataToExport = displayFamilies.map(f => [f.name, f.slug, f.access_code, f.max_guests]);
    } else if (targetType === 'transport') {
      headers = ['Family', 'Arrival Mode', 'Cab Requested', 'Pickup Location', 'Arrival Time', 'Details'];
      dataToExport = displayTransports.map(t => [
        displayFamilies.find(f => f.id === t.family_id)?.name || 'Guest',
        t.mode || 'N/A',
        t.need_cab ? 'Yes' : 'No',
        t.pickup_location || 'N/A',
        t.arrival_time || 'N/A',
        t.details || 'N/A'
      ]);
    } else if (targetType === 'rooms') {
      headers = ['Family', 'Hotel Name', 'Check-in', 'Check-out', 'Room Number', 'Status'];
      dataToExport = displayRooms.map(r => [
        displayFamilies.find(f => f.id === r.family_id)?.name || 'Guest',
        r.hotel_name || 'N/A',
        r.check_in || 'N/A',
        r.check_out || 'N/A',
        r.room_number || 'N/A',
        r.status || 'Pending'
      ]);
    } else if (targetType === 'inquiries') {
      headers = ['Name', 'Email', 'Phone', 'Service selected', 'Submitted Date', 'Status'];
      dataToExport = inquiries.map(i => [i.name, i.email, i.phone, i.service_selected, i.created_at, i.status]);
    } else if (targetType === 'services') {
      headers = ['Service Code', 'Category', 'Name', 'Price', 'Visible'];
      dataToExport = services.map(s => [s.id, s.cat, s.name, s.price || '-', s.visible !== false ? 'Yes' : 'No']);
    } else {
      headers = ['Gallery Code', 'Category', 'Label', 'Target Link', 'Visible'];
      dataToExport = gallery.map(g => [g.id, g.cat, g.lbl, g.image_url || '-', g.visible !== false ? 'Yes' : 'No']);
    }

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const logout = async () => {
    try {
      await dataService.logout();
    } catch (e) {
      console.warn('Silent failure on remote session signout:', e);
    }
    localStorage.removeItem('is_admin');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    navigate('/admin/login');
  };

  // Dynamic engagement trend (Real data only, Step 8, 9)
  const engagementData = (() => {
    const months = [];
    const now = new Date();
    // Use last 4 months ending in current month
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        count: 0
      });
    }

    events.forEach(e => {
      if (!e.created_at) return;
      const ed = new Date(e.created_at);
      months.forEach(m => {
        if (ed.getFullYear() === m.year && ed.getMonth() === m.monthNum) {
          m.count++;
        }
      });
    });

    inquiries.forEach(inq => {
      if (!inq.created_at) return;
      const id = new Date(inq.created_at);
      months.forEach(m => {
        if (id.getFullYear() === m.year && id.getMonth() === m.monthNum) {
          m.count++;
        }
      });
    });

    rsvps.forEach(r => {
      if (!r.created_at) return;
      const rd = new Date(r.created_at);
      months.forEach(m => {
        if (rd.getFullYear() === m.year && rd.getMonth() === m.monthNum) {
          m.count++;
        }
      });
    });

    return months;
  })();

  const currentEvent = events.find(e => e.id === selectedEventId);

  // Stats calculation
  const stats = {
    // Global Event Status Counts (Step 3)
    totalEvents: events.length,
    upcomingEvents: events.filter(e => e.status === 'Upcoming').length,
    activeEvents: events.filter(e => e.status === 'Ongoing' || e.status === 'Active' || e.status === 'Ongoing (Active)' as any).length,
    completedEvents: events.filter(e => e.status === 'Completed').length,
    archivedEvents: events.filter(e => e.status === 'Archived').length,

    // Global CMS / CRM Metrics (Step 4, 5, 6)
    totalInquiries: inquiries.length,
    pendingInquiries: inquiries.filter(i => i.status === 'Pending').length,
    totalServices: services.filter(s => s.visible !== false && s.status !== 'Draft' && s.status !== 'Hidden').length, 
    galleryItems: gallery.filter(g => g.visible !== false).length, 

    // Current Event Context (Step 2, 7)
    selectedEventId,
    selectedEventName: currentEvent ? currentEvent.name : null,
    expectedGuests: currentEvent ? currentEvent.expectedGuests : null,
    confirmedGuestsCount: selectedEventId ? displayRsvps.filter(r => r.attending).reduce((acc, curr) => acc + (curr.total_guests || 0), 0) : 0,
    rsvpResponsesCount: selectedEventId ? displayRsvps.length : 0,
    transportCount: selectedEventId ? displayTransports.length : 0,
    roomsCount: selectedEventId ? displayRooms.length : 0,

    // Detailed event metrics
    totalInviteLinks: selectedEventId ? displayFamilies.length : 0,
    inviteCapacity: selectedEventId ? displayFamilies.reduce((acc, f) => acc + (f.max_guests || 0), 0) : 0,
    notAttendingCount: selectedEventId ? displayRsvps.filter(r => !r.attending).length : 0,
    pendingRsvpsCount: selectedEventId ? displayFamilies.filter(f => !new Set(displayRsvps.map(r => r.family_id)).has(f.id)).length : 0,
    pendingGuestsCount: selectedEventId ? displayFamilies.filter(f => !new Set(displayRsvps.map(r => r.family_id)).has(f.id)).reduce((acc, f) => acc + (f.max_guests || 0), 0) : 0,
    checkinsCount: selectedEventId ? displayRsvps.filter(r => r.checked_in).length : 0,

    // Dynamic Sparkline
    engagementData
  };

  // Search Filter applications
  const term = searchTerm.toLowerCase().trim();
  
  const filteredInquiries = inquiries.filter(i => 
    (i.name || '').toLowerCase().includes(term) || 
    (i.email || '').toLowerCase().includes(term) || 
    (i.phone || '').toLowerCase().includes(term) || 
    (i.service_selected || '').toLowerCase().includes(term) || 
    (i.message || '').toLowerCase().includes(term)
  );

  const filteredServices = services.filter(s => 
    (s.name || '').toLowerCase().includes(term) || 
    (s.desc || '').toLowerCase().includes(term) || 
    (s.cat || '').toLowerCase().includes(term)
  );

  const filteredGallery = gallery.filter(g => 
    (g.lbl || '').toLowerCase().includes(term) || 
    (g.cat || '').toLowerCase().includes(term)
  );

  const filteredRSVPs = displayRsvps.filter(r => 
    (r.guest_name || '').toLowerCase().includes(term) || 
    (r.email || '').toLowerCase().includes(term)
  );

  const filteredFamilies = displayFamilies.filter(f => 
    (f.name || '').toLowerCase().includes(term) ||
    (f.access_code || '').toLowerCase().includes(term)
  );

  return (
    <div className="min-h-screen bg-[#060504] pt-24 pb-20 px-6 md:px-12 flex flex-col items-center">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedback.message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 z-[3000] px-6 py-4 rounded-xl shadow-2xl border ${
              feedback.type === 'error' 
                ? 'bg-red-950/90 border-red-500/30 text-red-100' 
                : 'bg-gold/10 border-gold/40 text-gold'
            }`}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Header */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <span className="text-gold tracking-[0.4em] text-[0.6rem] uppercase">Management Console</span>
          <h2 className="font-serif text-4xl md:text-5xl text-cream mt-2 tracking-tight">Eventra <em className="italic text-gold">Occasionz</em> Workspace</h2>
          {!isConfigured && (
            <div className="mt-4 flex items-center gap-2 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg text-xs">
              <Database size={14} />
              <span>Demo Workspace Enabled. Ensure Firebase credentials are set to persist the production database.</span>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <button onClick={fetchData} className="p-3 bg-white/5 border border-gold/20 text-gold hover:bg-gold/10 transition-all rounded-lg">
             <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={logout} className="px-6 py-2.5 border border-red-500/30 text-red-400 text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-red-500/10 rounded-lg transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Panel (Modular Visualizer) */}
      <React.Suspense fallback={
        <div className="w-full max-w-7xl h-44 flex items-center justify-center bg-black/10 rounded-2xl border border-white/5 mb-12">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      }>
        <AnalyticsPanel stats={stats} onSelectWorkspace={() => setActiveTab('events')} />
      </React.Suspense>

      {/* Control Board Core panel */}
      <div className="w-full max-w-7xl bg-[#121212] border border-white/5 rounded-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 bg-[#141414] w-full select-none">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-gold hover:bg-white/10 transition-colors"
          >
            <Menu size={18} />
            <span className="text-cream text-xs font-mono uppercase tracking-widest font-bold">Menu</span>
          </button>
          
          <div className="text-right flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono">Workspace</span>
            <span className="text-xs text-gold capitalize font-mono font-bold">{activeTab}</span>
          </div>
        </div>

        {/* Mobile Drawer (Backdrop & sliding menu) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] md:hidden"
              />
              
              {/* Sliding Menu */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 left-0 w-72 bg-[#0c0a09] border-r border-gold/10 p-5 z-[2001] flex flex-col overflow-y-auto md:hidden shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div className="flex flex-col">
                    <span className="text-gold text-[10px] uppercase tracking-widest font-mono font-bold">Eventra Occasionz</span>
                    <span className="text-cream text-xs font-serif font-medium mt-0.5">Control Panel</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg bg-white/5 text-text-secondary hover:text-gold hover:bg-white/10 transition-all border border-white/10"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-1 select-none">
                  <span className="text-[0.55rem] uppercase tracking-widest text-[#D4AF37]/50 ml-4 mb-3 font-bold">Workspace</span>
                  <TabButton active={activeTab === 'dashboard'} icon={<Database size={18} />} label="Dashboard" onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'events'} icon={<Sparkles size={18} />} label="Events" onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'guests'} icon={<UserCheck size={18} />} label="RSVP" onClick={() => { setActiveTab('guests'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'families'} icon={<Users size={18} />} label="Guests" onClick={() => { setActiveTab('families'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'website'} icon={<Layout size={18} />} label="Website" onClick={() => { setActiveTab('website'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'gallery'} icon={<Image size={18} />} label="Gallery" onClick={() => { setActiveTab('gallery'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'services'} icon={<Briefcase size={18} />} label="Services" onClick={() => { setActiveTab('services'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'settings'} icon={<Shield size={18} />} label="Settings" onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'staff'} icon={<Users size={18} />} label="Users" onClick={() => { setActiveTab('staff'); setIsSidebarOpen(false); }} />
                  <TabButton active={activeTab === 'analytics'} icon={<PieChart size={18} />} label="Analytics" onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} />

                  {selectedEventId && (
                    <>
                      <div className="h-[1px] bg-white/5 my-3" />
                      <span className="text-[0.55rem] uppercase tracking-widest text-[#D4AF37]/50 ml-4 mb-3 font-bold">Event Operations</span>
                      <TabButton active={activeTab === 'transport'} icon={<Car size={18} />} label="Transport" onClick={() => { setActiveTab('transport'); setIsSidebarOpen(false); }} />
                      <TabButton active={activeTab === 'rooms'} icon={<Hotel size={18} />} label="Hotel" onClick={() => { setActiveTab('rooms'); setIsSidebarOpen(false); }} />
                      <TabButton active={activeTab === 'documents'} icon={<FileText size={18} />} label="Guest Documents" onClick={() => { setActiveTab('documents'); setIsSidebarOpen(false); }} />
                      <TabButton active={activeTab === 'checkin'} icon={<CheckCircle2 size={18} />} label="Check-in" onClick={() => { setActiveTab('checkin'); setIsSidebarOpen(false); }} />
                      <TabButton active={activeTab === 'notifications'} icon={<MessageSquare size={18} />} label="Notifications" onClick={() => { setActiveTab('notifications'); setIsSidebarOpen(false); }} />
                      <TabButton active={activeTab === 'reports'} icon={<PieChart size={18} />} label="Reports" onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} />
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Navigation Sidebar (Desktop view) */}
        <div className="hidden md:flex md:flex-col md:w-64 border-r border-gold/10 p-4 gap-1 shrink-0 select-none bg-[#121212]">
          <span className="text-[0.55rem] uppercase tracking-widest text-[#D4AF37]/50 ml-4 mb-3 font-bold">Workspace</span>
          <TabButton active={activeTab === 'dashboard'} icon={<Database size={18} />} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
          <TabButton active={activeTab === 'events'} icon={<Sparkles size={18} />} label="Events" onClick={() => setActiveTab('events')} />
          <TabButton active={activeTab === 'guests'} icon={<UserCheck size={18} />} label="RSVP" onClick={() => setActiveTab('guests')} />
          <TabButton active={activeTab === 'families'} icon={<Users size={18} />} label="Guests" onClick={() => setActiveTab('families')} />
          <TabButton active={activeTab === 'website'} icon={<Layout size={18} />} label="Website" onClick={() => setActiveTab('website')} />
          <TabButton active={activeTab === 'gallery'} icon={<Image size={18} />} label="Gallery" onClick={() => setActiveTab('gallery')} />
          <TabButton active={activeTab === 'services'} icon={<Briefcase size={18} />} label="Services" onClick={() => setActiveTab('services')} />
          <TabButton active={activeTab === 'settings'} icon={<Shield size={18} />} label="Settings" onClick={() => setActiveTab('settings')} />
          <TabButton active={activeTab === 'staff'} icon={<Users size={18} />} label="Users" onClick={() => setActiveTab('staff')} />
          <TabButton active={activeTab === 'analytics'} icon={<PieChart size={18} />} label="Analytics" onClick={() => setActiveTab('analytics')} />

          {selectedEventId && (
            <>
              <div className="h-[1px] bg-white/5 my-3" />
              <span className="text-[0.55rem] uppercase tracking-widest text-[#D4AF37]/50 ml-4 mb-3 font-bold">Event Operations</span>
              <TabButton active={activeTab === 'transport'} icon={<Car size={18} />} label="Transport" onClick={() => setActiveTab('transport')} />
              <TabButton active={activeTab === 'rooms'} icon={<Hotel size={18} />} label="Hotel" onClick={() => setActiveTab('rooms')} />
              <TabButton active={activeTab === 'documents'} icon={<FileText size={18} />} label="Guest Documents" onClick={() => setActiveTab('documents')} />
              <TabButton active={activeTab === 'checkin'} icon={<CheckCircle2 size={18} />} label="Check-in" onClick={() => setActiveTab('checkin')} />
              <TabButton active={activeTab === 'notifications'} icon={<MessageSquare size={18} />} label="Notifications" onClick={() => setActiveTab('notifications')} />
              <TabButton active={activeTab === 'reports'} icon={<PieChart size={18} />} label="Reports" onClick={() => setActiveTab('reports')} />
            </>
          )}
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-grow w-full md:w-0 min-w-0 p-6 md:p-10 min-h-[550px] overflow-x-auto">
          
          {isRsvpTab && !selectedEventId ? (
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="animate-spin text-gold" size={40} />
                <p className="text-sm text-text-secondary uppercase tracking-widest font-thin">Loading Events Workspace...</p>
              </div>
            }>
              <EventsTab 
                events={events}
                selectedEventId={selectedEventId}
                onSelectEvent={(id) => {
                  setSelectedEventId(id);
                  setActiveTab('guests'); // Switch to RSVPs tab inside Event Dashboard
                }}
                onCreateEvent={handleCreateEvent}
                onDeleteEvent={handleDeleteEvent}
                onUpdateEventStatus={handleUpdateEventStatus}
                onUpdateEvent={handleUpdateEvent}
              />
            </React.Suspense>
          ) : (
            <>
              {selectedEventId && (
                <div className="mb-8 bg-gradient-to-r from-[#181512] via-[#241e17] to-[#181512] border border-gold/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                  {/* Visual decorations */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full filter blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-gold/5 rounded-full filter blur-2xl" />
                  
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 text-[9px] uppercase tracking-widest font-mono font-bold">
                          Premium Event Workspace
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-bold ${
                          events.find(e => e.id === selectedEventId)?.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : events.find(e => e.id === selectedEventId)?.status === 'Completed'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-white/10 text-text-secondary border border-white/5'
                        }`}>
                          {events.find(e => e.id === selectedEventId)?.status || 'Active'}
                        </span>
                      </div>

                      <h2 className="font-serif text-2xl sm:text-3xl text-cream tracking-tight">
                        {events.find(e => e.id === selectedEventId)?.name}
                      </h2>

                      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-serif text-gold/90">
                        <span className="flex items-center gap-1">
                          <Heart size={12} className="text-[#ff6b8b]" />
                          {events.find(e => e.id === selectedEventId)?.bride} & {events.find(e => e.id === selectedEventId)?.groom}
                        </span>
                        <span className="text-white/20 font-sans">•</span>
                        <span className="flex items-center gap-1 text-text-secondary font-mono text-[11px]">
                          <Clock size={12} className="text-white/30" />
                          {events.find(e => e.id === selectedEventId)?.date}
                        </span>
                        <span className="text-white/20 font-sans">•</span>
                        <span className="flex items-center gap-1 text-text-secondary font-mono text-[11px]">
                          <MapPin size={12} className="text-white/30" />
                          {events.find(e => e.id === selectedEventId)?.venue}
                        </span>
                      </div>
                    </div>

                    {/* Mini statistics badges */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-center min-w-[70px]">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-mono">RSVPs</span>
                        <span className="text-sm font-bold text-cream">{displayRsvps.filter(r => r.attending).length}</span>
                      </div>
                      <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-center min-w-[70px]">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-mono">Cabs</span>
                        <span className="text-sm font-bold text-cream">{displayTransports.filter(t => t.need_cab).length}</span>
                      </div>
                      <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-center min-w-[70px]">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-mono">Rooms</span>
                        <span className="text-sm font-bold text-cream">{displayRooms.length}</span>
                      </div>

                      <button 
                        onClick={() => setSelectedEventId(null)} 
                        className="ml-2 px-4 py-2.5 border border-gold/40 hover:bg-gold/10 text-gold text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                      >
                        <RefreshCcw size={12} /> Switch Event
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filter index search..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-gold/10 pl-12 pr-6 py-3 text-sm outline-none focus:border-gold transition-colors text-cream rounded-lg"
                  />
                </div>
                
                <div className="flex gap-4">
                  {activeTab === 'families' && (
                    <button
                      onClick={() => setShowAddFamily(true)}
                      className="px-5 py-3 bg-gold hover:bg-gold/90 text-dark text-xs uppercase tracking-widest font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg active:scale-95"
                    >
                      <Plus size={16} /> Add Invite Link
                    </button>
                  )}
                  <button 
                    onClick={() => handleExport()}
                    title="Export Data CSV File"
                    className="p-3 border border-gold/20 text-text-secondary hover:text-gold rounded-lg transition-colors hover:border-gold/40"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="animate-spin text-gold" size={40} />
                <p className="text-sm text-text-secondary uppercase tracking-widest font-thin">Synthesizing records safely...</p>
              </div>
            ) : (
              <React.Suspense fallback={
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="animate-spin text-gold" size={40} />
                  <p className="text-sm text-text-secondary uppercase tracking-widest font-thin">Loading modular panel...</p>
                </div>
              }>
                {activeTab === 'dashboard' && (
                  <EventsTab 
                    events={events}
                    selectedEventId={selectedEventId}
                    onSelectEvent={(id) => {
                      setSelectedEventId(id);
                      setActiveTab('guests');
                    }}
                    onCreateEvent={handleCreateEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onUpdateEventStatus={handleUpdateEventStatus}
                    onUpdateEvent={handleUpdateEvent}
                  />
                )}
                {activeTab === 'website' && (
                  <WebsiteSettingsTab
                    showToast={showToast}
                  />
                )}
                {activeTab === 'settings' && (
                  <SecurityTab />
                )}
                {activeTab === 'analytics' && (
                  <ReportsTab 
                    rsvps={displayRsvps}
                    families={displayFamilies}
                    transports={displayTransports}
                    rooms={displayRooms}
                    eventName={events.find(e => e.id === selectedEventId)?.name || 'All Events'}
                    onExport={handleExport}
                  />
                )}

                {activeTab === 'inquiries' && (
                  <InquiriesTab 
                    filteredInquiries={filteredInquiries}
                    handleUpdateInquiryStatus={handleUpdateInquiryStatus}
                    handleDeleteInquiry={handleDeleteInquiry}
                  />
                )}
                {activeTab === 'services' && (
                  <ServicesTab />
                )}
                {activeTab === 'gallery' && (
                  <GalleryTab 
                    filteredGallery={filteredGallery}
                    gallery={gallery}
                    handleShiftGalleryOrder={handleShiftGalleryOrder}
                    toggleGalleryVisibility={toggleGalleryVisibility}
                    handleDeleteGallery={handleDeleteGallery}
                    onRefresh={fetchData}
                  />
                )}
                {activeTab === 'guests' && (
                  <GuestsTab filteredRSVPs={filteredRSVPs} />
                )}
                {activeTab === 'families' && (
                  <FamiliesTab 
                    filteredFamilies={filteredFamilies}
                    handleDeleteFamily={handleDeleteFamily}
                    onRefresh={fetchData}
                    onAddClick={() => setShowAddFamily(true)}
                  />
                )}
                {activeTab === 'transport' && (
                  <TransportTab 
                    transports={displayTransports} 
                    families={displayFamilies} 
                    onRefresh={fetchData} 
                    showToast={showToast} 
                  />
                )}
                {activeTab === 'rooms' && (
                  <RoomsTab rooms={displayRooms} families={displayFamilies} onRefresh={fetchData} showToast={showToast} onRemove={(id) => setRooms(prev => prev.filter(r => r.id !== id))} />
                )}
                {activeTab === 'about' && (
                  <AboutTab showToast={showToast} onRefreshAll={fetchData} />
                )}
                {activeTab === 'audit' && (
                  <AuditTab />
                )}
                {activeTab === 'staff' && (
                  <StaffTab />
                )}
                {activeTab === 'security' && (
                  <SecurityTab />
                )}
                {activeTab === 'documents' && (
                  <DocumentsTab 
                    selectedEventId={selectedEventId || ''} 
                    onRefresh={fetchData} 
                    showToast={showToast} 
                  />
                )}
                {activeTab === 'events' && (
                  <EventsTab 
                    events={events}
                    selectedEventId={selectedEventId}
                    onSelectEvent={(id) => {
                      setSelectedEventId(id);
                      setActiveTab('guests'); // Switch to RSVPs tab inside Event Dashboard
                    }}
                    onCreateEvent={handleCreateEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onUpdateEventStatus={handleUpdateEventStatus}
                    onUpdateEvent={handleUpdateEvent}
                  />
                )}
                {activeTab === 'checkin' && (
                  <CheckinTab 
                    rsvps={displayRsvps}
                    families={displayFamilies}
                    rooms={displayRooms}
                    onToggleCheckin={handleToggleCheckin}
                  />
                )}
                {activeTab === 'notifications' && (
                  <NotificationsTab 
                    selectedEventId={selectedEventId || ''}
                    confirmedGuestsCount={displayRsvps.filter(r => r.attending).length}
                    hotelGuestsCount={displayRooms.length}
                    transportGuestsCount={displayTransports.filter(t => t.need_cab).length}
                    showToast={showToast}
                    families={displayFamilies}
                  />
                )}
                {activeTab === 'reports' && (
                  <ReportsTab 
                    rsvps={displayRsvps}
                    families={displayFamilies}
                    transports={displayTransports}
                    rooms={displayRooms}
                    eventName={events.find(e => e.id === selectedEventId)?.name || 'Event'}
                    onExport={handleExport}
                  />
                )}
              </React.Suspense>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {/* MODALS DRAWERS FOR STABLE DATA ENTRIES */}

      {/* A. FAMILY CREATOR MODAL */}
      <AnimatePresence>
        {showAddFamily && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAddFamily(false)}
               className="absolute inset-0 bg-dark/90 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-dark-2 border border-gold/40 p-10 z-[2001] rounded-2xl"
            >
              <button onClick={() => setShowAddFamily(false)} className="absolute top-6 right-6 text-text-secondary hover:text-gold"><XCircle size={24} /></button>
              <h3 className="font-serif text-3xl text-cream mb-2 italic">New Invitation Card</h3>
              <p className="text-[0.6rem] text-text-secondary uppercase tracking-widest mb-10">Generate unique digital passcodes & layouts</p>
              
              <form onSubmit={handleAddFamily} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6rem] uppercase tracking-widest text-text-secondary">Family / Group Name</label>
                  <input 
                    required type="text" 
                    className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold rounded-lg"
                    placeholder="e.g. The Malhotra Family"
                    value={newFamily.name}
                    onChange={e => setNewFamily({...newFamily, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-text-secondary">Slug (Optional)</label>
                    <input 
                      type="text" className="bg-white/5 border border-gold/20 p-4 text-text-primary text-xs outline-none focus:border-gold rounded-lg"
                      placeholder="the-malhotras"
                      value={newFamily.slug}
                      onChange={e => setNewFamily({...newFamily, slug: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-text-secondary">Access Code (Optional)</label>
                    <input 
                      type="text" className="bg-white/5 border border-gold/20 p-4 text-text-primary text-xs outline-none focus:border-gold uppercase rounded-lg"
                      placeholder="MALH2026"
                      value={newFamily.access_code}
                      onChange={e => setNewFamily({...newFamily, access_code: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6rem] uppercase tracking-widest text-[#D4AF37]">Allowed Capacity</label>
                  <input 
                    required type="number" 
                    className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold rounded-lg"
                    value={newFamily.max_guests}
                    onChange={e => setNewFamily({...newFamily, max_guests: parseInt(e.target.value)})}
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-gold text-dark text-xs uppercase tracking-[0.3em] font-bold mt-4 hover:bg-gold-light transition-all rounded-lg">
                   Create Invitation Link
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StatsCard({ icon, label, value, subLabel, colorClass }: { icon: React.ReactNode, label: string, value: number, subLabel?: string, colorClass?: string }) {
  return (
    <div className="bg-black/20 p-6 rounded-2xl border border-white/5 group hover:border-gold/20 transition-all">
      <div className={`${colorClass || 'text-gold'} mb-4 p-3 bg-white/5 rounded-xl w-fit transition-transform group-hover:scale-110`}>{icon}</div>
      <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">{label}</p>
      <p className={`font-serif text-3xl ${colorClass || 'text-cream'}`}>{value}</p>
      {subLabel && <p className={`text-[10px] mt-1 ${colorClass || 'text-gold/60'}`}>{subLabel}</p>}
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-xs tracking-widest uppercase transition-all rounded-lg mb-1 text-left
        ${active ? 'bg-gold/10 text-gold border-l-2 border-gold font-medium' : 'text-text-secondary hover:text-cream hover:bg-white/5 border-l-2 border-transparent'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
