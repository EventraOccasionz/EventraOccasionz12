# Stateless Helper Utilities — `src/utils/`

## Purpose
This directory houses pure helper functions, stateless cryptographic wrappers, and date/string formatters.

## Ownership
- **Owner Module**: Core Utilities
- **Design Intent**: Functions inside `src/utils/` should be completely stateless, side-effect-free, and decoupled from direct database instances (e.g. they should not reference `db` or `auth` directly).

## Guidelines
- **Allowed Files**: Mathematical calculators, TOTP secret generation, date-time formatters, and string parsers.
- **Forbidden Files**: Stateful React components, Firestore CRUD clients, or authentication routers.
