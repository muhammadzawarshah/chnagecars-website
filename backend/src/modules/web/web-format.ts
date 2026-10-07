import {
  ConditionGrade,
  DealerPlan,
  DealerStatus,
  Drivetrain,
  FuelType,
  LeadSource,
  LeadStage,
  Province,
  Transmission,
  VehicleCondition,
  VehicleStatus,
} from '../../generated/prisma/client';

/**
 * Vocabulary shared with the Next.js website (app/lib/*). The website's types use
 * display labels ("Petrol", "Gauteng", "4X4"); the database uses enums. Every translation
 * between the two lives here so the website code never has to know about backend enums.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX32 = /^[0-9a-f]{32}$/i;

/**
 * Car ids on the website end the URL slug ("<title>-<id>") and are read back as the text after the
 * last hyphen, so they must not contain hyphens: the UUID is sent as 32 hex characters.
 */
export const toWebId = (uuid: string) => uuid.replace(/-/g, '').toLowerCase();

export function fromWebId(id: string): string | null {
  const value = id.trim().toLowerCase();
  if (UUID.test(value)) return value;
  if (!HEX32.test(value)) return null;
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export const isUuid = (value: string) => UUID.test(value);

/** Same rules as the website's slugify (app/lib/cars/search.ts). */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Comma separated filter values, as the website sends them. */
export function filterValues(value?: string | null): string[] {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

export const ymd = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 10) : '');
/** "2026-10-06T08:55" (UTC, no seconds): the dashboard appends ":00Z" before parsing. */
export const ymdhm = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 16) : '');

// ───────────── provinces ─────────────

export const PROVINCE_NAMES: Record<Province, string> = {
  EASTERN_CAPE: 'Eastern Cape',
  FREE_STATE: 'Free State',
  GAUTENG: 'Gauteng',
  KWAZULU_NATAL: 'KwaZulu-Natal',
  LIMPOPO: 'Limpopo',
  MPUMALANGA: 'Mpumalanga',
  NORTHERN_CAPE: 'Northern Cape',
  NORTH_WEST: 'North West',
  WESTERN_CAPE: 'Western Cape',
};

const PROVINCE_BY_SLUG = new Map<string, Province>(
  (Object.entries(PROVINCE_NAMES) as [Province, string][]).flatMap(([value, name]) => [
    [slugify(name), value],
    [slugify(value), value],
  ]),
);

export const provinceFromName = (name: string): Province | undefined => PROVINCE_BY_SLUG.get(slugify(name));

// ───────────── vehicle attributes ─────────────

export const FUEL_LABELS: Record<FuelType, string> = {
  PETROL: 'Petrol',
  DIESEL: 'Diesel',
  HYBRID: 'Hybrid',
  PLUGIN_HYBRID: 'Hybrid',
  ELECTRIC: 'Electric',
  LPG: 'LPG',
  OTHER: 'Other',
};

export function fuelsFromLabel(label: string): FuelType[] {
  const slug = slugify(label);
  return (Object.entries(FUEL_LABELS) as [FuelType, string][]).filter(([value, name]) => slugify(name) === slug || slugify(value) === slug).map(([value]) => value);
}

export const TRANSMISSION_LABELS: Record<Transmission, string> = { MANUAL: 'Manual', AUTOMATIC: 'Automatic' };

export function transmissionFromLabel(label: string): Transmission | undefined {
  const slug = slugify(label);
  return (Object.keys(TRANSMISSION_LABELS) as Transmission[]).find((value) => slugify(value) === slug);
}

const FOUR_BY_FOUR: Drivetrain[] = [Drivetrain.FOUR_X_FOUR, Drivetrain.AWD];
const FOUR_BY_TWO: Drivetrain[] = [Drivetrain.FWD, Drivetrain.RWD, Drivetrain.FOUR_X_TWO];

export const driveLabel = (drivetrain: Drivetrain | null): '4X2' | '4X4' => (drivetrain && FOUR_BY_FOUR.includes(drivetrain) ? '4X4' : '4X2');

export function drivetrainsFromLabel(label: string): Drivetrain[] {
  const value = label.trim().toUpperCase();
  if (value === '4X4') return FOUR_BY_FOUR;
  if (value === '4X2') return FOUR_BY_TWO;
  return [];
}

/** Website body type label → category slugs (seeded in prisma/seed.ts). First slug is the canonical one. */
export const BODY_TYPES: { label: string; slugs: string[] }[] = [
  { label: 'SUV', slugs: ['suvs', 'crossovers'] },
  { label: 'Sedan', slugs: ['sedans'] },
  { label: 'Hatchback', slugs: ['hatchbacks'] },
  { label: 'Coupé', slugs: ['coupes'] },
  { label: 'Convertible', slugs: ['convertibles'] },
  { label: 'Double Cab Bakkie', slugs: ['double-cabs'] },
  { label: 'Single Cab Bakkie', slugs: ['bakkies'] },
  { label: 'Extended Cab', slugs: ['king-cabs', 'super-cabs'] },
  { label: 'MPV', slugs: ['mpvs'] },
  { label: 'Minibus', slugs: ['minibuses'] },
  { label: 'Panel Van', slugs: ['panel-vans'] },
  { label: 'Station Wagon', slugs: ['station-wagons'] },
  { label: 'Motorbike', slugs: ['motorbikes'] },
  { label: 'Caravan', slugs: ['caravans'] },
  { label: 'Boat', slugs: ['boats'] },
];

export const BAKKIE_SLUGS = ['bakkies', 'double-cabs', 'king-cabs', 'super-cabs'];

export function bodyTypeSlugs(label: string): string[] {
  const slug = slugify(label);
  return BODY_TYPES.find((type) => slugify(type.label) === slug)?.slugs ?? [];
}

export function bodyTypeLabel(categorySlugs: string[]): string {
  for (const slug of categorySlugs) {
    const type = BODY_TYPES.find((item) => item.slugs.includes(slug));
    if (type) return type.label;
  }
  return 'Other';
}

/** Curated lists the website calls "exotics", "classics" and "leisure" are categories here. */
export const COLLECTION_CATEGORIES = { exotic: 'exotic-cars', classic: 'classic-cars', leisure: 'leisure-vehicles' } as const;
export type WebCarCategory = keyof typeof COLLECTION_CATEGORIES;

export function carCategory(categorySlugs: string[]): WebCarCategory | undefined {
  return (Object.keys(COLLECTION_CATEGORIES) as WebCarCategory[]).find((key) => categorySlugs.includes(COLLECTION_CATEGORIES[key]));
}

/** Website "Vehicle Category" filter: New / Almost new / Used / Classic. */
export function vehicleGroup(condition: VehicleCondition, categorySlugs: string[]): string {
  if (categorySlugs.includes(COLLECTION_CATEGORIES.classic)) return 'Classic';
  return condition === VehicleCondition.NEW ? 'New' : condition === VehicleCondition.DEMO ? 'Almost new' : 'Used';
}

export function engineLabel(cc: number | null): string {
  return cc ? `${(cc / 1000).toFixed(1)}L` : '';
}

// ───────────── dealers, listings and leads (dashboard) ─────────────

export type WebDealerStatus = 'active' | 'pending' | 'suspended';

/** The dashboard has no "rejected" tab; rejected applications sit with suspended accounts (both can be re-approved). */
export const DEALER_STATUS_LABELS: Record<DealerStatus, WebDealerStatus> = {
  PENDING: 'pending',
  APPROVED: 'active',
  SUSPENDED: 'suspended',
  REJECTED: 'suspended',
};

export const PLAN_LABELS: Record<DealerPlan, 'Gold' | 'Silver' | 'Basic'> = { GOLD: 'Gold', SILVER: 'Silver', BASIC: 'Basic' };

export type WebListingStatus = 'active' | 'sold' | 'draft' | 'flagged';

export const LISTING_STATUS_LABELS: Record<VehicleStatus, WebListingStatus> = {
  PUBLISHED: 'active',
  RESERVED: 'active',
  SOLD: 'sold',
  DRAFT: 'draft',
  PENDING_REVIEW: 'draft',
  APPROVED: 'draft',
  ARCHIVED: 'draft',
  REJECTED: 'flagged',
  SUSPENDED: 'flagged',
};

export type WebLeadStatus = 'new' | 'contacted' | 'won' | 'lost';

export const LEAD_STATUS_LABELS: Record<LeadStage, WebLeadStatus> = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'contacted',
  NEGOTIATION: 'contacted',
  OFFER_SENT: 'contacted',
  WON: 'won',
  LOST: 'lost',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, 'Call' | 'WhatsApp' | 'Email' | 'Website form'> = {
  PHONE: 'Call',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  WEBSITE_ENQUIRY: 'Website form',
  QUOTE_REQUEST: 'Website form',
  TRADE_IN: 'Website form',
  OFFER_ACCEPTED: 'Website form',
  WALK_IN: 'Call',
  OTHER: 'Website form',
};

/**
 * "+27 82 000 0000" → "082 000 0000". The dealer leads screen builds WhatsApp links by dropping the
 * leading 0 and adding 27, so it needs the local format.
 */
export function localPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d+]/g, '');
  let local = digits;
  if (digits.startsWith('+27')) local = `0${digits.slice(3)}`;
  else if (digits.startsWith('27') && digits.length === 11) local = `0${digits.slice(2)}`;
  if (/^0\d{9}$/.test(local)) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return phone.trim();
}

// ───────────── sell forms ─────────────

export const CONDITION_FROM_LABEL: Record<string, ConditionGrade> = {
  great: ConditionGrade.EXCELLENT,
  excellent: ConditionGrade.EXCELLENT,
  good: ConditionGrade.GOOD,
  fair: ConditionGrade.FAIR,
  poor: ConditionGrade.POOR,
};

// ───────────── opening hours ─────────────

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
  pub: 'Public holidays',
  hol: 'Public holidays',
};

type HoursEntry = { day?: string; open?: string; close?: string; closed?: boolean };

const dayName = (day: string) => DAY_NAMES[day.trim().slice(0, 3).toLowerCase()] ?? day;
const time = (value?: string) => (value ?? '').replace(':', '.');

/**
 * Branch hours ([{ day: "Mon", open: "08:00", close: "17:00" }, …]) → the website's rows
 * ("Monday to Friday", "08.00 – 17.00"). Consecutive days with the same hours are merged.
 */
export function hoursRows(value: unknown): { day: string; time: string }[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const rows = (value as HoursEntry[])
    .filter((entry) => entry && typeof entry.day === 'string')
    .map((entry) => ({ day: dayName(entry.day!), time: entry.closed || !entry.open ? 'Closed' : `${time(entry.open)} – ${time(entry.close)}` }));
  const merged: { first: string; last: string; time: string }[] = [];
  for (const row of rows) {
    const previous = merged[merged.length - 1];
    if (previous && previous.time === row.time && row.day !== 'Public holidays' && previous.last !== 'Public holidays') previous.last = row.day;
    else merged.push({ first: row.day, last: row.day, time: row.time });
  }
  return merged.map((row) => ({ day: row.first === row.last ? row.first : `${row.first} to ${row.last}`, time: row.time }));
}
