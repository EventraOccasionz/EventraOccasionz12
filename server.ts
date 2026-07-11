import express from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});
import qrcode from 'qrcode';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp as initClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, getDocs, doc, setDoc, getDoc, query, where } from 'firebase/firestore';

// Load environment variables from .env
dotenv.config();

const rawTarget = process.env.VITE_SUPABASE_URL || '';
const target = rawTarget.replace(/^["']|["']$/g, '').trim().replace(/\/+$/, '');

async function startServer() {
  const app = express();
  const PORT = 3000;
  const hasFirebaseAdminCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_AUTH_EMULATOR_HOST);

  if (!target) {
    console.error('[Proxy Error] VITE_SUPABASE_URL is missing from environment. Proxy cannot function.');
  } else {
    console.log(`[Proxy] Initializing reverse proxy pointing to target: ${target}`);
  }

  // Set up Supabase Proxy to bypass iframe CORS / sandbox constraints
  // We apply the proxy at the root level using the pathFilter option. This ensures Express
  // does not strip the matched path prefixes (such as '/auth/v1'), preserving the absolute route format.
  const proxyFilter = (pathname: string, req: any) => {
    const isMatched = pathname.startsWith('/rest/') || pathname.startsWith('/auth/') || pathname.startsWith('/storage/');
    if (isMatched) {
      console.log(`[Proxy Filter] Match found for path: "${pathname}"`);
    }
    return isMatched;
  };

  const shouldLog = (url: string): boolean => {
    const lowercaseUrl = url.toLowerCase();
    const ignoredExtensions = ['.tsx', '.ts', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.json', '.ico', '.gif', '.webp', '.map'];
    const ignoredPatterns = ['/node_modules/', '/@vite/', '/@id/', '/@fs/'];
    
    if (ignoredExtensions.some(ext => lowercaseUrl.includes(ext))) {
      return false;
    }
    if (ignoredPatterns.some(pat => lowercaseUrl.includes(pat))) {
      return false;
    }
    return true;
  };

  app.use((req, res, next) => {
    if (shouldLog(req.url)) {
      console.log(`[Server Request] ${req.method} ${req.url}`);
    }
    next();
  });

  if (target) {
    app.use(
      createProxyMiddleware({
        target,
        changeOrigin: true,
        secure: false,
        pathFilter: proxyFilter,
        onProxyReq: (proxyReq: any, req: any) => {
          console.log(`[Proxy Requesting] ${req.method} ${req.url} -> ${target}`);
          // Enforce the correct Host header for Supabase to resolve the project properly
          try {
            const host = new URL(target).host;
            proxyReq.setHeader('Host', host);
            console.log(`[Proxy Header] Set Host header to ${host}`);
          } catch (e: any) {
            console.error(`[Proxy Header Error] Invalid target URL "${target}":`, e.message);
          }
        },
        onProxyRes: (proxyRes: any, req: any) => {
          console.log(`[Proxy Response] Received ${proxyRes.statusCode} for ${req.method} ${req.url}. Content-Type: ${proxyRes.headers['content-type']}`);
        },
        onError: (err: any, req: any, res: any) => {
          console.error(`[Proxy Error] Error proxying ${req.method} ${req.originalUrl}:`, err);
          res.status(502).json({ error: 'Supabase proxy failed', details: err.message });
        }
      } as any)
    );
  } else {
    console.log('[Proxy] VITE_SUPABASE_URL not configured. Skipping proxy middleware configuration.');
  }

  // Support JSON bodies for custom endpoints
  app.use(express.json());

  let triggerSitemapRebuild: (() => Promise<void>) | null = null;

  // Initialize server-side Firebase Admin SDK using the workspace JSON config
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let firebaseApp: any;
  let firebaseConfig: any;
  
  let firebaseClientApp: any;
  let firebaseClientDb: any;
  
  if (fs.existsSync(firebaseConfigPath)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      console.log(`[Server Firebase] Config: ${JSON.stringify(firebaseConfig)}`);
      
      if (hasFirebaseAdminCredentials) {
        try {
          firebaseApp = initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId
          });
          console.log(`[Server Firebase] Initialized Admin Firestore successfully on project: ${firebaseConfig.projectId}`);
        } catch (err: any) {
          console.warn(`[Server Firebase] Admin initialization skipped:`, err.message);
        }
      } else {
        console.warn(`[Server Firebase] Google Application Default Credentials not configured. Admin SDK initialization skipped.`);
      }
      
      try {
        firebaseClientApp = initClientApp(firebaseConfig);
        firebaseClientDb = getClientFirestore(firebaseClientApp, firebaseConfig.firestoreDatabaseId);
        console.log(`[Server Firebase] Initialized Client Firestore successfully.`);
      } catch (err: any) {
        console.error(`[Server Firebase] Client initialization error:`, err.message);
      }
    } catch (err: any) {
      console.error(`[Server Firebase] Initialization error:`, err.message);
    }
  } else {
    console.warn(`[Server Firebase] firebase-applet-config.json not found.`);
  }

  // Helper to resolve the correct Firestore instance (handling named database ID)
  const getAdminDb = () => {
    if (firebaseApp && hasFirebaseAdminCredentials) {
      if (firebaseConfig?.firestoreDatabaseId) {
        return getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      }
      return getFirestore(firebaseApp);
    }
    return null;
  };

  // Automated service that builds and updates the sitemap.xml file dynamically
  const setupSitemapGenerator = () => {
    if (!firebaseApp) {
      console.warn('[Sitemap Generator] Cannot setup sitemap generator: Firebase Admin SDK is not initialized.');
      return;
    }
    const dbAdmin = getAdminDb();
    
    const rebuildSitemap = async () => {
      try {
        console.log('[Sitemap Generator] Rebuilding website sitemap from Firestore...');
        
        let categories: any[] = [];
        try {
          const categoriesSnap = await dbAdmin.collection('categories').get();
          categoriesSnap.forEach(doc => categories.push({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          console.warn('[Sitemap Generator] Could not fetch categories collection (might be empty):', e.message);
        }

        let subCategories: any[] = [];
        try {
          const subCategoriesSnap = await dbAdmin.collection('sub_categories').get();
          subCategoriesSnap.forEach(doc => subCategories.push({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          console.warn('[Sitemap Generator] Could not fetch sub_categories collection (might be empty):', e.message);
        }

        let services: any[] = [];
        try {
          const servicesSnap = await dbAdmin.collection('services').get();
          servicesSnap.forEach(doc => services.push({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          console.warn('[Sitemap Generator] Could not fetch services collection (might be empty):', e.message);
        }

        const baseUrl = 'https://eventra-occasionz.com';
        const lastMod = new Date().toISOString().split('T')[0];
        const urls: string[] = [];

        // Static core routes
        const staticPages = [
          { path: '', priority: '1.0', changefreq: 'daily' },
          { path: '/services', priority: '0.9', changefreq: 'weekly' },
          { path: '/gallery', priority: '0.9', changefreq: 'weekly' },
          { path: '/rsvp', priority: '0.7', changefreq: 'monthly' },
          { path: '/contact', priority: '0.8', changefreq: 'monthly' }
        ];

        for (const p of staticPages) {
          urls.push(`  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
        }

        // Category URLs
        for (const cat of categories) {
          const catSlug = cat.slug || cat.id;
          if (!catSlug) continue;
          
          urls.push(`  <url>
    <loc>${baseUrl}/services/${catSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
          urls.push(`  <url>
    <loc>${baseUrl}/gallery/${catSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }

        // SubCategory URLs
        for (const sub of subCategories) {
          const subSlug = sub.slug || sub.id;
          if (!subSlug) continue;

          const parentCat = categories.find(c => c.id === sub.category_id || c.slug === sub.category_slug);
          const catSlug = parentCat ? (parentCat.slug || parentCat.id) : 'services';

          urls.push(`  <url>
    <loc>${baseUrl}/services/${catSlug}/${subSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
          urls.push(`  <url>
    <loc>${baseUrl}/gallery/${catSlug}/${subSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
        }

        // Service URLs
        for (const serv of services) {
          const servSlug = serv.slug || serv.id;
          if (!servSlug) continue;

          const parentSub = subCategories.find(s => s.id === serv.sub_category_id || s.id === serv.cat);
          const subSlug = parentSub ? (parentSub.slug || parentSub.id) : '';

          const parentCat = parentSub ? categories.find(c => c.id === parentSub.category_id) : (serv.category_id ? categories.find(c => c.id === serv.category_id) : null);
          const catSlug = parentCat ? (parentCat.slug || parentCat.id) : '';

          let pathUrl = `/services`;
          if (catSlug) pathUrl += `/${catSlug}`;
          if (subSlug) pathUrl += `/${subSlug}`;
          pathUrl += `/${servSlug}`;

          urls.push(`  <url>
    <loc>${baseUrl}${pathUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
        }

        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

        const publicPath = path.join(process.cwd(), 'public');
        const distPath = path.join(process.cwd(), 'dist');

        if (!fs.existsSync(publicPath)) {
          fs.mkdirSync(publicPath, { recursive: true });
        }
        fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), sitemapXml, 'utf8');
        console.log('[Sitemap Generator] Wrote dynamically built sitemap to public/sitemap.xml');

        if (fs.existsSync(distPath)) {
          fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemapXml, 'utf8');
          console.log('[Sitemap Generator] Wrote dynamically built sitemap to dist/sitemap.xml');
        }
      } catch (err: any) {
        console.error('[Sitemap Generator Error]:', err.message);
      }
    };

    // Store trigger reference for on-demand API requests
    triggerSitemapRebuild = rebuildSitemap;

    // Run initial generation once
    rebuildSitemap();

    // Set interval to rebuild sitemap periodically (e.g. every 3 minutes)
    setInterval(() => {
      console.log('[Sitemap Generator] Triggering periodic sitemap rebuild...');
      rebuildSitemap();
    }, 180000);
  };

  // Run sitemap generator only when Firebase Admin credentials are available.
  if (firebaseApp && hasFirebaseAdminCredentials) {
    setupSitemapGenerator();
  } else if (firebaseApp) {
    console.warn('[Sitemap Generator] Skipping startup sitemap rebuild because Firebase Admin credentials are unavailable in this environment.');
  }

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', proxyTarget: target });
  });

  // Rebuild sitemap manual trigger
  app.post('/api/rebuild-sitemap', async (req, res) => {
    if (!triggerSitemapRebuild) {
      return res.status(503).json({ success: false, error: 'Sitemap generator service is not initialized or database is unconfigured.' });
    }
    try {
      console.log('[Sitemap API] Rebuilding sitemap on user manual trigger request...');
      await triggerSitemapRebuild();
      return res.json({ success: true, message: 'Sitemap rebuilt and updated dynamically.' });
    } catch (err: any) {
      console.error('[Sitemap API Error]:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dynamic Sitemap XML Route
  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.header('Content-Type', 'application/xml');
      return res.sendFile(sitemapPath);
    }
    const lastMod = new Date().toISOString().split('T')[0];
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://eventra-occasionz.com</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.header('Content-Type', 'application/xml');
    return res.send(fallbackXml);
  });

  // 1. Generate 2FA Secret
  app.post('/api/2fa/generate-secret', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email in request body.' });
    }

    try {
      const secret = totp.generateSecret();
      const otpauth = totp.toURI({ secret, label: email, issuer: 'Eventra Occasionz' });
      const qrCodeUrl = await qrcode.toDataURL(otpauth);

      const recoveryCodes: string[] = [];
      for (let i = 0; i < 10; i++) {
        recoveryCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
      }

      return res.json({ secret, qrCodeUrl, recoveryCodes });
    } catch (err: any) {
      console.error('[2FA Generate Secret Error]:', err);
      return res.status(500).json({ error: 'Failed to generate 2FA secret.', details: err.message });
    }
  });

  // 2. Verify 2FA Code (Stateless)
  app.post('/api/2fa/verify-code', async (req, res) => {
    const { secret, code } = req.body;
    if (!secret || !code) {
      return res.status(400).json({ error: 'Missing secret or code in request body.' });
    }

    try {
      const verifyResult = await totp.verify(code.trim(), { secret, epochTolerance: 1 });
      return res.json({ valid: verifyResult.valid });
    } catch (err: any) {
      console.error('[2FA Verify Code Error]:', err);
      return res.status(500).json({ error: 'Failed to verify 2FA code.', details: err.message });
    }
  });

  // ==========================================
  // FIREBASE CLOUD MESSAGING & PUSH NOTIFICATIONS
  // ==========================================

  // Get FCM Client Configuration
  app.get('/api/fcm/config', (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return res.json(config);
      }
      return res.status(404).json({ error: 'Firebase config file not found' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to read Firebase config', details: err.message });
    }
  });

  // Register or Sync FCM Token on Backend
  app.post('/api/fcm/register', async (req, res) => {
    const { token, familyId, accountId, name } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Missing token parameter' });
    }

    try {
      console.log(`[Server Firebase] Registering token: ${token.substring(0, 10)}...`);
      const tokenId = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
      
      const dbAdmin = getAdminDb();
      if (dbAdmin && hasFirebaseAdminCredentials) {
        // Save under fcm_tokens collection using Admin SDK
        const fcmTokenDocRef = dbAdmin.collection('fcm_tokens').doc(tokenId);
        await fcmTokenDocRef.set({
          token,
          familyId: familyId || null,
          accountId: accountId || null,
          name: name || null,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // If familyId is provided, sync under the family profile!
        if (familyId) {
          const familyDocRef = dbAdmin.collection('families').doc(familyId);
          const familySnap = await familyDocRef.get();
          if (familySnap.exists) {
            await familyDocRef.set({
              fcmToken: token,
              fcmTokens: [token]
            }, { merge: true });
          }
        }

        // If accountId is provided, sync under registered accounts!
        if (accountId) {
          const accountDocRef = dbAdmin.collection('registered_accounts').doc(accountId);
          const accountSnap = await accountDocRef.get();
          if (accountSnap.exists) {
            await accountDocRef.set({
              fcmToken: token
            }, { merge: true });
          }
        }
      } else if (firebaseClientDb) {
        // Fallback to Client SDK to avoid credentials crash
        const docRef = doc(firebaseClientDb, 'fcm_tokens', tokenId);
        await setDoc(docRef, {
          token,
          familyId: familyId || null,
          accountId: accountId || null,
          name: name || null,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (familyId) {
          const familyDocRef = doc(firebaseClientDb, 'families', familyId);
          const familySnap = await getDoc(familyDocRef);
          if (familySnap.exists()) {
            await setDoc(familyDocRef, {
              fcmToken: token,
              fcmTokens: [token]
            }, { merge: true });
          }
        }

        if (accountId) {
          const accountDocRef = doc(firebaseClientDb, 'registered_accounts', accountId);
          const accountSnap = await getDoc(accountDocRef);
          if (accountSnap.exists()) {
            await setDoc(accountDocRef, {
              fcmToken: token
            }, { merge: true });
          }
        }
      }

      return res.json({ success: true, tokenId });
    } catch (err: any) {
      console.error('[FCM Backend Register Error]:', err);
      return res.status(500).json({ error: 'Failed to register token on backend', details: err.message });
    }
  });

  // Broadcast Notification via FCM and save to Firestore
  app.post('/api/notifications/send', async (req, res) => {
    const { title, message, priority, event_id, sender } = req.body;
    if (!title || !message || !event_id) {
      return res.status(400).json({ error: 'Missing title, message or event_id parameters' });
    }

    try {
      const dbAdmin = getAdminDb();
      if (!hasFirebaseAdminCredentials || !dbAdmin) {
        // Fallback to client SDK for saving history, bypass push
        const notifDocRef = doc(firebaseClientDb, 'venue_settings', `notifications_${event_id}`);
        const docSnap = await getDoc(notifDocRef);
        let currentList: any[] = [];
        if (docSnap.exists()) {
          currentList = docSnap.data()?.list || [];
        }
        const newNotif = {
          id: 'notif_' + Math.random().toString(36).substring(2, 9),
          title: title.trim(),
          message: message.trim(),
          priority: priority || 'normal',
          timestamp: new Date().toISOString(),
          sender: sender || 'system-admin',
          status: 'Delivered (No Push - Demo Mode)',
          recipientCount: 0
        };
        const updatedList = [newNotif, ...currentList];
        await setDoc(notifDocRef, { list: updatedList }, { merge: true });

        return res.json({ 
          success: true, 
          notification: newNotif, 
          sentCount: 0,
          multicastResult: { error: 'FCM push bypassed in demo mode.' }
        });
      }

      // 1. Fetch all FCM tokens from Firestore
      console.log(`[FCM Send] Fetching tokens for event: ${event_id}`);
      let tokens: string[] = [];
      try {
        const tokensSnap = await dbAdmin.collection('fcm_tokens').get();
        tokensSnap.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.token) {
            tokens.push(data.token);
          }
        });
        console.log(`[FCM Send] Loaded ${tokens.length} tokens for multicast.`);
      } catch (err: any) {
        console.error('[FCM Send] Error fetching tokens:', err);
        throw new Error(`Error fetching tokens: ${err.message}`);
      }

      // 2. Format the new notification
      const newNotif = {
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        title: title.trim(),
        message: message.trim(),
        priority: priority || 'normal',
        timestamp: new Date().toISOString(),
        sender: sender || 'system-admin',
        status: 'Delivered',
        recipientCount: tokens.length || 1
      };

      // 3. Save notification in Firestore under venue_settings/notifications_${event_id}
      console.log(`[FCM Send] Saving notification to Firestore...`);
      const notifDocRef = dbAdmin.collection('venue_settings').doc(`notifications_${event_id}`);
      const docSnap = await notifDocRef.get();
      
      let currentList: any[] = [];
      if (docSnap.exists) {
        currentList = docSnap.data()?.list || [];
      }
      
      const updatedList = [newNotif, ...currentList];
      await notifDocRef.set({ list: updatedList }, { merge: true });
      console.log(`[FCM Send] Saved notification inside venue_settings/notifications_${event_id}`);

      // 4. Dispatch the push notifications using FCM Multicast
      let multicastResult = null;
      if (tokens.length > 0) {
        try {
          console.log(`[FCM Send] Dispatching push...`);
          const messagingAdmin = getMessaging(firebaseApp);
          multicastResult = await messagingAdmin.sendEachForMulticast({
            tokens: tokens,
            notification: {
              title: title.trim(),
              body: message.trim(),
            },
            data: {
              title: title.trim(),
              body: message.trim(),
              priority: priority || 'normal',
              event_id: event_id
            }
          });
          console.log(`[FCM Send] Multicast success count: ${multicastResult.successCount}, failure count: ${multicastResult.failureCount}`);
        } catch (fcmErr: any) {
          console.error('[FCM Send] Error sending multicast push:', fcmErr);
          // Don't throw here if we want to still return the saved notification
          multicastResult = { error: fcmErr.message };
        }
      } else {
        console.log(`[FCM Send] No tokens to send push.`);
      }

      return res.json({ 
        success: true, 
        notification: newNotif, 
        sentCount: tokens.length,
        multicastResult
      });
    } catch (err: any) {
      console.error('[FCM Send Endpoint Error]:', err);
      return res.status(500).json({ error: 'Failed to broadcast notification', details: err.message });
    }
  });

  // AI Event Consultant & Budget Estimator Endpoint
  app.post('/api/ai-consultant', async (req, res) => {
    const {
      eventType,
      city,
      eventDate,
      guestCount,
      venueRequired,
      venueId,
      hotelCategory,
      roomsCount,
      nightsCount,
      hotelId,
      selectedServices, // string[]
      customQuantities, // Record<string, number>
      sparkularQty,
      coldPyroQty,
      runnersCount,
      runnerDays,
      airportTrips,
      additionalNotes
    } = req.body;

    try {
      if (!firebaseClientDb) {
        throw new Error('Firebase Client SDK is not initialized');
      }

      // 1. Fetch DB records from Firestore with fallbacks
      const servicesSnap = await getDocs(collection(firebaseClientDb, 'services'));
      const services: any[] = [];
      servicesSnap.forEach(d => services.push({ id: d.id, ...d.data() }));

      const hotelsSnap = await getDocs(collection(firebaseClientDb, 'estimator_hotels'));
      const hotels: any[] = [];
      hotelsSnap.forEach(d => hotels.push({ id: d.id, ...d.data() }));

      const venuesSnap = await getDocs(collection(firebaseClientDb, 'estimator_venues'));
      const venues: any[] = [];
      venuesSnap.forEach(d => venues.push({ id: d.id, ...d.data() }));

      // Fallback arrays if database collections are empty
      const fallbackHotels = [
        { id: 'h1', name: 'Hyatt Regency', city: 'Chandigarh', category: '5 Star', roomRate: 9000 },
        { id: 'h2', name: 'The Lalit', city: 'Chandigarh', category: '5 Star', roomRate: 8500 },
        { id: 'h3', name: 'Golden Tulip', city: 'Panchkula', category: '4 Star', roomRate: 5500 },
        { id: 'h4', name: 'Park Plaza', city: 'Zirakpur', category: '4 Star', roomRate: 4800 },
        { id: 'h5', name: 'Hotel Classic', city: 'Mohali', category: '3 Star', roomRate: 3000 },
        { id: 'h6', name: 'Red Fox Hotel', city: 'Chandigarh', category: '3 Star', roomRate: 2800 },
        { id: 'h7', name: 'Taj Aravali Resort & Spa', city: 'Udaipur', category: '5 Star', roomRate: 15000 },
        { id: 'h8', name: 'Radisson Blu Resort', city: 'Goa', category: '5 Star', roomRate: 12000 }
      ];

      const fallbackVenues = [
        { id: 'v1', name: 'Eventra Royal Grand Hall', city: 'Zirakpur', basePrice: 150000, description: 'Majestic banquet hall with luxury chandeliers.' },
        { id: 'v2', name: 'Whispering Willows Lawn', city: 'Zirakpur', basePrice: 200000, description: 'Lush green lawn.' },
        { id: 'v3', name: 'Hyatt Regency Banquet & Lawn', city: 'Chandigarh', basePrice: 350000, description: 'Luxe indoor-outdoor elite venue setup.' },
        { id: 'v4', name: 'The Oberoi Udaivilas Lawn', city: 'Udaipur', basePrice: 1200000, description: 'Ultra-luxury palatial venue.' },
        { id: 'v5', name: 'Caravela Beach Front Lawn', city: 'Goa', basePrice: 600000, description: 'Enchanting beachside wedding venue.' }
      ];

      const activeHotels = hotels.length > 0 ? hotels : fallbackHotels;
      const activeVenues = venues.length > 0 ? venues : fallbackVenues;

      // 2. Perform Precise Budget Calculation
      const items: any[] = [];
      let grandTotal = 0;

      // A. Calculate Hotel Booking
      if (hotelCategory && hotelCategory !== 'None' && roomsCount > 0 && nightsCount > 0) {
        // Find matching hotel in city and category
        const selectedHotel = activeHotels.find(h => 
          h.city.toLowerCase() === (city || '').toLowerCase() && 
          h.category === hotelCategory && 
          (hotelId ? h.id === hotelId : true)
        ) || activeHotels.find(h => h.category === hotelCategory) || fallbackHotels[0];

        if (selectedHotel) {
          const rate = selectedHotel.roomRate;
          const subtotal = rate * roomsCount * nightsCount;
          items.push({
            id: 'accommodation_hotel',
            category: 'Accommodation',
            name: `Hotel Room Nights (${selectedHotel.name})`,
            formula: `${roomsCount} Rooms × ${nightsCount} Nights @ ₹${rate.toLocaleString()}/night`,
            unitPrice: rate,
            quantity: roomsCount * nightsCount,
            subtotal,
            notes: `Selected ${hotelCategory} hotel in ${city || 'event city'}.`
          });
          grandTotal += subtotal;
        }
      }

      // B. Calculate Venue Rental
      if (venueRequired === 'Yes') {
        const selectedVenue = activeVenues.find(v => 
          v.id === venueId || 
          (v.city.toLowerCase() === (city || '').toLowerCase())
        ) || activeVenues[0];

        if (selectedVenue) {
          const price = selectedVenue.basePrice;
          items.push({
            id: 'venue_rental',
            category: 'Venue',
            name: `Venue Booking: ${selectedVenue.name}`,
            formula: `Base venue rental price`,
            unitPrice: price,
            quantity: 1,
            subtotal: price,
            notes: selectedVenue.description || 'Premium venue rental.'
          });
          grandTotal += price;
        }
      }

      // C. Calculate Selected Services
      if (selectedServices && Array.isArray(selectedServices)) {
        selectedServices.forEach(srvId => {
          const serv = services.find(s => s.id === srvId);
          if (!serv) return;

          // 1. Determine base price
          let basePrice = serv.standard_price;
          if (basePrice === undefined || basePrice === null) {
            basePrice = (serv.price_num ?? (serv.starting_from ? parseFloat(serv.starting_from.replace(/[^0-9.]/g, '')) : 0)) || 0;
          }

          // 2. City Overrides
          const currentCity = city?.toLowerCase() || '';
          if (serv.city_pricing) {
            for (const [cName, pData] of Object.entries(serv.city_pricing as Record<string, any>)) {
              if (cName.toLowerCase() === currentCity && pData.standard_price) {
                basePrice = pData.standard_price;
                break;
              }
            }
          }

          const calcType = serv.calculation_formula || serv.calculation_type || 'flat';
          const unitName = serv.pricing_unit || serv.unit_name || 'event';

          if (basePrice === 0) {
            // Price is unavailable
            items.push({
              id: serv.id,
              category: serv.category_slug || serv.cat || 'Services',
              name: serv.name,
              formula: 'Pricing Unavailable',
              unitPrice: 0,
              quantity: 0,
              subtotal: 0,
              notes: 'This service currently has no rate configured in the admin console. Ask consultant for custom quotes.',
              unavailable: true
            });
            return;
          }

          let qty = 1;
          let formula = `Flat rate pricing`;
          let subtotal = basePrice;

          if (calcType === 'per_guest') {
            qty = Number(guestCount) || 1;
            formula = `${qty} Guests × ₹${basePrice.toLocaleString()}/${unitName}`;
            subtotal = basePrice * qty;
          } else if (calcType === 'per_unit') {
            const customQty = customQuantities && customQuantities[srvId] ? Number(customQuantities[srvId]) : null;
            if (serv.name.toLowerCase().includes('spark') || serv.id.includes('spark')) {
              qty = Number(customQty ?? sparkularQty ?? 4);
            } else if (serv.name.toLowerCase().includes('pyro') || serv.id.includes('pyro')) {
              qty = Number(customQty ?? coldPyroQty ?? 10);
            } else {
              qty = Number(customQty ?? 1);
            }
            formula = `${qty} ${unitName} × ₹${basePrice.toLocaleString()} each`;
            subtotal = basePrice * qty;
          } else if (calcType === 'runner') {
            const rCount = Number(runnersCount || 2);
            const rDays = Number(runnerDays || 1);
            qty = rCount * rDays;
            formula = `${rCount} Runners × ${rDays} Days @ ₹${basePrice.toLocaleString()}/${unitName}`;
            subtotal = basePrice * qty;
          } else if (calcType === 'airport_pickup') {
            qty = Number(airportTrips || 2);
            formula = `${qty} Vehicle Trips × ₹${basePrice.toLocaleString()}/${unitName}`;
            subtotal = basePrice * qty;
          }

          // 3. Min/Max Constraints
          const minQty = serv.min_quantity ?? 1;
          const maxQty = serv.max_quantity ?? 99999;
          
          if (qty < minQty) {
             qty = minQty;
             formula += ` (Min Qty Applied: ${minQty})`;
             subtotal = basePrice * qty;
          } else if (qty > maxQty) {
             qty = maxQty;
             formula += ` (Max Qty Applied: ${maxQty})`;
             subtotal = basePrice * qty;
          }

          // 4. Min Charge Constraint
          const minCharge = serv.min_charge ?? 0;
          if (subtotal < minCharge) {
             formula += ` (Min Charge Configured: ₹${minCharge.toLocaleString()})`;
             subtotal = minCharge;
          }

          // 5. Tax Logic
          if (!serv.tax_included && serv.gst_percentage && serv.gst_percentage > 0) {
            const gstAmt = subtotal * (serv.gst_percentage / 100);
            formula += ` + ${serv.gst_percentage}% GST`;
            subtotal += gstAmt;
          }

          items.push({
            id: serv.id,
            category: serv.category_slug || serv.cat || 'Services',
            name: serv.name,
            formula,
            unitPrice: basePrice,
            quantity: qty,
            subtotal,
            notes: serv.desc || ''
          });
          grandTotal += subtotal;
        });
      }

      // 3. Invoke Gemini for the Professional Consultant Narrative
      const geminiApiKey = process.env.GEMINI_API_KEY;
      let aiResponseNarrative = '';

      // Fetch knowledge base articles for context
      let kbContext = '';
      try {
        const dbAdmin = getAdminDb();
        if (dbAdmin && hasFirebaseAdminCredentials) {
          const kbSnap = await dbAdmin.collection('knowledge_base').where('status', '==', 'published').get();
          const articles: any[] = [];
          kbSnap.forEach(d => articles.push(d.data()));
          kbContext = articles.map(a => `[${a.category}] ${a.title}:\n${a.content}`).join('\n\n');
        } else if (firebaseClientDb) {
          const q = query(collection(firebaseClientDb, 'knowledge_base'), where('status', '==', 'published'));
          const kbSnap = await getDocs(q);
          const articles: any[] = [];
          kbSnap.forEach(d => articles.push(d.data()));
          kbContext = articles.map(a => `[${a.category}] ${a.title}:\n${a.content}`).join('\n\n');
        }
      } catch (e) {
        console.error('Error fetching knowledge base:', e);
      }

      if (geminiApiKey) {
        try {
          console.log('[Gemini API] Lazily initializing official Google GenAI client...');
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });

          const prompt = `You are the lead Senior Event Consultant and Luxury Planner at Eventra Occasionz. You have deep expertise in custom Indian weddings, birthday bashes, executive corporate galas, and romantic anniversaries.

We have gathered exact customer planning metrics and run a database budget calculation.

===============================
KNOWLEDGE BASE:
===============================
${kbContext}

===============================
CLIENT INFORMATION & DECISIONS:
===============================
- Event Type: ${eventType || 'Not specified'}
- Location: ${city || 'Not specified'}
- Date: ${eventDate || 'Not specified'}
- Guest Count: ${guestCount || 'Not specified'}
- Venue Required: ${venueRequired || 'No'}
- Accommodation: ${hotelCategory && hotelCategory !== 'None' ? `${hotelCategory} (${roomsCount} rooms, ${nightsCount} nights)` : 'None'}
- Additional Notes / Style Preferences: ${additionalNotes || 'None'}

=============================================
DETERMINISTIC FINANCIAL LEDGER (DO NOT ALTER):
=============================================
${items.map(it => `- [${it.category}] ${it.name}: Subtotal ₹${it.subtotal.toLocaleString()} (${it.formula}) ${it.unavailable ? '[UNAVAILABLE IN DB]' : ''}`).join('\n')}

GRAND TOTAL CALCULATED: ₹${grandTotal.toLocaleString()}

=============================================
AI TASK & PERSONA RULES:
=============================================
1. STRICTLY ADHERE to the rules, behaviour, and recommendations found in the KNOWLEDGE BASE provided above.
2. Write a highly professional, welcoming, and elite proposal narrative addressed to the client. Be elegant, direct, clear, and reassuring. Do not sound like a generic computer. Speak in the voice of a seasoned Eventra Occasionz director.
3. Formulate 3-4 highly tailored strategic suggestions for their event based on the Knowledge Base.
4. Suggest 2-3 specific optional upgrades that match their category, referring to the Knowledge Base.
5. Offer 2-3 creative, smart cost-saving suggestions based on the Knowledge Base.
6. STRICT RESTRICTIONS:
   - NEVER invent or speculate prices for other services.
   - NEVER promise or guarantee calendar availability.
   - NEVER offer unauthorized discounts or offer price negotiation.
   - If any service is marked [UNAVAILABLE IN DB], advise them gently that the pricing for that specific bespoke element is subject to live operator assessment, and that our planners will supply a dedicated quote.
   - Keep your formatting pristine using elegant Markdown. Use bold titles and bulleted structures.

Begin your professional proposal now:`;

          console.log('[Gemini API] Dispatching content request to gemini-2.5-flash...');
          const modelResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });

          aiResponseNarrative = modelResponse.text || '';
          console.log('[Gemini API] Narrative successfully generated.');
        } catch (geminiErr: any) {
          console.error('[Gemini API Error] Failed to generate AI narrative:', geminiErr);
          aiResponseNarrative = `### Eventra Occasionz Luxury Proposal
          
Thank you for consulting with **Eventra Occasionz**. Our Senior Event Curation Desk has processed your details. 

Due to a temporary gateway issue with our AI model, we are presenting your raw calculated ledger below. Our professional event directors will contact you shortly to provide bespoke advice, theme visualizations, and availability confirmation.

*Please note: We do not guarantee calendar availability or promise custom discounts. All prices are calculated directly from our active master catalog.*`;
        }
      } else {
        console.warn('[Gemini API Warning] GEMINI_API_KEY environment variable is missing. Using standard fallback.');
        aiResponseNarrative = `### Eventra Occasionz Proposal (Database Calculation Mode)

Thank you for choosing **Eventra Occasionz**. 

We have computed your event budget using the live values from our secure administrator console database. Because the primary Google Gemini gateway is awaiting credentials setup, we are providing your precise ledger below. 

Our team will follow up via phone or email to deliver custom themes, timeline schedules, and a final contract.`;
      }

      return res.json({
        success: true,
        calculation: {
          items,
          grandTotal
        },
        narrative: aiResponseNarrative
      });
    } catch (err: any) {
      console.error('[AI Consultant Endpoint Error]:', err);
      return res.status(500).json({ error: 'Failed to generate event consultation proposal', details: err.message });
    }
  });

  // Vite middleware or build serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Failed]', err);
});
