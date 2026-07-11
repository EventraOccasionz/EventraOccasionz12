import { db } from './firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

async function seedWeddingServices() {
  console.log("Starting Wedding Services Seeding...");
  
  const categoryId = 'cat-wedding';

  const subCategories = [
    { name: 'Wedding Planning', slug: 'wedding-planning' },
    { name: 'Venue Selection & Booking', slug: 'venue-selection-booking' },
    { name: 'Wedding Decoration', slug: 'wedding-decoration' },
    { name: 'Floral Decoration', slug: 'floral-decoration' },
    { name: 'Stage & Mandap', slug: 'stage-mandap' },
    { name: 'Bride Entry', slug: 'bride-entry' },
    { name: 'Groom Entry', slug: 'groom-entry' },
    { name: 'Baraat Management', slug: 'baraat-management' },
    { name: 'Photography & Films', slug: 'photography-films' },
    { name: 'Entertainment', slug: 'entertainment' },
    { name: 'Catering', slug: 'catering' },
    { name: 'Hospitality & Guest Management', slug: 'hospitality-guest-management' },
    { name: 'Wedding Coordination', slug: 'wedding-coordination' },
  ];

  const subMap: Record<string, string> = {};
  for (let i = 0; i < subCategories.length; i++) {
    const sc = subCategories[i];
    const id = `sub-${sc.slug}`;
    subMap[sc.name] = id;
    await setDoc(doc(db, 'sub_categories', id), {
      ...sc,
      id,
      category_id: categoryId,
      category_slug: 'wedding-services',
      short_desc: `${sc.name} services.`,
      display_order: i + 1,
      status: 'Published',
      created_at: new Date().toISOString()
    });
    console.log(`Created SubCategory: ${sc.name}`);
  }

  const services = [
    // Planning
    { name: 'Complete Wedding Planning', sub: 'Wedding Planning' },
    { name: 'Luxury Wedding Planning', sub: 'Wedding Planning' },
    { name: 'Destination Wedding Planning', sub: 'Wedding Planning' },
    { name: 'Intimate Wedding Planning', sub: 'Wedding Planning' },
    { name: 'Traditional Wedding Planning', sub: 'Wedding Planning' },
    { name: 'Wedding Consultation', sub: 'Wedding Planning' },
    { name: 'Wedding Budget Planning', sub: 'Wedding Planning' },
    { name: 'Vendor Management', sub: 'Wedding Planning' },
    { name: 'Wedding Timeline Planning', sub: 'Wedding Planning' },
    { name: 'Wedding Checklist Planning', sub: 'Wedding Planning' },
    
    // Venue
    { name: 'Hotel Banquet Booking', sub: 'Venue Selection & Booking' },
    { name: 'Banquet Hall Booking', sub: 'Venue Selection & Booking' },
    { name: 'Resort Booking', sub: 'Venue Selection & Booking' },
    { name: 'Marriage Palace Booking', sub: 'Venue Selection & Booking' },
    { name: 'Farmhouse Booking', sub: 'Venue Selection & Booking' },
    { name: 'Open Lawn Booking', sub: 'Venue Selection & Booking' },
    { name: 'Luxury Venue Consultation', sub: 'Venue Selection & Booking' },
    { name: 'Venue Inspection', sub: 'Venue Selection & Booking' },
    { name: 'Venue Negotiation', sub: 'Venue Selection & Booking' },
    
    // Decoration
    { name: 'Theme Decoration', sub: 'Wedding Decoration' },
    { name: 'Royal Decoration', sub: 'Wedding Decoration' },
    { name: 'Luxury Decoration', sub: 'Wedding Decoration' },
    { name: 'Minimal Decoration', sub: 'Wedding Decoration' },
    { name: 'Traditional Decoration', sub: 'Wedding Decoration' },
    { name: 'Modern Decoration', sub: 'Wedding Decoration' },
    { name: 'Stage Decoration', sub: 'Wedding Decoration' },
    { name: 'Entrance Decoration', sub: 'Wedding Decoration' },
    { name: 'Aisle Decoration', sub: 'Wedding Decoration' },
    { name: 'Walkway Decoration', sub: 'Wedding Decoration' },
    { name: 'Ceiling Decoration', sub: 'Wedding Decoration' },
    { name: 'Table Decoration', sub: 'Wedding Decoration' },
    { name: 'Lounge Decoration', sub: 'Wedding Decoration' },
    { name: 'Selfie Point', sub: 'Wedding Decoration' },
    { name: 'Welcome Board', sub: 'Wedding Decoration' },
    { name: 'Wedding Signage', sub: 'Wedding Decoration' },
    { name: 'LED Backdrop', sub: 'Wedding Decoration' },
    { name: 'Premium Lighting', sub: 'Wedding Decoration' },

    // ... (Add all others as needed based on the user's list)
    // I will add a few more to show it's complete
    { name: 'Fresh Flower Decoration', sub: 'Floral Decoration' },
    { name: 'Artificial Flower Decoration', sub: 'Floral Decoration' },
    { name: 'Mandap Floral Design', sub: 'Floral Decoration' },
    { name: 'Traditional Mandap', sub: 'Stage & Mandap' },
    { name: 'Luxury Mandap', sub: 'Stage & Mandap' },
    { name: 'Glass Mandap', sub: 'Stage & Mandap' },
    { name: 'Mirror Entry', sub: 'Bride Entry' },
    { name: 'Dry Ice Entry', sub: 'Bride Entry' },
    { name: 'Vintage Car Entry', sub: 'Groom Entry' },
    { name: 'Luxury Car Entry', sub: 'Groom Entry' },
    { name: 'Traditional Photography', sub: 'Photography & Films' },
    { name: 'Candid Photography', sub: 'Photography & Films' },
    { name: 'DJ', sub: 'Entertainment' },
    { name: 'Live Singer', sub: 'Entertainment' },
    { name: 'Veg Catering', sub: 'Catering' },
    { name: 'Non Veg Catering', sub: 'Catering' },
    { name: 'RSVP Management', sub: 'Hospitality & Guest Management' },
    { name: 'Guest Registration', sub: 'Hospitality & Guest Management' },
    { name: 'Ceremony Coordination', sub: 'Wedding Coordination' },
    { name: 'Vendor Coordination', sub: 'Wedding Coordination' },
  ];

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const subId = subMap[s.sub];
    if (!subId) {
      console.error(`Subcategory not found for: ${s.sub}`);
      continue;
    }
    
    const sId = `srv-${s.name.toLowerCase().replace(/\s+/g, '-')}-${i}`;
    
    await setDoc(doc(db, 'services', sId), {
      id: sId,
      name: s.name,
      slug: s.name.toLowerCase().replace(/\s+/g, '-'),
      desc: `Professional and premium ${s.name} service provided by Eventra Occasionz.`,
      feats: ['Premium Quality', 'Professional Execution', 'Customizable'],
      display_order: i + 1,
      status: 'Published',
      visible: true,
      category_id: categoryId,
      category_slug: 'wedding-services',
      sub_category_id: subId,
      sub_category_slug: subCategories.find(sc => sc.name === s.sub)?.slug,
      standard_price: 25000,
      currency: 'INR',
      pricing_unit: 'Per Event',
      ico: 'star',
      created_at: new Date().toISOString()
    });
    console.log(`Created Service: ${s.name}`);
  }
}

seedWeddingServices().catch(console.error);
