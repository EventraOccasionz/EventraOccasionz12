
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

async function listCurrentStructure() {
  const cats = await getDocs(collection(db, 'categories'));
  console.log("--- CURRENT CATEGORIES ---");
  cats.forEach(d => console.log(`${d.id}: ${d.data().name}`));
}

listCurrentStructure().catch(console.error);
