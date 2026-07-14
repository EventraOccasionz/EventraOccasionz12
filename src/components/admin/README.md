# Admin Control Panel Components — `src/components/admin/`

## Purpose
Visual segments, tabs, analytics panels, and forms that integrate into the administrator management center.

## Ownership
- **Owner Module**: Admin Module
- **Design Intent**: Components bind to statistics feeds, tables, and CMS catalogs. Interaction-heavy elements emit triggers back up to the main dashboard container.

## Folder Boundaries & Restrictions
- **Allowed Files**: Sub-tabs (`ServicesTab`, `EventsTab`, `AuditTab`) and bento reports (`AnalyticsPanel`).
- **Forbidden Files**: Direct Auth providers, raw firebase initialization.
- **Dependencies**: Recharts, Lucide-React, `src/types.ts`.
