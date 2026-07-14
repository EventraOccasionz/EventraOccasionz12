import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { Category, SubCategory, Service, MediaItem, CMSPage, CMSPageSection, CMSSectionContent, CMSPageVersion, CMSThemeTokens, CMSGlobalVariables, CMSAnalytics, CMSPageStatus } from '../types';
import { authService } from './authService';

export const cmsService = {
  // CATEGORIES (Level 1)
  async getCategories(): Promise<Category[]> {
    const path = 'categories';
    const deletedIds = JSON.parse(sessionStorage.getItem('deleted_cat_ids') || '[]');
    try {
      const q = query(collection(db, path), orderBy('display_order', 'asc'));
      const snapshot = await getDocs(q);
      const items: Category[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Category);
      });

      // Seeding if database holds no records and user is logged in
      if (items.length === 0) {
        const defaults = this.getDefaultCategories();
        console.log('Seeding default categories into Firestore...');
        for (const cat of defaults) {
          const docRef = doc(db, path, cat.id);
          await setDoc(docRef, { ...cat, created_at: new Date().toISOString() });
          items.push(cat);
        }
      }

      return items.filter(c => !deletedIds.includes(c.id));
    } catch (error) {
      console.warn('Firestore categories read failed, using default fallbacks:', error);
      return this.getDefaultCategories().filter(c => !deletedIds.includes(c.id));
    }
  },

  async addCategory(cat: Partial<Category>): Promise<Category> {
    const path = 'categories';
    try {
      const docRef = doc(collection(db, path));
      const cleanData: Category = {
        id: docRef.id,
        name: cat.name || '',
        slug: cat.slug || (cat.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        short_desc: cat.short_desc || '',
        full_desc: cat.full_desc || '',
        banner_image: cat.banner_image || '',
        thumbnail_image: cat.thumbnail_image || '',
        icon: cat.icon || '✨',
        display_order: cat.display_order ?? 10,
        status: cat.status || 'Published',
        show_on_homepage: cat.show_on_homepage ?? true,
        featured: cat.featured ?? false,
        seo_title: cat.seo_title || cat.name || '',
        seo_description: cat.seo_description || cat.short_desc || '',
        seo_keywords: cat.seo_keywords || '',
        canonical_url: cat.canonical_url || '',
        og_image: cat.og_image || '',
        schema_data: cat.schema_data || '',
        robots_index: cat.robots_index ?? true,
        homepage_image: cat.homepage_image || '',
        homepage_desc: cat.homepage_desc || '',
        homepage_btn_text: cat.homepage_btn_text || 'Explore Service',
        homepage_btn_link: cat.homepage_btn_link || '',
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      this.triggerSitemapRebuild();
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<void> {
    const path = `categories/${id}`;
    try {
      await updateDoc(doc(db, 'categories', id), cat);
      this.triggerSitemapRebuild();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const deletedIds = JSON.parse(sessionStorage.getItem('deleted_cat_ids') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      sessionStorage.setItem('deleted_cat_ids', JSON.stringify(deletedIds));
    }
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
      this.triggerSitemapRebuild();
    } catch (error: any) {
      console.warn('Database delete operation warning:', error.message);
    }
  },

  async duplicateCategory(category: Category): Promise<Category> {
    const dupe: Partial<Category> = {
      ...category,
      name: `${category.name} (Copy)`,
      slug: `${category.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      display_order: category.display_order + 1
    };
    delete dupe.id;
    return this.addCategory(dupe);
  },

  // SUB CATEGORIES (Level 2)
  async getSubCategories(): Promise<SubCategory[]> {
    const path = 'sub_categories';
    const deletedIds = JSON.parse(sessionStorage.getItem('deleted_subcat_ids') || '[]');
    try {
      const q = query(collection(db, path), orderBy('display_order', 'asc'));
      const snapshot = await getDocs(q);
      const items: SubCategory[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as SubCategory);
      });

      if (items.length === 0) {
        const defaults = this.getDefaultSubCategories();
        console.log('Seeding default subcategories into Firestore...');
        for (const sub of defaults) {
          const docRef = doc(db, path, sub.id);
          await setDoc(docRef, { ...sub, created_at: new Date().toISOString() });
          items.push(sub);
        }
      }

      return items.filter(s => !deletedIds.includes(s.id));
    } catch (error) {
      console.warn('Firestore subcategories read failed, using default fallbacks:', error);
      return this.getDefaultSubCategories().filter(s => !deletedIds.includes(s.id));
    }
  },

  async addSubCategory(sub: Partial<SubCategory>): Promise<SubCategory> {
    const path = 'sub_categories';
    try {
      const docRef = doc(collection(db, path));
      const cleanData: SubCategory = {
        id: docRef.id,
        category_id: sub.category_id || '',
        category_slug: sub.category_slug || '',
        name: sub.name || '',
        slug: sub.slug || (sub.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        short_desc: sub.short_desc || '',
        full_desc: sub.full_desc || '',
        banner_image: sub.banner_image || '',
        thumbnail_image: sub.thumbnail_image || '',
        featured_image: sub.featured_image || '',
        display_order: sub.display_order ?? 10,
        status: sub.status || 'Published',
        show_on_homepage: sub.show_on_homepage ?? true,
        featured: sub.featured ?? false,
        seo_title: sub.seo_title || sub.name || '',
        seo_description: sub.seo_description || sub.short_desc || '',
        seo_keywords: sub.seo_keywords || '',
        canonical_url: sub.canonical_url || '',
        og_image: sub.og_image || '',
        schema_data: sub.schema_data || '',
        robots_index: sub.robots_index ?? true,
        homepage_image: sub.homepage_image || '',
        homepage_desc: sub.homepage_desc || '',
        homepage_btn_text: sub.homepage_btn_text || 'Learn More',
        homepage_btn_link: sub.homepage_btn_link || '',
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      this.triggerSitemapRebuild();
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateSubCategory(id: string, sub: Partial<SubCategory>): Promise<void> {
    const path = `sub_categories/${id}`;
    try {
      await updateDoc(doc(db, 'sub_categories', id), sub);
      this.triggerSitemapRebuild();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteSubCategory(id: string): Promise<void> {
    const deletedIds = JSON.parse(sessionStorage.getItem('deleted_subcat_ids') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      sessionStorage.setItem('deleted_subcat_ids', JSON.stringify(deletedIds));
    }
    const path = `sub_categories/${id}`;
    try {
      await deleteDoc(doc(db, 'sub_categories', id));
      this.triggerSitemapRebuild();
    } catch (error: any) {
      console.warn('Database delete operation warning:', error.message);
    }
  },

  // SERVICES (Level 3 / Details)
  async getServices(): Promise<Service[]> {
    const path = 'services';
    const deletedIds = JSON.parse(sessionStorage.getItem('deleted_service_ids') || '[]');
    try {
      const q = query(collection(db, path), orderBy('display_order', 'asc'));
      const snapshot = await getDocs(q);
      const items: Service[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Service);
      });

      if (items.length === 0) {
        const defaults = this.getDefaultServices();
        console.log('Seeding default services into Firestore...');
        for (const s of defaults) {
          const docRef = doc(db, path, s.id);
          await setDoc(docRef, { ...s, created_at: new Date().toISOString() });
          items.push(s);
        }
      }

      return items.filter(s => !deletedIds.includes(s.id));
    } catch (error) {
      console.warn('Firestore services read failed, using default fallbacks:', error);
      return this.getDefaultServices().filter(s => !deletedIds.includes(s.id));
    }
  },

  async addService(s: Partial<Service>): Promise<Service> {
    const path = 'services';
    try {
      const docRef = doc(collection(db, path));
      const cleanData: Service = {
        id: docRef.id,
        sub_category_id: s.sub_category_id || '',
        sub_category_slug: s.sub_category_slug || '',
        category_id: s.category_id || '',
        category_slug: s.category_slug || '',
        name: s.name || '',
        slug: s.slug || (s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        desc: s.desc || '',
        full_desc: s.full_desc || '',
        ico: s.ico || '✨',
        thumbnail: s.thumbnail || '',
        banner: s.banner || '',
        gallery: s.gallery || [],
        videos: s.videos || [],
        price: s.price || '',
        starting_from: s.starting_from || '',
        display_order: s.display_order ?? 10,
        status: s.status || 'Published',
        feats: s.feats || [],
        highlights: s.highlights || [],
        faqs: s.faqs || [],
        show_on_homepage: s.show_on_homepage ?? true,
        featured: s.featured ?? false,
        seo_title: s.seo_title || s.name || '',
        seo_description: s.seo_description || s.desc || '',
        seo_keywords: s.seo_keywords || '',
        canonical_url: s.canonical_url || '',
        og_image: s.og_image || '',
        schema_data: s.schema_data || '',
        robots_index: s.robots_index ?? true,
        homepage_image: s.homepage_image || '',
        homepage_desc: s.homepage_desc || '',
        homepage_btn_text: s.homepage_btn_text || 'View Details',
        homepage_btn_link: s.homepage_btn_link || '',
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      this.triggerSitemapRebuild();
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateService(id: string, s: Partial<Service>): Promise<void> {
    const path = `services/${id}`;
    try {
      await updateDoc(doc(db, 'services', id), s);
      this.triggerSitemapRebuild();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteService(id: string): Promise<void> {
    const deletedIds = JSON.parse(sessionStorage.getItem('deleted_service_ids') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      sessionStorage.setItem('deleted_service_ids', JSON.stringify(deletedIds));
    }
    const path = `services/${id}`;
    try {
      await deleteDoc(doc(db, 'services', id));
      this.triggerSitemapRebuild();
    } catch (error: any) {
      console.warn('Database delete operation warning:', error.message);
    }
  },

  // MEDIA LIBRARY
  async getMediaLibrary(): Promise<MediaItem[]> {
    const path = 'media_library';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const items: MediaItem[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as MediaItem);
      });
      return items;
    } catch (error) {
      console.warn('Firestore media read failed:', error);
      return [];
    }
  },

  async addMediaItem(media: Partial<MediaItem>): Promise<MediaItem> {
    const path = 'media_library';
    try {
      const docRef = doc(collection(db, path));
      const cleanData: MediaItem = {
        id: docRef.id,
        name: media.name || 'Unnamed media',
        url: media.url || '',
        type: media.type || 'image',
        folder: media.folder || 'General',
        tags: media.tags || [],
        size: media.size || 0,
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async deleteMediaItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'media_library', id));
    } catch (error) {
      console.warn('Failed to delete media item:', error);
    }
  },

  // Trigger Dynamic Sitemap generation via background endpoint
  async triggerSitemapRebuild(): Promise<boolean> {
    try {
      const res = await fetch('/api/rebuild-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.warn('Could not reach rebuild-sitemap endpoint:', e);
      return false;
    }
  },

  // STATIC SEED DATA HELPERS
  getDefaultCategories(): Category[] {
    return [
      {
        id: 'cat_wedding',
        name: 'Wedding Services',
        slug: 'wedding-services',
        short_desc: 'Bespoke high-end wedding curation, production, and luxury coordination.',
        full_desc: 'We transform dream weddings into pristine physical realities, taking care of every minute luxury detail.',
        icon: '💍',
        display_order: 1,
        status: 'Published',
        show_on_homepage: true,
        featured: true,
        homepage_desc: 'Royal multi-day high-end planning and custom mandap assemblies.',
        homepage_btn_text: 'Explore Weddings'
      },
      {
        id: 'cat_birthday',
        name: 'Birthday Celebrations',
        slug: 'birthday-celebrations',
        short_desc: 'Grand milestone anniversary events, kid-themed birthdays and elite celebrations.',
        full_desc: 'Milestone events designed with custom theatrical props, exquisite balloon clouds, and lively stage programs.',
        icon: '🎂',
        display_order: 2,
        status: 'Published',
        show_on_homepage: true,
        featured: true,
        homepage_desc: 'Enchanting fantasy themes, magical custom backdrops & elite sound arrays.',
        homepage_btn_text: 'Explore Birthdays'
      },
      {
        id: 'cat_corporate',
        name: 'Corporate Events',
        slug: 'corporate-events',
        short_desc: 'Executive brand activation setups, annual award galas, and professional seminars.',
        full_desc: 'Seamless end-to-end event execution designed to project your corporate branding with absolute sophistication.',
        icon: '🏛️',
        display_order: 3,
        status: 'Published',
        show_on_homepage: true,
        featured: true,
        homepage_desc: 'Impeccable product launches, audio-visual grids, and professional hospitality.',
        homepage_btn_text: 'Corporate Solutions'
      },
      {
        id: 'cat_destination',
        name: 'Destination Weddings',
        slug: 'destination-weddings',
        short_desc: 'Enchanting experiences across major global luxury resorts and local beach retreats.',
        full_desc: 'Full-service travel coordination, guest accommodation desks, local venue transformation, and exotic décor styles.',
        icon: '🏝️',
        display_order: 4,
        status: 'Published',
        show_on_homepage: true,
        featured: true,
        homepage_desc: 'Exotic destination retreats, guest logistics and complete venue management.',
        homepage_btn_text: 'Destination Weddings'
      },
      {
        id: 'cat_anniversary',
        name: 'Anniversary Celebrations',
        slug: 'anniversary-celebrations',
        short_desc: 'Romantic surprise dynamic designs, high-end dinners, and beautiful custom flower settings.',
        full_desc: 'Cherishing your shared timeline with elegant candlelight receptions, luxury flower setups, and live music ensembles.',
        icon: '💖',
        display_order: 5,
        status: 'Published',
        show_on_homepage: true,
        featured: false
      },
      {
        id: 'cat_photography',
        name: 'Photography & Films',
        slug: 'photography-films',
        short_desc: 'High-definition digital cinematic capturing, pre-wedding shoots, drone views, and same-day highlights edit.',
        full_desc: 'Preserving grand, fleeting expressions via premium visual lenses, standard lighting setups and cinematic color-grading.',
        icon: '📸',
        display_order: 6,
        status: 'Published',
        show_on_homepage: true,
        featured: true
      },
      {
        id: 'cat_balloon',
        name: 'Balloon Decoration',
        slug: 'balloon-decoration',
        short_desc: 'Artistic organic balloon installations, custom geometric frame backdrops, and thematic balloon arches.',
        full_desc: 'Custom structured assemblies tailored with luxury colors and safely bound for high aesthetic impact.',
        icon: '🎈',
        display_order: 7,
        status: 'Published',
        show_on_homepage: true,
        featured: false
      },
      {
        id: 'cat_flower',
        name: 'Flower Decoration',
        slug: 'flower-decoration',
        short_desc: 'Exotic fresh and artificial flower arrays, table centerpiece design, and grand entrance floral grids.',
        full_desc: 'High-quality selection of fresh roses, orchids and customized floral elements to enrich your layout scent and aesthetics.',
        icon: '🌸',
        display_order: 8,
        status: 'Published',
        show_on_homepage: true,
        featured: false
      },
      {
        id: 'cat_sfx',
        name: 'SFX & Special Effects',
        slug: 'sfx-special-effects',
        short_desc: 'Cold pyro fountains, sparkular lines, dry ice heavy fog effects, and custom confetti blasts.',
        full_desc: 'Breathtaking moments produced safely by trained technicians using advanced non-hazardous professional systems.',
        icon: '⚡',
        display_order: 9,
        status: 'Published',
        show_on_homepage: true,
        featured: false
      },
      {
        id: 'cat_entertainment',
        name: 'Entertainment',
        slug: 'entertainment',
        short_desc: 'Professional DJs on wheels, high-octane Punjabi dhol teams, live acoustic bands, and celebrity artist coordination.',
        full_desc: 'Creating electric atmosphere rhythms tailored to set a memorable pulse for your celebration.',
        icon: '🎵',
        display_order: 10,
        status: 'Published',
        show_on_homepage: true,
        featured: true
      },
      {
        id: 'cat_catering',
        name: 'Catering Services',
        slug: 'catering-services',
        short_desc: 'Bespoke multi-cuisine menus curated by award-winning chefs, gourmet live counters, and high-end services.',
        full_desc: 'Indulging your invitees with top-level local, traditional and world gastronomy designed with exquisite buffet sets.',
        icon: '🍽️',
        display_order: 11,
        status: 'Published',
        show_on_homepage: true,
        featured: false
      },
      {
        id: 'cat_hospitality',
        name: 'Hospitality & Event Operations',
        slug: 'hospitality-event-operations',
        short_desc: 'Premium guest RSVP systems, transport assistance, room allotment, and professional timeline coordination.',
        full_desc: 'Taking full accountability of guest comfort, reception helpdesks, check-ins, and logistical operations.',
        icon: '💁',
        display_order: 12,
        status: 'Published',
        show_on_homepage: true,
        featured: true
      }
    ];
  },

  getDefaultSubCategories(): SubCategory[] {
    return [
      // Wedding Subcategories
      {
        id: 'sub_wedding_planning',
        category_id: 'cat_wedding',
        category_slug: 'wedding-services',
        name: 'Wedding Planning',
        slug: 'wedding-planning',
        short_desc: 'Complete high-end wedding strategy and multi-day coordination.',
        display_order: 1,
        status: 'Published',
        show_on_homepage: true
      },
      {
        id: 'sub_wedding_decor',
        category_id: 'cat_wedding',
        category_slug: 'wedding-services',
        name: 'Wedding Decoration',
        slug: 'wedding-decoration',
        short_desc: 'Stunning thematic drapes, majestic mandap designs and royal stage lighting.',
        display_order: 2,
        status: 'Published',
        show_on_homepage: true
      },
      // Birthday Subcategories
      {
        id: 'sub_birthday_decor',
        category_id: 'cat_birthday',
        category_slug: 'birthday-celebrations',
        name: 'Theme Decoration',
        slug: 'theme-decoration',
        short_desc: 'Theatrical balloon backdrops, whimsical entryways and colorful stage panels.',
        display_order: 1,
        status: 'Published',
        show_on_homepage: true
      },
      // Corporate Subcategories
      {
        id: 'sub_corporate_planning',
        category_id: 'cat_corporate',
        category_slug: 'corporate-events',
        name: 'Conferences & Galas',
        slug: 'conferences-galas',
        short_desc: 'Perfect scheduling, sound-and-light setups and professional registration.',
        display_order: 1,
        status: 'Published',
        show_on_homepage: true
      },
      // Hospitality Subcategories
      {
        id: 'sub_hospitality_rsvp',
        category_id: 'cat_hospitality',
        category_slug: 'hospitality-event-operations',
        name: 'RSVP & Guest Desk',
        slug: 'rsvp-guest-desk',
        short_desc: 'Integrated registration counters, shadow escort desks, and luggage log assistance.',
        display_order: 1,
        status: 'Published',
        show_on_homepage: true
      }
    ];
  },

  getDefaultServices(): Service[] {
    return [
      {
        id: 's_wedding_full',
        sub_category_id: 'sub_wedding_planning',
        sub_category_slug: 'wedding-planning',
        category_id: 'cat_wedding',
        category_slug: 'wedding-services',
        name: 'Complete Wedding Planning',
        slug: 'complete-wedding-planning',
        desc: 'End-to-end luxury orchestration from vendor negotiation, menu taste reviews, down to the final minute checklist.',
        full_desc: 'Your wedding should be a seamless, stress-free display of pristine opulence. Our team handles your entire planning timeline, coordinating with florist teams, decorators, gourmet chefs, and live entertainment modules.',
        ico: '💍',
        display_order: 1,
        status: 'Published',
        feats: ['Dedicated Senior Planner & Assistant Team', 'Budget profiling & vendor rate optimization', '3D visual layout blueprint designs', 'Guest lists, digital RSVP dashboard & seating mapping'],
        highlights: ['100% Bespoke curation', 'Award-winning florist networks', 'White-glove coordination'],
        faqs: [
          { question: 'When should we book?', answer: 'We recommend booking 6 to 9 months ahead to ensure priority resort slots.' },
          { question: 'Do you manage destination events?', answer: 'Yes, we handle complete travel desks, resort bookings, and international compliance.' }
        ],
        show_on_homepage: true,
        featured: true
      },
      {
        id: 's_wedding_decor_stage',
        sub_category_id: 'sub_wedding_decor',
        sub_category_slug: 'wedding-decoration',
        category_id: 'cat_wedding',
        category_slug: 'wedding-services',
        name: 'Stage & Mandap Setup',
        slug: 'stage-mandap-setup',
        desc: 'Exquisite custom mandap canopies adorned with fresh orchids, roses, premium fabrics, and royal downlights.',
        full_desc: 'A magnificent stage that holds the visual spotlight of your sacred vows. Designed with beautiful geometric frames, cascading strings of jasmine, crystal chandeliers, and lush visual foliage.',
        ico: '🌸',
        display_order: 2,
        status: 'Published',
        feats: ['Luxury fresh/artificial floral arrangements', 'Intelligent stage uplighting & spot focus', 'Thematic luxury chairs and bolster setups'],
        highlights: ['Artisan floral structures', 'High-contrast backdrop design', 'Safety certified installations'],
        show_on_homepage: true,
        featured: true
      },
      {
        id: 's_birthday_decor_balloon',
        sub_category_id: 'sub_birthday_decor',
        sub_category_slug: 'theme-decoration',
        category_id: 'cat_birthday',
        category_slug: 'birthday-celebrations',
        name: 'Balloon Decoration',
        slug: 'balloon-decoration',
        desc: 'Stunning organic multi-colored balloon arches, customized neon sign boards, and thematic columns.',
        full_desc: 'We craft spectacular color-coordinated bubble clouds and balloon backdrops designed to capture perfect photographs for your family milestone events.',
        ico: '🎈',
        display_order: 1,
        status: 'Published',
        feats: ['Premium matte and chrome balloons', 'Custom helium elements', 'On-site installation & visual alignment'],
        show_on_homepage: true,
        featured: true
      },
      {
        id: 's_corp_confs',
        sub_category_id: 'sub_corporate_planning',
        sub_category_slug: 'conferences-galas',
        category_id: 'cat_corporate',
        category_slug: 'corporate-events',
        name: 'Conferences & Seminars',
        slug: 'conferences-and-seminars',
        desc: 'High-definition LED screens, pristine sound, smart delegate badge check-ins, and multi-cuisine catering.',
        full_desc: 'We produce faultless corporate conferences designed to project your branding with elite, sharp authority.',
        ico: '🏛️',
        display_order: 1,
        status: 'Published',
        feats: ['Line-array premium audio grids', 'Professional sound & light engineers', 'Interactive digital display setup'],
        show_on_homepage: true,
        featured: true
      }
    ];
  },

  // === THEME ENGINE ===
  async getThemeTokens(): Promise<CMSThemeTokens> {
    const docId = 'active_theme_presets';
    const path = `theme_tokens/${docId}`;
    try {
      const { getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'theme_tokens', docId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CMSThemeTokens;
      }
    } catch (error) {
      console.warn('Firestore theme tokens read failed, using default fallbacks:', error);
    }
    return this.getDefaultThemeTokens();
  },

  async saveThemeTokens(tokens: CMSThemeTokens): Promise<void> {
    const path = `theme_tokens/${tokens.id || 'active_theme_presets'}`;
    const id = tokens.id || 'active_theme_presets';
    try {
      await setDoc(doc(db, 'theme_tokens', id), {
        ...tokens,
        id
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  getDefaultThemeTokens(): CMSThemeTokens {
    return {
      id: 'active_theme_presets',
      name: 'Luxury Champagne & Royal Slate',
      colors: {
        primary: '#C5A880', // Champagne Gold
        secondary: '#1E293B', // Royal Slate
        accent: '#FDFBF7', // Off-White Canvas
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#FAF9F6', // Soft Alabaster
        surface: '#FFFFFF',
        text_primary: '#0F172A',
        text_secondary: '#475569'
      },
      typography: {
        headings_font: 'Space Grotesk',
        body_font: 'Inter',
        base_size: '16px'
      },
      spacing: {
        button_radius: 'md',
        card_radius: 'lg',
        animation_speed: 'normal'
      },
      effects: {
        glass_intensity: 'light',
        box_shadow: 'luxury-depth'
      },
      is_dark_mode: false
    };
  },

  // === GLOBAL VARIABLES ===
  async getGlobalVariables(): Promise<CMSGlobalVariables> {
    const docId = 'site_globals';
    const path = `global_variables/${docId}`;
    try {
      const { getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'global_variables', docId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CMSGlobalVariables;
      }
    } catch (error) {
      console.warn('Firestore global variables read failed, using defaults:', error);
    }
    return this.getDefaultGlobalVariables();
  },

  async saveGlobalVariables(vars: CMSGlobalVariables): Promise<void> {
    const path = `global_variables/${vars.id || 'site_globals'}`;
    const id = vars.id || 'site_globals';
    try {
      await setDoc(doc(db, 'global_variables', id), {
        ...vars,
        id
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  getDefaultGlobalVariables(): CMSGlobalVariables {
    return {
      id: 'site_globals',
      company_name: 'Eventra Occasionz',
      contact: {
        phone: '+91 98765 43210',
        email: 'concierge@eventraoccasionz.com',
        address: 'Signature Suites, DLF Phase 5, Gurugram, India',
        business_hours: '10:00 AM - 08:00 PM (IST)'
      },
      social_links: {
        whatsapp: 'https://wa.me/919876543210',
        instagram: 'https://instagram.com/eventraoccasionz',
        facebook: 'https://facebook.com/eventraoccasionz',
        pinterest: 'https://pinterest.com/eventraoccasionz'
      },
      branding: {
        logo_dark: '',
        logo_light: '',
        favicon: '',
        copyright_text: '© 2026 Eventra Occasionz Private Limited. All Rights Reserved.'
      }
    };
  },

  // === CMS PAGES & ROUTING ===
  async getPages(): Promise<CMSPage[]> {
    const path = 'pages';
    try {
      const snapshot = await getDocs(collection(db, path));
      const items: CMSPage[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as CMSPage);
      });

      if (items.length === 0) {
        // Seed default home page metadata
        const defaultPage: CMSPage = {
          id: 'home_page',
          slug: '/',
          title: 'Eventra Occasionz | Bespoke Events & Luxury Curation',
          seo_id: 'home_seo',
          layout_id: 'default_canvas',
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          author_id: 'system'
        };
        await setDoc(doc(db, path, 'home_page'), defaultPage);
        items.push(defaultPage);
      }

      return items;
    } catch (error) {
      console.warn('Firestore pages read failed, returning defaults:', error);
      return [{
        id: 'home_page',
        slug: '/',
        title: 'Eventra Occasionz | Bespoke Events & Luxury Curation',
        seo_id: 'home_seo',
        layout_id: 'default_canvas',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_id: 'system'
      }];
    }
  },

  async getPageBySlug(slug: string): Promise<CMSPage | null> {
    const path = 'pages';
    try {
      const q = query(collection(db, path), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        return { id: d.id, ...d.data() } as CMSPage;
      }
    } catch (error) {
      console.warn(`Firestore page get by slug [${slug}] failed:`, error);
    }
    // Fallback for default home page
    if (slug === '/') {
      const pages = await this.getPages();
      return pages.find(p => p.slug === '/') || null;
    }
    return null;
  },

  async savePage(page: Partial<CMSPage> & { id: string }): Promise<void> {
    const path = `pages/${page.id}`;
    try {
      await setDoc(doc(db, 'pages', page.id), {
        ...page,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // === PAGE SECTIONS ===
  async getPageSections(pageId: string): Promise<CMSPageSection[]> {
    const path = 'page_sections';
    try {
      const q = query(collection(db, path), where('page_id', '==', pageId), orderBy('order_index', 'asc'));
      const snapshot = await getDocs(q);
      const items: CMSPageSection[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as CMSPageSection);
      });

      if (items.length === 0 && pageId === 'home_page') {
        // Seed default landing page sections
        const defaultSections: CMSPageSection[] = [
          {
            id: 'home_hero_sec',
            page_id: 'home_page',
            type: 'hero',
            component_key: 'Hero01',
            order_index: 0,
            is_visible: true,
            layout_config: { padding_y: 'none', bg_preset: 'default' }
          },
          {
            id: 'home_services_sec',
            page_id: 'home_page',
            type: 'services',
            component_key: 'ServicesGrid',
            order_index: 1,
            is_visible: true,
            layout_config: { padding_y: 'medium', bg_preset: 'surface' }
          },
          {
            id: 'home_gallery_sec',
            page_id: 'home_page',
            type: 'gallery',
            component_key: 'GalleryGrid',
            order_index: 2,
            is_visible: true,
            layout_config: { padding_y: 'medium', bg_preset: 'luxury' }
          },
          {
            id: 'home_testimonials_sec',
            page_id: 'home_page',
            type: 'testimonials',
            component_key: 'TestimonialSlider',
            order_index: 3,
            is_visible: true,
            layout_config: { padding_y: 'medium', bg_preset: 'accent' }
          },
          {
            id: 'home_faq_sec',
            page_id: 'home_page',
            type: 'faq',
            component_key: 'Accordion',
            order_index: 4,
            is_visible: true,
            layout_config: { padding_y: 'medium', bg_preset: 'surface' }
          },
          {
            id: 'home_contact_sec',
            page_id: 'home_page',
            type: 'contact',
            component_key: 'ContactForm',
            order_index: 5,
            is_visible: true,
            layout_config: { padding_y: 'medium', bg_preset: 'default' }
          }
        ];

        for (const sec of defaultSections) {
          await setDoc(doc(db, path, sec.id), sec);
          items.push(sec);
        }
      }

      return items;
    } catch (error) {
      console.warn(`Firestore page sections load failed for page ${pageId}:`, error);
      return [];
    }
  },

  async savePageSection(section: CMSPageSection): Promise<void> {
    const path = `page_sections/${section.id}`;
    try {
      await setDoc(doc(db, 'page_sections', section.id), section, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // === SECTION CONTENT ===
  async getSectionContent(sectionId: string): Promise<CMSSectionContent | null> {
    const path = 'section_content';
    try {
      const q = query(collection(db, path), where('section_id', '==', sectionId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        return { id: d.id, ...d.data() } as CMSSectionContent;
      }

      // Seed content fallbacks if missing
      if (sectionId === 'home_hero_sec') {
        const defaultHeroContent: CMSSectionContent = {
          id: 'home_hero_content',
          section_id: 'home_hero_sec',
          content: {
            heading: 'Crafting Exquisite Masterpiece Occasions',
            sub_heading: 'Eventra Occasionz',
            description: 'Where absolute luxury planning coordinates with fine-art craftsmanship to realize your most brilliant memories.',
            cta_buttons: [
              { text: 'Reserve Consultation', link: '#contact', style: 'primary' },
              { text: 'Explore Galleries', link: '/gallery', style: 'outline' }
            ]
          },
          last_updated: new Date().toISOString(),
          updated_by: 'system'
        };
        await setDoc(doc(db, path, 'home_hero_content'), defaultHeroContent);
        return defaultHeroContent;
      }
    } catch (error) {
      console.warn(`Firestore section content load failed for ${sectionId}:`, error);
    }
    return null;
  },

  async saveSectionContent(contentId: string, content: Partial<CMSSectionContent>): Promise<void> {
    const path = `section_content/${contentId}`;
    try {
      await setDoc(doc(db, 'section_content', contentId), {
        ...content,
        last_updated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // === VERSION CONTROL &snapshots ===
  async createPageVersion(version: CMSPageVersion): Promise<void> {
    const path = `page_versions/${version.id}`;
    try {
      await setDoc(doc(db, 'page_versions', version.id), version);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getPageVersions(pageId: string): Promise<CMSPageVersion[]> {
    const path = 'page_versions';
    try {
      const q = query(collection(db, path), where('page_id', '==', pageId), orderBy('version_number', 'desc'));
      const snapshot = await getDocs(q);
      const items: CMSPageVersion[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as CMSPageVersion);
      });
      return items;
    } catch (error) {
      console.warn(`Firestore page versions read failed for ${pageId}:`, error);
      return [];
    }
  },

  // === CMS DECOUPLED ANALYTICS ===
  async recordCMSAnalytic(analytic: Omit<CMSAnalytics, 'id' | 'timestamp'>): Promise<void> {
    const path = 'cms_analytics';
    try {
      const docRef = doc(collection(db, path));
      const record: CMSAnalytics = {
        id: docRef.id,
        ...analytic,
        timestamp: new Date().toISOString()
      };
      await setDoc(docRef, record);
    } catch (error) {
      // Fail silently to never block client visual experiences
      console.warn('Analytics record failed:', error);
    }
  }
};
