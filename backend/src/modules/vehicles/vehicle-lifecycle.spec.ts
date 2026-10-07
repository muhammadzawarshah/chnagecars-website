import { VehicleStatus as S } from '../../generated/prisma/client';
import { acceptsEnquiries, allowedTargets, availabilityOf, findTransition } from './vehicle-lifecycle';

describe('vehicle lifecycle (FR-47, BR-01..BR-05)', () => {
  it('follows the documented happy path Draft → … → Archived', () => {
    const path: [S, S, 'dealer' | 'admin'][] = [
      [S.DRAFT, S.PENDING_REVIEW, 'dealer'],
      [S.PENDING_REVIEW, S.APPROVED, 'admin'],
      [S.APPROVED, S.PUBLISHED, 'dealer'],
      [S.PUBLISHED, S.RESERVED, 'dealer'],
      [S.RESERVED, S.SOLD, 'dealer'],
      [S.SOLD, S.ARCHIVED, 'dealer'],
    ];
    for (const [from, to, actor] of path) expect(findTransition(from, to, actor)).toBeDefined();
  });

  it('only administrators approve or reject listings', () => {
    expect(findTransition(S.PENDING_REVIEW, S.APPROVED, 'dealer')).toBeUndefined();
    expect(findTransition(S.PENDING_REVIEW, S.REJECTED, 'dealer')).toBeUndefined();
    expect(findTransition(S.PENDING_REVIEW, S.REJECTED, 'admin')?.action).toBe('reject');
  });

  it('never publishes a vehicle that was not approved (BR-01)', () => {
    for (const from of [S.DRAFT, S.PENDING_REVIEW, S.REJECTED]) {
      expect(findTransition(from, S.PUBLISHED, 'dealer')).toBeUndefined();
      expect(findTransition(from, S.PUBLISHED, 'admin')).toBeUndefined();
    }
  });

  it('only reserves published vehicles and only sells published/reserved ones', () => {
    expect(findTransition(S.APPROVED, S.RESERVED, 'dealer')).toBeUndefined();
    expect(findTransition(S.DRAFT, S.SOLD, 'dealer')).toBeUndefined();
    expect(findTransition(S.PUBLISHED, S.SOLD, 'dealer')).toBeDefined();
  });

  it('distinguishes actions that share a target status', () => {
    expect(findTransition(S.APPROVED, S.PUBLISHED, 'dealer')?.action).toBe('publish');
    expect(findTransition(S.RESERVED, S.PUBLISHED, 'dealer')?.action).toBe('release');
    expect(findTransition(S.SUSPENDED, S.PUBLISHED, 'dealer')?.action).toBe('unsuspend');
    expect(findTransition(S.SOLD, S.PUBLISHED, 'dealer')).toBeUndefined();
    expect(findTransition(S.SOLD, S.PUBLISHED, 'admin')?.action).toBe('relist');
  });

  it('lets the system release reservations but not publish', () => {
    expect(findTransition(S.RESERVED, S.PUBLISHED, 'system')?.action).toBe('release');
    expect(findTransition(S.APPROVED, S.PUBLISHED, 'system')).toBeUndefined();
  });

  it('archived is terminal', () => {
    expect(allowedTargets(S.ARCHIVED, 'admin')).toEqual([]);
  });

  it('derives availability from the lifecycle (FR-51)', () => {
    expect(availabilityOf(S.PUBLISHED)).toBe('AVAILABLE');
    expect(availabilityOf(S.RESERVED)).toBe('RESERVED');
    expect(availabilityOf(S.SOLD)).toBe('SOLD');
    expect(availabilityOf(S.SUSPENDED)).toBe('TEMPORARILY_UNAVAILABLE');
    expect(availabilityOf(S.DRAFT)).toBe('NOT_LISTED');
  });

  it('blocks purchase enquiries once a vehicle is gone (FR-51)', () => {
    expect(acceptsEnquiries(S.PUBLISHED)).toBe(true);
    expect(acceptsEnquiries(S.SOLD)).toBe(false);
    expect(acceptsEnquiries(S.ARCHIVED)).toBe(false);
    expect(acceptsEnquiries(S.SUSPENDED)).toBe(false);
  });
});
