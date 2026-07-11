
import { db } from './firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const FINAL_ORDER = [
  { id: 'cat-wedding-planning', order: 1 },
  { id: 'cat-destination-weddings', order: 2 },
  { id: 'cat-birthday-celebrations', order: 3 },
  { id: 'cat-corporate-events', order: 4 },
  { id: 'cat-anniversary-celebrations', order: 5 },
  { id: 'cat-other-social', order: 6 },
  { id: 'cat-hospitality-management', order: 7 }
];

async function setDisplayOrders() {
  console.log("Setting final display orders...");
  for (const cat of FINAL_ORDER) {
    try {
      await updateDoc(doc(db, 'categories', cat.id), { display_order: cat.order });
      console.log(`Set order ${cat.order} for ${cat.id}`);
    } catch (e) {
      console.error(`Failed to update ${cat.id}:`, e);
    }
  }
  console.log("Ordering complete.");
}

setDisplayOrders().catch(console.error);
