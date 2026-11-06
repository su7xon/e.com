import type { StaffProfile, StaffRole } from '../../lib/auth';

export type AdminTab =
  | 'dashboard'
  | 'live-orders'
  | 'delivery'
  | 'rushda'
  | 'menu'
  | 'offers'
  | 'coupons'
  | 'images'
  | 'qr'
  | 'stores'
  | 'staff';

/** Admin pages each role can open. Riders only get the /delivery screen. */
export const ROLE_TABS: Record<StaffRole, AdminTab[]> = {
  owner: ['dashboard', 'live-orders', 'delivery', 'rushda', 'menu', 'offers', 'coupons', 'images', 'qr', 'stores', 'staff'],
  manager: ['dashboard', 'live-orders', 'delivery', 'rushda', 'menu', 'qr', 'staff'],
  staff: ['live-orders', 'rushda', 'menu'],
  rider: [],
};

export type AdminAction =
  /** Add / edit / delete menu items, prices, photos (owner only). */
  | 'edit-menu'
  /** Mark items sold out at a store. */
  | 'sold-out'
  /** Day close report, Excel export. */
  | 'reports'
  /** Delete an order. */
  | 'delete-order'
  /** Edit store details (address, pin, hours, GST, bill header). */
  | 'edit-stores'
  /** Add / remove logins. */
  | 'manage-staff'
  /** Open the /delivery rider screen. */
  | 'rider-screen';

const ACTIONS: Record<StaffRole, AdminAction[]> = {
  owner: ['edit-menu', 'sold-out', 'reports', 'delete-order', 'edit-stores', 'manage-staff', 'rider-screen'],
  manager: ['sold-out', 'reports', 'delete-order', 'manage-staff', 'rider-screen'],
  staff: ['sold-out'],
  rider: ['rider-screen'],
};

export const can = (profile: Pick<StaffProfile, 'role'>, action: AdminAction) => ACTIONS[profile.role].includes(action);

export const tabsFor = (profile: Pick<StaffProfile, 'role'>) => ROLE_TABS[profile.role];

/** Roles a person may create logins for. */
export const creatableRoles = (profile: Pick<StaffProfile, 'role'>): StaffRole[] =>
  profile.role === 'owner' ? ['manager', 'staff', 'rider'] : profile.role === 'manager' ? ['staff', 'rider'] : [];

/** Pages that need one store picked (owner on "All stores" is asked to choose). */
export const NEEDS_ONE_STORE: AdminTab[] = ['rushda', 'qr'];
