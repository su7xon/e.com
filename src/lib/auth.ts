import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
} from 'firebase/auth';
import { collection, doc, onSnapshot, query, setDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import { app, db, firebaseConfig } from './firebase';

export type StaffRole = 'owner' | 'manager' | 'staff' | 'rider';

export interface StaffProfile {
  uid: string;
  username: string;
  name: string;
  role: StaffRole;
  /** The store this person works at. Empty for the owner (all stores). */
  outletId?: string;
  active: boolean;
  createdBy?: string;
  createdAt?: number;
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
  rider: 'Rider',
};

/** Usernames are turned into Firebase emails on this domain; staff only ever type the username. */
const STAFF_EMAIL_DOMAIN = 'staff.7cheesepizza.com';
/** The owner's login. Its profile is created on first sign-in (the security rules allow only this email to do that). */
export const OWNER_USERNAME = 'owner';

export const normalizeUsername = (u: string) => u.trim().toLowerCase();
export const isValidUsername = (u: string) => /^[a-z0-9][a-z0-9.-]{2,29}$/.test(u);
const toEmail = (username: string) => `${normalizeUsername(username)}@${STAFF_EMAIL_DOMAIN}`;
/** Staff logins are usernames on the staff domain; everything else (Google sign-in) is a customer. */
export const isStaffEmail = (email?: string | null) => !!email && email.toLowerCase().endsWith(`@${STAFF_EMAIL_DOMAIN}`);

export const auth: Auth = getAuth(app);
const STAFF = 'staff';

/** Readable message for the login and staff screens. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-email')
    return 'Wrong username or password.';
  if (code === 'auth/too-many-requests') return 'Too many tries. Wait a few minutes and try again.';
  if (code === 'auth/network-request-failed') return 'No internet connection. Check the network and try again.';
  if (code === 'auth/email-already-in-use') return 'That username is already taken. Choose another one.';
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed')
    return 'Staff login is not switched on yet. The owner needs to turn on Email/Password sign-in in Firebase.';
  if (code === 'permission-denied') return 'You are not allowed to do that.';
  return (err as { message?: string })?.message || 'Something went wrong. Try again.';
}

export async function staffSignIn(username: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, toEmail(username), password);
}

export async function staffSignOut(): Promise<void> {
  try {
    sessionStorage.removeItem(DEV_KEY);
    localStorage.removeItem(DEV_KEY);
  } catch {
    // ignore
  }
  devListeners.forEach((l) => l({ status: 'signed-out' }));
  await signOut(auth).catch(() => {});
}

export type StaffSession =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'denied'; message: string }
  | { status: 'ready'; profile: StaffProfile };

// Local test hook (dev server only, stripped from production builds): lets automated UI tests
// log in as a role without a real Firebase account.
const DEV_KEY = 'seven_cheese_dev_staff';
const devListeners = new Set<(s: StaffSession) => void>();
function devProfile(): StaffProfile | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(DEV_KEY);
    return raw ? (JSON.parse(raw) as StaffProfile) : null;
  } catch {
    return null;
  }
}

/**
 * Who is signed in on this device, with their live staff profile.
 * A removed (inactive) or unknown login is signed out with a message.
 */
export function watchStaffSession(cb: (s: StaffSession) => void): () => void {
  const dev = devProfile();
  if (dev) {
    cb({ status: 'ready', profile: dev });
    devListeners.add(cb);
    return () => devListeners.delete(cb);
  }
  devListeners.add(cb);
  let unsubProfile: (() => void) | null = null;
  const unsubAuth = onAuthStateChanged(auth, (user) => {
    unsubProfile?.();
    unsubProfile = null;
    // A customer signed in with Google is not staff: show the staff login, never sign them out.
    if (!user || !isStaffEmail(user.email)) {
      cb({ status: 'signed-out' });
      return;
    }
    cb({ status: 'loading' });
    const ref = doc(db, STAFF, user.uid);
    unsubProfile = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      async (snap) => {
        // Wait until the server has the profile (first owner sign-in writes it from this device),
        // otherwise the store's orders are asked for before the rules can see the profile.
        if (snap.metadata.hasPendingWrites) return;
        const username = (user.email || '').split('@')[0];
        if (!snap.exists()) {
          // First sign-in of the owner login: create its profile.
          if (username === OWNER_USERNAME) {
            try {
              await setDoc(ref, {
                uid: user.uid,
                username,
                name: 'Owner',
                role: 'owner',
                active: true,
                createdAt: Date.now(),
              } satisfies StaffProfile);
              return; // the snapshot fires again with the new profile
            } catch {
              // fall through to "no access"
            }
          }
          cb({ status: 'denied', message: 'This login has no staff access. Ask the owner or your store manager.' });
          void signOut(auth);
          return;
        }
        const profile = { ...(snap.data() as StaffProfile), uid: user.uid };
        if (!profile.active) {
          cb({ status: 'denied', message: 'This login has been removed. Ask the owner or your store manager.' });
          void signOut(auth);
          return;
        }
        cb({ status: 'ready', profile });
      },
      () => {
        cb({ status: 'denied', message: 'Could not load your staff profile. Check the internet and try again.' });
      }
    );
  });
  return () => {
    devListeners.delete(cb);
    unsubAuth();
    unsubProfile?.();
  };
}

// ---------- Staff management (owner: anyone; manager: Staff and Riders of their store) ----------

/** Second Firebase app, so creating a login does not sign the owner / manager out of this one. */
function creatorAuth(): Auth {
  const existing = getApps().find((a) => a.name === 'staff-creator');
  return getAuth(existing ?? initializeApp(firebaseConfig, 'staff-creator'));
}

export async function createStaffLogin(
  input: { username: string; password: string; name: string; role: StaffRole; outletId?: string },
  createdBy: StaffProfile,
): Promise<StaffProfile> {
  const username = normalizeUsername(input.username);
  if (!isValidUsername(username)) throw new Error('Username: 3–30 letters, numbers, dots or dashes (e.g. raipur.manager).');
  if (input.password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (input.role === 'owner') throw new Error('Only one owner login is allowed.');
  if (!input.outletId) throw new Error('Choose the store this person works at.');
  const second = creatorAuth();
  const cred = await createUserWithEmailAndPassword(second, toEmail(username), input.password);
  await signOut(second).catch(() => {});
  const profile: StaffProfile = {
    uid: cred.user.uid,
    username,
    name: input.name.trim() || username,
    role: input.role,
    outletId: input.outletId,
    active: true,
    createdBy: createdBy.uid,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, STAFF, profile.uid), profile);
  return profile;
}

export async function setStaffActive(uid: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, STAFF, uid), { active });
}

/** Staff list: every store for the owner, one store for a manager. */
export function watchStaffList(
  scope: string | 'all',
  cb: (list: StaffProfile[]) => void,
  onError?: (message: string) => void,
): () => void {
  const source = scope === 'all' ? collection(db, STAFF) : query(collection(db, STAFF), where('outletId', '==', scope));
  return onSnapshot(
    source,
    (snap) => {
      const list: StaffProfile[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as StaffProfile), uid: d.id }));
      list.sort((a, b) => (a.outletId || '').localeCompare(b.outletId || '') || a.username.localeCompare(b.username));
      cb(list);
    },
    (err) => onError?.(authErrorMessage(err)),
  );
}

export async function getStaffProfile(uid: string): Promise<StaffProfile | null> {
  const snap = await getDoc(doc(db, STAFF, uid));
  return snap.exists() ? ({ ...(snap.data() as StaffProfile), uid } as StaffProfile) : null;
}
