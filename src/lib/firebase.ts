import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import type { MenuItem } from '../types';
import type { AdminOrder } from '../components/admin/adminData';

// Config: VITE_ env vars first, fallback to project defaults so upload works out of the box.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCBPh_XLIGGeLpjkd8eQIk-U6-6t9ZWSGs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pizzaaaaaaaa-4f3b2.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pizzaaaaaaaa-4f3b2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pizzaaaaaaaa-4f3b2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1025047896197',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1025047896197:web:a9e872efbf5fc1164609ec',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-5BD3XTBB2J',
};


let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const FIREBASE_PROJECT_ID: string = firebaseConfig.projectId;
export const FIREBASE_API_KEY: string = firebaseConfig.apiKey;

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
      reject(new Error('Only JPG / PNG / WebP / GIF images are allowed.'));
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      reject(new Error(`Image must be smaller than 5MB. (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`));
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

    // No progress/error within 60s → treat as stuck, explain the likely cause
    const timeoutId = setTimeout(() => {
      fail(
        'Upload stuck at 0% for 60s. This usually means the Storage bucket does not exist yet or the network is blocked. ' +
          'In Firebase console go to Build → Storage → Get Started, create the bucket, then retry.'
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
          reject(new Error('Storage permission denied. In Console → Storage → Security, allow read + write to publish.'));
        } else if (err.code === 'storage/canceled') {
          reject(new Error('Upload was cancelled.'));
        } else if (err.code === 'storage/bucket-not-found' || err.code === 'storage/project-not-found') {
          reject(new Error('Storage bucket not found. In Console go to Build → Storage → Get Started to create the bucket, then retry.'));
        } else if (err.code === 'storage/retry-limit-exceeded' || err.code === 'storage/unknown') {
          reject(new Error('Network/bucket issue. First confirm the Storage bucket exists (Get Started), then retry with a smaller image.'));
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
          reject(e instanceof Error ? e : new Error('Download URL not received.'));
        }
      }
    );
  });
}

/**
 * Upload an already-optimized Blob (200-300KB) to Storage.
 * The bucket must exist (Console → Build → Storage → Get Started).
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
          'Upload stuck for 60s. In Console go to Build → Storage → Get Started to create the bucket, then retry.'
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
          reject(new Error('Storage permission denied. In Console → Storage → Security, allow read + write to publish.'));
        } else if (err.code === 'storage/canceled') {
          reject(new Error('Upload was cancelled.'));
        } else if (err.code === 'storage/bucket-not-found' || err.code === 'storage/project-not-found') {
          reject(new Error('Storage bucket not found. In Console go to Build → Storage → Get Started to create the bucket.'));
        } else if (err.code === 'storage/retry-limit-exceeded' || err.code === 'storage/unknown') {
          reject(new Error('Network/bucket issue. Confirm the Storage bucket exists, then retry.'));
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
          reject(e instanceof Error ? e : new Error('Download URL not received.'));
        }
      }
    );
  });
}

// ---------- Firestore: menuItems collection (same menu on all devices) ----------

const MENU_COLLECTION = 'menuItems';

function toPlain(item: unknown): Record<string, unknown> {
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

/**
 * Live subscription for menuItems (har device, har outlet).
 * When admin adds/deletes in Outlet-1, Outlet-2 / customer phones update live too.
 * Returns unsubscribe. Never throws.
 */
export function subscribeToFirestoreMenu(
  onItems: (items: MenuItem[]) => void,
  onError?: (message: string) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, MENU_COLLECTION),
      (snap) => {
        const list: MenuItem[] = [];
        snap.forEach((d) => {
          list.push({ ...(d.data() as MenuItem), id: d.id });
        });
        onItems(list);
      },
      (err) => {
        onError?.(err.code || err.message);
      }
    );
  } catch {
    return () => {};
  }
}

// ---------- Firestore: orders collection (customer device -> admin device, live) ----------

const ORDERS_COLLECTION = 'orders';

/** Customer places order: mirror it to Firestore so the admin screen gets it live. */
export async function saveOrderToFirestore(order: AdminOrder): Promise<void> {
  await setDoc(doc(db, ORDERS_COLLECTION, order.id), toPlain(order));
}

/** Admin changes status: sync back so customer/other screens stay consistent. */
export async function updateOrderStatusInFirestore(
  orderId: string,
  status: AdminOrder['status']
): Promise<void> {
  await setDoc(doc(db, ORDERS_COLLECTION, orderId), { status }, { merge: true });
}

/** Admin deletes order: remove from Firestore so it vanishes on all devices. */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
}

/** Live subscription for the admin screen. Returns unsubscribe. Never throws. */
export function subscribeToFirestoreOrders(
  onOrders: (orders: AdminOrder[]) => void,
  onError?: (message: string) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, ORDERS_COLLECTION),
      (snap) => {
        const list: AdminOrder[] = [];
        snap.forEach((d) => {
          list.push({ ...((d.data() as AdminOrder) ?? {}), id: d.id } as AdminOrder);
        });
        onOrders(list);
      },
      (err) => {
        // Offline / permission denied: stay on local orders, report status.
        onError?.(err.code || err.message);
      }
    );
  } catch {
    return () => {};
  }
}

export { app };
