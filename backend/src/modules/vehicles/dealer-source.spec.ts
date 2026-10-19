import { dealerSourceDetails } from './dealer-source';

it('uses the selected source dealer hours and public review links without private routing fields', () => {
  const details = dealerSourceDetails({ hours_1_key: 'Monday to Friday', hours_1_val: '08.00 – 17.00', hours_2_key: '', hours_2_val: '', google_review: 'https://www.google.com/search?q=dealer', peter_review: 'javascript:alert(1)', lead_email_1: 'private@example.test' });
  expect(details).toEqual({ hours: [{ day: 'Monday to Friday', time: '08.00 – 17.00' }], googleReviewUrl: 'https://www.google.com/search?q=dealer', hellopeterReviewUrl: null });
  expect(JSON.stringify(details)).not.toContain('private@example.test');
  expect(dealerSourceDetails(null)).toEqual({ hours: undefined, googleReviewUrl: null, hellopeterReviewUrl: null });
});
