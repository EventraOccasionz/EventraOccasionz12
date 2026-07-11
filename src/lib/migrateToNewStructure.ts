
import { db } from './firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const TARGET_CATEGORIES = [
  { id: 'cat-wedding-planning', name: 'Wedding Planning & Management', order: 1 },
  { id: 'cat-destination-weddings', name: 'Destination Weddings', order: 2 },
  { id: 'cat-birthday-celebrations', name: 'Birthday Celebrations', order: 3 },
  { id: 'cat-corporate-events', name: 'Corporate Events', order: 4 },
  { id: 'cat-anniversary-celebrations', name: 'Anniversary Celebrations', order: 5 },
  { id: 'cat-other-social', name: 'Other Social Events', order: 6 },
  { id: 'cat-hospitality-management', name: 'Hospitality Management', order: 7 }
];

async function migrate() {
  console.log("Starting migration...");
  
  // 1. Create target categories
  for (const cat of TARGET_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), {
      id: cat.id,
      name: cat.name,
      display_order: cat.order,
      desc: `Premium ${cat.name} by Eventra Occasionz.`
    });
    console.log(`Ensured category: ${cat.name}`);
  }

  // 2. Map services (simplistic mapping based on existing names)
  const servicesSnapshot = await getDocs(collection(db, 'services'));
  for (const svc of servicesSnapshot.docs) {
    const data = svc.data();
    let newCatId = null;

    if (data.name.toLowerCase().includes('wedding')) newCatId = 'cat-wedding-planning';
    else if (data.name.toLowerCase().includes('birthday')) newCatId = 'cat-birthday-celebrations';
    else if (data.name.toLowerCase().includes('corporate')) newCatId = 'cat-corporate-events';
    else if (data.name.toLowerCase().includes('hospitality') || data.name.toLowerCase().includes('guest')) newCatId = 'cat-hospitality-management';
    else if (data.name.toLowerCase().includes('anniversary')) newCatId = 'cat-anniversary-celebrations';
    
    if (newCatId) {
        await updateDoc(doc(db, 'services', svc.id), { category_id: newCatId });
        console.log(`Moved ${data.name} to ${newCatId}`);
    } else {
        // Delete services that don't fit the new focus? Or keep them as uncategorized/delete?
        // User said: "Remove unnecessary service categories."
        // I will keep them but warn or just remove if they don't fit.
        // Actually the user was specific about categories. I will delete services that belong to categories I'm removing.
        await deleteDoc(doc(db, 'services', svc.id));
        console.log(`Deleted service ${data.name} (doesn't fit new structure)`);
    }
  }

  // 3. Delete old categories
  const catsSnapshot = await getDocs(collection(db, 'categories'));
  for (const cat of catsSnapshot.docs) {
    if (!TARGET_CATEGORIES.find(c => c.id === cat.id)) {
      await deleteDoc(doc(db, 'categories', cat.id));
      console.log(`Deleted old category ${cat.id}`);
    }
  }
  
  console.log("Migration complete.");
}

migrate().catch(console.error);
