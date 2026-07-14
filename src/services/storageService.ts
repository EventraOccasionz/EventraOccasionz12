import { authService } from './authService';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { UploadedDocument, VerificationStatus } from '../types';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // Support up to 10MB since we auto-compress anyway

/**
 * Resizes and compresses an image to fit inside Firestore's 1MB document limit.
 * Converts to JPEG base64 with adjustable quality.
 */
function compressAndResizeImage(file: File, maxWidth = 900, maxHeight = 900, quality = 0.7): Promise<string> {
  // If it's a PDF, we don't compress, just read as Base64
  if (file.type === 'application/pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(new Error('PDF reader error: ' + e));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio adaptive target resizing
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas 2D context is unavailable
          resolve(event.target?.result as string);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert the file to compressed JPEG format
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (e) => reject(new Error('Image processor load error: ' + e));
    };
    reader.onerror = (e) => reject(new Error('FileReader error: ' + e));
  });
}

export const storageService = {
  async uploadImage(file: File, bypassAdminCheck = false): Promise<string> {
    // 1. Validation: Protect system by validating inputs client-side first
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      throw new Error(`Upload aborted: File extension '.${fileExt}' is not permitted. Authorized extension list: JPEG, PNG, WEBP, GIF, PDF.`);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Upload aborted: MIME type '${file.type}' is unauthorized for storage safety.`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Upload aborted: Original file is too large. Loaded ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB. Limit constraint: 10MB.`);
    }

    // 2. Validate administrator authorization (Only administrators can upload/alter assets, unless bypassed for guest uploads)
    if (!bypassAdminCheck) {
      let isAdmin = localStorage.getItem('is_admin') === 'true' || localStorage.getItem('user_role') === 'admin';

      // Dynamically retrieve authenticated user's email as fallback to avoid stale session blockages
      if (!isAdmin && authService.isConfigured()) {
        try {
          const { auth } = await import('./firebase');
          const currentUser = auth?.currentUser;
          if (currentUser) {
            const email = currentUser.email?.toLowerCase();
            const whitelist = ['eventraoccasionz@gmail.com', 'ddg27874@gmail.com'];
            if (email && whitelist.includes(email)) {
              isAdmin = true;
            }
          }
        } catch (authErr) {
          console.warn('[Storage] Dynamic auth checks failed:', authErr);
        }
      }

      if (authService.isConfigured() && !isAdmin) {
        throw new Error('Upload aborted: Elevated administrator status is required to upload files.');
      }
    }

    // Automatically compress the image to downscale bytes under Firestore document limits
    try {
      return await compressAndResizeImage(file);
    } catch (err: any) {
      console.warn('Canvas compression failed, falling back to raw reader:', err);
      // Fallback to raw base64 if anything fails during canvas manipulation
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(new Error('Local file reader system error: ' + e));
        reader.readAsDataURL(file);
      });
    }
  },

  async deleteImage(filePath: string): Promise<void> {
    const isAdmin = localStorage.getItem('is_admin') === 'true' || localStorage.getItem('user_role') === 'admin';
    if (!isAdmin) {
      throw new Error('Destructive operation aborted: You do not have permission to delete assets.');
    }
    // Base64 assets are stored inline inside Firestore documents, so they are cleaned up automatically
    console.log('Image removal event received for path/data:', filePath.substring(0, 50) + '...');
  },

  // Guest Document Operations
  async saveGuestDocument(doc: Omit<UploadedDocument, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'guest_documents'), {
        ...doc,
        uploaded_at: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'guest_documents');
      return '';
    }
  },

  async getGuestDocuments(eventId: string, familyId?: string): Promise<UploadedDocument[]> {
    try {
      let q = query(collection(db, 'guest_documents'), where('event_id', '==', eventId));
      if (familyId) {
        q = query(q, where('family_id', '==', familyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UploadedDocument));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'guest_documents');
      return [];
    }
  },

  async updateDocumentStatus(docId: string, status: VerificationStatus, notes?: string): Promise<void> {
    try {
      const docRef = doc(db, 'guest_documents', docId);
      await updateDoc(docRef, { 
        verification_status: status,
        ...(notes !== undefined && { notes })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `guest_documents/${docId}`);
    }
  },

  async deleteGuestDocument(docId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'guest_documents', docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `guest_documents/${docId}`);
    }
  }
};
