# Archive Directory — `/archive/`

## Purpose
This directory contains frozen, deprecated, or legacy files from past developer iterations. Files are placed here to maintain a history of structural changes and scripts without polluting the active production codebase.

## Ownership
- **Owner Module**: Core System Runtime
- **Design Intent**: No code inside the `archive/` directory may be imported or executed by active production code. It serves strictly as a cold-storage history.

## Subdirectories
- `legacy/`: Past developer patch scripts and temporary JavaScript fixes from the root directory.
- `deprecated/`: Structural cleanup, migration, and previous refactoring tools from `/src/lib/`.
- `review/`: Diagnostic utilities and static JSON data configurations (e.g., database checkers, city updaters, and static mock user catalogs).

## Guidelines
- **Allowed Files**: Any code that is completely unreferenced by production assets but preserved for safety.
- **Forbidden Files**: Active service registries or imported configurations.
