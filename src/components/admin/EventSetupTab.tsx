import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { dataService } from '../../services/dataService';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  SlidersHorizontal, Sparkles, ChevronRight, ChevronLeft, Save, 
  Plus, Trash2, Edit2, Check, HelpCircle, X, Eye, Info, 
  AlertCircle, MapPin, Clock, Music, Calendar, Users, 
  Briefcase, Heart, Star, BookOpen, Hotel, Car, CheckSquare, ListPlus
} from 'lucide-react';
import { EventData } from '../../types';

interface EventSetupTabProps {
  event: EventData;
  onUpdateEvent: (updatedEvent: EventData) => Promise<void> | void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface CustomQuestion {
  id: string;
  type: 'text' | 'longtext' | 'yesno' | 'single' | 'multiple';
  questionText: string;
  required: boolean;
  enabled: boolean;
  options?: string[];
  order: number;
}

interface ProgrammeItem {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueName: string;
  address?: string;
  mapsLink?: string;
  description?: string;
  dressCode?: string;
  thumbnail?: string;
  visible: boolean;
  askRsvp: boolean;
  order: number;
}

export default function EventSetupTab({ event, onUpdateEvent, showToast }: EventSetupTabProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewGuestUrl, setPreviewGuestUrl] = useState<string | null>(null);

  // Experience Settings Configuration State
  const [details, setDetails] = useState<Record<string, any>>({});
  const [invitation, setInvitation] = useState({
    useDefault: true,
    welcomeHeading: '',
    welcomeMessage: '',
    invitationMessage: '',
    closingMessage: '',
    backgroundMusic: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    mainPhoto: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200'
  });
  const [programme, setProgramme] = useState<ProgrammeItem[]>([]);
  const [rsvpConfig, setRsvpConfig] = useState({
    enabled: true,
    deadline: '',
    questions: {
      attendance: true,
      guests: true,
      food: true,
      travel: true,
      notes: true
    },
    customQuestions: [] as CustomQuestion[]
  });
  const [guestServices, setGuestServices] = useState({
    accommodationEnabled: true,
    transportEnabled: true
  });

  // Local state for editing individual programme item
  const [editingProgramItem, setEditingProgramItem] = useState<Partial<ProgrammeItem> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<CustomQuestion> | null>(null);
  const [newOptionText, setNewOptionText] = useState('');

  const steps = [
    { title: 'Event Details', icon: <Info size={16} />, desc: 'Configure identity and basic fields' },
    { title: 'Invitation Customization', icon: <BookOpen size={16} />, desc: 'Design invitation wording' },
    { title: 'Programme / Timeline', icon: <Calendar size={16} />, desc: 'Build the source of truth functions' },
    { title: 'RSVP Configuration', icon: <CheckSquare size={16} />, desc: 'Set up questions and deadlines' },
    { title: 'Guest Services', icon: <Hotel size={16} />, desc: 'Toggle accommodation & cab scheduling' },
    { title: 'Review & Live Preview', icon: <Eye size={16} />, desc: 'Review setup and launch simulation' }
  ];

  // Load configuration from Firebase or LocalStorage
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        let data: any = null;
        if (dataService.isConfigured()) {
          const docRef = doc(db, 'event_configs', event.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data = docSnap.data();
          }
        } else {
          const cached = localStorage.getItem(`local_event_config_${event.id}`);
          if (cached) {
            data = JSON.parse(cached);
          }
        }

        if (data) {
          // Prefill states
          setDetails(data.details || {});
          if (data.invitation) {
            setInvitation({
              useDefault: data.invitation.useDefault !== false,
              welcomeHeading: data.invitation.welcomeHeading || '',
              welcomeMessage: data.invitation.welcomeMessage || '',
              invitationMessage: data.invitation.invitationMessage || '',
              closingMessage: data.invitation.closingMessage || '',
              backgroundMusic: data.invitation.backgroundMusic || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
              mainPhoto: data.invitation.mainPhoto || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200'
            });
          }
          if (Array.isArray(data.functions)) {
            setProgramme(data.functions);
          }
          if (data.rsvp) {
            setRsvpConfig({
              enabled: data.rsvp.enabled !== false,
              deadline: data.rsvp.deadline || '',
              questions: {
                attendance: data.rsvp.questions?.attendance !== false,
                guests: data.rsvp.questions?.guests !== false,
                food: data.rsvp.questions?.food !== false,
                travel: data.rsvp.questions?.travel !== false,
                notes: data.rsvp.questions?.notes !== false,
                ...data.rsvp.questions
              },
              customQuestions: Array.isArray(data.rsvp.customQuestions) ? data.rsvp.customQuestions : []
            });
          }
          setGuestServices({
            accommodationEnabled: data.accommodationEnabled !== false,
            transportEnabled: data.transportEnabled !== false
          });
        } else {
          // Setup initial defaults based on event category
          initializeDefaults();
        }
      } catch (err) {
        console.error('Failed to load event configuration:', err);
        showToast('error', 'Failed to load event configuration.');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [event.id]);

  // Generate preview guest link if available
  useEffect(() => {
    const fetchPreviewGuest = async () => {
      try {
        const q = query(collection(db, 'families'), where('event_id', '==', event.id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const firstFam = snap.docs[0].data();
          setPreviewGuestUrl(`/invite/${firstFam.slug || firstFam.id}`);
        } else {
          setPreviewGuestUrl(null);
        }
      } catch (e) {
        console.warn('Could not load families for preview link:', e);
      }
    };
    if (event.id) {
      fetchPreviewGuest();
    }
  }, [event.id, programme, details]);

  const initializeDefaults = () => {
    // Generate sensible default Details based on category
    const cat = event.type || 'Other';
    const initDetails: Record<string, any> = {};
    if (cat === 'Wedding') {
      initDetails.partner1Name = event.groom || '';
      initDetails.partner2Name = event.bride || '';
      initDetails.familyName = event.familyName || '';
    } else if (cat === 'Birthday') {
      initDetails.birthdayPerson = event.name.replace(/birthday/gi, '').trim() || '';
      initDetails.age = '';
      initDetails.hostedBy = event.clientName || '';
    } else if (cat === 'Corporate') {
      initDetails.companyName = event.clientName || 'Our Organization';
      initDetails.eventPurpose = event.name || '';
      initDetails.organizerContact = '';
    } else if (cat === 'Anniversary') {
      initDetails.coupleNames = event.name.replace(/anniversary/gi, '').trim() || '';
      initDetails.anniversaryMilestone = '';
      initDetails.hostedBy = event.clientName || '';
    } else if (cat === 'Baby Shower') {
      initDetails.parentNames = event.name.replace(/baby shower/gi, '').trim() || '';
      initDetails.celebrationTitle = 'A Blessed New Beginning';
      initDetails.hostedBy = event.clientName || '';
    } else if (cat === 'Engagement') {
      initDetails.coupleNames = event.name.replace(/engagement/gi, '').trim() || '';
      initDetails.familyName = event.familyName || '';
    } else {
      initDetails.customTitle = event.name;
      initDetails.hostOrganizer = event.clientName || '';
    }
    setDetails(initDetails);

    // Default invitation wording
    const templates = getWordingTemplates(cat, initDetails);
    setInvitation({
      useDefault: true,
      welcomeHeading: templates.heading,
      welcomeMessage: templates.welcome,
      invitationMessage: templates.main,
      closingMessage: templates.closing,
      backgroundMusic: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      mainPhoto: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200'
    });

    // Default Programme items (none by default, user can click "Use Suggested Programme")
    setProgramme([]);

    // Default RSVP
    setRsvpConfig({
      enabled: true,
      deadline: event.date || '',
      questions: {
        attendance: true,
        guests: true,
        food: true,
        travel: true,
        notes: true
      },
      customQuestions: []
    });

    setGuestServices({
      accommodationEnabled: true,
      transportEnabled: true
    });
  };

  const getWordingTemplates = (category: string, currentDetails: any) => {
    const fName = currentDetails.familyName || event.familyName || 'Sharma';
    const cName = currentDetails.coupleNames || `${currentDetails.partner1Name || 'Priya'} & ${currentDetails.partner2Name || 'Rahul'}`;
    const bPerson = currentDetails.birthdayPerson || 'Aria';
    const compName = currentDetails.companyName || 'Apex Corp';
    const pNames = currentDetails.parentNames || 'Mira & Sean';

    switch (category) {
      case 'Wedding':
        return {
          heading: 'Royal Invitation',
          welcome: 'With the divine blessings of our families, we invite you to celebrate the wedding of our children.',
          main: 'We request the honor of your presence as we unite our lives forever in matrimony.',
          closing: `We look forward to celebrating this beautiful beginning with you. With Love, The ${fName} Family.`
        };
      case 'Birthday':
        return {
          heading: 'Celebration of Life',
          welcome: 'You are warmly invited to join us in celebrating a wonderful milestone birthday.',
          main: `Let's gather for an evening filled with laughter, music, and memories as we celebrate ${bPerson}'s special day!`,
          closing: 'Your presence is the greatest gift. Looking forward to seeing you there!'
        };
      case 'Corporate':
        return {
          heading: 'Annual Gala & Celebration',
          welcome: 'We are pleased to invite you to our annual organization gathering.',
          main: `Join us as we reflect on our shared milestones and celebrate the success of ${compName}.`,
          closing: 'Please RSVP by the deadline. Warm regards, the Organizing Committee.'
        };
      case 'Anniversary':
        return {
          heading: 'Milestone Anniversary Celebration',
          welcome: 'Please join us as we celebrate a beautiful journey of love and togetherness.',
          main: `We invite you to share in our joy as we celebrate the wedding anniversary of ${cName}.`,
          closing: 'Thank you for being a part of our lives and story.'
        };
      case 'Baby Shower':
        return {
          heading: 'A Little Miracle is on the Way',
          welcome: `Help us shower the parents-to-be ${pNames} with love, blessings, and warm wishes.`,
          main: 'You are cordially invited to celebrate the upcoming arrival of the new baby!',
          closing: "We can't wait to introduce our little one to you."
        };
      case 'Engagement':
        return {
          heading: 'The Ring Ceremony',
          welcome: 'We are thrilled to announce the formal engagement of our beloved children.',
          main: `Join us as we witness the exchange of rings and toast to a lifetime of happiness for ${cName}.`,
          closing: `With love and anticipation, the ${fName} Family.`
        };
      default:
        return {
          heading: 'Special Invitation',
          welcome: 'We are delighted to invite you to a special gathering.',
          main: `Join us for a unique event celebration: ${event.name}.`,
          closing: 'Looking forward to your esteemed presence.'
        };
    }
  };

  const handleSaveProgress = async (quiet = false) => {
    setSaving(true);
    try {
      // 1. Prepare Configuration Data Model
      const configData = {
        id: event.id,
        details,
        invitation,
        functions: programme,
        rsvp: {
          ...rsvpConfig,
          questions: {
            ...rsvpConfig.questions,
            // Sync travel question with transport services toggle
            travel: rsvpConfig.questions.travel && guestServices.transportEnabled
          }
        },
        accommodationEnabled: guestServices.accommodationEnabled,
        transportEnabled: guestServices.transportEnabled,
        updatedAt: new Date().toISOString()
      };

      // 2. Persist to Firestore or LocalStorage
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'event_configs', event.id), configData, { merge: true });
      } else {
        localStorage.setItem(`local_event_config_${event.id}`, JSON.stringify(configData));
      }

      // 3. Update master Event identity fields if modified in details
      const updatedEvent: EventData = { ...event };
      if (event.type === 'Wedding') {
        updatedEvent.groom = details.partner1Name || event.groom || '';
        updatedEvent.bride = details.partner2Name || event.bride || '';
        updatedEvent.familyName = details.familyName || event.familyName || '';
      } else if (event.type === 'Birthday') {
        updatedEvent.clientName = details.hostedBy || event.clientName || '';
      } else if (event.type === 'Corporate') {
        updatedEvent.clientName = details.companyName || event.clientName || '';
      }

      await onUpdateEvent(updatedEvent);

      if (!quiet) {
        showToast('success', 'Event Experience Setup saved successfully.');
      }
    } catch (err: any) {
      console.error('Failed to save config:', err);
      showToast('error', `Failed to save setup: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = async () => {
    await handleSaveProgress(true);
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const insertPlaceholder = (fieldName: string, placeholder: string) => {
    setInvitation(prev => {
      const currentText = (prev as any)[fieldName] || '';
      return {
        ...prev,
        [fieldName]: currentText + ' ' + placeholder
      };
    });
  };

  // Preset Programme Applicator
  const applyProgrammePreset = (presetName: string) => {
    let items: Omit<ProgrammeItem, 'id' | 'order'>[] = [];
    const date = event.date || new Date().toISOString().substring(0, 10);

    if (presetName === 'Sikh Wedding') {
      items = [
        { name: 'Jaggo Night', date, startTime: '18:00', endTime: '22:00', venueName: 'Golden Terraces', description: 'Traditional singing, dance and lights celebrating the family dynamic.', dressCode: 'Traditional Colorful Punjabi', visible: true, askRsvp: true },
        { name: 'Anand Karaj (Sikh Wedding)', date, startTime: '09:00', endTime: '13:00', venueName: 'Gurudwara Sahib', description: 'Blissful union and sacred wedding vows.', dressCode: 'Modest Formals (Head Cover Required)', visible: true, askRsvp: true },
        { name: 'Reception Banquet', date, startTime: '19:00', endTime: '23:59', venueName: 'Royal Ballroom', description: 'Grand feast, toasts, cake cutting and celebration party.', dressCode: 'Tuxedos and Evening Gowns', visible: true, askRsvp: true }
      ];
    } else if (presetName === 'Hindu Wedding') {
      items = [
        { name: 'Haldi Ceremony', date, startTime: '10:00', endTime: '13:00', venueName: 'Palace Courtyard', description: 'Turmeric paste splash, auspicious songs and auspicious starting.', dressCode: 'Yellow Festive Attire', visible: true, askRsvp: true },
        { name: 'Mehndi & Sangeet', date, startTime: '17:00', endTime: '22:30', venueName: 'Poolside Lawn', description: 'Intricate henna art, live music and synchronized group dances.', dressCode: 'Ethnic Festive / Indowestern', visible: true, askRsvp: true },
        { name: 'Baraat & Varmala', date, startTime: '15:30', endTime: '17:00', venueName: 'Grand Gates', description: 'Grooms grand arrival parade leading to exchange of garland vows.', dressCode: 'Traditional Royal Attire', visible: true, askRsvp: true },
        { name: 'Saat Phere Mandap', date, startTime: '17:30', endTime: '20:00', venueName: 'Central Mandap', description: 'Seven sacred steps around fire sealing the lifelong bond.', dressCode: 'Traditional Royal Attire', visible: true, askRsvp: true },
        { name: 'Reception Gala', date, startTime: '20:30', endTime: '23:30', venueName: 'Grand Lawn', description: 'An elegant reception banquet to greet guests and share blessings.', dressCode: 'Formals / Tuxedo / Saree', visible: true, askRsvp: true }
      ];
    } else if (presetName === 'Christian Wedding') {
      items = [
        { name: 'Rehearsal Dinner', date, startTime: '18:30', endTime: '21:30', venueName: 'Terrace Bistro', description: 'Warm family speeches and dinner preparation.', dressCode: 'Smart Casuals', visible: true, askRsvp: true },
        { name: 'Wedding Ceremony', date, startTime: '15:00', endTime: '16:30', venueName: 'St. Peter\'s Cathedral', description: 'A holy covenant and exchanging of rings.', dressCode: 'Formal Suite / Gowns', visible: true, askRsvp: true },
        { name: 'Reception Reception', date, startTime: '18:00', endTime: '23:00', venueName: 'Grand Garden', description: 'Grand entrance, couple first dance, champagne toast and dinner.', dressCode: 'Formal Dress', visible: true, askRsvp: true }
      ];
    } else if (presetName === 'Birthday') {
      items = [
        { name: 'Guest Arrival & Welcome', date, startTime: '17:30', endTime: '18:30', venueName: 'The Sky Lounge', description: 'Gathering, cocktails and appetizer round.', dressCode: 'Casual Chic', visible: true, askRsvp: true },
        { name: 'Cake Cutting & Toast', date, startTime: '19:00', endTime: '19:30', venueName: 'Central Stage', description: 'Candle blowing, celebration toast, and cake slicing.', dressCode: 'Casual Chic', visible: true, askRsvp: true },
        { name: 'Dinner & Dancefloor', date, startTime: '20:00', endTime: '23:00', venueName: 'The Ballroom', description: 'Buffet dining and high energy DJ beats.', dressCode: 'Casual Chic', visible: true, askRsvp: true }
      ];
    } else if (presetName === 'Corporate') {
      items = [
        { name: 'Welcome & Morning Registration', date, startTime: '09:00', endTime: '10:00', venueName: 'Main Lobby', description: 'Badge handovers, welcoming coffee and networking.', dressCode: 'Business Formal', visible: true, askRsvp: true },
        { name: 'Keynote & Executive Panels', date, startTime: '10:00', endTime: '12:30', venueName: 'Auditorium A', description: 'Annual summary, company goals, and futuristic panel discussion.', dressCode: 'Business Formal', visible: true, askRsvp: true },
        { name: 'Networking Luncheon', date, startTime: '12:30', endTime: '14:00', venueName: 'Panoramic Restaurant', description: 'Exquisite hot buffet lunch with cross team mingling.', dressCode: 'Business Formal', visible: true, askRsvp: true },
        { name: 'Recognition & Awards Gala', date, startTime: '14:30', endTime: '17:00', venueName: 'Auditorium A', description: 'Honoring star achievers and distributing milestones.', dressCode: 'Business Formal', visible: true, askRsvp: true }
      ];
    } else if (presetName === 'Anniversary') {
      items = [
        { name: 'Arrival & Welcome Drinks', date, startTime: '18:30', endTime: '19:30', venueName: 'Rooftop Gazebo', description: 'A warm welcome to start the golden journey celebration.', dressCode: 'Elegant Evening Wear', visible: true, askRsvp: true },
        { name: 'Couple Slide & Toasts', date, startTime: '19:45', endTime: '20:30', venueName: 'Main Lounge', description: 'Journey review video, friendly toasts, and family photos.', dressCode: 'Elegant Evening Wear', visible: true, askRsvp: true },
        { name: 'Dinner & Live Jazz', date, startTime: '20:30', endTime: '23:30', venueName: 'Garden Lawn', description: 'Classic candlelit buffet dinner under gentle melodies.', dressCode: 'Elegant Evening Wear', visible: true, askRsvp: true }
      ];
    } else if (presetName === 'Baby Shower') {
      items = [
        { name: 'Welcoming Guests & Social', date, startTime: '14:00', endTime: '15:00', venueName: 'Cozy Solarium', description: 'Greeting family, writing cute message cards for newborn.', dressCode: 'Pastel / Floral Theme', visible: true, askRsvp: true },
        { name: 'Baby Games & Activities', date, startTime: '15:00', endTime: '16:00', venueName: 'Cozy Solarium', description: 'Interactive guess the baby food, name suggestions and puzzles.', dressCode: 'Pastel / Floral Theme', visible: true, askRsvp: true },
        { name: 'High Tea & Gift Slices', date, startTime: '16:00', endTime: '18:00', venueName: 'Sun Deck', description: 'Opening cute presents, delicious tea, and treats.', dressCode: 'Pastel / Floral Theme', visible: true, askRsvp: true }
      ];
    }

    const compiled: ProgrammeItem[] = items.map((it, idx) => ({
      ...it,
      id: 'prog_' + Math.random().toString(36).substring(2, 9),
      order: idx
    }));

    setProgramme(compiled);
    showToast('success', `Applied ${presetName} suggested template with ${compiled.length} items.`);
  };

  // Programme Items Handlers
  const handleSaveProgramItem = () => {
    if (!editingProgramItem || !editingProgramItem.name) {
      showToast('error', 'Item name is required.');
      return;
    }

    if (editingProgramItem.id) {
      // Editing existing
      setProgramme(prev => prev.map(item => item.id === editingProgramItem.id ? (editingProgramItem as ProgrammeItem) : item));
      showToast('success', 'Timeline item updated.');
    } else {
      // Adding new
      const newItem: ProgrammeItem = {
        id: 'prog_' + Math.random().toString(36).substring(2, 9),
        name: editingProgramItem.name,
        date: editingProgramItem.date || event.date || new Date().toISOString().substring(0, 10),
        startTime: editingProgramItem.startTime || '12:00',
        endTime: editingProgramItem.endTime || '',
        venueName: editingProgramItem.venueName || event.venue || '',
        address: editingProgramItem.address || '',
        mapsLink: editingProgramItem.mapsLink || '',
        description: editingProgramItem.description || '',
        dressCode: editingProgramItem.dressCode || '',
        thumbnail: editingProgramItem.thumbnail || '',
        visible: editingProgramItem.visible !== false,
        askRsvp: editingProgramItem.askRsvp !== false,
        order: programme.length
      };
      setProgramme(prev => [...prev, newItem]);
      showToast('success', 'Timeline item added.');
    }
    setEditingProgramItem(null);
  };

  const handleToggleItemVisibility = (id: string) => {
    setProgramme(prev => prev.map(it => it.id === id ? { ...it, visible: !it.visible } : it));
  };

  const handleToggleItemRsvp = (id: string) => {
    setProgramme(prev => prev.map(it => it.id === id ? { ...it, askRsvp: !it.askRsvp } : it));
  };

  const handleDeleteItem = (id: string) => {
    setProgramme(prev => prev.filter(it => it.id !== id).map((it, idx) => ({ ...it, order: idx })));
    showToast('info', 'Item removed from timeline.');
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === programme.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const items = [...programme];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    // Recalculate order
    const updated = items.map((it, idx) => ({ ...it, order: idx }));
    setProgramme(updated);
  };

  // Custom RSVP Questions Handlers
  const handleSaveQuestion = () => {
    if (!editingQuestion || !editingQuestion.questionText) {
      showToast('error', 'Question wording is required.');
      return;
    }

    if (editingQuestion.id) {
      setRsvpConfig(prev => ({
        ...prev,
        customQuestions: prev.customQuestions.map(q => q.id === editingQuestion.id ? (editingQuestion as CustomQuestion) : q)
      }));
      showToast('success', 'Custom RSVP Question updated.');
    } else {
      const newQ: CustomQuestion = {
        id: 'q_' + Math.random().toString(36).substring(2, 9),
        type: editingQuestion.type || 'text',
        questionText: editingQuestion.questionText,
        required: editingQuestion.required || false,
        enabled: editingQuestion.enabled !== false,
        options: editingQuestion.options || [],
        order: rsvpConfig.customQuestions.length
      };
      setRsvpConfig(prev => ({
        ...prev,
        customQuestions: [...prev.customQuestions, newQ]
      }));
      showToast('success', 'Custom RSVP Question added.');
    }
    setEditingQuestion(null);
    setNewOptionText('');
  };

  const handleAddQuestionOption = () => {
    if (!newOptionText.trim()) return;
    setEditingQuestion(prev => {
      const options = prev?.options || [];
      if (options.includes(newOptionText.trim())) return prev;
      return {
        ...prev,
        options: [...options, newOptionText.trim()]
      };
    });
    setNewOptionText('');
  };

  const handleRemoveQuestionOption = (opt: string) => {
    setEditingQuestion(prev => ({
      ...prev,
      options: (prev?.options || []).filter(o => o !== opt)
    }));
  };

  const handleDeleteQuestion = (id: string) => {
    setRsvpConfig(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== id).map((q, idx) => ({ ...q, order: idx }))
    }));
    showToast('info', 'Question removed.');
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rsvpConfig.customQuestions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const questions = [...rsvpConfig.customQuestions];
    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    const updated = questions.map((q, idx) => ({ ...q, order: idx }));
    setRsvpConfig(prev => ({ ...prev, customQuestions: updated }));
  };

  const handleGenerateTestAndPreview = async () => {
    setSaving(true);
    try {
      // Guarantee the config is saved first
      await handleSaveProgress(true);

      // Create a test family record if it doesn't already exist
      const testSlug = 'test-simulation-guest';
      const testFamId = 'test_simulation_family';
      const testFamData = {
        id: testFamId,
        event_id: event.id,
        name: 'Simulation Test Guest',
        access_code: 'TEST-RSVP',
        slug: testSlug,
        max_guests: 5,
        created_at: new Date().toISOString(),
        custom_greeting: 'Welcome to our Live Event Simulation. This sandbox allows you to test the personalized guest RSVP flow, countdown timers, and digital itinerary.',
        custom_title: 'Distinguished Sandbox Tester'
      };

      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'families', testFamId), testFamData, { merge: true });
      } else {
        const cachedFamilies = JSON.parse(localStorage.getItem('local_families') || '[]');
        const filtered = cachedFamilies.filter((f: any) => f.id !== testFamId);
        filtered.push(testFamData);
        localStorage.setItem('local_families', JSON.stringify(filtered));
      }

      showToast('success', 'Simulation guest initialized. Opening invitation preview...');
      
      // Open the preview in a new browser tab
      setTimeout(() => {
        window.open(`#/invite/${testSlug}`, '_blank');
      }, 500);

    } catch (e: any) {
      console.error(e);
      showToast('error', `Failed to boot simulation: ${e?.message || 'Firestore connection issue.'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-cream/60">
        <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest">Loading Event Workspace Setup...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Upper Title Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold block mb-1">
            Category: {event.type || 'Standard Event'}
          </span>
          <h1 className="font-serif text-2xl text-cream tracking-wide">
            Event Setup Workspace & Experience
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Selected Event: <span className="text-gold/80 font-semibold">{event.name}</span> (ID: {event.id})
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => handleSaveProgress(false)}
            disabled={saving}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gold/10 border border-gold/30 hover:bg-gold/20 text-gold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Config'}
          </button>
          
          <button
            onClick={handleGenerateTestAndPreview}
            disabled={saving}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gold text-black hover:bg-gold/95 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shadow-md"
          >
            <Eye size={14} />
            Launch Simulation
          </button>
        </div>
      </div>

      {/* Steps Indicator Tracker */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-black/40 p-2 rounded-2xl border border-white/5">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isCompleted = idx < activeStep;
          return (
            <button
              key={idx}
              onClick={async () => {
                await handleSaveProgress(true);
                setActiveStep(idx);
              }}
              className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-gold/10 border border-gold/30 text-gold shadow-sm' 
                  : isCompleted 
                    ? 'text-green-400 hover:bg-white/5' 
                    : 'text-white/40 hover:bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 border ${
                isActive 
                  ? 'bg-gold text-black border-gold' 
                  : isCompleted 
                    ? 'bg-green-400/10 border-green-400/30' 
                    : 'bg-white/5 border-white/10'
              }`}>
                {isCompleted ? <Check size={14} /> : step.icon}
              </div>
              <span className="text-[10px] font-bold tracking-wider line-clamp-1">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Step Panel Container */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Step 1: Event Details */}
            {activeStep === 0 && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4 mb-4">
                  <h2 className="text-base font-serif text-gold flex items-center gap-2">
                    <Info size={18} /> Step 1: Category Identity Details
                  </h2>
                  <p className="text-xs text-white/40 mt-1">
                    Configure the major identity fields matching this {event.type} type.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.type === 'Wedding' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Bride / Partner 1 Name</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="Enter Bride / Partner 1 name"
                          value={details.partner1Name || ''}
                          onChange={e => setDetails({ ...details, partner1Name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Groom / Partner 2 Name</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="Enter Groom / Partner 2 name"
                          value={details.partner2Name || ''}
                          onChange={e => setDetails({ ...details, partner2Name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono font-bold">Family / Host Surname (Optional)</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Sharma Family / Host Names"
                          value={details.familyName || ''}
                          onChange={e => setDetails({ ...details, familyName: e.target.value })}
                        />
                        <span className="text-[9px] text-white/30 block mt-1">
                          This name is printed automatically at the invitation closing line footer.
                        </span>
                      </div>
                    </>
                  )}

                  {event.type === 'Birthday' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Birthday Person Name</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Aria Sharma"
                          value={details.birthdayPerson || ''}
                          onChange={e => setDetails({ ...details, birthdayPerson: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Age / Milestone (Optional)</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-mono"
                          placeholder="e.g. 1st, 18th, 30th, 50th"
                          value={details.age || ''}
                          onChange={e => setDetails({ ...details, age: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Hosted By / Sponsoring Hosts</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Her Loving Parents Mr. & Mrs. Sharma"
                          value={details.hostedBy || ''}
                          onChange={e => setDetails({ ...details, hostedBy: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {event.type === 'Corporate' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Company / Organization Name</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Apex Global Corp"
                          value={details.companyName || ''}
                          onChange={e => setDetails({ ...details, companyName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Event Theme / Main Focus</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Excellence Gala & Annual Awards"
                          value={details.eventPurpose || ''}
                          onChange={e => setDetails({ ...details, eventPurpose: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Organizer Office / Contact Person</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-mono"
                          placeholder="e.g. HR Engagement Department"
                          value={details.organizerContact || ''}
                          onChange={e => setDetails({ ...details, organizerContact: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {event.type === 'Anniversary' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Couple / Partner Names</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Priya & Rahul"
                          value={details.coupleNames || ''}
                          onChange={e => setDetails({ ...details, coupleNames: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Anniversary Milestone (Optional)</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-mono"
                          placeholder="e.g. 25th Silver, 50th Golden"
                          value={details.anniversaryMilestone || ''}
                          onChange={e => setDetails({ ...details, anniversaryMilestone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Hosted By / Children (Optional)</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Hosted with Love by their Children Aria & Arman"
                          value={details.hostedBy || ''}
                          onChange={e => setDetails({ ...details, hostedBy: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {event.type === 'Baby Shower' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Parents Name</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Mira & Sean"
                          value={details.parentNames || ''}
                          onChange={e => setDetails({ ...details, parentNames: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Celebration Title</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Showering Baby Sharma"
                          value={details.celebrationTitle || ''}
                          onChange={e => setDetails({ ...details, celebrationTitle: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {event.type === 'Engagement' && (
                    <>
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Partner Names</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Priya & Rahul"
                          value={details.coupleNames || ''}
                          onChange={e => setDetails({ ...details, coupleNames: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Family Host Details</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. The Sharma Family"
                          value={details.familyName || ''}
                          onChange={e => setDetails({ ...details, familyName: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {event.type !== 'Wedding' && event.type !== 'Birthday' && event.type !== 'Corporate' && event.type !== 'Anniversary' && event.type !== 'Baby Shower' && event.type !== 'Engagement' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Custom Event Wording Title</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Graduation Gala"
                          value={details.customTitle || ''}
                          onChange={e => setDetails({ ...details, customTitle: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Host / Sponsoring Organizers</label>
                        <input
                          type="text"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                          placeholder="e.g. Mr. Arman Sharma"
                          value={details.hostOrganizer || ''}
                          onChange={e => setDetails({ ...details, hostOrganizer: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Invitation Setup */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-serif text-gold flex items-center gap-2">
                      <BookOpen size={18} /> Step 2: Digital Invitation Wording
                    </h2>
                    <p className="text-xs text-white/40 mt-1">
                      Customize how greeting card components will present to your guests.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const defaultWordings = getWordingTemplates(event.type || 'Other', details);
                        setInvitation(prev => ({
                          ...prev,
                          welcomeHeading: defaultWordings.heading,
                          welcomeMessage: defaultWordings.welcome,
                          invitationMessage: defaultWordings.main,
                          closingMessage: defaultWordings.closing
                        }));
                        showToast('info', 'Loaded default wording template.');
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-mono text-gold"
                    >
                      Load Category Defaults
                    </button>
                  </div>
                </div>

                {/* Personalization Insertion Guide */}
                <div className="bg-gold/5 border border-gold/15 rounded-2xl p-4 text-xs space-y-3">
                  <span className="font-semibold text-gold flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                    <Sparkles size={12} /> Pro-Tip: Active Personalization Tags
                  </span>
                  <p className="text-[11px] text-cream/80">
                    Use these smart tags inside welcome or body notes. The system replaces them dynamically with the guest's personalized details on load!
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { tag: '{{guest_name}}', label: 'Guest Family Name' },
                      { tag: '{{event_name}}', label: 'Event Wording' },
                      { tag: '{{venue}}', label: 'Venue Location' },
                      { tag: '{{event_date}}', label: 'Date' }
                    ].map(btn => (
                      <button
                        key={btn.tag}
                        type="button"
                        onClick={() => {
                          showToast('info', `Copied tag: ${btn.tag}. Double-click or paste inside any box.`);
                          navigator.clipboard.writeText(btn.tag);
                        }}
                        className="bg-black/40 hover:bg-black/60 border border-white/5 hover:border-gold/30 text-cream px-2.5 py-1 rounded-md text-[10px] font-mono transition-all flex items-center gap-1"
                      >
                        <code className="text-gold font-bold">{btn.tag}</code>
                        <span className="text-white/40">({btn.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Welcome Header / Banner title</label>
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                      placeholder="e.g. Royal Invitation / Welcome Gala"
                      value={invitation.welcomeHeading}
                      onChange={e => setInvitation({ ...invitation, welcomeHeading: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Welcome Narrative / Intro text</label>
                    <textarea
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all min-h-[80px] font-serif"
                      placeholder="e.g. With the blessings of our elders, we are pleased to welcome you..."
                      value={invitation.welcomeMessage}
                      onChange={e => setInvitation({ ...invitation, welcomeMessage: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Main Invitation Message / Core Call</label>
                    <textarea
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all min-h-[80px] font-serif"
                      placeholder="e.g. We request the pleasure of your esteemed presence as we..."
                      value={invitation.invitationMessage}
                      onChange={e => setInvitation({ ...invitation, invitationMessage: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Closing / Family Footer Signature</label>
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-white/20 outline-none focus:border-gold/50 transition-all font-serif"
                      placeholder="e.g. Cordially Invited by The Sharma Family"
                      value={invitation.closingMessage}
                      onChange={e => setInvitation({ ...invitation, closingMessage: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Music size={14} className="text-gold" />
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Background Music (MP3 Link)</label>
                      </div>
                      <input
                        type="text"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-cream outline-none focus:border-gold/50 transition-all font-mono"
                        placeholder="Paste MP3 Audio link"
                        value={invitation.backgroundMusic}
                        onChange={e => setInvitation({ ...invitation, backgroundMusic: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-gold" />
                        <label className="text-[10px] uppercase tracking-wider text-gold/80 font-semibold font-mono">Cover Splash Photo URL</label>
                      </div>
                      <input
                        type="text"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-cream outline-none focus:border-gold/50 transition-all font-mono"
                        placeholder="Paste landscape image URL"
                        value={invitation.mainPhoto}
                        onChange={e => setInvitation({ ...invitation, mainPhoto: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Programme */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-base font-serif text-gold flex items-center gap-2">
                      <Calendar size={18} /> Step 3: Programme Timeline
                    </h2>
                    <p className="text-xs text-white/40 mt-1">
                      Construct individual ceremonies, functions, or sessions. This array drives both the Timeline and RSVP checkers!
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Suggested Preset Trigger Buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-white/30 hidden lg:inline">Presets:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            applyProgrammePreset(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase tracking-widest font-mono text-gold px-3 py-1.5 outline-none cursor-pointer"
                      >
                        <option value="" className="bg-black text-cream">Suggested Preset</option>
                        {event.type === 'Wedding' && (
                          <>
                            <option value="Sikh Wedding" className="bg-black text-cream">Sikh Wedding</option>
                            <option value="Hindu Wedding" className="bg-black text-cream">Hindu Wedding</option>
                            <option value="Christian Wedding" className="bg-black text-cream">Christian Wedding</option>
                          </>
                        )}
                        {event.type === 'Birthday' && <option value="Birthday" className="bg-black text-cream">Birthday Party</option>}
                        {event.type === 'Corporate' && <option value="Corporate" className="bg-black text-cream">Corporate Gala</option>}
                        {event.type === 'Anniversary' && <option value="Anniversary" className="bg-black text-cream">Anniversary Banquet</option>}
                        {event.type === 'Baby Shower' && <option value="Baby Shower" className="bg-black text-cream">Baby Shower High Tea</option>}
                      </select>
                    </div>

                    <button
                      onClick={() => setEditingProgramItem({})}
                      className="bg-gold text-black hover:bg-gold/90 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Item
                    </button>
                  </div>
                </div>

                {/* Timeline Items Listing */}
                {programme.length === 0 ? (
                  <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl py-12 text-cream/40">
                    <Calendar size={32} className="text-gold/40 mb-3" />
                    <p className="font-serif text-sm">No Programme functions created yet</p>
                    <p className="text-[11px] mt-1 text-center max-w-sm px-4">
                      Create items individually or click "Suggested Preset" above to load starting category benchmarks.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {programme
                      .sort((a, b) => a.order - b.order)
                      .map((item, index) => (
                        <div 
                          key={item.id}
                          className="bg-black/30 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col gap-1 items-center justify-center pt-1">
                              <button
                                disabled={index === 0}
                                onClick={() => handleMoveItem(index, 'up')}
                                className="p-0.5 hover:text-gold disabled:opacity-20 text-white/40"
                              >
                                ▲
                              </button>
                              <button
                                disabled={index === programme.length - 1}
                                onClick={() => handleMoveItem(index, 'down')}
                                className="p-0.5 hover:text-gold disabled:opacity-20 text-white/40"
                              >
                                ▼
                              </button>
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-serif text-sm font-bold text-cream">{item.name}</h3>
                                {!item.visible && (
                                  <span className="px-1.5 py-0.5 bg-red-400/10 text-red-400 border border-red-400/20 rounded text-[9px] font-mono tracking-widest uppercase">
                                    HIDDEN ON TIMELINE
                                  </span>
                                )}
                                {!item.askRsvp && (
                                  <span className="px-1.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded text-[9px] font-mono tracking-widest uppercase">
                                    RSVP REGISTER OFF
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-white/40">
                                <span className="flex items-center gap-1"><Clock size={12} className="text-gold/70" /> {item.date} • {item.startTime}</span>
                                <span className="flex items-center gap-1"><MapPin size={12} className="text-gold/70" /> {item.venueName}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto md:self-center">
                            {/* Fast Action Toggles */}
                            <button
                              onClick={() => handleToggleItemVisibility(item.id)}
                              className={`px-2 py-1.5 border rounded-lg text-[9px] font-mono tracking-wider font-bold transition-all flex-1 md:flex-initial text-center ${
                                item.visible 
                                  ? 'bg-green-400/10 border-green-400/20 text-green-400' 
                                  : 'bg-white/5 border-white/10 text-white/30'
                              }`}
                              title="Toggle Visibility on Guest Invitation card"
                            >
                              TIMELINE: {item.visible ? 'SHOW' : 'HIDE'}
                            </button>

                            <button
                              onClick={() => handleToggleItemRsvp(item.id)}
                              className={`px-2 py-1.5 border rounded-lg text-[9px] font-mono tracking-wider font-bold transition-all flex-1 md:flex-initial text-center ${
                                item.askRsvp 
                                  ? 'bg-green-400/10 border-green-400/20 text-green-400' 
                                  : 'bg-white/5 border-white/10 text-white/30'
                              }`}
                              title="Ask attendance registration in RSVP"
                            >
                              RSVP QUESTION: {item.askRsvp ? 'ASK' : 'SKIP'}
                            </button>

                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => setEditingProgramItem(item)}
                                className="p-2 hover:bg-white/5 border border-white/5 rounded-xl text-gold/80 hover:text-gold"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 hover:bg-white/5 border border-white/5 rounded-xl text-red-400 hover:text-red-300"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Sub-Modal Overlay to Add/Edit Timeline Program Item */}
                <AnimatePresence>
                  {editingProgramItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-black border border-white/15 rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
                      >
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h3 className="font-serif text-base text-gold font-bold">
                            {editingProgramItem.id ? 'Edit Function Item' : 'Add Programme Function'}
                          </h3>
                          <button onClick={() => setEditingProgramItem(null)} className="text-white/40 hover:text-white">
                            <X size={18} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Function / Ceremony Name</label>
                            <input
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none font-serif"
                              placeholder="e.g. Anand Karaj Vows"
                              value={editingProgramItem.name || ''}
                              onChange={e => setEditingProgramItem({ ...editingProgramItem, name: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Date</label>
                              <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none"
                                value={editingProgramItem.date || ''}
                                onChange={e => setEditingProgramItem({ ...editingProgramItem, date: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Start Time</label>
                              <input
                                type="time"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none"
                                value={editingProgramItem.startTime || ''}
                                onChange={e => setEditingProgramItem({ ...editingProgramItem, startTime: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Venue Name</label>
                            <input
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none"
                              placeholder="e.g. Royal Banquet Courtyard"
                              value={editingProgramItem.venueName || ''}
                              onChange={e => setEditingProgramItem({ ...editingProgramItem, venueName: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Venue Street Address (Optional)</label>
                            <input
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none"
                              placeholder="e.g. Lane 4, Grand Ridge Boulevard"
                              value={editingProgramItem.address || ''}
                              onChange={e => setEditingProgramItem({ ...editingProgramItem, address: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Google Maps / Navigation URL (Optional)</label>
                            <input
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none font-mono"
                              placeholder="Paste share link"
                              value={editingProgramItem.mapsLink || ''}
                              onChange={e => setEditingProgramItem({ ...editingProgramItem, mapsLink: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Dress Code Instruction</label>
                            <input
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none"
                              placeholder="e.g. Pastel Traditional Indian Formals"
                              value={editingProgramItem.dressCode || ''}
                              onChange={e => setEditingProgramItem({ ...editingProgramItem, dressCode: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Function Short Description</label>
                            <textarea
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-cream focus:border-gold/50 outline-none min-h-[60px]"
                              placeholder="Brief instructions or summary about the ceremony..."
                              value={editingProgramItem.description || ''}
                              onChange={e => setEditingProgramItem({ ...editingProgramItem, description: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Visual Header Image Link (Optional)</label>
                            <input
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none font-mono"
                              placeholder="Paste landscape image URL"
                              value={editingProgramItem.thumbnail || ''}
                              onChange={e => setEditingProgramItem({ ...editingProgramItem, thumbnail: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProgramItem(null)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-mono text-cream"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveProgramItem}
                            className="bg-gold hover:bg-gold/90 text-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold"
                          >
                            Confirm Item
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Step 4: RSVP Setup */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4 mb-4">
                  <h2 className="text-base font-serif text-gold flex items-center gap-2">
                    <CheckSquare size={18} /> Step 4: RSVP Questionnaire Config
                  </h2>
                  <p className="text-xs text-white/40 mt-1">
                    Control standard RSVP queries and attach custom questions specific to your guest checklist.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: General Settings & Deadlines */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-4">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold block pb-2 border-b border-white/5">
                      Registration Settings
                    </span>

                    <div className="flex justify-between items-center py-2">
                      <div>
                        <span className="text-xs text-cream font-bold block">Enable RSVP Gate</span>
                        <span className="text-[10px] text-white/40">Disable to stop all guest submissions</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={rsvpConfig.enabled}
                        onChange={e => setRsvpConfig({ ...rsvpConfig, enabled: e.target.checked })}
                        className="w-4 h-4 accent-gold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80 block">RSVP Deadline Date</label>
                      <input
                        type="date"
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-cream outline-none focus:border-gold/50"
                        value={rsvpConfig.deadline}
                        onChange={e => setRsvpConfig({ ...rsvpConfig, deadline: e.target.value })}
                      />
                    </div>

                    <span className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold block pt-4 pb-2 border-b border-white/5">
                      Include Standard Form Modules
                    </span>

                    {[
                      { key: 'attendance', label: 'Primary Attendance (Yes/No)' },
                      { key: 'guests', label: 'Total Family Guests Count selector' },
                      { key: 'food', label: 'Dietary Protocol / Requirements selection' },
                      { key: 'travel', label: 'Cab Pickup / Travel Arrival query' },
                      { key: 'notes', label: 'Personalized Message / Notes for host' }
                    ].map(q => (
                      <div key={q.key} className="flex justify-between items-center py-1.5">
                        <span className="text-xs text-cream">{q.label}</span>
                        <input
                          type="checkbox"
                          checked={(rsvpConfig.questions as any)[q.key]}
                          onChange={e => setRsvpConfig({
                            ...rsvpConfig,
                            questions: {
                              ...rsvpConfig.questions,
                              [q.key]: e.target.checked
                            }
                          })}
                          className="w-4 h-4 accent-gold"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Right: Custom Questions Panel */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold">
                        Custom Survey Questions
                      </span>
                      <button
                        onClick={() => setEditingQuestion({ type: 'text', options: [], required: false, enabled: true })}
                        className="bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider font-mono font-bold flex items-center gap-1"
                      >
                        <Plus size={10} /> Add Custom Query
                      </button>
                    </div>

                    {rsvpConfig.customQuestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl py-12 text-cream/30">
                        <ListPlus size={24} className="text-gold/30 mb-2" />
                        <span className="text-xs font-serif">No custom questions created</span>
                        <span className="text-[9px] mt-1 text-center max-w-xs">
                          Need custom questions like "Favorite Song?" or "Shuttle Needed on Sunday?" Add them above.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rsvpConfig.customQuestions
                          .sort((a, b) => a.order - b.order)
                          .map((q, idx) => (
                            <div 
                              key={q.id}
                              className="bg-black/20 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col text-[10px]">
                                  <button disabled={idx === 0} onClick={() => handleMoveQuestion(idx, 'up')} className="text-white/20 hover:text-gold disabled:opacity-20">▲</button>
                                  <button disabled={idx === rsvpConfig.customQuestions.length - 1} onClick={() => handleMoveQuestion(idx, 'down')} className="text-white/20 hover:text-gold disabled:opacity-20">▼</button>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-cream">{q.questionText}</span>
                                    {q.required && <span className="text-red-400 text-[9px] font-bold">REQUIRED</span>}
                                    {!q.enabled && <span className="text-white/30 text-[9px]">DISABLED</span>}
                                  </div>
                                  <span className="text-[10px] text-gold/70 uppercase font-mono">Type: {q.type}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingQuestion(q)}
                                  className="p-1.5 hover:bg-white/5 text-gold/80 hover:text-gold"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1.5 hover:bg-white/5 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Modal Overlay to Edit/Add Custom Question */}
                <AnimatePresence>
                  {editingQuestion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-black border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl"
                      >
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h3 className="font-serif text-base text-gold font-bold">
                            {editingQuestion.id ? 'Edit Custom Question' : 'Add Custom Question'}
                          </h3>
                          <button onClick={() => setEditingQuestion(null)} className="text-white/40 hover:text-white">
                            <X size={18} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Question Text / Label</label>
                            <input
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none"
                              placeholder="e.g. Do you require vegetarian catering?"
                              value={editingQuestion.questionText || ''}
                              onChange={e => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80">Response Input Type</label>
                            <select
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold/50 outline-none cursor-pointer"
                              value={editingQuestion.type || 'text'}
                              onChange={e => setEditingQuestion({ ...editingQuestion, type: e.target.value as any, options: [] })}
                            >
                              <option value="text">Short Text Response</option>
                              <option value="longtext">Long Text/Wishes Box</option>
                              <option value="yesno">Yes / No Switch</option>
                              <option value="single">Single Choice selector</option>
                              <option value="multiple">Multiple Choice selector</option>
                            </select>
                          </div>

                          {(editingQuestion.type === 'single' || editingQuestion.type === 'multiple') && (
                            <div className="space-y-2 border border-white/5 p-3 rounded-xl bg-white/5">
                              <label className="text-[10px] uppercase font-mono tracking-wider text-gold/80 block">Configure Choice Options</label>
                              
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  className="flex-grow bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-cream outline-none"
                                  placeholder="e.g. Vegan"
                                  value={newOptionText}
                                  onChange={e => setNewOptionText(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuestionOption(); } }}
                                />
                                <button
                                  type="button"
                                  onClick={handleAddQuestionOption}
                                  className="bg-gold text-black px-3 py-1.5 rounded-lg text-xs font-bold"
                                >
                                  Add
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(editingQuestion.options || []).map(opt => (
                                  <span key={opt} className="bg-black text-cream border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1.5">
                                    {opt}
                                    <button onClick={() => handleRemoveQuestionOption(opt)} className="text-red-400 hover:text-red-300">×</button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 py-2 border-t border-white/5">
                            <label className="flex items-center gap-2 text-xs text-cream cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingQuestion.required || false}
                                onChange={e => setEditingQuestion({ ...editingQuestion, required: e.target.checked })}
                                className="w-4 h-4 accent-gold"
                              />
                              Required Field
                            </label>

                            <label className="flex items-center gap-2 text-xs text-cream cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingQuestion.enabled !== false}
                                onChange={e => setEditingQuestion({ ...editingQuestion, enabled: e.target.checked })}
                                className="w-4 h-4 accent-gold"
                              />
                              Active / Enabled
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingQuestion(null)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-mono text-cream"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveQuestion}
                            className="bg-gold hover:bg-gold/90 text-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold"
                          >
                            Confirm Question
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Step 5: Guest Services */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4 mb-4">
                  <h2 className="text-base font-serif text-gold flex items-center gap-2">
                    <Hotel size={18} /> Step 5: Accommodation & Travel Services
                  </h2>
                  <p className="text-xs text-white/40 mt-1">
                    Control which services are active for this event workspace. Skip unwanted hotel/car coordination clutter.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Accommodation Toggle */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Hotel size={18} className="text-gold" />
                            <h3 className="text-sm font-bold text-cream">Accommodation / Hotel Rooms</h3>
                          </div>
                          <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                            Enables matching guests to allotted rooms and printing hotel desk details on their personal digital passes.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={guestServices.accommodationEnabled}
                          onChange={e => setDetailsAndSaveService('accommodationEnabled', e.target.checked)}
                          className="w-5 h-5 accent-gold cursor-pointer"
                        />
                      </div>

                      {guestServices.accommodationEnabled ? (
                        <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-4 text-[11px] text-green-300 mt-4 flex items-start gap-2">
                          <Check size={16} className="mt-0.5" />
                          <span>
                            <strong>Active:</strong> Guests allotted rooms will automatically see hotel room maps, checkout timers and address directions printed on their digital invitation passes! You can coordinate rooms inside the <strong>Hotel</strong> tab.
                          </span>
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-[11px] text-white/40 mt-4 flex items-start gap-2">
                          <Info size={16} className="mt-0.5 text-gold/50" />
                          <span>
                            <strong>De-activated:</strong> Clutter-free. Guests will not see or query hotel arrangements on their cards.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transport Toggle */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Car size={18} className="text-gold" />
                            <h3 className="text-sm font-bold text-cream">Cab Scheduling & Pickups</h3>
                          </div>
                          <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                            Allows guests to request airport/station pickups, and lets organizers assign vehicles and drivers.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={guestServices.transportEnabled}
                          onChange={e => setDetailsAndSaveService('transportEnabled', e.target.checked)}
                          className="w-5 h-5 accent-gold cursor-pointer"
                        />
                      </div>

                      {guestServices.transportEnabled ? (
                        <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-4 text-[11px] text-green-300 mt-4 flex items-start gap-2">
                          <Check size={16} className="mt-0.5" />
                          <span>
                            <strong>Active:</strong> Guests can enter arrival flight numbers or times during RSVP. Organizers publish vehicle driver name and vehicle plates under the <strong>Transport</strong> tab.
                          </span>
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-[11px] text-white/40 mt-4 flex items-start gap-2">
                          <Info size={16} className="mt-0.5 text-gold/50" />
                          <span>
                            <strong>De-activated:</strong> Clutter-free. Guests will not see or register vehicle requests.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Review & Preview */}
            {activeStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4 mb-4">
                  <h2 className="text-base font-serif text-gold flex items-center gap-2">
                    <Eye size={18} /> Step 6: Live Workspace Simulation
                  </h2>
                  <p className="text-xs text-white/40 mt-1">
                    Review your configured setup and spin up a real sandboxed guest invitation simulation!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Summary Info cards */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold block pb-1 border-b border-white/5">
                        Experience Summary Checker
                      </span>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-white/40 block">Event Category:</span>
                          <span className="text-cream font-bold">{event.type || 'Standard'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Primary Date:</span>
                          <span className="text-cream font-bold">{event.date}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-white/40 block">Welcome Heading wording:</span>
                          <span className="text-gold/80 font-serif font-semibold">{invitation.welcomeHeading || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Active Timeline Functions:</span>
                          <span className="text-cream font-bold">{programme.length} ceremonies</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Custom survey queries:</span>
                          <span className="text-cream font-bold">{rsvpConfig.customQuestions.length} added</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-2">
                      <span className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold block pb-1 border-b border-white/5">
                        Feature Flags
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={guestServices.accommodationEnabled ? 'text-green-400' : 'text-white/20'}>●</span>
                          <span className="text-cream">Hotel Desk Coordination {guestServices.accommodationEnabled ? 'ON' : 'OFF'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={guestServices.transportEnabled ? 'text-green-400' : 'text-white/20'}>●</span>
                          <span className="text-cream">Transport Pickup Request {guestServices.transportEnabled ? 'ON' : 'OFF'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={rsvpConfig.enabled ? 'text-green-400' : 'text-white/20'}>●</span>
                          <span className="text-cream">RSVP registration Gate {rsvpConfig.enabled ? 'ACTIVE' : 'LOCKED'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Preview Launcher Simulation Box */}
                  <div className="bg-gold/5 border border-gold/30 rounded-3xl p-6 flex flex-col justify-between items-center text-center space-y-4">
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto text-gold">
                        <Sparkles size={22} className="animate-pulse" />
                      </div>
                      <h3 className="font-serif text-base text-gold font-bold">Simulator Sandboxing</h3>
                      <p className="text-[11px] text-cream/70 leading-relaxed max-w-xs">
                        This environment spins up a robust test family guest record so you can review the exact visual invitation, background music audio, and RSVP submission pipeline in real time.
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateTestAndPreview}
                      className="w-full bg-gold hover:bg-gold/95 text-black font-bold uppercase tracking-widest text-xs py-3.5 rounded-2xl shadow-lg active:scale-[0.98] transition-all"
                    >
                      Launch Live Simulation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={handlePrevStep}
          disabled={activeStep === 0}
          className="flex items-center gap-2 bg-white/5 border border-white/10 disabled:opacity-20 hover:bg-white/10 text-cream px-5 py-3 rounded-2xl text-xs uppercase tracking-wider font-mono transition-all"
        >
          <ChevronLeft size={16} /> Previous Setup Step
        </button>

        {activeStep < steps.length - 1 ? (
          <button
            onClick={handleNextStep}
            className="flex items-center gap-2 bg-gold text-black hover:bg-gold/90 px-6 py-3 rounded-2xl text-xs uppercase tracking-wider font-bold transition-all shadow-md"
          >
            Save & Next Step <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => handleSaveProgress(false)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl text-xs uppercase tracking-wider font-bold transition-all shadow-md"
          >
            <Check size={16} /> Save & Complete Setup
          </button>
        )}
      </div>
    </div>
  );

  function setDetailsAndSaveService(field: 'accommodationEnabled' | 'transportEnabled', val: boolean) {
    setGuestServices(prev => ({
      ...prev,
      [field]: val
    }));
  }
}
