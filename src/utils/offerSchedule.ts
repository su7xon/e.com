export interface OfferSchedule {
  /** 0 = Sunday ... 6 = Saturday. Omitted/empty = every day. */
  days?: number[];
  /** 24h "HH:MM". Omitted = no time limit. */
  startTime?: string;
  endTime?: string;
}

export const TUESDAY: OfferSchedule = { days: [2] };
export const FRIDAY: OfferSchedule = { days: [5] };
export const LUNCH: OfferSchedule = { startTime: '11:00', endTime: '14:00' };

/** Built-in schedules for the default offers, keyed by coupon code or combo item id. */
export const OFFER_SCHEDULES: Record<string, OfferSchedule> = {
  TUESDAYTREAT: TUESDAY,
  FUNDAYFRIDAY: FRIDAY,
  'p-offer-tuesday-treat': TUESDAY,
  'p-offer-lunch-regular-veg': LUNCH,
  'p-offer-lunch-regular-nonveg': LUNCH,
  'p-offer-lunch-medium-veg': LUNCH,
  'p-offer-lunch-medium-nonveg': LUNCH,
};

/** Banner "Show when" presets (Admin → Store Images). */
export const SLIDE_SCHEDULES: Record<string, OfferSchedule | undefined> = {
  always: undefined,
  tuesday: TUESDAY,
  friday: FRIDAY,
  lunch: LUNCH,
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

export const isScheduleActive = (s: OfferSchedule | undefined, now: Date): boolean => {
  if (!s) return true;
  if (s.days && s.days.length > 0 && !s.days.includes(now.getDay())) return false;
  if (s.startTime && s.endTime) {
    const cur = now.getHours() * 60 + now.getMinutes();
    if (cur < toMinutes(s.startTime) || cur >= toMinutes(s.endTime)) return false;
  }
  return true;
};

/** `key` is a coupon code or item id; own schedule fields win over the built-in map. */
export const isOfferActive = (
  offer: OfferSchedule & { code?: string; id?: string },
  now: Date,
): boolean => {
  const own = offer.days || offer.startTime || offer.endTime ? offer : undefined;
  const key = offer.code ?? offer.id;
  return isScheduleActive(own ?? (key ? OFFER_SCHEDULES[key] : undefined), now);
};

export const describeSchedule = (s: OfferSchedule | undefined): string => {
  if (!s) return '';
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = s.days && s.days.length ? s.days.map((d) => names[d]).join(', ') : '';
  const time = s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : '';
  return [day, time].filter(Boolean).join(' · ');
};
