import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

async function deleteCollection(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  for (const document of querySnapshot.docs) {
    await deleteDoc(doc(db, collectionName, document.id));
    console.log(`Deleted document ${document.id} from ${collectionName}`);
  }
}

async function cleanup() {
  console.log("Cleaning up AI collections...");
  await deleteCollection('estimator_cities');
  await deleteCollection('estimator_hotels');
  await deleteCollection('estimator_venues');
  await deleteCollection('estimator_packages');
  await deleteCollection('knowledge_base');
  console.log("Cleanup complete.");
}

cleanup().catch(console.error);
