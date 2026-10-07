import { BiddingStatus, OfferStatus } from '../../generated/prisma/client';
import { canAcceptBids, checkAcceptable, isDealerEligible } from './bidding.rules';

const now = new Date('2026-06-01T12:00:00Z');
const hour = 3600_000;
const dealer = { id: 'd1', status: 'APPROVED' as const, biddingEnabled: true, province: 'GAUTENG' as const };

describe('bidding rules (FR-52, BR-06..BR-12)', () => {
  it('eligibility: approved, enabled, invited, right province', () => {
    expect(isDealerEligible({ eligibleProvinces: [], inviteDealerIds: [] }, dealer)).toBe(true);
    expect(isDealerEligible({ eligibleProvinces: [], inviteDealerIds: [] }, { ...dealer, status: 'PENDING' })).toBe(false);
    expect(isDealerEligible({ eligibleProvinces: [], inviteDealerIds: [] }, { ...dealer, biddingEnabled: false })).toBe(false);
    expect(isDealerEligible({ eligibleProvinces: [], inviteDealerIds: ['d2'] }, dealer)).toBe(false);
    expect(isDealerEligible({ eligibleProvinces: ['WESTERN_CAPE'], inviteDealerIds: [] }, dealer)).toBe(false);
    expect(isDealerEligible({ eligibleProvinces: ['GAUTENG'], inviteDealerIds: ['d1'] }, dealer)).toBe(true);
  });

  it('bids only inside the open window (BR-07)', () => {
    const session = { status: BiddingStatus.OPEN, opensAt: new Date(now.getTime() - hour), closesAt: new Date(now.getTime() + hour), acceptedOfferId: null };
    expect(canAcceptBids(session, now)).toBe(true);
    expect(canAcceptBids({ ...session, closesAt: now }, now)).toBe(false);
    expect(canAcceptBids({ ...session, status: BiddingStatus.CLOSED }, now)).toBe(false);
    expect(canAcceptBids({ ...session, acceptedOfferId: 'o1' }, now)).toBe(false);
    expect(canAcceptBids({ ...session, opensAt: new Date(now.getTime() + 1) }, now)).toBe(false);
  });

  it('accepts only active, unexpired offers on un-awarded sessions (BR-10, BR-12)', () => {
    const open = { status: BiddingStatus.CLOSED, acceptedOfferId: null };
    const valid = { status: OfferStatus.UPDATED, expiresAt: new Date(now.getTime() + hour) };
    expect(checkAcceptable(valid, open, now)).toEqual({ ok: true });
    expect(checkAcceptable({ ...valid, expiresAt: new Date(now.getTime() - 1) }, open, now)).toMatchObject({ ok: false, code: 'OFFER_EXPIRED' });
    expect(checkAcceptable({ ...valid, status: OfferStatus.WITHDRAWN }, open, now)).toMatchObject({ code: 'OFFER_WITHDRAWN' });
    expect(checkAcceptable({ ...valid, status: OfferStatus.REJECTED }, open, now)).toMatchObject({ code: 'OFFER_REJECTED' });
    expect(checkAcceptable({ ...valid, status: OfferStatus.SUPERSEDED }, open, now)).toMatchObject({ code: 'OFFER_SUPERSEDED' });
    expect(checkAcceptable(valid, { ...open, acceptedOfferId: 'other' }, now)).toMatchObject({ code: 'ALREADY_AWARDED' });
    expect(checkAcceptable(valid, { ...open, status: BiddingStatus.CANCELLED }, now)).toMatchObject({ code: 'BIDDING_CANCELLED' });
  });
});
