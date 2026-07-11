
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const coreServices = [
  "Venue Selection",
  "Banquet Hall Selection",
  "Hotel Selection",
  "Resort Selection",
  "Farmhouse Selection",
  "Marriage Palace Selection",
  "Venue Booking Assistance",
  "Guest Accommodation",
  "Wedding Decoration",
  "Stage & Mandap Setup",
  "Floral Decoration",
  "Entrance Decoration",
  "Welcome Setup",
  "Bridal Entry",
  "Groom Entry",
  "Baraat Setup",
  "Bidai Car Arrangement",
  "Wedding Coordination",
  "Timeline Planning",
  "Wedding Day Management"
];

async function addMissingCoreServices() {
  console.log("Adding missing core wedding services...");
  
  for (const name of coreServices) {
    const sId = `srv-wedding-core-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    await setDoc(doc(db, 'services', sId), {
      id: sId,
      category_id: 'cat-wedding',
      sub_category_id: 'sub-wedding-planning', // Using generic for now
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      status: 'Published',
      display_order: 1,
      desc: `Core ${name} service provided by Eventra Occasionz.`,
      feats: ['Premium Quality', 'Professional Execution'],
      standard_price: 1000,
      currency: 'INR',
      pricing_unit: 'Per Event',
      ico: 'star'
    });
    console.log(`Added core service: ${name}`);
  }
}

addMissingCoreServices().catch(console.error);
