import { db } from '../../src/services/firebase';
import { doc, setDoc } from 'firebase/firestore';

async function seedFinalServices() {
  console.log("Starting Seeding for Entertainment, Catering, Hospitality, and SFX...");

  const data: { 
    category: { name: string; slug: string }; 
    subCategories: { name: string; slug: string; services: string[] }[] 
  }[] = [
    {
      category: { name: 'Entertainment', slug: 'entertainment' },
      subCategories: [
        { name: 'DJ Services', slug: 'dj-services', services: ['Basic DJ', 'Premium DJ', 'Luxury DJ', 'DJ on Wheels', 'LED DJ Setup', 'Silent DJ', 'Wedding DJ', 'Birthday DJ', 'Corporate DJ', 'Cocktail DJ', 'Reception DJ', 'After Party DJ'] },
        { name: 'Live Music', slug: 'live-music', services: ['Live Singer', 'Male Singer', 'Female Singer', 'Acoustic Band', 'Live Band', 'Sufi Band', 'Qawwali Group', 'Instrumental Band', 'Fusion Band', 'Jazz Band', 'Rock Band'] },
        { name: 'Traditional Performances', slug: 'traditional-performances', services: ['Punjabi Dhol', 'Traditional Dhol', 'Bhangra Team', 'Giddha Team', 'Rajasthani Folk', 'Kalbelia Dance', 'Garba Team', 'Cultural Folk Artists'] },
        { name: 'Celebrity Management', slug: 'celebrity-management', services: ['Celebrity Appearance', 'Punjabi Singer', 'Bollywood Singer', 'Stand-up Comedian', 'Motivational Speaker', 'Influencer Appearance', 'Anchor Celebrity', 'Custom Artist Booking'] },
        { name: 'Dance Performances', slug: 'dance-performances', services: ['Bride Side Dance Team', 'Groom Side Dance Team', 'LED Dance Show', 'Fire Dance', 'Mirror Dance', 'Couple Dance Choreography', 'Family Dance Choreography', 'Professional Dance Troupe'] },
        { name: 'Stage Anchors', slug: 'stage-anchors', services: ['Wedding Emcee', 'Corporate Emcee', 'Birthday Host', 'Professional Anchor', 'Bilingual Anchor', 'Luxury Event Host'] },
        { name: 'Kids Entertainment', slug: 'kids-entertainment', services: ['Magic Show', 'Puppet Show', 'Mascot Characters', 'Balloon Artist', 'Face Painting', 'Tattoo Artist', 'Game Coordinator', 'Clown', 'Bubble Show', 'Science Show', 'Story Teller'] },
        { name: 'Wedding Entertainment', slug: 'wedding-entertainment', services: ['Cocktail Entertainment', 'Sangeet Entertainment', 'Reception Entertainment', 'Live Orchestra', 'Wedding Games', 'Luxury Entry Concepts'] },
        { name: 'Corporate Entertainment', slug: 'corporate-entertainment', services: ['Corporate DJ', 'Corporate Band', 'Corporate Host', 'Award Show Anchor', 'Business Entertainers', 'Team Engagement Activities'] },
        { name: 'Special Acts', slug: 'special-acts', services: ['LED Robot', 'Stilt Walkers', 'Mirror Characters', 'Living Statue', 'Fire Performers', 'Laser Performance', 'LED Drummers', 'Theme Characters'] },
      ]
    },
    {
      category: { name: 'Catering Services', slug: 'catering-services' },
      subCategories: [
        { name: 'Wedding Catering', slug: 'wedding-catering', services: ['Veg Catering', 'Non Veg Catering', 'Silver Package', 'Gold Package', 'Platinum Package', 'Diamond Package', 'Luxury Buffet', 'Traditional Punjabi Cuisine', 'North Indian Cuisine', 'South Indian Cuisine', 'Chinese Cuisine', 'Italian Cuisine', 'Continental Cuisine'] },
        { name: 'Birthday Catering', slug: 'birthday-catering', services: ['Kids Menu', 'Snack Menu', 'Mini Buffet', 'Finger Food', 'Live Snacks'] },
        { name: 'Corporate Catering', slug: 'corporate-catering', services: ['Breakfast', 'Lunch', 'Dinner', 'High Tea', 'Executive Buffet', 'Conference Meals'] },
        { name: 'Food Packages', slug: 'food-packages', services: ['Silver Veg', 'Gold Veg', 'Platinum Veg', 'Diamond Veg', 'Silver Non Veg', 'Gold Non Veg', 'Platinum Non Veg', 'Diamond Non Veg'] },
        { name: 'Live Counters', slug: 'live-counters', services: ['Chaat Counter', 'Chinese Counter', 'Italian Counter', 'Pizza Counter', 'Pasta Counter', 'South Indian Counter', 'Tandoor Counter', 'BBQ Counter', 'Live Jalebi Counter', 'Kulfi Counter', 'Ice Cream Counter', 'Coffee Counter', 'Tea Counter', 'Mocktail Counter', 'Chocolate Fountain', 'Candy Counter', 'Popcorn Counter', 'Cotton Candy Counter'] },
        { name: 'Beverages', slug: 'beverages', services: ['Welcome Drinks', 'Fresh Juice', 'Soft Drinks', 'Mocktails', 'Tea Service', 'Coffee Service'] },
        { name: 'Desserts', slug: 'desserts', services: ['Indian Sweets', 'Premium Desserts', 'Pastries', 'Brownies', 'Ice Cream', 'Kulfi', 'Chocolate Counter'] },
        { name: 'Service Staff', slug: 'service-staff', services: ['Professional Waiters', 'Buffet Staff', 'Kitchen Staff', 'Service Captains', 'Food Supervisors'] },
      ]
    },
    {
      category: { name: 'Hospitality & Event Operations', slug: 'hospitality-operations' },
      subCategories: [
        { name: 'Guest Management', slug: 'guest-management', services: ['RSVP Management', 'Guest Registration', 'Welcome Desk', 'Help Desk', 'Hospitality Desk', 'VIP Guest Management', 'Guest Assistance', 'Invitation Tracking', 'Guest Check-in', 'Guest Check-out'] },
        { name: 'Hospitality', slug: 'hospitality', services: ['Runner Services', 'Shadow Services', 'Bride Assistance', 'Groom Assistance', 'Artist Hospitality', 'Family Coordination', 'Hospitality Executive'] },
        { name: 'Transportation', slug: 'transportation', services: ['Guest Transport', 'Airport Pickup', 'Airport Drop', 'Railway Pickup', 'Railway Drop', 'Hotel Transfers', 'Shuttle Services', 'VIP Transport'] },
        { name: 'Coordination', slug: 'coordination', services: ['Vendor Coordination', 'Venue Coordination', 'Decoration Coordination', 'Photography Coordination', 'Entertainment Coordination', 'Catering Coordination'] },
        { name: 'Operations', slug: 'operations', services: ['Timeline Management', 'Backstage Management', 'Green Room Management', 'Inventory Management', 'Event Execution', 'Function Coordination', 'Stage Management'] },
        { name: 'Logistics', slug: 'logistics', services: ['Material Logistics', 'Vendor Logistics', 'Guest Logistics', 'Equipment Logistics', 'Emergency Coordination', 'Medical Assistance', 'Permission & Compliance Support'] },
      ]
    },
    {
      category: { name: 'SFX & Special Effects', slug: 'sfx-special-effects' },
      subCategories: [
        { name: 'Wedding Effects', slug: 'wedding-effects', services: ['Cold Pyro', 'Sparkular', 'Dry Ice', 'Confetti Blast', 'Flower Shower', 'Bubble Machine', 'Fog Machine', 'Snow Machine', 'Laser Show', 'Fireworks', 'CO₂ Gun'] },
        { name: 'Entry Effects', slug: 'entry-effects', services: ['Mirror Entry', 'Dry Ice Entry', 'Cold Pyro Entry', 'Sparkular Entry', 'CO₂ Entry', 'Flower Entry', 'Luxury Couple Entry'] },
        { name: 'Stage Effects', slug: 'stage-effects', services: ['LED Effects', 'Moving Head Lights', 'Intelligent Lighting', 'Smoke Effects', 'Haze Effects', 'Pixel Lighting'] },
        { name: 'Lighting Effects', slug: 'lighting-effects', services: ['Architectural Lighting', 'Ambient Lighting', 'Decor Lighting', 'Dance Floor Lighting', 'Outdoor Lighting'] },
        { name: 'Pyrotechnics', slug: 'pyrotechnics', services: ['Indoor Fireworks', 'Outdoor Fireworks', 'Cold Flame Effects', 'Stage Pyro', 'Grand Finale Effects'] },
        { name: 'Special Experiences', slug: 'special-experiences', services: ['360 Experience', 'Interactive LED Tunnel', 'Digital Entry Experience', 'Projection Mapping', 'Hologram Projection', 'Immersive Guest Experience'] },
      ]
    }
  ];

  for (const item of data) {
    const catId = `cat-${item.category.slug}`;
    await setDoc(doc(db, 'categories', catId), {
      id: catId,
      name: item.category.name,
      slug: item.category.slug,
      status: 'Published',
      display_order: 1
    });
    console.log(`Created Category: ${item.category.name}`);

    for (const sub of item.subCategories) {
      const subId = `sub-${item.category.slug}-${sub.slug}`;
      await setDoc(doc(db, 'sub_categories', subId), {
        id: subId,
        category_id: catId,
        category_slug: item.category.slug,
        name: sub.name,
        slug: sub.slug,
        status: 'Published',
        display_order: 1
      });
      console.log(`Created SubCategory: ${sub.name}`);

      for (const serv of sub.services) {
        const sId = `srv-${item.category.slug}-${sub.slug}-${serv.toLowerCase().replace(/\s+/g, '-')}`;
        await setDoc(doc(db, 'services', sId), {
          id: sId,
          category_id: catId,
          sub_category_id: subId,
          name: serv,
          slug: serv.toLowerCase().replace(/\s+/g, '-'),
          status: 'Published',
          display_order: 1,
          desc: `Premium ${serv} service tailored to your event needs.`,
          feats: ['High Quality', 'Professional Service'],
          standard_price: 1000,
          currency: 'INR',
          pricing_unit: 'Per Event',
          ico: 'star'
        });
        console.log(`Created Service: ${serv}`);
      }
    }
  }
}

seedFinalServices().catch(console.error);
