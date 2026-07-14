# Stage 4 — Service Architecture Audit Report

## 1. adminService
* **Purpose**: Admin functionality including CRUD for families, check-ins, tracking, settings, staff, and overall management.
* **Public methods**: `getAuditLogs`, `createAuditLog`, `addFamily`, `getFamilies`, `updateFamily`, `deleteFamily`, `getFamilyByCode`, `getFamilyBySlug`, `getAccounts`, `addAccount`, `updateUserRoleAndPhone`, `getVenueSettings`, `updateVenueSettings`, `getAboutSettings`, `updateAboutSettings`.
* **Internal dependencies**: None
* **External dependencies**: `firebase/firestore`
* **Firebase dependencies**: `firestore`
* **Cross-service dependencies**: `firebase`, `authService`
* **Circular dependencies**: None
* **Duplicate responsibilities**: None natively, but highly shadowed by `dataService`.
* **Estimated complexity**: High
* **Risk level**: Medium

## 2. authService
* **Purpose**: Admin & User Authentication, Two-Factor Auth (TOTP), Session management (Inactivity logout).
* **Public methods**: `login`, `logout`, `signUp`, `signInWithGoogle`, `forgotPassword`, `isConfigured`, `isDemoMode`, `getCurrentUser`, `getAdminWhitelist`, `setupTwoFactor`, `verifyTwoFactor`, `checkAuth`, `initializeInactivityTimer`, `resetInactivityTimer`.
* **Internal dependencies**: None
* **External dependencies**: `firebase/auth`
* **Firebase dependencies**: `auth`, `firestore` (for role / rules verification)
* **Cross-service dependencies**: `firebase`
* **Circular dependencies**: None
* **Duplicate responsibilities**: None
* **Estimated complexity**: Medium
* **Risk level**: High (Security-critical)

## 3. bookingService
* **Purpose**: RSVPs, room bookings, transportation submissions, and general inquiries.
* **Public methods**: `getRSVPs`, `submitRSVP`, `getTransports`, `submitTransport`, `getRooms`, `setRoomBooking`, `deleteRoomBooking`, `getInquiries`, `addInquiry`, `updateInquiryStatus`, `deleteInquiry`.
* **Internal dependencies**: None
* **External dependencies**: `firebase/firestore`
* **Firebase dependencies**: `firestore`
* **Cross-service dependencies**: `firebase`, `authService`
* **Circular dependencies**: None
* **Duplicate responsibilities**: None
* **Estimated complexity**: Low
* **Risk level**: Low

## 4. cmsService
* **Purpose**: Content management for dynamic features (categories, subcategories, services, media library).
* **Public methods**: `getCategories`, `addCategory`, `updateCategory`, `deleteCategory`, `duplicateCategory`, `getSubCategories`, `addSubCategory`, `updateSubCategory`, `deleteSubCategory`, `getServices`, `addService`, `updateService`, `deleteService`, `getMediaLibrary`, `addMediaItem`, `deleteMediaItem`, `triggerSitemapRebuild`.
* **Internal dependencies**: None
* **External dependencies**: `firebase/firestore`
* **Firebase dependencies**: `firestore`
* **Cross-service dependencies**: `firebase`, `authService`
* **Circular dependencies**: None
* **Duplicate responsibilities**: Overlaps with `galleryService` (media management).
* **Estimated complexity**: Medium
* **Risk level**: Low

## 5. dataService
* **Purpose**: God-object Facade pattern re-exporting methods from almost all other services to create a single access point.
* **Public methods**: Re-exports methods from `authService`, `bookingService`, `cmsService`, `galleryService`, `adminService`, `storageService`.
* **Internal dependencies**: None
* **External dependencies**: None
* **Firebase dependencies**: None
* **Cross-service dependencies**: `authService`, `bookingService`, `cmsService`, `galleryService`, `adminService`, `storageService`
* **Circular dependencies**: None
* **Duplicate responsibilities**: Extreme (The entire file is duplication).
* **Estimated complexity**: Low
* **Risk level**: High (Creates unnecessary coupling and bloated bundle sizes; forces all services to be imported whenever one is needed).

## 6. fcmService
* **Purpose**: Push notification integration using Firebase Cloud Messaging.
* **Public methods**: `requestPermission`, `onMessageListener`
* **Internal dependencies**: None
* **External dependencies**: `firebase/messaging`, `firebase/app`
* **Firebase dependencies**: `firestore`, `messaging`, `app`
* **Cross-service dependencies**: `firebase.ts`
* **Circular dependencies**: Vite dynamic import conflicts (dynamically imports `firebase/app` and `firebase-applet-config.json` while `firebase.ts` statically imports them).
* **Duplicate responsibilities**: None
* **Estimated complexity**: Low
* **Risk level**: Medium (Due to dynamic import bundler warnings/conflicts).

## 7. firebase
* **Purpose**: Initialize Firebase app and export initialized instances (db, auth).
* **Public methods**: `db`, `auth`, `handleFirestoreError`, `verifyFirebaseConnection`.
* **Internal dependencies**: None
* **External dependencies**: `firebase/app`, `firebase/auth`, `firebase/firestore`
* **Firebase dependencies**: `app`, `auth`, `firestore`
* **Cross-service dependencies**: none
* **Circular dependencies**: None
* **Duplicate responsibilities**: None
* **Estimated complexity**: Low
* **Risk level**: Critical (Core dependency)

## 8. galleryService
* **Purpose**: Legacy media gallery management.
* **Public methods**: `getGallery`, `addGalleryItem`, `updateGalleryItem`, `deleteGalleryItem`.
* **Internal dependencies**: None
* **External dependencies**: `firebase/firestore`
* **Firebase dependencies**: `firestore`
* **Cross-service dependencies**: `firebase`, `authService`
* **Circular dependencies**: None
* **Duplicate responsibilities**: Overlaps significantly with `cmsService.ts` (Media Library).
* **Estimated complexity**: Low
* **Risk level**: Low

## 9. storageService
* **Purpose**: Upload and manage images and guest documents, resizing/compressing logic.
* **Public methods**: `uploadImage`, `deleteImage`, `saveGuestDocument`, `getGuestDocuments`, `updateDocumentStatus`, `deleteGuestDocument`.
* **Internal dependencies**: None
* **External dependencies**: `firebase/firestore`
* **Firebase dependencies**: `firestore`, `auth`
* **Cross-service dependencies**: `firebase`, `authService`
* **Circular dependencies**: Dynamic import of `firebase` while also statically importing it.
* **Duplicate responsibilities**: None
* **Estimated complexity**: Medium
* **Risk level**: Medium (Client-side compression, dynamic import conflicts)

---

## Service Dependency Graph

```text
firebase
├── authService
├── adminService
├── bookingService
├── cmsService
├── fcmService
├── galleryService
└── storageService

dataService (Facade)
├── authService
├── bookingService
├── cmsService
├── galleryService
├── adminService
└── storageService
```

## Migration Recommendations (Stage 4)

1. **Services that can remain independent**:
   - `authService.ts`
   - `bookingService.ts`
   - `firebase.ts`

2. **Services that should be merged or deleted**:
   - **`dataService.ts`**: This should be completely DELETED. All UI components should import from the specific domain services (`adminService`, `cmsService`, etc.) directly to prevent loading the entire backend logic in every component.
   - **`galleryService.ts`**: Should be merged into `cmsService.ts` or deprecated entirely as `cmsService` now manages media.

3. **Services that violate separation of concerns**:
   - **`dataService.ts`**: A massive god-object that tightly couples all other services together.
   - **`storageService.ts`**: Contains both raw image compression (which is a utility function) and domain logic (`guest_documents`). The `guest_documents` logic should probably be moved to `adminService` or `bookingService`.

4. **Hidden dependencies / Runtime Risks**:
   - **`fcmService.ts` & `storageService.ts`**: Both contain dynamic `import()` statements to `firebase` modules or config files that are also statically imported by `firebase.ts`. This is causing Vite Rollup chunking errors (`dynamic import will not move module into another chunk`). We must convert these dynamic imports to standard static imports at the top of the file, or abstract the Firebase initialization.
