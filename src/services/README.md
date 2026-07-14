# Database & API Integrations Layer — `src/services/`

## Purpose
This directory houses all service layer interfaces, Firestore bindings, and authentication wrappers. This represents the sole interface between the presentation components and the backend.

## Ownership
- **Owner Module**: Core Services Layer / Core System
- **Design Intent**: All business logic, database queries, and backend transactions must live exclusively in this folder. Presentational components consume data from services and trigger actions without writing database queries.

## Subdirectories
- `seed/`: Runtime production seeders and static CMS catalogs that are dynamically loaded on-demand by the application interface (e.g. `seedDatabase.ts`).

## Guidelines
- **Allowed Files**: Service classes, API client initializers, and backend interfaces using pure TypeScript.
- **Forbidden Files**: React DOM elements, HTML rendering nodes, or localized interactive styling configurations.
