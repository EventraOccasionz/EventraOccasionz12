# Routing Pages & Orchestrators — `src/pages/`

## Purpose
Full-screen router routes that coordinate layout rendering, business transaction dispatching, and view assembly.

## Ownership
- **Owner Module**: Core Pages
- **Design Intent**: Pages act as the intermediate controllers. They connect the presentational components (`src/components/`) to the business services (`src/services/`).

## Folder Boundaries & Restrictions
- **Allowed Files**: High-level page orchestrators mapped to React Router entries (e.g. `AdminDashboard.tsx`, `InvitePage.tsx`, `Home.tsx`).
- **Forbidden Files**: Granular sub-components (e.g. specialized buttons, specific modal designs).
- **Dependencies**: React Router, standard react hooks, production services.
