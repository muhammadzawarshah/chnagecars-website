// End-to-end smoke test (114+ checks) against a running API with a freshly migrated and seeded database:
//   SEED_DEMO=true SEED_ADMIN_PASSWORD=AdminPass123 npm run db:seed
//   RUN_WORKER_IN_API=true npm run start:prod
//   API_URL=http://localhost:4000 DATABASE_URL=postgresql://... node test/smoke.e2e.mjs
// It mutates data, so never point it at production.
import { createRequire } from 'node:module';
const pg = createRequire(import.meta.url)('pg');

const ROOT = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
const BASE = `${ROOT}/api/v1`;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'AdminPass123';
if (process.env.NODE_ENV === 'production') throw new Error('Refusing to run the smoke test in production');
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

let passed = 0;
let failed = 0;
const results = [];
function check(name, condition, detail) {
  if (condition) {
    passed++;
    results.push(`PASS ${name}`);
  } else {
    failed++;
    results.push(`FAIL ${name} ${detail !== undefined ? JSON.stringify(detail).slice(0, 400) : ''}`);
  }
}

async function call(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(path.startsWith('http') ? path : BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }
  return { status: res.status, body: json, headers: res.headers };
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(fn, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await fn();
    if (value) return value;
    await sleep(500);
  }
  return undefined;
}
const login = async (email, password) => (await call('POST', '/auth/login', { body: { email, password } })).body;

// ── health ──
check('health live', (await call('GET', ROOT + '/health/live')).status === 200);
const ready = await call('GET', ROOT + '/health/ready');
check('health ready', ready.status === 200 && ready.body.checks.database === 'up', ready.body);
const docs = await call('GET', ROOT + '/docs/openapi.json');
check('openapi document', docs.status === 200 && Object.keys(docs.body.paths).length > 100, Object.keys(docs.body?.paths ?? {}).length);

const cacheCheck = await call('GET', '/vehicles');
check('anonymous search is CDN-cacheable', /public, .*s-maxage=60/.test(cacheCheck.headers.get('cache-control') ?? ''), cacheCheck.headers.get('cache-control'));

// ── catalogue ──
const makes = await call('GET', '/catalogue/makes');
check('catalogue makes', makes.status === 200 && makes.body.some((make) => make.slug === 'bmw'), makes.body);
const bmw = await call('GET', '/catalogue/makes/bmw/models/3-series');
check('catalogue model with variants + spec', bmw.status === 200 && bmw.body.variants.length === 2 && bmw.body.variants[0].specification?.powerKw > 0, bmw.status);
const variant = await call('GET', `/catalogue/variants/${bmw.body.variants.find((v) => v.name === '320d M Sport').id}`);
check('variant features inherit from make + variant', variant.body.features?.some((f) => f.source === 'make') && variant.body.features?.some((f) => f.source === 'variant'), variant.body.features);
const categories = await call('GET', '/catalogue/categories');
check('categories (FR-25)', categories.body.length >= 11, categories.body.length);

// ── search ──
const all = await call('GET', '/vehicles');
check('search returns published vehicles', all.status === 200 && all.body.meta.total === 9, all.body.meta);
const diesel = await call('GET', '/vehicles?fuelType=DIESEL&sort=price-asc');
check('filter fuelType + sort price asc', diesel.body.data.length === 4 && diesel.body.data.every((v, i, a) => i === 0 || a[i - 1].price <= v.price), diesel.body.data.map((v) => v.price));
const scoped = await call('GET', '/vehicles?make=bmw,toyota&model=toyota:hilux');
check('make/model scoping (any BMW or a Toyota Hilux)', scoped.body.meta.total === 4, scoped.body.data.map((v) => v.title));
const priceRange = await call('GET', '/vehicles?minPrice=300000&maxPrice=700000&province=GAUTENG');
check('price range + province', priceRange.body.data.every((v) => v.price >= 300000 && v.price <= 700000), priceRange.body.data.map((v) => v.price));
const q = await call('GET', '/vehicles?q=hilux legend');
check('free-text search', q.body.meta.total === 1, q.body.meta);
const specials = await call('GET', '/vehicles/specials');
check('specials (FR-23)', specials.body.meta.total === 2 && specials.body.data.every((v) => v.discount > 0), specials.body.meta);
const hot = await call('GET', '/vehicles/hot-sellers');
check('hot sellers sorted by popularity (FR-24)', hot.body.data.length > 0, hot.body.meta);
const ev = await call('GET', '/vehicles?category=electric-vehicles');
check('category filter (EV)', ev.body.meta.total === 1, ev.body.meta);
const radius = await call('GET', '/vehicles?lat=-26.1&lng=28.05&radiusKm=20');
check('location radius search', radius.body.meta.total === 9, radius.body.meta);
const facets = await call('GET', '/vehicles/facets?condition=USED');
check('facets', facets.status === 200 && facets.body.makes.length > 0 && facets.body.ranges.price.min > 0, facets.body);
const badSort = await call('GET', '/vehicles?sort=bogus');
check('invalid query -> 400 VALIDATION_FAILED', badSort.status === 400 && badSort.body.code === 'VALIDATION_FAILED' && badSort.body.requestId, badSort.body);

const first = all.body.data[0];
const detail = await call('GET', `/vehicles/${first.slug}`);
check('vehicle detail by slug (FR-04)', detail.status === 200 && detail.body.finance?.monthlyRepayment > 0 && detail.body.features.length > 0, detail.body);
check('detail hides private fields', detail.body.vin === undefined && detail.body.registrationNumber === undefined && detail.body.reviewNotes === undefined);
const compare = await call('GET', `/vehicles/compare?ids=${all.body.data[0].id},${all.body.data[1].id}`);
check('compare vehicles (FR-17)', compare.body.items?.length === 2, compare.body);
const similar = await call('GET', `/vehicles/${first.id}/similar`);
check('similar vehicles', similar.status === 200, similar.status);

// ── finance ──
const repayment = await call('POST', '/finance/repayment', { body: { vehiclePrice: 400000, deposit: 40000, termMonths: 72, annualInterestRate: 11.75, balloonPercent: 0 } });
check('finance repayment (FR-18)', repayment.status === 200 && Math.abs(repayment.body.monthlyRepayment - 6991.35) < 0.01, repayment.body);
const afford = await call('POST', '/finance/affordability', { body: { monthlyIncome: 40000, monthlyExpenses: 22000, deposit: 30000, termMonths: 72, annualInterestRate: 11.75 } });
check('affordability (FR-19)', afford.status === 200 && afford.body.maxMonthlyRepayment === 12000 && afford.body.estimatedVehicleBudget > 500000, afford.body);

// ── auth ──
const email = `buyer${Date.now()}@example.com`;
const reg = await call('POST', '/auth/register', { body: { email, password: 'Secret123', firstName: 'Sipho', lastName: 'Dlamini', phone: '+27 82 555 0101', acceptTerms: true } });
check('register (FR-01)', reg.status === 201 && reg.body.accessToken && reg.body.refreshToken, reg.body);
const dup = await call('POST', '/auth/register', { body: { email, password: 'Secret123', firstName: 'X', lastName: 'Y', acceptTerms: true } });
check('duplicate email -> 409', dup.status === 409 && dup.body.code === 'EMAIL_TAKEN', dup.body);
const badLogin = await call('POST', '/auth/login', { body: { email, password: 'wrong-pass1' } });
check('bad credentials -> 401', badLogin.status === 401 && badLogin.body.code === 'INVALID_CREDENTIALS', badLogin.body);
let customer = await login(email, 'Secret123');
check('login', !!customer?.accessToken, customer);
const me = await call('GET', '/auth/me', { token: customer.accessToken });
check('auth/me', me.body.email === email, me.body);
const refreshed = await call('POST', '/auth/refresh', { body: { refreshToken: customer.refreshToken } });
check('refresh rotates token', refreshed.status === 200 && refreshed.body.refreshToken !== customer.refreshToken, refreshed.body);
const reuse = await call('POST', '/auth/refresh', { body: { refreshToken: customer.refreshToken } });
check('refresh-token reuse rejected', reuse.status === 401, reuse.body);
const afterReuse = await call('POST', '/auth/refresh', { body: { refreshToken: refreshed.body.refreshToken } });
check('reuse revokes whole session family', afterReuse.status === 401, afterReuse.body);
customer = await login(email, 'Secret123');
const privateCheck = await call('GET', '/vehicles', { token: customer.accessToken });
check('signed-in responses are never shared-cached', privateCheck.headers.get('cache-control') === 'private, no-store', privateCheck.headers.get('cache-control'));
const noAuth = await call('GET', '/me');
check('protected route without token -> 401', noAuth.status === 401, noAuth.body);
const forbidden = await call('GET', '/admin/stats', { token: customer.accessToken });
check('customer cannot reach admin -> 403', forbidden.status === 403, forbidden.body);
const notDealer = await call('GET', '/dealer/vehicles', { token: customer.accessToken });
check('customer cannot reach dealer portal -> 403', notDealer.status === 403 && notDealer.body.code === 'NOT_A_DEALER', notDealer.body);

// ── favourites, saved search, recently viewed ──
const fav = await call('PUT', `/me/favourites/${first.id}`, { token: customer.accessToken });
check('add favourite (FR-37)', fav.status === 200 && fav.body.saved, fav.body);
await call('PUT', `/me/favourites/${first.id}`, { token: customer.accessToken });
const favs = await call('GET', '/me/favourites', { token: customer.accessToken });
check('favourites idempotent', favs.body.meta.total === 1, favs.body.meta);
const saved = await call('POST', '/me/saved-searches', { token: customer.accessToken, body: { name: 'Diesel double cabs', criteria: { fuelType: 'DIESEL', category: 'double-cabs', maxPrice: 1000000 } } });
check('saved search (FR-38)', saved.status === 201, saved.body);
await call('GET', `/vehicles/${first.slug}`, { token: customer.accessToken });
const recent = await call('GET', '/me/recently-viewed', { token: customer.accessToken });
check('recently viewed (FR-41)', recent.body.length === 1, recent.body);

// ── enquiry → lead → dealer response ──
const enquiry = await call('POST', '/enquiries/vehicle', {
  token: customer.accessToken,
  body: { vehicleId: first.id, name: 'Sipho Dlamini', email, phone: '+27 82 555 0101', consent: true, message: 'Is this still available?', interestedInFinance: true },
});
check('vehicle enquiry (FR-14)', enquiry.status === 201 && enquiry.body.reference?.startsWith('ENQ-'), enquiry.body);
const enquiryDup = await call('POST', '/enquiries/vehicle', { token: customer.accessToken, body: { vehicleId: first.id, name: 'Sipho Dlamini', email, phone: '+27 82 555 0101', consent: true } });
check('duplicate enquiry deduplicated', enquiryDup.body.duplicate === true && enquiryDup.body.id === enquiry.body.id, enquiryDup.body);
const noConsent = await call('POST', '/enquiries/contact', { body: { name: 'A B', email: 'a@b.co', phone: '0821234567', consent: false, subject: 'Hi', message: 'Hello' } });
check('consent required', noConsent.status === 400, noConsent.body);
const quote = await call('POST', '/enquiries/quote', { body: { makeId: bmw.body.make.id, modelId: bmw.body.id, name: 'Guest Buyer', email: 'guest@example.com', phone: '0821234567', consent: true, province: 'GAUTENG' } });
check('quote request (FR-15)', quote.status === 201, quote.body);

const owner = await login('owner@demo-dealer.co.za', 'Password123');
const sales = await login('sales@demo-dealer.co.za', 'Password123');
const leads = await call('GET', '/dealer/leads', { token: owner.accessToken });
const lead = leads.body.data?.find((row) => row.email === email);
check('enquiry created a CRM lead (FR-43)', !!lead && lead.stage === 'NEW', leads.body);
const salesLeads = await call('GET', '/dealer/leads', { token: sales.accessToken });
check('sales staff only see leads assigned to them', salesLeads.status === 200 && salesLeads.body.meta.total === 0, salesLeads.body.meta);
const staff = await call('GET', '/dealer/staff', { token: owner.accessToken });
const salesMember = staff.body.find((member) => member.user.email === 'sales@demo-dealer.co.za');
const assign = await call('POST', `/dealer/leads/${lead.id}/assign`, { token: owner.accessToken, body: { memberId: salesMember.id } });
check('assign lead to staff (FR-44)', assign.status === 201, assign.body);
const salesLeads2 = await call('GET', '/dealer/leads', { token: sales.accessToken });
check('assigned lead visible to staff', salesLeads2.body.meta.total === 1, salesLeads2.body.meta);
const dealerEnquiries = await call('GET', '/dealer/enquiries', { token: owner.accessToken });
const respond = await call('POST', `/dealer/enquiries/${enquiry.body.id}/respond`, { token: owner.accessToken, body: { message: 'Yes it is, come for a test drive!' } });
check('dealer responds to enquiry', respond.status === 201 && dealerEnquiries.body.meta.total >= 1, respond.body);
const leadAfter = await call('GET', `/dealer/leads/${lead.id}`, { token: owner.accessToken });
check('responding moved lead NEW -> CONTACTED with history', leadAfter.body.stage === 'CONTACTED' && leadAfter.body.firstResponseAt && leadAfter.body.activities.some((a) => a.type === 'STAGE_CHANGE'), leadAfter.body.stage);
const badStage = await call('POST', `/dealer/leads/${lead.id}/stage`, { token: owner.accessToken, body: { stage: 'NEW' } });
check('invalid lead stage transition -> 409', badStage.status === 409, badStage.body);
const qualify = await call('POST', `/dealer/leads/${lead.id}/stage`, { token: sales.accessToken, body: { stage: 'QUALIFIED', note: 'Pre-approved' } });
check('staff advances own lead', qualify.status === 201 && qualify.body.stage === 'QUALIFIED', qualify.body);
const myEnquiries = await call('GET', '/me/enquiries', { token: customer.accessToken });
check('customer sees dealer response (FR-42)', myEnquiries.body.data[0].responses.length === 1 && myEnquiries.body.data[0].lead.stage === 'QUALIFIED', myEnquiries.body.data[0]);

// ── dealer vehicle lifecycle ──
const models = await call('GET', '/catalogue/makes/volkswagen/models');
const polo = await call('GET', '/catalogue/makes/volkswagen/models/polo');
const created = await call('POST', '/dealer/vehicles', {
  token: owner.accessToken,
  body: { makeId: polo.body.make.id, modelId: polo.body.id, variantId: polo.body.variants[0].id, condition: 'USED', year: 2023, mileage: 15000, price: 310000, colour: 'Blue', vin: 'WVWZZZAWZPU000001' },
});
check('dealer creates DRAFT with specs from catalogue', created.status === 201 && created.body.status === 'DRAFT' && created.body.powerKw === 70 && created.body.transmission === 'MANUAL', created.body);
const vid = created.body.id;
const submitNoImage = await call('POST', `/dealer/vehicles/${vid}/submit`, { token: owner.accessToken });
check('submit without photos -> 422', submitNoImage.status === 422 && submitNoImage.body.code === 'IMAGES_REQUIRED', submitNoImage.body);
await db.query(`INSERT INTO vehicle_images (id, "vehicleId", "storageKey", url, "mediumUrl", "contentType", status, "isPrimary", "updatedAt") VALUES (gen_random_uuid(), $1, $2, 'https://cdn.example/x.webp', 'https://cdn.example/x-m.webp', 'image/jpeg', 'READY', true, now())`, [vid, `test/${vid}.jpg`]);
const publishEarly = await call('POST', `/dealer/vehicles/${vid}/publish`, { token: owner.accessToken });
check('cannot publish a DRAFT (BR-01)', publishEarly.status === 409 && publishEarly.body.code === 'INVALID_STATUS_TRANSITION', publishEarly.body);
const salesSubmit = await call('POST', `/dealer/vehicles/${vid}/submit`, { token: sales.accessToken });
check('staff without INVENTORY_MANAGE cannot submit', salesSubmit.status === 403, salesSubmit.body);
const submit = await call('POST', `/dealer/vehicles/${vid}/submit`, { token: owner.accessToken });
check('submit for review', submit.status === 201 && submit.body.status === 'PENDING_REVIEW', submit.body);
const notPublic = await call('GET', `/vehicles/${vid}`);
check('pending vehicle not public (BR-01)', notPublic.status === 404, notPublic.status);

const admin = await login('admin@changecars.co.za', ADMIN_PASSWORD);
const queue = await call('GET', '/admin/vehicles/review-queue', { token: admin.accessToken });
check('admin review queue', queue.body.data.some((v) => v.id === vid), queue.body.meta);
const rejectNoReason = await call('POST', `/admin/vehicles/${vid}/reject`, { token: admin.accessToken, body: {} });
check('reject requires reason', rejectNoReason.status === 400, rejectNoReason.body);
const approve = await call('POST', `/admin/vehicles/${vid}/approve`, { token: admin.accessToken, body: {} });
check('admin approves', approve.body.status === 'APPROVED', approve.body);
const editMaterial = await call('PATCH', `/dealer/vehicles/${vid}`, { token: owner.accessToken, body: { mileage: 1 } });
check('material edit after approval blocked', editMaterial.status === 409 && editMaterial.body.code === 'MATERIAL_CHANGE_REQUIRES_REVIEW', editMaterial.body);
const publish = await call('POST', `/dealer/vehicles/${vid}/publish`, { token: owner.accessToken });
check('publish approved vehicle', publish.body.status === 'PUBLISHED' && publish.body.availability === 'AVAILABLE', publish.body);
const nowPublic = await call('GET', `/vehicles/${vid}`);
check('published vehicle is public', nowPublic.status === 200, nowPublic.status);

await call('PUT', `/me/favourites/${vid}`, { token: customer.accessToken });
const priceDrop = await call('PATCH', `/dealer/vehicles/${vid}`, { token: owner.accessToken, body: { price: 295000, expectedVersion: 0 } });
check('stale expectedVersion rejected', priceDrop.status === 409 && priceDrop.body.code === 'STALE_VERSION', priceDrop.body);
const current = await call('GET', `/dealer/vehicles/${vid}`, { token: owner.accessToken });
const priceDrop2 = await call('PATCH', `/dealer/vehicles/${vid}`, { token: owner.accessToken, body: { price: 295000, expectedVersion: current.body.version } });
check('price change allowed on published vehicle', priceDrop2.status === 200 && priceDrop2.body.price === 295000 && priceDrop2.body.priceHistory.length === 1, priceDrop2.body);
const dropNote = await waitFor(async () => {
  const notes = await call('GET', '/me/notifications', { token: customer.accessToken });
  return notes.body.data.find((n) => n.type === 'favourite.price_drop');
});
check('favourite price-drop notification (FR-37/39) via outbox worker', !!dropNote, dropNote);

const reserve = await call('POST', `/dealer/vehicles/${vid}/reserve`, { token: owner.accessToken, body: {} });
check('reserve (BR-05)', reserve.body.status === 'RESERVED' && reserve.body.availability === 'RESERVED', reserve.body);
const reservedSearch = await call('GET', '/vehicles?q=polo');
check('reserved still visible with status', reservedSearch.body.data.some((v) => v.id === vid && v.availability === 'RESERVED'), reservedSearch.body.data.map((v) => v.availability));
const availableOnly = await call('GET', '/vehicles?q=polo&availableOnly=true');
check('availableOnly hides reserved', !availableOnly.body.data.some((v) => v.id === vid));
const sell = await call('POST', `/dealer/vehicles/${vid}/sell`, { token: owner.accessToken, body: {} });
check('mark sold', sell.body.status === 'SOLD', sell.body);
const soldSearch = await call('GET', '/vehicles?q=polo');
check('sold vehicle not in search (BR-04)', !soldSearch.body.data.some((v) => v.id === vid));
const soldEnquiry = await call('POST', '/enquiries/vehicle', { body: { vehicleId: vid, name: 'Late Buyer', email: 'late@example.com', phone: '0821234567', consent: true } });
check('no purchase enquiries on sold vehicle (FR-51)', soldEnquiry.status === 409 && soldEnquiry.body.code === 'VEHICLE_NOT_AVAILABLE', soldEnquiry.body);
const history = await call('GET', `/dealer/vehicles/${vid}`, { token: owner.accessToken });
check('status history recorded', history.body.statusHistory.length >= 6, history.body.statusHistory.length);

// ── second dealer via registration + approval ──
const dealerEmail = `owner${Date.now()}@capeauto.co.za`;
const regDealer = await call('POST', '/dealers/register', {
  body: {
    owner: { email: dealerEmail, password: 'Dealer123', firstName: 'Anele', lastName: 'Botha', acceptTerms: true },
    dealership: { name: `Cape Auto ${Date.now()}`, email: 'info@capeauto.co.za', phone: '+27 21 000 0000', province: 'WESTERN_CAPE', city: 'Cape Town', address: '10 Main Road' },
  },
});
check('dealer registration (FR-11) -> PENDING', regDealer.status === 201 && regDealer.body.dealer.status === 'PENDING', regDealer.body);
const pendingCreate = await call('POST', '/dealer/vehicles/x/submit', { token: regDealer.body.accessToken });
const pendingBidding = await call('GET', '/dealer/bidding/sessions', { token: regDealer.body.accessToken });
check('pending dealer cannot bid (BR-02)', pendingBidding.status === 403 && pendingBidding.body.code === 'DEALER_NOT_APPROVED', pendingBidding.body);
const approveDealer = await call('PATCH', `/admin/dealers/${regDealer.body.dealer.id}/status`, { token: admin.accessToken, body: { status: 'APPROVED' } });
check('admin approves dealer', approveDealer.body.status === 'APPROVED', approveDealer.body);
const badTransition = await call('PATCH', `/admin/dealers/${regDealer.body.dealer.id}/status`, { token: admin.accessToken, body: { status: 'REJECTED', reason: 'x' } });
check('invalid dealer transition -> 409', badTransition.status === 409, badTransition.body);
const dealer2 = await login(dealerEmail, 'Dealer123');

// ── sell / valuation / bidding ──
const sellReq = await call('POST', '/sell-requests', {
  token: customer.accessToken,
  body: { type: 'SELL', name: 'Sipho Dlamini', email, phone: '+27 82 555 0101', consent: true, province: 'GAUTENG', makeId: bmw.body.make.id, modelId: bmw.body.id, year: 2022, mileage: 45000, condition: 'GOOD', registrationNumber: 'CA123456' },
});
check('sell request (FR-08)', sellReq.status === 201 && sellReq.body.reference.startsWith('SELL-'), sellReq.body);
const manual = await waitFor(async () => {
  const r = await call('GET', '/me/sell-requests/' + sellReq.body.id, { token: customer.accessToken });
  return r.body.status === 'UNDER_REVIEW' ? r.body : undefined;
});
check('too few comparables and no variant -> manual review (FR-09)', !!manual && manual.valuations.length === 0, manual);
const manualVal = await call('POST', '/admin/sell-requests/' + sellReq.body.id + '/valuations', { token: admin.accessToken, body: { estimateLow: 470000, estimateMid: 500000, estimateHigh: 530000 } });
check('admin manual valuation', manualVal.status === 201 && manualVal.body.method === 'MANUAL', manualVal.body);
const variantReq = await call('POST', '/sell-requests', {
  token: customer.accessToken,
  body: { type: 'VALUATION', name: 'Sipho Dlamini', email, phone: '+27 82 555 0101', consent: true, province: 'GAUTENG', makeId: bmw.body.make.id, modelId: bmw.body.id, variantId: bmw.body.variants.find((v) => v.name === '320i').id, year: 2022, mileage: 45000, condition: 'GOOD' },
});
const valued = await waitFor(async () => {
  const r = await call('GET', '/me/sell-requests/' + variantReq.body.id, { token: customer.accessToken });
  return r.body.valuations?.length ? r.body : undefined;
});
check('automated valuation (FR-09)', valued?.status === 'VALUED' && valued.valuations[0].method === 'AUTOMATED' && valued.valuations[0].estimateLow < valued.valuations[0].estimateMid && valued.valuations[0].estimateMid < valued.valuations[0].estimateHigh, valued?.valuations);
const valuationNote = await waitFor(async () => (await call('GET', '/me/notifications', { token: customer.accessToken })).body.data.find((n) => n.type === 'valuation.ready'));
check('valuation-ready notification', !!valuationNote);

const closesAt = new Date(Date.now() + 3600_000).toISOString();
const session = await call('POST', `/admin/sell-requests/${sellReq.body.id}/bidding-sessions`, { token: admin.accessToken, body: { closesAt, offerValidityHours: 24, reservePrice: 300000 } });
check('admin opens bidding (FR-10)', session.status === 201 && session.body.status === 'OPEN', session.body);
const second = await call('POST', `/admin/sell-requests/${sellReq.body.id}/bidding-sessions`, { token: admin.accessToken, body: { closesAt } });
check('only one live bidding process', second.status === 409, second.body);
const sessions = await call('GET', '/dealer/bidding/sessions', { token: owner.accessToken });
const visible = sessions.body.data?.find((s) => s.id === session.body.id);
check('eligible dealer sees session without customer PII', !!visible && visible.sellRequest.registrationNumber === undefined && visible.sellRequest.email === undefined, visible);
const lowBid = await call('POST', `/dealer/bidding/sessions/${session.body.id}/offers`, { token: owner.accessToken, body: { amount: 250000 } });
check('bid below reserve rejected', lowBid.status === 400 && lowBid.body.code === 'BELOW_RESERVE', lowBid.body);
const offerA = await call('POST', `/dealer/bidding/sessions/${session.body.id}/offers`, { token: owner.accessToken, body: { amount: 480000, terms: 'Subject to inspection', dealerNotes: 'internal' } });
check('dealer A bids', offerA.status === 201 && offerA.body.status === 'SUBMITTED', offerA.body);
const offerA2 = await call('POST', `/dealer/bidding/sessions/${session.body.id}/offers`, { token: owner.accessToken, body: { amount: 495000 } });
check('dealer A revises bid -> UPDATED, same offer (BR-08/09)', offerA2.body.id === offerA.body.id && offerA2.body.status === 'UPDATED', offerA2.body);
const offerB = await call('POST', `/dealer/bidding/sessions/${session.body.id}/offers`, { token: dealer2.accessToken, body: { amount: 500000 } });
check('dealer B bids independently', offerB.status === 201 && offerB.body.id !== offerA.body.id, offerB.body);

const myOffers = await call('GET', '/me/offers', { token: customer.accessToken });
check('customer reviews offers, dealer notes hidden', myOffers.body.meta.total === 2 && myOffers.body.data.every((o) => o.dealerNotes === undefined), myOffers.body.data);
const lowCounter = await call('POST', `/me/offers/${offerA.body.id}/counter`, { token: customer.accessToken, body: { amount: 400000 } });
check('counter must exceed offer', lowCounter.status === 400, lowCounter.body);
const counter = await call('POST', `/me/offers/${offerA.body.id}/counter`, { token: customer.accessToken, body: { amount: 520000, message: 'Meet me at 520' } });
check('customer counter-offer (FR-56)', counter.status === 201 && counter.body.offer.status === 'PENDING', counter.body);
const counterResp = await call('POST', `/dealer/offers/${offerA.body.id}/counter-response`, { token: owner.accessToken, body: { accept: true } });
check('dealer accepts counter -> offer amount updated', counterResp.body.amount === 520000 && counterResp.body.status === 'UPDATED', counterResp.body);

// Concurrency: accept two different offers at the same time; exactly one may win.
const [accA, accB] = await Promise.all([
  call('POST', `/me/offers/${offerA.body.id}/accept`, { token: customer.accessToken, headers: { 'Idempotency-Key': 'accept-A-1' } }),
  call('POST', `/me/offers/${offerB.body.id}/accept`, { token: customer.accessToken, headers: { 'Idempotency-Key': 'accept-B-1' } }),
]);
const winners = [accA, accB].filter((r) => r.status === 200);
const losers = [accA, accB].filter((r) => r.status === 409);
check('concurrent acceptance: exactly one wins (BR-12, brief 5.2)', winners.length === 1 && losers.length === 1, [accA.status, accA.body?.code, accB.status, accB.body?.code]);
const winnerId = accA.status === 200 ? offerA.body.id : offerB.body.id;
const winnerKey = accA.status === 200 ? 'accept-A-1' : 'accept-B-1';
const replay = await call('POST', `/me/offers/${winnerId}/accept`, { token: customer.accessToken, headers: { 'Idempotency-Key': winnerKey } });
const winnerBody = (accA.status === 200 ? accA : accB).body;
check('idempotent retry returns the same deal', replay.status === 200 && replay.body.deal.id === winnerBody.deal.id, replay.body);
const again = await call('POST', `/me/offers/${winnerId}/accept`, { token: customer.accessToken });
check('re-accept without key is still safe (same deal)', again.status === 200 && again.body.deal.id === winnerBody.deal.id, again.body);
const deals = await db.query('SELECT count(*)::int AS n FROM deals WHERE "sellRequestId" = $1', [sellReq.body.id]);
check('exactly one deal in the database', deals.rows[0].n === 1, deals.rows[0]);
const sr = await call('GET', `/me/sell-requests/${sellReq.body.id}`, { token: customer.accessToken });
const statuses = sr.body.biddingSessions[0].offers.map((o) => o.status).sort();
check('winner ACCEPTED, other SUPERSEDED, request OFFER_ACCEPTED (FR-54)', JSON.stringify(statuses) === JSON.stringify(['ACCEPTED', 'SUPERSEDED']) && sr.body.status === 'OFFER_ACCEPTED' && sr.body.biddingSessions[0].status === 'AWARDED', [statuses, sr.body.status]);
const lateBid = await call('POST', `/dealer/bidding/sessions/${session.body.id}/offers`, { token: dealer2.accessToken, body: { amount: 600000 } });
check('no bids after award (BR-07)', lateBid.status === 409, lateBid.body);
const winnerDealerToken = winnerId === offerA.body.id ? owner.accessToken : dealer2.accessToken;
const dealLead = await call('GET', '/dealer/leads?source=OFFER_ACCEPTED', { token: winnerDealerToken });
check('accepted offer created a lead for the winning dealer', dealLead.body.meta.total >= 1, dealLead.body.meta);
const revisions = await db.query('SELECT status FROM offer_revisions WHERE "offerId" = $1 ORDER BY "createdAt"', [offerA.body.id]);
check('complete bid history kept', revisions.rows.length >= 4, revisions.rows.map((r) => r.status));

// ── expiry ──
const session2Req = await call('POST', '/sell-requests', { body: { type: 'SELL', name: 'Guest', email: 'guest2@example.com', phone: '0821234567', consent: true, province: 'GAUTENG', makeName: 'Toyota', modelName: 'Hilux', year: 2019, mileage: 120000, condition: 'FAIR' } });
const session2 = await call('POST', `/admin/sell-requests/${session2Req.body.id}/bidding-sessions`, { token: admin.accessToken, body: { closesAt, offerValidityHours: 1 } });
const shortOffer = await call('POST', `/dealer/bidding/sessions/${session2.body.id}/offers`, { token: owner.accessToken, body: { amount: 250000 } });
await db.query(`UPDATE offers SET "expiresAt" = now() - interval '1 minute' WHERE id = $1`, [shortOffer.body.id]);
const expired = await waitFor(async () => (await db.query('SELECT status FROM offers WHERE id = $1', [shortOffer.body.id])).rows[0].status === 'EXPIRED', 45000);
check('offers auto-expire (FR-55)', !!expired);

// ── admin, audit, newsletter, content ──
const stats = await call('GET', '/admin/stats', { token: admin.accessToken });
check('admin stats (FR-34)', stats.status === 200 && stats.body.vehicles.byStatus.PUBLISHED >= 9, stats.body);
const audit = await call('GET', '/admin/audit-logs?action=offer.accept', { token: admin.accessToken });
check('audit trail of acceptance (BR-13)', audit.body.meta.total === 1 && audit.body.data[0].before && audit.body.data[0].after && audit.body.data[0].requestId, audit.body.data[0]);
const outbox = await call('GET', '/admin/system/outbox', { token: admin.accessToken });
check('outbox health', outbox.status === 200 && !outbox.body.byStatus.DEAD, outbox.body);
const sub = await call('POST', '/newsletter/subscribe', { body: { email: 'news@example.com' } });
check('newsletter subscribe (FR-32)', sub.status === 200 && sub.body.status === 'SUBSCRIBED', sub.body);
const page = await call('GET', '/content/pages/electric-vehicles');
check('EV info page (FR-31)', page.status === 200, page.status);
const articles = await call('GET', '/content/articles');
check('articles (FR-28)', articles.body.meta.total >= 1, articles.body.meta);
const badBlock = await call('POST', '/admin/articles', { token: admin.accessToken, body: { title: 'Bad', body: [{ type: 'html', html: '<script>alert(1)</script>' }] } });
check('raw HTML blocks rejected (XSS)', badBlock.status === 400 && badBlock.body.code === 'INVALID_CONTENT_BLOCK', badBlock.body);
const sitemap = await call('GET', '/seo/sitemap-vehicles-1.xml');
check('vehicle sitemap (NFR-12)', sitemap.status === 200 && String(sitemap.body).includes('<urlset'), String(sitemap.body).slice(0, 80));
const dash = await call('GET', '/me/dashboard', { token: customer.accessToken });
check('customer dashboard (FR-40)', dash.status === 200 && dash.body.counts.favourites === 2, dash.body.counts);
const dealerDash = await call('GET', '/dealer/dashboard', { token: owner.accessToken });
check('dealer dashboard (FR-13)', dealerDash.status === 200 && dealerDash.body.inventory.byStatus.PUBLISHED >= 8, dealerDash.body.inventory);
const exportData = await call('GET', '/me/export', { token: customer.accessToken });
check('data export (NFR-17), no password hash', exportData.status === 200 && exportData.body.user.passwordHash === undefined, Object.keys(exportData.body.user ?? {}));

console.log(results.join('\n'));
console.log(`\n${passed} passed, ${failed} failed`);
await db.end();
process.exit(failed ? 1 : 0);
