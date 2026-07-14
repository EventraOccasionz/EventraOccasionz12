# Project Context — EventraOccasionz

EventraOccasionz is a luxury, production-ready full-stack Event Management Platform designed to orchestrate events, manage high-profile guest invitations, triage RSVPs, coordinate local logistics (hotel room allocations, transit airport cabs), and empower client CMS portfolios.

## High-Level Vision
To supply wedding planners, corporate hosts, and private celebrants with a premium, robust, single-dashboard command center. Security (MFA, route guards), scalability (Firebase/Firestore persistence), and micro-interaction visual polish (Tailwind CSS, premium display typography) represent the foundation of the platform.

## Technology Stack
- **Frontend Framework**: React 18+ with TypeScript
- **Bundler & Tooling**: Vite with Tailwind CSS
- **Routing**: React-Router-DOM v6
- **Database & Services**: Cloud Firestore (NoSQL), Firebase Authentication, Firebase Storage
- **Security Features**: TOTP-based Two-Factor Authentication (2FA) with `otplib` and noble-crypto, Protected Route guards, Inactivity session auto-logout.
- **Analytics & Visualizations**: `recharts` for dynamic bento stats, Sparklines, and Progress Target Meters.
- **Production Server**: Express (configured in `server.ts` for serving the built assets on Port 3000 in container nodes).
