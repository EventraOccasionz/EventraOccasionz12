
import { db } from './firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const REQUIRED_CATEGORIES = [
  { name: "Wedding Services", id: "cat-wedding", order: 1 },
  { name: "Birthday Celebrations", id: "cat-birthday-celebrations", order: 2 },
  { name: "Corporate Events", id: "cat-corporate-events", order: 3 },
  { name: "Destination Weddings", id: "cat-destination-weddings", order: 4 },
  { name: "Anniversary Celebrations", id: "cat-anniversary-celebrations", order: 5 },
  { name: "Photography & Films", id: "cat-photography-films", order: 6 },
  { name: "Balloon Decoration", id: "cat-balloon-decoration", order: 7 },
  { name: "Flower Decoration", id: "cat-flower-decoration", order: 8 },
  { name: "SFX & Special Effects", id: "cat-sfx-special-effects", order: 9 },
  { name: "Entertainment", id: "cat-entertainment", order: 10 },
  { name: "Catering Services", id: "cat-catering-services", order: 11 },
  { name: "Hospitality & Event Operations", id: "cat-hospitality-operations", order: 12 }
];

async function fixCMS() {
  console.log("Starting CMS fix...");
  const catsSnapshot = await getDocs(collection(db, 'categories'));
  const subsSnapshot = await getDocs(collection(db, 'sub_categories'));
  const servicesSnapshot = await getDocs(collection(db, 'services'));

  const catsMap = new Map();
  catsSnapshot.docs.forEach(d => catsMap.set(d.id, d.data()));

  // 1. Identify canonical IDs for duplicates
  // Manually mapping duplicates found (e.g. cat_birthday vs cat-birthday-celebrations)
  const idMappings = {
    "cat_birthday": "cat-birthday-celebrations",
    "cat_corporate": "cat-corporate-events",
    "cat_hospitality": "cat-hospitality-operations"
  };

  // 2. Move items
  for (const sub of subsSnapshot.docs) {
    const data = sub.data();
    if (idMappings[data.category_id]) {
      console.log(`Moving subcategory ${sub.id} from ${data.category_id} to ${idMappings[data.category_id]}`);
      await updateDoc(doc(db, 'sub_categories', sub.id), { category_id: idMappings[data.category_id] });
    }
  }

  for (const svc of servicesSnapshot.docs) {
    const data = svc.data();
    if (idMappings[data.category_id]) {
      console.log(`Moving service ${svc.id} from ${data.category_id} to ${idMappings[data.category_id]}`);
      await updateDoc(doc(db, 'services', svc.id), { category_id: idMappings[data.category_id] });
    }
  }

  // 3. Update orders and delete duplicates
  for (const cat of REQUIRED_CATEGORIES) {
    if (catsMap.has(cat.id)) {
      console.log(`Updating ${cat.name} order to ${cat.order}`);
      await updateDoc(doc(db, 'categories', cat.id), { display_order: cat.order });
    }
  }

  for (const cat of catsSnapshot.docs) {
    if (!REQUIRED_CATEGORIES.find(c => c.id === cat.id)) {
      console.log(`Deleting duplicate category ${cat.id}`);
      await deleteDoc(doc(db, 'categories', cat.id));
    }
  }

  console.log("CMS fix complete.");
}

fixCMS().catch(console.error);
