# PROJECT_MAP.md — EventraOccasionz Production Registry

This file serves as the definitive index of production-grade source code inside the `src/` directory. Unused development patches, seeds, and migration utilities are registered in `/scripts/` or `/archive/` and are excluded from active production pathways.

## Core Directory Index

| File Path | Purpose | Owner Module | Dependencies | Imported By | Risk Level | Can AI Modify? |
|-----------|---------|--------------|--------------|-------------|------------|----------------|
| `src/main.tsx` | App entrypoint mounting React to the DOM. | Core Runtime | React, Tailwind, App.tsx | `index.html` | HIGH | NO |
| `src/App.tsx` | Main root router and core provider setup. | Core Runtime | React-Router-DOM, Pages | `src/main.tsx` | HIGH | YES |
| `src/types.ts` | Unified TypeScript interface declarations. | Global Shared | None | Whole Application | HIGH | YES |
| `src/index.css` | Global stylesheet styling via Tailwind. | Global Shared | Tailwind CSS | `src/main.tsx` | MEDIUM | YES |
| `src/services/firebase.ts` | SDK configuration and Firebase initialization. | Services | firebase/app, firebase/firestore, firebase/auth | Services, AdminLogin, EnableTwoFactor | CRITICAL | NO |
| `src/services/authService.ts` | User session, auth checks, and login controllers. | Services | firebase.ts, types.ts | AuthModal, BookingForm, Contact | CRITICAL | YES |
| `src/services/dataService.ts` | Centralized data gateway for RSVPs, check-ins, events, etc. | Services | firebase.ts, cmsService, types.ts | Pages, Tabs, GuestDashboard | CRITICAL | YES |
| `src/services/cmsService.ts` | Content Management queries for services, catalog, and images. | Services | firebase.ts, types.ts | dataService.ts, admin components | CRITICAL | YES |
| `src/services/adminService.ts` | Administrative operations (MFA, TOTP secrets, user profiles). | Services | firebase.ts, types.ts | AdminDashboard.tsx | CRITICAL | YES |
| `src/services/bookingService.ts` | Room bookings and accommodation allocation controls. | Services | firebase.ts, types.ts | layout components | HIGH | YES |
| `src/services/fcmService.ts` | Cloud Messaging notification register and delivery API. | Services | firebase.ts, types.ts | InvitePage.tsx | MEDIUM | YES |
| `src/services/storageService.ts` | Cloud Storage uploads proxy (or local mock if disabled). | Services | firebase.ts, types.ts | RSVP uploads | MEDIUM | YES |
| `src/services/galleryService.ts` | Media viewer and portfolio assets content management. | Services | firebase.ts, types.ts | home, CMS tabs | HIGH | YES |
| `src/utils/totp.ts` | TOTP MFA generation and base32 validation client. | Utilities | otplib, noble-crypto | AdminLogin, EnableTwoFactor | HIGH | NO |

## Pages Index

| File Path | Purpose | Owner Module | Dependencies | Imported By | Risk Level | Can AI Modify? |
|-----------|---------|--------------|--------------|-------------|------------|----------------|
| `src/pages/Home.tsx` | Premium landing showcase page. | Core Pages | home/, layout/ | `src/App.tsx` | MEDIUM | YES |
| `src/pages/CategoryPage.tsx` | Event categories catalog views. | Core Pages | layout/, services/ | `src/App.tsx` | MEDIUM | YES |
| `src/pages/InviteAccess.tsx` | Secure digital passcode entry barrier for guests. | Invitations | services/ | `src/App.tsx` | HIGH | YES |
| `src/pages/InvitePage.tsx` | Personalized wedding/engagement digital card. | Invitations | invitations/, services/ | `src/App.tsx` | HIGH | YES |
| `src/pages/BirthdayInvitePage.tsx` | Personalized kids/milestone birthday guest suite. | Invitations | birthday/, services/ | `src/App.tsx` | HIGH | YES |
| `src/pages/EntryPass.tsx` | Ticketed barcode check-in gateway with audio playback. | Invitations | services/ | `src/App.tsx` | HIGH | YES |
| `src/pages/EventMasterPage.tsx` | Main event landing interface. | Invitations | services/ | `src/App.tsx` | MEDIUM | YES |
| `src/pages/AdminLogin.tsx` | Admin identity barrier featuring TOTP multi-factor checks. | Authentication | utils/totp, services/ | `src/App.tsx` | HIGH | YES |
| `src/pages/EnableTwoFactor.tsx` | TOTP barcode provisioning and secret registration wizard. | Authentication | utils/totp, services/ | `src/App.tsx` | HIGH | YES |
| `src/pages/AdminDashboard.tsx` | Unified control room for managers (RSVPs, rooms, logs, CMS). | Admin | components/admin/, services/ | `src/App.tsx` | CRITICAL | YES |

## Major Component Registries

| File Path | Purpose | Owner Module | Dependencies | Imported By | Risk Level | Can AI Modify? |
|-----------|---------|--------------|--------------|-------------|------------|----------------|
| `src/components/admin/AnalyticsPanel.tsx` | Core metrics dashboards, bento logs, sparklines. | Admin | services/, recharts, lucide | AdminDashboard | HIGH | YES |
| `src/components/admin/EventsTab.tsx` | Active and archived occasion managers. | Admin | services/ | AdminDashboard | HIGH | YES |
| `src/components/admin/EventDetailsDashboard.tsx` | Individual workspace detailed command room (Staff, transport). | Admin | services/, lucide | EventsTab.tsx | CRITICAL | YES |
| `src/components/layout/Navbar.tsx` | Luxury navigation controller. | Layout | services/, Lucide | `src/App.tsx` | MEDIUM | YES |
| `src/components/layout/LoadingGateway.tsx` | Smooth loading transition overlay. | Layout | services/ | `src/App.tsx` | MEDIUM | YES |
| `src/components/layout/AuthModal.tsx` | Modular authentication dialogue modal. | Layout | services/ | Navbar.tsx, Contact.tsx | HIGH | YES |
| `src/components/layout/ProtectedRoute.tsx` | Secure route gatekeeper for admin sessions. | Layout | services/ | `src/App.tsx` | HIGH | YES |
