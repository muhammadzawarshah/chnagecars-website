import { VehicleStatus } from '../../generated/prisma/client';

const S = VehicleStatus;

export type LifecycleActor = 'dealer' | 'admin' | 'system';

export interface TransitionRule {
  from: VehicleStatus[];
  to: VehicleStatus;
  actors: LifecycleActor[];
  /** Short action name used in audit logs and API routes. */
  action: string;
}

/**
 * FR-47 lifecycle: Draft → Pending Review → Approved → Published → Reserved → Sold → Archived,
 * plus the side states the requirements imply: Rejected (review failed), Suspended (FR-12
 * "suspend listings"), and returns to Draft for material edits. The backend is the only
 * place these rules are enforced; the frontend cannot bypass them.
 */
export const TRANSITIONS: TransitionRule[] = [
  { action: 'submit', from: [S.DRAFT, S.REJECTED], to: S.PENDING_REVIEW, actors: ['dealer', 'admin'] },
  { action: 'withdraw', from: [S.PENDING_REVIEW], to: S.DRAFT, actors: ['dealer', 'admin'] },
  { action: 'approve', from: [S.PENDING_REVIEW], to: S.APPROVED, actors: ['admin'] },
  { action: 'reject', from: [S.PENDING_REVIEW], to: S.REJECTED, actors: ['admin'] },
  { action: 'edit', from: [S.REJECTED, S.APPROVED, S.PUBLISHED, S.SUSPENDED], to: S.DRAFT, actors: ['dealer', 'admin'] },
  { action: 'publish', from: [S.APPROVED], to: S.PUBLISHED, actors: ['dealer', 'admin'] },
  { action: 'reserve', from: [S.PUBLISHED], to: S.RESERVED, actors: ['dealer', 'admin', 'system'] },
  { action: 'release', from: [S.RESERVED], to: S.PUBLISHED, actors: ['dealer', 'admin', 'system'] },
  { action: 'sell', from: [S.PUBLISHED, S.RESERVED], to: S.SOLD, actors: ['dealer', 'admin', 'system'] },
  { action: 'suspend', from: [S.PUBLISHED, S.RESERVED], to: S.SUSPENDED, actors: ['dealer', 'admin'] },
  { action: 'unsuspend', from: [S.SUSPENDED], to: S.PUBLISHED, actors: ['dealer', 'admin'] },
  { action: 'archive', from: [S.DRAFT, S.REJECTED, S.APPROVED, S.PUBLISHED, S.SUSPENDED, S.SOLD], to: S.ARCHIVED, actors: ['dealer', 'admin'] },
  { action: 'relist', from: [S.SOLD], to: S.PUBLISHED, actors: ['admin'] },
];

export function findTransition(from: VehicleStatus, to: VehicleStatus, actor: LifecycleActor): TransitionRule | undefined {
  return TRANSITIONS.find((rule) => rule.to === to && rule.from.includes(from) && rule.actors.includes(actor));
}

export function allowedTargets(from: VehicleStatus, actor: LifecycleActor): VehicleStatus[] {
  return TRANSITIONS.filter((rule) => rule.from.includes(from) && rule.actors.includes(actor)).map((rule) => rule.to);
}

/** Visible on the public site (BR-01, BR-04, BR-05). Sold detail pages stay reachable for old links. */
export const PUBLIC_SEARCH_STATUSES: VehicleStatus[] = [S.PUBLISHED, S.RESERVED];
export const PUBLIC_DETAIL_STATUSES: VehicleStatus[] = [S.PUBLISHED, S.RESERVED, S.SOLD];

/** Content may be edited freely only before review. */
export const FREELY_EDITABLE: VehicleStatus[] = [S.DRAFT, S.REJECTED];
/** After approval only commercial, non-identifying fields may change without a new review. */
export const COMMERCIALLY_EDITABLE: VehicleStatus[] = [S.APPROVED, S.PUBLISHED, S.RESERVED, S.SUSPENDED];
export const COMMERCIAL_FIELDS = [
  'price',
  'specialPrice',
  'isSpecial',
  'description',
  'colour',
  'branchId',
  'stockNumber',
  'featureIds',
  'promotionId',
] as const;

/** FR-51 availability, derived from the lifecycle so there is a single source of truth. */
export type Availability = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'TEMPORARILY_UNAVAILABLE' | 'ARCHIVED' | 'NOT_LISTED';

export function availabilityOf(status: VehicleStatus): Availability {
  switch (status) {
    case S.PUBLISHED:
      return 'AVAILABLE';
    case S.RESERVED:
      return 'RESERVED';
    case S.SOLD:
      return 'SOLD';
    case S.SUSPENDED:
      return 'TEMPORARILY_UNAVAILABLE';
    case S.ARCHIVED:
      return 'ARCHIVED';
    default:
      return 'NOT_LISTED';
  }
}

/** FR-51: new purchase enquiries only while the vehicle can still be bought. */
export function acceptsEnquiries(status: VehicleStatus): boolean {
  return status === S.PUBLISHED || status === S.RESERVED;
}
