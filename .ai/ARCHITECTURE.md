# Architectural Guidelines — EventraOccasionz

This document defines the core architecture, data flow, and directory structure of EventraOccasionz. All modifications must align strictly with these architectural rules.

## Core System Directory Design

```
EventraOccasionz/
├── .ai/                       # AI Memory System (System Rules, Changelogs, State)
├── archive/                   # Frozen deprecated or legacy code (never deleted permanently)
│   ├── legacy/                # Previous developer patches and unneeded backups
│   ├── deprecated/            # Code disabled during refactoring
│   └── review/                # Leftover configurations and mock data
├── docs/                      # General developer manuals and structural audits
├── scripts/                   # Production-safe maintenance and seeding tools
│   ├── maintenance/           # System check, DB check, and structure verifiers
│   └── seed/                  # Firestore database seeding routines and CMS data
├── public/                    # Production static media files (icons, backgrounds)
├── src/                       # Application Source Files
│   ├── assets/                # App images, logos, responsive frames
│   ├── components/            # Presentational UI Components (purely presentational)
│   │   ├── admin/             # Control room panels (Events, Security, Analytics, CMS)
│   │   ├── home/              # Hero showcase, booking widgets, and contact forms
│   │   ├── invitations/       # Occasion card variants (Wedding, Corporate, Kids birthday)
│   │   └── layout/            # Universal layout controllers (Navbar, Footer, Modal)
│   ├── pages/                 # Full-Screen Routes / Orchestrators
│   ├── services/              # Isolated APIs & Database services (Business logic ONLY)
│   ├── utils/                 # Extracted helper utilities (TOTP, Date handlers)
│   └── types.ts               # Unified TS interfaces and schemas
```

## Architectural Decoupling Rules

1. **Presentation / Business Separation**:
   - UI components (under `src/components`) must contain ONLY presentational code, local animations (`motion/react`), and state bindings.
   - Database operations, external API calls, and authentication handles must reside EXCLUSIVELY in `src/services/`.
   - Utility functions (e.g., encryption, math) must live in `src/utils/`.

2. **Database & API Isolation**:
   - `firebase.ts` initializes the SDK. No UI components may interact directly with raw Firestore refs if an isolated service layer covers the operation.
   - Use `dataService.ts`, `authService.ts`, and `cmsService.ts` as the central proxies.

3. **No Circular Dependencies**:
   - Services must never import pages or layout components.
   - Data types must be imported from the central `src/types.ts` registry.

4. **Import Protocol**:
   - Always resolve imports cleanly. Use relative paths starting from the module level (`../services/` or `../../services/`).
   - Remove unused or duplicate import declarations.
