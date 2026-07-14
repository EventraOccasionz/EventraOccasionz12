# Known Issues & Tech Debt

## Active Issues
- **None**: The application compiles cleanly with zero TypeScript errors or linter complaints.

## Tech Debt to Resolve (Refactoring Goals)
1. **Root Directory Clutter**: Unused CJS and JS patch scripts from past manual corrections must be archived or moved to helper script directories.
2. **Scattered Services**: Production services currently sit alongside database seeding programs inside `/src/lib/`. Services belong in `/src/services/` and seed utilities belong in `/scripts/seed/`.
3. **Mismatched Imports**: Moving files requires meticulous import path updates across multiple pages and components.
