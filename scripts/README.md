# Maintenance & Utility Scripts — `/scripts/`

## Purpose
This directory hosts production-safe maintenance, seeding, and automated diagnostic scripts. These utilities are executed manually or via pre-build hooks but never loaded inside the user's active browser runtime.

## Ownership
- **Owner Module**: Core Infrastructure / DevSecOps
- **Design Intent**: Scripts in this folder are designed to be run server-side in Node.js (via `tsx` or standard Node). They should not import any client-side modules or standard React code.

## Subdirectories
- `seed/`: One-off seeders used to populate or customize the live cloud database during staging or manual maintenance.
- `maintenance/`: System health checkers, diagnostic reports, and index verify scripts.

## Guidelines
- **Allowed Files**: Independent CLI scripts, JSON seed tables, and Drizzle/Firestore manual transaction modules.
- **Forbidden Files**: Core React components or files that must be bundled into the production web bundle.
