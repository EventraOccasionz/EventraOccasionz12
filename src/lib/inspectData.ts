
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

async function listData() {
  const cats = await getDocs(collection(db, 'categories'));
  const subs = await getDocs(collection(db, 'sub_categories'));
  const services = await getDocs(collection(db, 'services'));

  console.log("--- CATEGORIES ---");
  cats.forEach(d => console.log(`${d.id}: ${d.data().name} (order: ${d.data().display_order})`));
  
  console.log("\n--- SUB CATEGORIES ---");
  subs.forEach(d => console.log(`${d.id}: ${d.data().name} (parent: ${d.data().category_id})`));
}

listData().catch(console.error);
