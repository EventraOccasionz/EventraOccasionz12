import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CATEGORIES, DETAILED_SERVICES } from './detailedServicesData';

function makeSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function seedDatabase() {
  console.log("Starting Detailed Seed Process from client...");
  let count = 0;
  
  // 1. Categories
  for (const cat of CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), {
      ...cat,
      thumbnail_image: cat.thumbnail,
      banner_image: cat.thumbnail,
      status: 'Published',
      show_on_homepage: true,
      created_at: new Date().toISOString()
    });
    console.log(`Created Cat: ${cat.name}`);
  }
  
  // 2. Services
  for (const group of DETAILED_SERVICES) {
    const category = CATEGORIES.find(c => c.id === group.catId);
    if (!category) continue;

    let order = 1;
    for (const s of group.services) {
      const sSlug = makeSlug(s.name);
      const sId = `srv-${category.slug}-${sSlug}`;
      const docRef = doc(db, 'services', sId);
      
      const payload = {
        id: sId,
        category_id: category.id,
        category_slug: category.slug,
        name: s.name,
        slug: sSlug,
        desc: s.desc,
        ico: s.ico,
        thumbnail: s.img,
        banner: s.img,
        display_order: order++,
        visible: true,
        status: 'Published',
        feats: ['Premium Experience', 'Professional Coordination', 'Elite Service Standards'],
        created_at: new Date().toISOString(),
        pricing_unit: 'Per Event',
        calculation_formula: 'flat',
        standard_price: 50000,
        premium_price: 75000,
        luxury_price: 100000,
        currency: 'INR'
      };
      
      await setDoc(docRef, payload);
      count++;
    }
  }
  
  return count;
}

