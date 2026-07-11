import { db } from './firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { CATEGORIES, DETAILED_SERVICES } from './detailedServicesData';

async function seedDetailedCMS() {
  console.log("Starting Comprehensive CMS Seeding for Eventra Occasionz...");

  try {
    const batch = writeBatch(db);

    // 1. Seed Categories
    for (const cat of CATEGORIES) {
      const catRef = doc(db, 'categories', cat.id);
      batch.set(catRef, {
        ...cat,
        thumbnail_image: cat.thumbnail, // Map for type compatibility
        banner_image: cat.thumbnail,    // Use same for banner as fallback
        status: 'Published',
        show_on_homepage: true,
        created_at: new Date().toISOString()
      }, { merge: true });
    }

    // 2. Seed Services
    for (const group of DETAILED_SERVICES) {
      const category = CATEGORIES.find(c => c.id === group.catId);
      if (!category) continue;

      let order = 1;
      for (const s of group.services) {
        const sSlug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const sId = `srv-${category.slug}-${sSlug}`;
        const sRef = doc(db, 'services', sId);
        
        batch.set(sRef, {
          id: sId,
          category_id: category.id,
          category_slug: category.slug,
          name: s.name,
          slug: sSlug,
          desc: s.desc,
          ico: s.ico,
          thumbnail: s.img,
          display_order: order++,
          visible: true,
          status: 'Published',
          feats: ['Premium Experience', 'Professional Coordination', 'Elite Service Standards'],
          created_at: new Date().toISOString()
        }, { merge: true });
      }
    }

    await batch.commit();
    const totalServices = DETAILED_SERVICES.reduce((acc, curr) => acc + curr.services.length, 0);
    console.log(`SUCCESS: All ${CATEGORIES.length} Categories and ${totalServices} Services have been catalogued and seeded.`);
  } catch (error) {
    console.error("FATAL: Seeding failed with error:", error);
  }
}

seedDetailedCMS().catch(console.error);
