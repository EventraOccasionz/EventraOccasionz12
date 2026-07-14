# System Modules — EventraOccasionz

The system is organized into decoupled functional modules. Every module encapsulates its own data structures, service layers, and components.

## 1. Authentication Module
- **Core Purpose**: Coordinates user logins, security states, administrative session protections, and MFA.
- **Key Files**:
  - `src/services/authService.ts`
  - `src/pages/AdminLogin.tsx`
  - `src/pages/EnableTwoFactor.tsx`
  - `src/utils/totp.ts`
  - `src/components/layout/ProtectedRoute.tsx`

## 2. Event & Inquiry Management Module
- **Core Purpose**: Coordinates multi-event workspace scopes, planner inquiries, and active status state-machines (Upcoming -> Active -> Completed -> Archived).
- **Key Files**:
  - `src/services/dataService.ts`
  - `src/pages/EventMasterPage.tsx`
  - `src/components/admin/EventsTab.tsx`
  - `src/components/admin/EventSetupTab.tsx`
  - `src/components/admin/InquiriesTab.tsx`

## 3. Invitations Module
- **Core Purpose**: Individualized wedding, anniversary, baby shower, and corporate digital invitation routes and guest experiences.
- **Key Files**:
  - `src/pages/InviteAccess.tsx`
  - `src/pages/InvitePage.tsx`
  - `src/pages/BirthdayInvitePage.tsx`
  - `src/components/invitations/` (subfolders)

## 4. Hospitality & Logistics Module
- **Core Purpose**: Coordinate guest hotel allocations, airport transit shuttle schedules, and room assignment lists.
- **Key Files**:
  - `src/services/bookingService.ts`
  - `src/components/admin/RoomsTab.tsx`
  - `src/components/admin/TransportTab.tsx`

## 5. Portfolio CMS Module
- **Core Purpose**: Manage company portfolios, services, catalogs, and media assets display on the public landing page.
- **Key Files**:
  - `src/services/cmsService.ts`
  - `src/services/galleryService.ts`
  - `src/components/admin/ServicesTab.tsx`
  - `src/components/admin/GalleryTab.tsx`

## 6. Analytics Module
- **Core Purpose**: Consolidate global platform-wide statistics and individual event workspace bento reports.
- **Key Files**:
  - `src/components/admin/AnalyticsPanel.tsx`
  - `src/pages/AdminDashboard.tsx`
