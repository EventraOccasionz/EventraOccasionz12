# Project Rules & Coding Conventions

These rules are the absolute coding laws of EventraOccasionz.

## 1. Technical Declarations
- **TypeScript Only**: Pure types, interface declarations, and standard enums. Do not use `any` unless absolutely forced. Avoid casting assertions (`as any`) where strong contracts exist in `src/types.ts`.
- **React Components**: Implement functional components with modern hooks. Do not update state directly inside render bodies.
- **`useEffect` Dependency Arrays**: Prefer primitive dependencies (booleans, strings, numbers). Never feed non-memoized objects or arrays into dependency listings to prevent rapid infinite re-render loops.

## 2. Style & Typography Laws
- **Tailwind Only**: No inline styles or external `.css` files. Custom design values must be mapped to classes or standard Tailwind variables.
- **Typography Selection**:
  - Headings / Serif: Elegant decorative fonts (serif, Playfair Display) paired with `text-gold` or `text-cream`.
  - Body UI: Standard crisp sans-serif ("Inter") with generous spacing.
  - Telemetry / Numeric Data: Tech-forward monospace ("JetBrains Mono" or standard monospace) for data cells and stats.
- **Aesthetics & Tone**: Avoid flashing colors or excessive gradients. Use dark slate backgrounds, custom translucent borders (`border-white/5`), and smooth micro-animations. No larping system indicators ("ONLINE", "LIVE", etc.) unless functional.

## 3. Database Rules
- Always load the `firebase-integration` skill for DB tasks.
- Keep Firestore collection schemas uniform. Ensure security rules (`firestore.rules`) permit read/write channels for authenticated sessions where required, and deny public write channels on administrative catalogs.

## 4. Reorganization Restrictions
- Never rename public APIs or service hooks unless part of a synchronized refactor.
- Moving files must proceed through the 10 Stage Reorganization pipeline under strict dependency testing.
