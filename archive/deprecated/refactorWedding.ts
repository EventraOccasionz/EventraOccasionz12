
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const allowedServices = [
  "Complete Wedding Planning",
  "Luxury Wedding Planning",
  "Destination Wedding Planning",
  "Wedding Consultation",
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
  "Vendor Coordination",
  "Timeline Planning",
  "Wedding Day Management"
];

async function refactorWedding() {
  console.log("Refactoring Wedding Services...");
  
  const querySnapshot = await getDocs(collection(db, 'services'));
  
  for (const document of querySnapshot.docs) {
    const data = document.data();
    if (data.category_id === 'cat-wedding') {
      if (!allowedServices.includes(data.name)) {
        console.log(`Deleting service: ${data.name}`);
        await deleteDoc(doc(db, 'services', document.id));
      } else {
        console.log(`Keeping service: ${data.name}`);
      }
    }
  }
}

refactorWedding().catch(console.error);
