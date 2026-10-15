import { BiddingStatus, DealerStatus, OfferStatus, Province } from '../../generated/prisma/client';

export const ACTIVE_OFFER_STATUSES: OfferStatus[] = [OfferStatus.SUBMITTED, OfferStatus.UPDATED, OfferStatus.PENDING];

export interface SessionRules {
  status: BiddingStatus;
  opensAt: Date;
  closesAt: Date;
  acceptedOfferId: string | null;
  eligibleProvinces: Province[];
  inviteDealerIds: string[];
}

export interface DealerProfile {
  id: string;
  status: DealerStatus;
  biddingEnabled: boolean;
  province: Province;
}

/** BR-02 + BR-06: which dealers may see and bid on a session. */
export function isDealerEligible(session: Pick<SessionRules, 'eligibleProvinces' | 'inviteDealerIds'>, dealer: DealerProfile): boolean {
  if (dealer.status !== DealerStatus.APPROVED || !dealer.biddingEnabled) return false;
  if (session.inviteDealerIds.length && !session.inviteDealerIds.includes(dealer.id)) return false;
  if (session.eligibleProvinces.length && !session.eligibleProvinces.includes(dealer.province)) return false;
  return true;
}

/** BR-07: bids only inside the open window of an un-awarded session. */
export function canAcceptBids(session: Pick<SessionRules, 'status' | 'opensAt' | 'closesAt' | 'acceptedOfferId'>, now = new Date()): boolean {
  return session.status === BiddingStatus.OPEN && !session.acceptedOfferId && session.opensAt <= now && now < session.closesAt;
}

export type AcceptCheck = { ok: true } | { ok: false; code: string; message: string };

/**
 * BR-10, BR-11, BR-12: an offer can be accepted only while active and unexpired, and only if
 * the session has not been awarded or cancelled. Acceptance after the bidding window closes is
 * allowed as long as the offer itself is still valid.
 */
export function checkAcceptable(
  offer: { status: OfferStatus; expiresAt: Date },
  session: Pick<SessionRules, 'status' | 'acceptedOfferId'>,
  now = new Date(),
): AcceptCheck {
  if (session.acceptedOfferId || session.status === BiddingStatus.AWARDED) {
    return { ok: false, code: 'ALREADY_AWARDED', message: 'An offer has already been accepted for this vehicle' };
  }
  if (session.status === BiddingStatus.CANCELLED) return { ok: false, code: 'BIDDING_CANCELLED', message: 'This bidding process was cancelled' };
  if (offer.status === OfferStatus.EXPIRED || offer.expiresAt <= now) return { ok: false, code: 'OFFER_EXPIRED', message: 'This offer has expired' };
  if (offer.status === OfferStatus.WITHDRAWN) return { ok: false, code: 'OFFER_WITHDRAWN', message: 'The dealer withdrew this offer' };
  if (offer.status === OfferStatus.REJECTED) return { ok: false, code: 'OFFER_REJECTED', message: 'This offer was rejected' };
  if (offer.status === OfferStatus.SUPERSEDED) return { ok: false, code: 'OFFER_SUPERSEDED', message: 'This offer was superseded' };
  if (!ACTIVE_OFFER_STATUSES.includes(offer.status)) return { ok: false, code: 'OFFER_NOT_ACTIVE', message: `Offer is ${offer.status}` };
  return { ok: true };
}
