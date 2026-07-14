# Presentation Component Layer — `src/components/`

## Purpose
This directory houses all modular, presentational UI components of the EventraOccasionz platform. 

## Ownership
- **Owner Module**: Core Presentational Layer / Multiple Modules
- **Design Intent**: Components must remain presentational whenever possible. They consume data via props and invoke handlers defined in orchestrator pages or shared state. They must never directly run Firestore queries.

## Folder Boundaries & Restrictions
- **Allowed Files**: Clean React functional components, modular local sub-components, and styling declarations using Tailwind CSS utility classes.
- **Forbidden Files**: DB initialization handles, API service declarations, one-time migration scripts, or raw database transaction managers.
- **Dependencies**: Lucide React (icons), Recharts (charts), Motion/React (animations).

## Subdirectories
- `admin/`: Controls, charts, and table panels for the dashboard control room.
- `home/`: Public landing showcase components, testimonial grids, booking widgets.
- `invitations/`: Customized visual template layers for individual invitation types.
- `layout/`: Universal scaffolding assets (Navbar, Footer, Modal, ProtectedRoute).
- `rsvp/`: Individual interactive segments (passcode entry, document uploads).
- `dashboard/`: Presentational widgets for the personalized guest portal.
