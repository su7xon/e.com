import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  arrayUnion,
  arrayRemove,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import type { MenuItem } from '../types';
import type { AdminOrder } from '../components/admin/adminData';
import type { Outlet } from '../components/admin/outlets';

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


const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const FIREBASE_PROJECT_ID: string = firebaseConfig.projectId;
export const FIREBASE_API_KEY: string = firebaseConfig.apiKey;

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in using Google popup. Returns the authenticated Firebase User.
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out current Firebase user.
 */
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Listen to auth state changes (persisted session).
 */
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

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

/** Set a field on an order (e.g. backfill outletId on old orders). */
export async function patchOrderInFirestore(orderId: string, patch: Partial<AdminOrder>): Promise<void> {
  await setDoc(doc(db, ORDERS_COLLECTION, orderId), toPlain(patch), { merge: true });
}

/**
 * Live orders for staff. `'all'` (owner only) = every store; otherwise just that store's orders,
 * which is what the security rules let managers / staff / riders read.
 * Returns unsubscribe. Never throws.
 */
export function subscribeToFirestoreOrders(
  scope: string | 'all',
  onOrders: (orders: AdminOrder[]) => void,
  onError?: (message: string) => void
): () => void {
  try {
    const source =
      scope === 'all'
        ? collection(db, ORDERS_COLLECTION)
        : query(collection(db, ORDERS_COLLECTION), where('outletId', '==', scope));
    return onSnapshot(
      source,
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

/**
 * Customer side: watch only this phone's own orders (by id) for the tracker —
 * never the whole collection, which holds other customers' names and addresses.
 */
export function subscribeToMyOrders(
  orderIds: string[],
  onOrders: (orders: AdminOrder[]) => void,
  onError?: (message: string) => void
): () => void {
  const latest = new Map<string, AdminOrder>();
  const unsubs = orderIds.map((id) => {
    try {
      return onSnapshot(
        doc(db, ORDERS_COLLECTION, id),
        (snap) => {
          if (snap.exists()) latest.set(id, { ...(snap.data() as AdminOrder), id });
          else latest.delete(id);
          onOrders(Array.from(latest.values()));
        },
        (err) => onError?.(err.code || err.message)
      );
    } catch {
      return () => {};
    }
  });
  return () => unsubs.forEach((u) => u());
}

// ---------- Firestore: stores (outlets) and per-store sold-out ----------

const OUTLETS_COLLECTION = 'outlets';
const OUTLET_MENU_COLLECTION = 'outletMenu';

export async function saveOutletToFirestore(outlet: Outlet): Promise<void> {
  await setDoc(doc(db, OUTLETS_COLLECTION, outlet.id), toPlain(outlet));
}

/** Only the given fields (managers may change just `tables` / `qrToken` of their own store). */
export async function patchOutletInFirestore(outletId: string, patch: Partial<Outlet>): Promise<void> {
  await setDoc(doc(db, OUTLETS_COLLECTION, outletId), toPlain(patch), { merge: true });
}

export function subscribeToOutlets(onOutlets: (outlets: Outlet[]) => void, onError?: (message: string) => void): () => void {
  try {
    return onSnapshot(
      collection(db, OUTLETS_COLLECTION),
      (snap) => {
        const list: Outlet[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as Outlet), id: d.id }));
        onOutlets(list);
      },
      (err) => onError?.(err.code || err.message)
    );
  } catch {
    return () => {};
  }
}

/** Item ids sold out at one store. */
export function subscribeToOutletSoldOut(outletId: string, onIds: (ids: string[]) => void): () => void {
  try {
    return onSnapshot(
      doc(db, OUTLET_MENU_COLLECTION, outletId),
      (snap) => {
        const ids = (snap.exists() ? (snap.data() as { soldOut?: unknown }).soldOut : []) as unknown;
        onIds(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : []);
      },
      () => onIds([])
    );
  } catch {
    return () => {};
  }
}

export async function setOutletSoldOut(outletId: string, itemId: string, soldOut: boolean): Promise<void> {
  await setDoc(
    doc(db, OUTLET_MENU_COLLECTION, outletId),
    { soldOut: soldOut ? arrayUnion(itemId) : arrayRemove(itemId) },
    { merge: true }
  );
}

// ---------- Firestore: counter item codes (one list for all stores) ----------

const POS_CODES_DOC = ['posCodes', 'items'] as const;

/** Saved codes (item id → code). Falls back to none, so the built-in codes keep working. */
export function subscribeToPosCodes(onCodes: (codes: Record<string, string>) => void): () => void {
  try {
    return onSnapshot(
      doc(db, ...POS_CODES_DOC),
      (snap) => onCodes(((snap.exists() ? (snap.data() as { codes?: Record<string, string> }).codes : null) ?? {})),
      () => onCodes({})
    );
  } catch {
    return () => {};
  }
}

export async function savePosCode(id: string, code: string): Promise<void> {
  await setDoc(doc(db, ...POS_CODES_DOC), { codes: { [id]: code } }, { merge: true });
}

export { app, firebaseConfig };
