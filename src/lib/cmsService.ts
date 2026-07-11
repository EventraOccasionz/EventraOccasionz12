import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { Category, SubCategory, Service, MediaItem } from '../types';
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
  }
};
