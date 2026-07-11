import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

async function seedCorporateDestPhoto() {
  console.log("Starting Seeding for Corporate Events, Destination Weddings, and Photography & Films...");

  const data: { 
    category: { name: string; slug: string }; 
    subCategories: { name: string; slug: string; services: string[] }[] 
  }[] = [
    {
      category: { name: 'Corporate Events', slug: 'corporate-events' },
      subCategories: [
        { name: 'Corporate Planning', slug: 'corporate-planning', services: ['Corporate Event Planning', 'Executive Meetings', 'Board Meetings', 'Investor Meetings', 'Business Networking', 'Corporate Consultation', 'Event Strategy', 'Corporate Branding', 'Corporate Event Management'] },
        { name: 'Business Meetings', slug: 'business-meetings', services: ['Meeting Room Setup', 'Board Room Setup', 'Presentation Setup', 'Video Conference Setup', 'Hybrid Meetings'] },
        { name: 'Conferences', slug: 'conferences', services: ['National Conference', 'International Conference', 'Medical Conference', 'Educational Conference', 'Business Conference', 'Technical Conference'] },
        { name: 'Seminars', slug: 'seminars', services: ['Corporate Seminar', 'Training Seminar', 'Workshop', 'Motivational Seminar', 'Educational Seminar'] },
        { name: 'Product Launches', slug: 'product-launches', services: ['Product Reveal', 'Vehicle Launch', 'Fashion Launch', 'Brand Launch', 'Store Launch', 'Corporate Launch Show'] },
        { name: 'Award Ceremonies', slug: 'award-ceremonies', services: ['Corporate Awards', 'Employee Awards', 'Annual Recognition', 'Achievement Ceremony'] },
        { name: 'Dealer Meets', slug: 'dealer-meets', services: ['Dealer Conference', 'Distributor Meet', 'Channel Partner Meet', 'Sales Meet'] },
        { name: 'Annual Day', slug: 'annual-day', services: ['Annual Celebration', 'Employee Engagement', 'Family Day', 'Festival Celebration'] },
        { name: 'Exhibitions', slug: 'exhibitions', services: ['Trade Show', 'Expo Management', 'Business Exhibition', 'Industrial Exhibition', 'Display Booth Design'] },
        { name: 'Brand Promotions', slug: 'brand-promotions', services: ['Road Show', 'Mall Activation', 'College Promotion', 'Retail Promotion', 'Sampling Campaign'] },
        { name: 'Team Building', slug: 'team-building', services: ['Outdoor Team Building', 'Indoor Team Building', 'Adventure Activities', 'Corporate Games', 'Leadership Activities'] },
        { name: 'Corporate Entertainment', slug: 'corporate-entertainment', services: ['Corporate DJ', 'Live Band', 'Emcee', 'Celebrity Appearance', 'Motivational Speaker', 'Stand-up Comedy', 'Magic Show', 'Live Music'] },
        { name: 'Corporate Hospitality', slug: 'corporate-hospitality', services: ['Guest Registration', 'VIP Management', 'Help Desk', 'Welcome Desk', 'Hotel Coordination', 'Airport Transfers', 'Guest Assistance'] },
        { name: 'Corporate Production', slug: 'corporate-production', services: ['LED Wall', 'Stage Fabrication', 'Lighting Design', 'Professional Sound', 'Live Streaming', 'Multi Camera Setup'] },
        { name: 'Corporate Catering', slug: 'corporate-catering', services: ['Breakfast', 'Lunch', 'Dinner', 'High Tea', 'Buffet', 'Live Counters', 'Coffee Station', 'Mocktail Station'] },
        { name: 'Corporate Coordination', slug: 'corporate-coordination', services: ['Timeline Management', 'Vendor Coordination', 'Backstage Management', 'Event Execution'] },
      ]
    },
    {
      category: { name: 'Destination Weddings', slug: 'destination-weddings' },
      subCategories: [
        { name: 'Destination Planning', slug: 'destination-planning', services: ['Complete Destination Planning', 'Luxury Destination Wedding', 'Beach Wedding', 'Mountain Wedding', 'Palace Wedding', 'Heritage Wedding', 'Intimate Destination Wedding'] },
        { name: 'Venue Consultation', slug: 'venue-consultation', services: ['Luxury Resort', 'Beach Resort', 'Hill Resort', 'Heritage Palace', '5 Star Hotel', 'Private Villa', 'Farmhouse', 'Open Lawn'] },
        { name: 'Resort Weddings', slug: 'resort-weddings', services: ['Goa Weddings', 'Jaipur Weddings', 'Udaipur Weddings', 'Jodhpur Weddings', 'Shimla Weddings', 'Manali Weddings', 'Mussoorie Weddings', 'Rishikesh Weddings', 'Kerala Weddings'] },
        { name: 'Hotel Weddings', slug: 'hotel-weddings', services: ['3 Star Hotel', '4 Star Hotel', '5 Star Hotel', 'Luxury Hotel', 'Boutique Hotel'] },
        { name: 'Guest Hospitality', slug: 'guest-hospitality', services: ['Guest Check-in', 'Guest Check-out', 'Welcome Kits', 'Airport Pickup', 'Railway Pickup', 'Guest Transport', 'Room Allocation', 'Hospitality Desk'] },
        { name: 'Travel Management', slug: 'travel-management', services: ['Flight Assistance', 'Train Assistance', 'Bus Assistance', 'Luxury Transfers', 'Guest Shuttle'] },
        { name: 'Wedding Experiences', slug: 'wedding-experiences', services: ['Welcome Dinner', 'Pool Party', 'Mehndi', 'Haldi', 'Sangeet', 'Cocktail', 'Wedding Ceremony', 'Reception', 'After Party'] },
        { name: 'Destination Coordination', slug: 'destination-coordination', services: ['Venue Coordination', 'Vendor Coordination', 'Timeline Management', 'Guest Coordination'] },
      ]
    },
    {
      category: { name: 'Photography & Films', slug: 'photography-films' },
      subCategories: [
        { name: 'Wedding Photography', slug: 'wedding-photography', services: ['Traditional Photography', 'Candid Photography', 'Luxury Photography', 'Bridal Portrait', 'Groom Portrait', 'Family Portrait', 'Group Photography'] },
        { name: 'Corporate Photography', slug: 'corporate-photography', services: ['Conference Photography', 'Award Photography', 'Product Photography', 'Brand Photography'] },
        { name: 'Birthday Photography', slug: 'birthday-photography', services: ['Kids Birthday', 'Luxury Birthday', 'Theme Birthday'] },
        { name: 'Destination Photography', slug: 'destination-photography', services: ['Beach Shoot', 'Palace Shoot', 'Mountain Shoot', 'Resort Shoot'] },
        { name: 'Videography', slug: 'videography', services: ['Traditional Video', 'Cinematic Film', 'Wedding Highlights', 'Teaser Film', 'Documentary Film', 'Instagram Reels'] },
        { name: 'Drone', slug: 'drone', services: ['Drone Photography', 'Drone Videography', 'Aerial Coverage', 'Resort Coverage', 'Venue Coverage'] },
        { name: 'Wedding Films', slug: 'wedding-films', services: ['Love Story Film', 'Save The Date', 'Pre Wedding Film', 'Same Day Edit', 'Wedding Trailer', 'Reception Film'] },
        { name: 'Photo Booth', slug: 'photo-booth', services: ['360 Video Booth', 'Mirror Booth', 'Selfie Booth', 'Instant Print Booth'] },
        { name: 'Digital Content', slug: 'digital-content', services: ['Instagram Reels', 'YouTube Highlights', 'Short Films', 'Social Media Content', 'Behind The Scenes'] },
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

seedCorporateDestPhoto().catch(console.error);
