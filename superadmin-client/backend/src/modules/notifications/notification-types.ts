import { NotificationChannel } from '../../generated/prisma/client';

/**
 * User-facing notification types (FR-36, FR-48, FR-57). Users configure
 * preferences per type and channel. Defaults: in-app + email on, SMS off.
 */
export const NotificationTypes = {
  EnquiryNew: 'enquiry.new',
  EnquiryResponse: 'enquiry.response',
  LeadAssigned: 'lead.assigned',
  ValuationReady: 'valuation.ready',
  BiddingOpened: 'bidding.opened',
  OfferNew: 'offer.new',
  OfferUpdated: 'offer.updated',
  OfferCountered: 'offer.countered',
  OfferCounterResponse: 'offer.counter_response',
  OfferAccepted: 'offer.accepted',
  OfferRejected: 'offer.rejected',
  OfferExpired: 'offer.expired',
  OfferWithdrawn: 'offer.withdrawn',
  VehicleStatus: 'vehicle.status',
  VehicleReviewRequested: 'vehicle.review_requested',
  SavedSearchMatch: 'saved_search.match',
  FavouritePriceDrop: 'favourite.price_drop',
  FavouriteStatus: 'favourite.status',
  DealerApplication: 'dealer.application',
  DealerStatus: 'dealer.status',
  StaffInvited: 'dealer.staff_invited',
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

export const ALL_NOTIFICATION_TYPES = Object.values(NotificationTypes);

export const DEFAULT_CHANNELS: Record<NotificationChannel, boolean> = {
  IN_APP: true,
  EMAIL: true,
  SMS: false,
};
