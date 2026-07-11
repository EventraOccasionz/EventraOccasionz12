/* eslint-disable no-undef */
// Firebase Cloud Messaging Background Service Worker

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Fetch the config from the backend dynamically
fetch('/api/fcm/config')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase config from backend');
    }
    return response.json();
  })
  .then(config => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    // Listen to background notifications
    messaging.onBackgroundMessage((payload) => {
      console.log('[Service Worker] Received background notification:', payload);

      const notificationTitle = payload.notification?.title || payload.data?.title || 'Eventra Occasionz Notification';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'New announcement available.',
        icon: '/eventra_logo.jpg', // we can use the logo or favicon
        badge: '/favicon.ico',
        tag: 'eventra-announcement',
        renotify: true,
        data: {
          click_action: payload.data?.click_action || '/',
          ...payload.data
        }
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(err => {
    console.error('[Service Worker] Failed to load config or initialize Firebase:', err);
  });

// Handle notification click to focus or open the tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(clickAction) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(clickAction);
        }
      })
  );
});
