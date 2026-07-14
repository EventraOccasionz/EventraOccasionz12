
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const TO_DELETE = [
  'cat-balloon-decoration',
  'cat-catering-services',
  'cat-entertainment',
  'cat-flower-decoration',
  'cat-hospitality-operations',
  'cat-photography-films',
  'cat-sfx-special-effects'
];

async function finalCleanup() {
  console.log("Deleting redundant categories...");
  for (const id of TO_DELETE) {
    try {
      await deleteDoc(doc(db, 'categories', id));
      console.log(`Deleted: ${id}`);
    } catch (e) {
      console.error(`Failed to delete ${id}:`, e);
    }
  }
  console.log("Cleanup complete.");
}

finalCleanup().catch(console.error);
