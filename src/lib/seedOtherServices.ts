import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

async function seedOtherServices() {
  console.log("Starting Seeding for Birthday, Anniversary, Balloon, and Flower Decorations...");

  const data: { 
    category: { name: string; slug: string }; 
    subCategories: { name: string; slug: string; services: string[] }[] 
  }[] = [
    {
      category: { name: 'Birthday Celebrations', slug: 'birthday-celebrations' },
      subCategories: [
        { name: 'Birthday Planning', slug: 'birthday-planning', services: ['Complete Birthday Planning', 'Luxury Birthday Planning', 'Kids Birthday Planning', 'Adult Birthday Planning', 'First Birthday Planning', 'Surprise Birthday Planning', 'Theme Birthday Planning', 'Private Birthday Party', 'Outdoor Birthday Party', 'Indoor Birthday Party', 'Pool Party Planning', 'Terrace Party Planning', 'Birthday Consultation'] },
        { name: 'Venue Selection', slug: 'birthday-venue-selection', services: ['Banquet Hall', 'Hotel Banquet', 'Restaurant Party', 'Cafe Party', 'Farmhouse', 'Resort', 'Private Villa', 'Open Lawn', 'Club House', 'Home Celebration Setup'] },
        { name: 'Birthday Decorations', slug: 'birthday-decorations', services: ['Theme Decoration', 'Premium Decoration', 'Luxury Decoration', 'LED Decoration', 'Stage Decoration', 'Entrance Decoration', 'Welcome Setup', 'Cake Table Decoration', 'Photo Booth Decoration', 'Selfie Corner', 'Ceiling Decoration', 'Table Decoration', 'Backdrop Decoration'] },
        { name: 'Theme Parties', slug: 'theme-parties', services: ['Superhero Theme', 'Princess Theme', 'Jungle Theme', 'Cartoon Theme', 'Unicorn Theme', 'Space Theme', 'Harry Potter Theme', 'Frozen Theme', 'Mickey Mouse Theme', 'Boss Baby Theme', 'Cocomelon Theme', 'Luxury Black & Gold Theme', 'Neon Theme', 'Casino Theme', 'Retro Theme', 'Bollywood Theme'] },
        { name: 'Kids Entertainment', slug: 'kids-entertainment', services: ['Magic Show', 'Puppet Show', 'Mascot Characters', 'Balloon Artist', 'Face Painting', 'Tattoo Artist', 'Game Host', 'Kids DJ', 'Clown', 'Bubble Show', 'Science Show', 'Story Teller'] },
        { name: 'Photography', slug: 'birthday-photography', services: ['Birthday Photography', 'Candid Photography', 'Birthday Videography', 'Drone Coverage', 'Instant Printing', '360 Video Booth', 'Photo Booth', 'Highlight Video', 'Instagram Reels'] },
        { name: 'Cake & Catering', slug: 'cake-catering', services: ['Designer Cake', 'Theme Cake', 'Cup Cake Station', 'Dessert Table', 'Veg Catering', 'Non Veg Catering', 'Live Food Counters', 'Mocktail Counter', 'Ice Cream Counter', 'Chocolate Fountain', 'Candy Counter'] },
        { name: 'Special Effects', slug: 'birthday-special-effects', services: ['Cold Pyro', 'Sparkular', 'Dry Ice', 'Bubble Machine', 'Fog Machine', 'Confetti Blast', 'Snow Effect', 'Fireworks', 'Laser Show', 'Flower Shower'] },
        { name: 'Birthday Coordination', slug: 'birthday-coordination', services: ['Guest Welcome', 'Guest Registration', 'Cake Ceremony Coordination', 'Entertainment Coordination', 'Timeline Management', 'Vendor Coordination', 'Photography Coordination'] },
      ]
    },
    {
      category: { name: 'Anniversary Celebrations', slug: 'anniversary-celebrations' },
      subCategories: [
        { name: 'Anniversary Planning', slug: 'anniversary-planning', services: ['Silver Anniversary', 'Golden Anniversary', 'Diamond Anniversary', 'Surprise Anniversary', 'Romantic Anniversary', 'Private Celebration', 'Luxury Celebration'] },
        { name: 'Venue Selection', slug: 'anniversary-venue-selection', services: ['Hotel', 'Banquet', 'Restaurant', 'Resort', 'Farmhouse', 'Private Villa', 'Open Lawn'] },
        { name: 'Decoration', slug: 'anniversary-decoration', services: ['Romantic Decoration', 'Floral Decoration', 'Balloon Decoration', 'Candle Light Setup', 'Luxury Stage', 'Entrance Decoration', 'Table Decoration'] },
        { name: 'Entertainment', slug: 'anniversary-entertainment', services: ['Live Singer', 'Acoustic Band', 'DJ', 'Couple Dance Setup', 'Emcee', 'Live Music'] },
        { name: 'Photography', slug: 'anniversary-photography', services: ['Photography', 'Videography', 'Drone', 'Highlight Film', 'Instagram Reels'] },
        { name: 'Dining Experience', slug: 'anniversary-dining', services: ['Private Dining', 'Candle Light Dinner', 'Live BBQ', 'Buffet', 'Fine Dining'] },
        { name: 'Special Effects', slug: 'anniversary-special-effects', services: ['Cold Pyro', 'Dry Ice', 'Confetti', 'Bubble Machine', 'Fireworks', 'Flower Shower'] },
        { name: 'Celebration Coordination', slug: 'anniversary-coordination', services: ['Guest Management', 'Vendor Coordination', 'Timeline Management', 'Complete Event Coordination'] },
      ]
    },
    {
      category: { name: 'Balloon Decoration', slug: 'balloon-decoration' },
      subCategories: [
        { name: 'Balloon Themes', slug: 'balloon-themes', services: ['Birthday Balloon Decoration', 'Anniversary Balloon Decoration', 'Baby Shower Balloon Decoration', 'Proposal Decoration', 'Welcome Decoration', 'Corporate Balloon Decoration'] },
        { name: 'Balloon Services', slug: 'balloon-services', services: ['Organic Balloon Arch', 'Ring Decoration', 'Balloon Ceiling', 'Balloon Wall', 'Balloon Tunnel', 'LED Balloon Decoration', 'Helium Balloons', 'Foil Balloons', 'Chrome Balloons', 'Confetti Balloons', 'Pastel Balloon Theme', 'Luxury Balloon Theme', 'Balloon Photo Booth', 'Cake Table Balloon Decor', 'Entrance Balloon Decor', 'Stage Balloon Decor', 'Number Balloon Setup', 'Alphabet Balloon Setup'] },
      ]
    },
    {
      category: { name: 'Flower Decoration', slug: 'flower-decoration' },
      subCategories: [
        { name: 'Flower Themes', slug: 'flower-themes', services: ['Wedding Floral Decoration', 'Birthday Floral Decoration', 'Anniversary Floral Decoration', 'Car Decoration', 'Stage Decoration', 'Mandap Decoration', 'Entrance Decoration', 'Luxury Floral Styling'] },
        { name: 'Flower Services', slug: 'flower-services', services: ['Fresh Flower Decoration', 'Artificial Flower Decoration', 'Rose Decoration', 'Orchid Decoration', 'Marigold Decoration', 'Premium Floral Arch', 'Floral Tunnel', 'Floral Ceiling', 'Floral Chandelier', 'Flower Wall', 'Flower Backdrop', 'Table Centerpieces', 'Luxury Floral Stage', 'Mandap Floral Styling', 'Bridal Room Decoration', 'Car Flower Decoration', 'Aisle Decoration', 'Welcome Gate Decoration', 'Flower Basket Decoration'] },
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
          desc: `Professional ${serv} service.`,
          feats: ['Professional Execution'],
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

seedOtherServices().catch(console.error);
