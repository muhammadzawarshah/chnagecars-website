/** Every asynchronous event type the platform emits through the outbox. */
export const OutboxEvents = {
  UserRegistered: 'user.registered',
  PasswordResetRequested: 'auth.password_reset_requested',
  DealerRegistered: 'dealer.registered',
  DealerStatusChanged: 'dealer.status_changed',
  DealerMemberInvited: 'dealer.member_invited',
  VehicleStatusChanged: 'vehicle.status_changed',
  VehiclePriceChanged: 'vehicle.price_changed',
  VehicleImageUploaded: 'vehicle.image_uploaded',
  EnquiryCreated: 'enquiry.created',
  EnquiryResponded: 'enquiry.responded',
  LeadAssigned: 'lead.assigned',
  SellRequestCreated: 'sell_request.created',
  ValuationCompleted: 'valuation.completed',
  BiddingOpened: 'bidding.opened',
  OfferSubmitted: 'offer.submitted',
  OfferUpdated: 'offer.updated',
  OfferWithdrawn: 'offer.withdrawn',
  OfferRejected: 'offer.rejected',
  OfferCountered: 'offer.countered',
  CounterOfferResponded: 'offer.counter_responded',
  OfferAccepted: 'offer.accepted',
  OfferExpired: 'offer.expired',
  NewsletterSubscribed: 'newsletter.subscribed',
} as const;

export type OutboxEventType = (typeof OutboxEvents)[keyof typeof OutboxEvents];
