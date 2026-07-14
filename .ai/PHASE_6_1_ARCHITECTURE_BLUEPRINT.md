# EventraOccasionz — Phase 6.1 Visual CMS Architecture Blueprint

This document details the normalized, scalable, and highly decoupled architecture designed to transform EventraOccasionz into an enterprise-grade, metadata-driven Visual CMS. It implements a complete division between **Content**, **Layout**, and **Theme**, avoiding document bloat, mitigating Firestore write limitations, and enabling dynamic component rendering.

---

## 1. Normalized Firestore Collections & Schema Specifications

By decoupling layout, content, versions, and analytics, we ensure that changing single blocks does not require rewriting massive documents. This optimizes Firestore billing, prevents document size limit (1MB) exhaustion, and enables seamless concurrency.

### `pages` (Metadata & Routing)
Stores page-level parameters and routing rules.
```typescript
interface PageDocument {
  id: string;             // Firestore document ID (e.g. 'home', 'wedding_landing')
  slug: string;           // URL routing path (e.g. '/', '/wedding-services')
  title: string;          // Browser page title
  seo_id: string;         // Reference to specialized SEO configuration
  layout_id: string;      // Reference to layout template
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  created_at: string;     // ISO timestamp
  updated_at: string;     // ISO timestamp
  published_at?: string;  // ISO timestamp of latest publication
  author_id: string;      // Editor user ID
}
```

### `page_sections` (Layout Order & Structure)
Maintains structural positions of sections on a given page.
```typescript
interface PageSectionDocument {
  id: string;             // UUID (e.g., 'sec_hero_home_9182')
  page_id: string;        // Foreign key -> pages.id
  type: 'hero' | 'about' | 'services' | 'gallery' | 'testimonials' | 'faq' | 'timeline' | 'contact' | 'footer' | 'custom';
  component_key: string;  // Identifies registration key (e.g. 'Hero02', 'GalleryLuxury')
  order_index: number;    // Multi-index sorting float (supports drag-and-drop floating repositioning)
  is_visible: boolean;
  schedule?: {
    publish_at?: string;  // Automated content reveal
    unpublish_at?: string; // Automated content hide
  };
  layout_config: {
    padding_y?: 'none' | 'small' | 'medium' | 'large';
    bg_preset?: 'default' | 'surface' | 'accent' | 'luxury';
    glass_effect?: boolean;
    border_bottom?: boolean;
  };
}
```

### `section_content` (Pure Content Payload)
Houses the key-value attributes rendered by target components.
```typescript
interface SectionContentDocument {
  id: string;             // UUID
  section_id: string;     // Foreign key -> page_sections.id
  content: {
    heading?: string;
    sub_heading?: string;
    description?: string;
    cta_buttons?: Array<{
      text: string;
      link: string;
      style: 'primary' | 'secondary' | 'outline';
      icon?: string;
    }>;
    media_assets?: Array<{
      media_id: string;   // Foreign key -> media_library.id
      asset_url: string;  // Cached CDN/Firestore Base64 fallbacks
      alt_text: string;
      caption?: string;
      order: number;
    }>;
    text_blocks?: Array<{
      title: string;
      body: string;
      icon?: string;
    }>;
    custom_fields?: Record<string, any>; // Adaptable fields for custom developer widgets
  };
  last_updated: string;
  updated_by: string;
}
```

### `page_versions` (Historical Revision & Rollbacks)
Maintains historical backups of entire page structures for comparing and restoring previous states.
```typescript
interface PageVersionDocument {
  id: string;
  page_id: string;
  version_number: number;
  snapshot: {
    page: Omit<PageDocument, 'id'>;
    sections: Array<Omit<PageSectionDocument, 'id'>>;
    content: Record<string, any>; // Keyed by section_id -> content fields
  };
  created_at: string;
  created_by: string;
  change_reason: string;
}
```

### `theme_tokens` (Design Tokens & Styling Configurations)
Controls visual styling variables globally.
```typescript
interface ThemeTokensDocument {
  id: string;             // e.g. 'active_theme_presets'
  name: string;           // Theme configuration name
  colors: {
    primary: string;      // CSS Color string (e.g. '#C5A880' - Luxury Gold)
    secondary: string;    // e.g. '#1E293B' - Royal Slate
    accent: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    text_primary: string;
    text_secondary: string;
  };
  typography: {
    headings_font: string; // Google font name or class (e.g., 'Space Grotesk')
    body_font: string;     // e.g. 'Inter'
    base_size: string;     // e.g. '16px'
  };
  spacing: {
    button_radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    card_radius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    animation_speed: 'slow' | 'normal' | 'fast' | 'none';
  };
  effects: {
    glass_intensity: 'none' | 'light' | 'heavy';
    box_shadow: 'none' | 'flat' | 'luxury-depth' | 'dreamy';
  };
  is_dark_mode: boolean;
}
```

### `global_variables` (Company Details & Constants)
Reusable static variables rendered in headers, footers, and templates.
```typescript
interface GlobalVariablesDocument {
  id: string;             // 'site_globals'
  company_name: string;
  contact: {
    phone: string;
    email: string;
    address: string;
    business_hours: string;
  };
  social_links: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    pinterest?: string;
  };
  branding: {
    logo_dark: string;     // Base64 or CDN URL
    logo_light: string;
    favicon: string;
    copyright_text: string;
  };
}
```

### `media_library` (Centralized Media Assets Asset Manager)
Optimized file metadata indexing for SEO, folders, optimization.
```typescript
interface MediaAssetDocument {
  id: string;
  file_name: string;
  url: string;            // Primary asset reference
  mime_type: string;
  file_size_bytes: number;
  width?: number;
  height?: number;
  folder_path: string;    // Virtual directory layout (e.g., "hero/banners")
  alt_text: string;
  seo_title: string;
  tags: string[];
  is_optimized: boolean;  // Compressed automatically by storage client
  created_at: string;
  updated_at: string;
}
```

### `dynamic_forms` (Form Builder Engine)
Dynamic generation and field layout of inquiry/booking/career forms.
```typescript
interface FormBuilderDocument {
  id: string;             // e.g., 'corporate_booking_form'
  title: string;
  description?: string;
  fields: Array<{
    id: string;           // Form element key
    label: string;
    type: 'text' | 'textarea' | 'number' | 'phone' | 'email' | 'date' | 'time' | 'dropdown' | 'radio' | 'checkbox' | 'file';
    required: boolean;
    placeholder?: string;
    options?: string[];   // Dropdown/Radio/Checkbox elements
    conditional_rule?: {
      depends_on_field: string;
      trigger_value: string;
      action: 'show' | 'hide';
    };
    validation_regex?: string;
  }>;
  submit_action: {
    notify_emails: string[];
    success_message: string;
    redirect_url?: string;
  };
}
```

### `rsvp_templates` (Dynamic RSVP Engine Configurations)
Question configurations for wedding, birthday, and special events.
```typescript
interface RSVPBuilderDocument {
  id: string;             // e.g., 'luxury_wedding_rsvp_v1'
  event_type: 'wedding' | 'birthday' | 'corporate' | 'anniversary' | 'custom';
  steps: Array<{
    title: string;
    description?: string;
    questions: Array<{
      id: string;
      type: 'text' | 'radio' | 'checkbox' | 'dropdown' | 'file' | 'guest_count' | 'meal_preference' | 'transportation' | 'room_booking' | 'custom_question';
      label: string;
      required: boolean;
      options?: string[];
      conditional_logic?: {
        depends_on: string;
        equals: string;
        action: 'show' | 'hide';
      };
    }>;
  }>;
}
```

### `cms_analytics` (Decoupled Performance Tracking)
Pure analytical ledger completely decoupled from content documents to maintain fast client transactions and avoid locking documents due to high read-write limits.
```typescript
interface CMSAnalyticsDocument {
  id: string;
  page_id: string;
  section_id?: string;
  metric_type: 'view' | 'click' | 'conversion';
  element_id?: string;    // Sub-component button ID
  user_agent?: string;
  referrer?: string;
  timestamp: string;      // Aggregated hourly or processed via backend background aggregators
}
```

---

## 2. ER-Style Data Relationships

The relational schema relies on standard document-referential Integrity paths, optimizing queries to only read sub-elements as needed:

```text
[pages] (Primary Entity)
   │
   ├── (1 : N) ──► [page_sections]
   │                    │
   │                    └── (1 : 1) ──► [section_content]
   │
   ├── (1 : N) ──► [page_versions] (Historical Backups)
   │
   └── (1 : N) ──► [cms_analytics] (Performance Ledger)

[media_library] ◄── (Ref ID) ── [section_content] (Renders base64 or optimized CDN URLs)

[layout_templates] ◄── (Template ID) ── [pages]

[theme_tokens] ── (Applies globally to layout canvas) ──► [Page Rendering Engine]

[global_variables] ── (Applies global constants to UI context) ──► [Global Site Shell]
```

---

## 3. Service Layer Design Architecture

We split service responsibilities cleanly to keep runtime imports isolated. All static/dynamic dependencies are direct, avoiding the bloated `dataService` facade pattern.

```text
               ┌───────────────────────┐
               │    Client UI Pages    │
               │ (Home, Admin, Custom) │
               └───────────┬───────────┘
                           │
      ┌────────────────────┼───────────────────┐
      ▼                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  cmsService │     │ authService │     │adminService │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ├───────────────────┼───────────────────┤
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────┐
│                  firebase.ts                 │
│         (Init, Auth, DB, Error Handler)      │
└──────────────────────────────────────────────┘
```

### Modular CMS Service Responsibilities:
* **`cmsService`**:
  * Resolves pages, dynamic layouts, and content payloads.
  * Spawns specialized managers under-the-hood to manage isolated scopes (`mediaService`, `formBuilderService`, `rsvpEngineService`).
* **`authService`**:
  * Manages identity and verification states, enforcing administrative validation.
* **`adminService`**:
  * Evaluates system audit logs, configures whitelist credentials, and handles global static settings variables.

---

## 4. Metadata-Driven Page Rendering Engine

The Guest Interface is completely powered by a dynamic routing and compilation engine. Instead of hardcoding components, the engine reads layout directives and maps them to specialized modules.

```text
              [Route Hit: /wedding]
                        │
                        ▼
            [PageRenderer Loader Hook]
                        │
                        ▼
       [Query pages WHERE slug == '/wedding']
                        │
                        ▼
         [Query page_sections ORDER BY order_index]
                        │
                        ▼
      [Query section_content FOR each section ID]
                        │
                        ▼
      [Execute ComponentRegistry Instantiation]
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   [Map Key: "Hero02"]           [Map Key: "GalleryLuxury"]
         │                             │
         ▼                             ▼
┌───────────────────┐         ┌───────────────────┐
│ Render Hero02     │         │ Render GalleryLux │
│ with content props│         │ with media items  │
└───────────────────┘         └───────────────────┘
```

---

## 5. Dynamic Component Registry Catalog

To maintain responsive, varied, and visual design layouts without duplicate code, we build a component registration directory matching database identifiers to actual visual React components.

```text
ComponentRegistry System
 ├── "hero"
 │    ├── "Hero01" (Standard Elegant Center Heading)
 │    ├── "Hero02" (Luxury Split Screen with Frame)
 │    └── "Hero03" (Video Backdrop Immersive Panel)
 ├── "gallery"
 │    ├── "GalleryGrid" (Responsive Balanced Photo Wall)
 │    ├── "GalleryMasonry" (Staggered Fine-Art Layout)
 │    └── "GalleryLuxury" (Premium Carousel with Lightbox)
 ├── "faq"
 │    ├── "Accordion" (Space-Optimized Accordion Grid)
 │    └── "FaqCards" (Bento-Grid Categorized Q&A Card Panels)
 └── "testimonials"
      ├── "TestimonialGrid" (Multi-Column Review Board)
      └── "TestimonialSlider" (Focus-Rotated Premium Carousel)
```

**Implementation Pattern:**
Using dynamic imports ensures that only the visual component requested by the page rendering configuration is included in the client's network stream, maintaining exceptional Lighthouse page speed scores.

```typescript
import React, { lazy } from 'react';

export const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  // Hero variations
  Hero01: lazy(() => import('../components/home/Hero')), // Base fallback
  Hero02: lazy(() => import('../components/cms/registry/HeroLuxury')),
  Hero03: lazy(() => import('../components/cms/registry/HeroVideo')),

  // Gallery variations
  GalleryGrid: lazy(() => import('../components/home/Gallery')),
  GalleryMasonry: lazy(() => import('../components/cms/registry/GalleryMasonry')),
  GalleryLuxury: lazy(() => import('../components/cms/registry/GalleryLuxury')),

  // FAQ variations
  Accordion: lazy(() => import('../components/cms/registry/FaqAccordion')),
  FaqCards: lazy(() => import('../components/cms/registry/FaqCards')),
};
```

---

## 6. Visual CMS Flow & Publish Pipeline

To protect the production workspace, updates made by the admin remain strictly isolated as a **Draft** version. Changes are only pushed live to guests upon passing review criteria and authorization stages.

```text
[Visual Editor Canvas] ──► [Instant Dynamic Preview (Updates local state only)]
          │
          ▼
    [Click Save] ──► [Write to draft section_content & page_sections state]
                          │
                          ▼
                    [Publish Stage]
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   [Manual Publish]               [Scheduled Publish]
         │                                 │
         │ (Admin approval event)          │ (Background CRON/Time Check)
         ▼                                 ▼
[Create Version Snapshot]          [Create Version Snapshot]
         │                                 │
         ▼                                 ▼
[Update page status -> "published"] [Update page status -> "published"]
         │                                 │
         └────────────────┬────────────────┘
                          │
                          ▼
            [Guest Invalidation Trigger]
           (Forces cache reset on clients)
```

---

## 7. Revised Directory Structures & Layout Boundaries

To preserve strict separation of concerns, the workspace maintains isolated boundaries for backend execution, visual editors, dynamic registry assets, and shared utility helpers.

```text
/app/applet/
├── .ai/                            # Architecture rules and blueprints
├── scripts/                        # Server-side system management scripts
│   ├── seed/                       # Database bootstrapping seeders
│   └── maintenance/                # Diagnostic utility scripts
├── src/
│   ├── components/
│   │   ├── cms/                    # MAIN CMS Engine Submodule
│   │   │   ├── EditorCanvas.tsx    # Drag-and-drop live edit workspace
│   │   │   ├── ThemeManager.tsx    # Palette selection and token updates
│   │   │   ├── MediaLibrary.tsx    # centralized folder-based media assets
│   │   │   ├── FormBuilder.tsx     # Custom input dynamic schema creation
│   │   │   └── registry/           # Lazy-loaded visual catalog files
│   │   │       ├── HeroLuxury.tsx
│   │   │       ├── GalleryLuxury.tsx
│   │   │       └── FaqAccordion.tsx
│   │   ├── layout/                 # Global navigation shells
│   │   └── ui/                     # Generic form elements & UI kit
│   ├── services/
│   │   ├── firebase.ts             # Primary connection initialization
│   │   ├── cmsService.ts           # Page and Dynamic Layout loading
│   │   ├── adminService.ts         # User settings, whitelist, audit logs
│   │   ├── authService.ts          # Authentication and Identity verification
│   │   └── fcmService.ts           # Decoupled notification handlers
│   └── types.ts                    # Consolidated CMS Types
```

---

## 8. API Route Design (Vite Dev / Cloud Run Native Node Backend API)

To protect secure API tokens and maintain performant, decoupled actions, all complex requests are proxied server-side in `server.ts` through dedicated paths.

### AI Assistant (Gemini Proxy)
* **Endpoint**: `POST /api/cms/ai-generate`
* **Purpose**: Safe server-side processing of prompts for layout assembly, text enhancement, and SEO optimization.
* **Request Schema**:
  ```json
  {
    "action": "improve_text" | "generate_faq" | "suggest_layout",
    "payload": {
      "context": "Fine art wedding services page",
      "target_field": "heading",
      "tone": "luxury"
    }
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "result": "Unveiling Splendor: Crafting Masterpiece Wedding Occasions"
  }
  ```

### Sitemap & Static Rebuilds
* **Endpoint**: `POST /api/cms/publish-rebuild`
* **Purpose**: Compiles a fresh SEO-compliant Google Sitemap based on dynamic pages and notifies search crawlers.

---

## 9. Scalability Justifications & Design Enhancements

### Document Size & Field Optimization
* **Old Structure**: Storing entire page modules in single large structures risked hitting the 1MB Firestore limit, and forced heavy read/write charges when editing simple text lines.
* **New Structure**: Normalizing sections means a text tweak to the FAQ only updates a single tiny `section_content` document (often <1KB), resulting in extremely fast read speeds, fast rendering, and minimal operational overhead.

### Dynamic Import Code Splitting
* Moving CMS editors, form builders, and visual options to a separate subfolder (`/src/components/cms/`) ensures that standard guests visiting the website never download these heavy admin tools. The guest bundle remains light, ensuring superior SEO scores.

### Completely Decoupled Analytical Logs
* Writing views and clicks directly into page documents is a common failure pattern that causes Firestore write limits (1 write/second per document) to be rapidly hit. By decoupling performance tracking to `cms_analytics` and batch-writing metrics, content documents remain completely static, ensuring fast load times.

---

## 10. Implementation Safeguards & Rollback Framework

### Safe Sandbox Rollbacks
To guarantee continuous operations during migration:
1. **Side-by-Side Coexistence**: The dynamic page rendering engine will run concurrently alongside legacy pages. The legacy hardcoded pages (`Home.tsx`) will remain active until the client explicitly tests and clicks "Publish Live" on the visual editor.
2. **Database Fallback Switch**: We maintain a fallback feature flag (`VITE_USE_LEGACY_PAGES=true`). If any layout exception triggers an error, the global `ErrorBoundary` will automatically route the client back to the legacy components, maintaining 100% website uptime.
3. **Database Restore**: Because every single layout save creates a version snapshot in `page_versions`, any admin can revert a broken layout configuration back to a stable baseline in under a second with no engineering interaction required.
