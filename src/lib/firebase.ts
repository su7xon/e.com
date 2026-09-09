import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  type Firestore,
} from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import type { MenuItem } from '../types';

// Config: VITE_ env vars first, fallback to project defaults so upload works out of the box.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAcPsgKOrYQypAdLPYJs-AFuMhsRYhmxZg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pizzaaaaaaaa-6b26b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pizzaaaaaaaa-6b26b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pizzaaaaaaaa-6b26b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '588235968119',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:588235968119:web:634b33ccd17612c7ee0072',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-R7PYRGSL2F',
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const storage: FirebaseStorage = getStorage(app);
export const db: Firestore = getFirestore(app);

// Analytics only in browser + supported env. Never blocks app boot.
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((ok) => {
      if (ok) {
        try {
          analytics = getAnalytics(app);
        } catch {
          analytics = null;
        }
      }
    })
    .catch(() => {
      analytics = null;
    });
}

const MAX_IMAGE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

/**
 * Upload menu item image to Firebase Storage.
 * Returns public download URL. Shows progress via callback (0-100).
 */
export function uploadMenuImage(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error('Sirf JPG / PNG / WebP / GIF image allowed hai.'));
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      reject(new Error(`Image 5MB se chhoti honi chahiye. (milaa ${(file.size / 1024 / 1024).toFixed(1)}MB)`));
      return;
    }

    const path = `menu-items/${Date.now()}-${sanitizeFileName(file.name)}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    let settled = false;
    const fail = (msg: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      try {
        task.cancel();
      } catch {
        // ignore
      }
      reject(new Error(msg));
    };

    // 60s me koi progress/error nahi → atka hua samjho, saaf wajah batao
    const timeoutId = setTimeout(() => {
      fail(
        'Upload 60s se 0% pe atka hai. Iska matlab Storage bucket bana hi nahi ya net blocked hai. ' +
          'Firebase console → Build → Storage → Get Started dabao, bucket banao, phir retry karo.'
      );
    }, 60000);

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (err.code === 'storage/unauthorized') {
          reject(new Error('Storage permission denied. Console → Storage → Security me allow read + allow write publish karo.'));
        } else if (err.code === 'storage/canceled') {
          reject(new Error('Upload cancel ho gaya.'));
        } else if (err.code === 'storage/bucket-not-found' || err.code === 'storage/project-not-found') {
          reject(new Error('Storage bucket mila hi nahi. Console → Build → Storage → Get Started se bucket banao, phir retry karo.'));
        } else if (err.code === 'storage/retry-limit-exceeded' || err.code === 'storage/unknown') {
          reject(new Error('Network/bucket issue. Pehle Storage bucket bana hai ye confirm karo (Get Started), phir chhoti image se retry karo.'));
        } else {
          reject(new Error(`Upload fail: ${err.code || err.message}`));
        }
      },
      async () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Download URL nahi mila.'));
        }
      }
    );
  });
}

/**
 * Pehle se optimized Blob (200-300KB) ko Storage me daalo.
 * Bucket bana hona chahiye (Console → Build → Storage → Get Started).
 */
export function uploadImageBlob(
  blob: Blob,
  fileName: string,
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const safe = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(0, 80);
    const storageRef = ref(storage, `menu-items/${Date.now()}-${safe}`);
    const task = uploadBytesResumable(storageRef, blob, { contentType });

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        task.cancel();
      } catch {
        // ignore
      }
      reject(
        new Error(
          'Upload 60s se atka hai. Console → Build → Storage → Get Started se bucket banao, phir retry karo.'
        )
      );
    }, 60000);

    task.on(
      'state_changed',
      (snap) => {
        onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (err.code === 'storage/unauthorized') {
          reject(new Error('Storage permission denied. Console → Storage → Security me allow read + allow write publish karo.'));
        } else if (err.code === 'storage/canceled') {
          reject(new Error('Upload cancel ho gaya.'));
        } else if (err.code === 'storage/bucket-not-found' || err.code === 'storage/project-not-found') {
          reject(new Error('Storage bucket mila hi nahi. Console → Build → Storage → Get Started se bucket banao.'));
        } else if (err.code === 'storage/retry-limit-exceeded' || err.code === 'storage/unknown') {
          reject(new Error('Network/bucket issue. Storage bucket bana hai ye confirm karo, phir retry karo.'));
        } else {
          reject(new Error(`Upload fail: ${err.code || err.message}`));
        }
      },
      async () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Download URL nahi mila.'));
        }
      }
    );
  });
}

// ---------- Firestore: menuItems collection (sab devices pe same menu) ----------

const MENU_COLLECTION = 'menuItems';

function toPlain(item: MenuItem): Record<string, unknown> {
  return JSON.parse(JSON.stringify(item)) as Record<string, unknown>;
}

export async function saveMenuItemToFirestore(item: MenuItem): Promise<void> {
  await setDoc(doc(db, MENU_COLLECTION, item.id), toPlain(item));
}

export async function deleteMenuItemFromFirestore(itemId: string): Promise<void> {
  await deleteDoc(doc(db, MENU_COLLECTION, itemId));
}

export async function fetchMenuItemsFromFirestore(): Promise<MenuItem[] | null> {
  const snap = await getDocs(collection(db, MENU_COLLECTION));
  if (snap.empty) return null;
  const items: MenuItem[] = [];
  snap.forEach((d) => {
    items.push({ ...(d.data() as MenuItem), id: d.id });
  });
  return items;
}

export { app };
