import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { dataService } from './dataService';

export type EventExperienceConfig = {
  invitationContent: Record<string, string>;
  invitation?: any;
  scheduleItems: any[];
  functions?: any[];
  rsvpSettings: Record<string, any>;
  customQuestions: any[];
  sectionVisibility: Record<string, boolean>;
  hasSavedConfig: boolean;
};

const asArray = (value: unknown) => Array.isArray(value) ? value : [];

export function resolveEventExperienceConfig(event: any, details: any = {}): EventExperienceConfig {
  const saved = details?.experienceConfig;
  const hasSavedConfig = !!saved || (Array.isArray(details?.timeline) && details.timeline.length > 0);
  const sourceSchedule = hasSavedConfig
    ? asArray(saved?.scheduleItems || details?.timeline)
    : [];
  
  const scheduleItems = sourceSchedule.map((item: any, index: number) => {
    const startTime = item?.startTime || item?.time || '';
    const endTime = item?.endTime || '';
    const timeVal = item?.time || [startTime, endTime].filter(Boolean).join(' – ');

    return {
      id: String(item?.id || `schedule_${index + 1}`),
      title: String(item?.title || item?.name || ''),
      name: String(item?.title || item?.name || ''),
      date: item?.date || event?.date || '',
      startTime,
      endTime,
      time: timeVal,
      venue: item?.venue || item?.venueName || event?.venue || '',
      venueName: item?.venue || item?.venueName || event?.venue || '',
      address: item?.address || '', 
      mapUrl: item?.mapUrl || item?.mapsLink || '',
      mapsLink: item?.mapUrl || item?.mapsLink || '',
      description: item?.description || item?.notes || '', 
      dressCode: item?.dressCode || '',
      image: item?.image || item?.thumbnail || '', 
      thumbnail: item?.image || item?.thumbnail || '',
      visible: item?.visible !== false,
      rsvpEnabled: item?.rsvpEnabled !== false, 
      order: Number(item?.order ?? index)
    };
  }).filter((item: any) => item.title).sort((a: any, b: any) => a.order - b.order);

  const invitationContent = saved?.invitationContent || {};
  const invitation = {
    welcomeHeading: invitationContent.welcomeHeading || invitationContent.welcome_heading || '',
    invitationMessage: invitationContent.invitationMessage || invitationContent.invitation_message || '',
    partner1Name: event?.groom || '',
    partner2Name: event?.bride || '',
    backgroundMusic: saved?.invitation?.backgroundMusic || '',
    mainPhoto: saved?.invitation?.mainPhoto || '',
    ...invitationContent,
    ...(saved?.invitation || {})
  };

  return {
    invitationContent,
    invitation,
    scheduleItems,
    functions: scheduleItems,
    rsvpSettings: saved?.rsvpSettings || {}, 
    customQuestions: asArray(saved?.customQuestions)
      .filter((q: any) => q?.enabled !== false).sort((a: any, b: any) => Number(a?.order ?? 0) - Number(b?.order ?? 0)),
    sectionVisibility: saved?.sectionVisibility || {}, 
    hasSavedConfig
  };
}

export async function loadEventExperienceConfig(event: any): Promise<EventExperienceConfig> {
  const eventId = event?.id;
  let details: any = {};
  if (eventId) {
    if (dataService.isConfigured()) {
      const snapshot = await getDoc(doc(db, 'event_details', eventId));
      details = snapshot.exists() ? snapshot.data() : {};
    } else {
      try { details = JSON.parse(localStorage.getItem(`event_details_${eventId}`) || '{}'); } catch { details = {}; }
    }
  }
  return resolveEventExperienceConfig(event, details);
}

export function resolvePlaceholders(value: unknown, event: any, family: any) {
  if (typeof value !== 'string') return '';
  const values: Record<string, string> = {
    guestName: family?.name || '', familyName: family?.name || '', eventName: event?.name || '',
    brideName: event?.bride || event?.brideName || '', groomName: event?.groom || event?.groomName || '',
    birthdayPerson: event?.birthdayPerson || event?.bride || '', companyName: event?.companyName || event?.organizerName || '',
    venue: event?.venue || '', eventDate: event?.date || ''
  };
  return value.replace(/\{([a-zA-Z]+)\}/g, (_, key) => values[key] || '');
}
