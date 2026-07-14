import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Initialize messaging lazily and safely
let messagingInstance: any = null;

const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const firebaseConfig = await import('../../firebase-applet-config.json');

    const app = getApps().length === 0 ? initializeApp(firebaseConfig.default || firebaseConfig) : getApp();
    const supported = await isSupported();
    
    if (supported) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    } else {
      console.warn('[FCM Service] Messaging is not supported in this browser.');
    }
  } catch (err) {
    console.error('[FCM Service] Failed to initialize Firebase Messaging:', err);
  }
  return null;
};

export const fcmService = {
  async registerToken(token: string, familyId?: string, accountId?: string, name?: string) {
    if (!token) return;
    try {
      // Clean and sanitize tokenId for Firestore path safety
      const tokenId = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
      const docRef = doc(db, 'fcm_tokens', tokenId);
      await setDoc(docRef, {
        token,
        familyId: familyId || null,
        accountId: accountId || null,
        name: name || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('[FCM Service] Token saved to Firestore:', tokenId);

      // Also register under families collection if familyId is provided
      if (familyId) {
        // Since unauthenticated guest can't write to families, we can let the backend handle it or try updating if permitted
        // We'll also register it on the backend or in guest_fcm_tokens
        console.log('[FCM Service] Token registered under guest family:', familyId);
      }
    } catch (e) {
      console.error('[FCM Service] Failed to save token to Firestore:', e);
    }
  },

  async retrieveAndRegisterToken(familyId?: string, accountId?: string, name?: string) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('[FCM Service] Service Worker or Notification API not supported.');
      return null;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[FCM Service] Notification permission not granted.');
      return null;
    }

    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn('[FCM Service] Messaging could not be initialized.');
        return null;
      }

      const { getToken } = await import('firebase/messaging');

      // Register the service worker explicitly
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('[FCM Service] Service Worker registered with scope:', registration.scope);

      // Retrieve VAPID Key from import.meta.env or a standard fallback
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('[FCM Service] VITE_FIREBASE_VAPID_KEY is not defined. Please define it in your .env.example/environment settings to complete token generation.');
      }

      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: vapidKey || undefined
      });

      if (token) {
        console.log('[FCM Service] Obtained FCM Token:', token);
        await this.registerToken(token, familyId, accountId, name);
        
        // Let the server know about this registration token to sync under family document using admin SDK
        try {
          await fetch('/api/fcm/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, familyId, accountId, name })
          });
        } catch (err) {
          console.warn('[FCM Service] Failed to register token with backend sync endpoint:', err);
        }

        return token;
      } else {
        console.warn('[FCM Service] No registration token available.');
      }
    } catch (err) {
      console.error('[FCM Service] Error retrieving token:', err);
    }
    return null;
  },

  async onForegroundMessage(callback: (payload: any) => void) {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    try {
      const { onMessage } = await import('firebase/messaging');
      return onMessage(messaging, (payload) => {
        console.log('[FCM Service] Received foreground message:', payload);
        callback(payload);
      });
    } catch (e) {
      console.warn('[FCM Service] Failed to attach foreground listener:', e);
    }
    return null;
  }
};
