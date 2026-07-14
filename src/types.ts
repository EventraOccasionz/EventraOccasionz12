export type EventType = 'Wedding' | 'Engagement' | 'Haldi' | 'Mehendi' | 'Sangeet' | 'Reception' | 'Birthday' | 'Anniversary' | 'Baby Shower' | 'House Warming' | 'Corporate Event' | 'Custom Event';

export interface EventData {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  type?: EventType | string;
  date: string;
  time?: string;
  venue: string;
  location?: string;
  gallery?: string[];
  host?: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Archived' | 'Active';
  created_at: string;
  updated_at?: string;
  bride?: string;
  groom?: string;
  eventName?: string;
  familyName?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  state?: string;
  clientName?: string;
  clientMobile?: string;
  clientEmail?: string;
  expectedGuests?: number;
  hotelName?: string;
  previousStatus?: string;

  // Category-Specific fields
  brideParents?: string;
  groomParents?: string;
  weddingHashtag?: string;
  birthdayPersonName?: string;
  birthdayAge?: string;
  birthdayTheme?: string;
  companyName?: string;
  corporateEventType?: string;
  corporateContactPerson?: string;
  anniversaryMilestone?: string;
  anniversaryCoupleNames?: string;
  babyShowerParentNames?: string;
  babyShowerMotherName?: string;
  babyShowerTheme?: string;
  engagementCoupleNames?: string;
  hostedBy?: string;
  customCategoryName?: string;
}

export type VerificationStatus = 'Pending' | 'Verified' | 'Rejected';

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
  verification_status?: VerificationStatus;
  family_id?: string;
  guest_id?: string;
  family_name?: string;
  event_id?: string;
  notes?: string;
}

export interface Family {
  id: string;
  event_id?: string;
  name: string; // e.g. "Sharma Family"
  access_code: string; // e.g. "SHARMA2026"
  slug: string; // e.g. "sharma-family"
  max_guests: number;
  created_at: string;
  guest_image?: string; // Optional custom guest or family photo link (Base64 or URL)
  custom_greeting?: string; // Optional customized welcome narrative
  custom_title?: string; // Optional relationship title/caption (e.g. "Beloved Groom's Friends", "Our Honored Uncle")
  documents?: UploadedDocument[];
  rsvp_locked?: boolean; // Admin can lock RSVP editing
}

export interface RSVP {
  id: string;
  event_id?: string;
  family_id: string;
  guest_name: string;
  email: string;
  attending: boolean;
  total_guests: number;
  children_count: number;
  custom_notes?: string;
  dietary_requirements?: string;
  events: string[]; // e.g. ["Haldi", "Mehndi", "Wedding"]
  checked_in?: boolean;
  checked_in_at?: string; // Save check-in time for admin check-in
  created_at: string;
  updated_at?: string;
  
  // Premium RSVP Fields
  family_name?: string;
  primary_guest?: string;
  mobile_number?: string;
  adults_count?: number;
  family_members?: string[]; // Names of all family members
  arrival_method?: 'Flight' | 'Train' | 'Bus' | 'Car' | 'Other';
  pickup_required?: boolean;
  pickup_location?: string;
  arrival_date?: string;
  arrival_time?: string;
  flight_number?: string;
  train_number?: string;
  drop_required?: boolean;
  drop_location?: string;
  drop_date?: string;
  drop_time?: string;
  aadhaar_url?: string; // Aadhaar card upload
  special_requests?: string;
  functions_attending?: string[]; // Functions list they are attending
  rsvp_locked?: boolean; // Admin can lock individual RSVP
}

export interface TransportRequest {
  id: string;
  event_id?: string;
  family_id: string;
  mode: 'Car' | 'Bus' | 'Train' | 'Flight';
  need_cab: boolean;
  pickup_location?: string;
  arrival_time?: string;
  details?: string;
  created_at: string;
  updated_at?: string;
  
  // Premium Vehicle Fields published by Admin
  driver_name?: string;
  vehicle_number?: string;
  driver_contact?: string;
  pickup_time?: string;
}

export interface RoomBooking {
  id: string;
  event_id?: string;
  family_id: string;
  hotel_name?: string;
  room_number?: string;
  floor?: string; // Room floor
  check_in?: string;
  check_out?: string;
  status: 'Pending' | 'Confirmed' | 'Checked-in' | 'Checked-out';
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export interface RegisteredAccount {
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone_number?: string;
  passcode?: string;
  slug?: string;
  created_at?: string;
}

export type InquiryStatus = 'Pending' | 'Contacted' | 'Completed';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  service_selected: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export interface SEOSettings {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  og_image?: string;
  schema_data?: string;
  robots_index?: boolean;
}

export interface HomepageSettings {
  show_on_homepage?: boolean;
  featured?: boolean;
  homepage_priority?: number;
  homepage_image?: string;
  homepage_desc?: string;
  homepage_btn_text?: string;
  homepage_btn_link?: string;
}

export interface Category extends SEOSettings, HomepageSettings {
  id: string;
  name: string;
  slug: string;
  short_desc: string;
  full_desc?: string;
  banner_image?: string;
  thumbnail_image?: string;
  icon?: string;
  display_order: number;
  status: 'Published' | 'Draft' | 'Hidden';
  created_at?: string;
}

export interface SubCategory extends SEOSettings, HomepageSettings {
  id: string;
  category_id: string;
  category_slug?: string;
  name: string;
  slug: string;
  short_desc: string;
  full_desc?: string;
  banner_image?: string;
  thumbnail_image?: string;
  featured_image?: string;
  display_order: number;
  status: 'Published' | 'Draft' | 'Hidden';
  created_at?: string;
}

export interface Service extends SEOSettings, HomepageSettings {
  id: string;
  cat?: string; // compatibility with legacy
  ico: string;
  name: string;
  slug?: string;
  desc: string;
  full_desc?: string;
  feats: string[];
  price?: string;
  starting_from?: string; // Legacy
  price_num?: number;
  calculation_type?: string;
  unit_name?: string;

  // Comprehensive Pricing Engine Fields
  standard_price?: number;
  premium_price?: number;
  luxury_price?: number;
  custom_price?: number;
  currency?: string;
  tax_included?: boolean;
  gst_percentage?: number;
  discount_allowed?: boolean;
  pricing_unit?: string; // e.g. Per Guest, Per Plate, Per Room, Per Night, Per Event, Per Person, Per Machine, Per Hour, Per Day, Per Vehicle, Per KM, Custom Unit
  calculation_formula?: string;
  min_quantity?: number;
  max_quantity?: number;
  min_charge?: number;
  
  // Advanced Dynamic Pricing
  city_pricing?: Record<string, { standard_price?: number; premium_price?: number; luxury_price?: number; }>;
  season_pricing?: { off_season_multiplier?: number; peak_season_multiplier?: number; wedding_season_multiplier?: number; };
  
  order_index?: number; // compatibility with legacy
  display_order?: number;
  visible?: boolean; // compatibility with legacy
  status?: 'Published' | 'Draft' | 'Hidden';
  sub_category_id?: string;
  sub_category_slug?: string;
  category_id?: string;
  category_slug?: string;
  thumbnail?: string;
  banner?: string;
  gallery?: string[];
  videos?: string[];
  highlights?: string[];
  faqs?: { question: string; answer: string }[];
  created_at?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  folder: string;
  tags: string[];
  size?: number;
  created_at?: string;
}

export interface GalleryItem {
  id: string;
  cat: string;
  lbl: string;
  bg?: string; // fallback CSS background
  image_url?: string; // Firebase Storage public url
  order_index: number;
  visible: boolean;
  created_at?: string;
}

export interface AdminSettings {
  key: string;
  value: any;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performer: string;
  category: string;
  details: string;
}

// === CMS FOUNDATION LAYER TYPES ===

export type CMSPageStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export interface CMSPage {
  id: string;             // Document ID
  slug: string;           // URL routing path
  title: string;          // Browser page title
  seo_id: string;         // Reference to specialized SEO configuration
  layout_id: string;      // Reference to layout template
  status: CMSPageStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
  author_id: string;
}

export interface CMSPageSection {
  id: string;
  page_id: string;
  type: 'hero' | 'about' | 'services' | 'gallery' | 'testimonials' | 'faq' | 'timeline' | 'contact' | 'footer' | 'custom';
  component_key: string;  // e.g. 'Hero01', 'GalleryLuxury'
  order_index: number;    // Multi-index sorting float
  is_visible: boolean;
  schedule?: {
    publish_at?: string;
    unpublish_at?: string;
  };
  layout_config: {
    padding_y?: 'none' | 'small' | 'medium' | 'large';
    bg_preset?: 'default' | 'surface' | 'accent' | 'luxury';
    glass_effect?: boolean;
    border_bottom?: boolean;
  };
}

export interface CMSSectionContent {
  id: string;
  section_id: string;
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
      media_id: string;
      asset_url: string;
      alt_text: string;
      caption?: string;
      order: number;
    }>;
    text_blocks?: Array<{
      title: string;
      body: string;
      icon?: string;
    }>;
    custom_fields?: Record<string, any>;
  };
  last_updated: string;
  updated_by: string;
}

export interface CMSPageVersion {
  id: string;
  page_id: string;
  version_number: number;
  snapshot: {
    page: Omit<CMSPage, 'id'>;
    sections: Array<Omit<CMSPageSection, 'id'>>;
    content: Record<string, any>; // section_id -> content details
  };
  created_at: string;
  created_by: string;
  change_reason: string;
}

export interface CMSThemeTokens {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
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
    headings_font: string;
    body_font: string;
    base_size: string;
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

export interface CMSGlobalVariables {
  id: string;
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
    logo_dark: string;
    logo_light: string;
    favicon: string;
    copyright_text: string;
  };
}

export interface CMSAnalytics {
  id: string;
  page_id: string;
  section_id?: string;
  metric_type: 'view' | 'click' | 'conversion';
  element_id?: string;
  user_agent?: string;
  referrer?: string;
  timestamp: string;
}

