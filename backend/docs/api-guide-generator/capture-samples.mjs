// Captures real request/response pairs from the running API for the developer guide.
import { writeFileSync } from 'node:fs';

const ROOT = 'http://localhost:4000';
const BASE = `${ROOT}/api/v1`;
const samples = {};

async function call(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

/** Shortens arrays and long strings so examples fit on a page. */
function trim(value, depth = 0) {
  if (Array.isArray(value)) return value.slice(0, depth === 0 ? 2 : 2).map((item) => trim(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, trim(v, depth + 1)]));
  }
  if (typeof value === 'string' && value.length > 90) return value.slice(0, 60) + '...';
  return value;
}

function record(name, method, path, request, response) {
  samples[name] = { method, path, request: request ?? null, status: response.status, response: trim(response.body) };
}

const email = `docs.${Date.now()}@example.com`;
const registerBody = { email, password: 'Secret123', firstName: 'Sipho', lastName: 'Dlamini', phone: '+27 82 555 0101', acceptTerms: true };
const reg = await call('POST', '/auth/register', { body: registerBody });
record('register', 'POST', '/api/v1/auth/register', registerBody, reg);
const token = reg.body.accessToken;

const refresh = await call('POST', '/auth/refresh', { body: { refreshToken: reg.body.refreshToken } });
record('refresh', 'POST', '/api/v1/auth/refresh', { refreshToken: '<refresh token>' }, refresh);

const badLogin = await call('POST', '/auth/login', { body: { email, password: 'wrong-pass1' } });
record('errorAuth', 'POST', '/api/v1/auth/login', { email, password: 'wrong-pass1' }, badLogin);

const validation = await call('POST', '/auth/register', { body: { email: 'not-an-email', password: 'short' } });
record('errorValidation', 'POST', '/api/v1/auth/register', { email: 'not-an-email', password: 'short' }, validation);

const search = await call('GET', '/vehicles?make=toyota&fuelType=DIESEL&sort=price-asc&pageSize=1');
record('search', 'GET', '/api/v1/vehicles?make=toyota&fuelType=DIESEL&sort=price-asc&pageSize=1', null, search);

const slug = search.body.data[0].slug;
const vehicleId = search.body.data[0].id;
const detail = await call('GET', `/vehicles/${slug}`);
record('detail', 'GET', `/api/v1/vehicles/${slug}`, null, detail);

const makes = await call('GET', '/catalogue/makes');
record('makes', 'GET', '/api/v1/catalogue/makes', null, makes);

const finance = await call('POST', '/finance/repayment', { body: { vehiclePrice: 400000, deposit: 40000, termMonths: 72, annualInterestRate: 11.75, balloonPercent: 0 } });
record('finance', 'POST', '/api/v1/finance/repayment', { vehiclePrice: 400000, deposit: 40000, termMonths: 72, annualInterestRate: 11.75, balloonPercent: 0 }, finance);

const enquiryBody = { vehicleId, name: 'Sipho Dlamini', email, phone: '+27 82 555 0101', consent: true, message: 'Is this still available?', interestedInFinance: true };
const enquiry = await call('POST', '/enquiries/vehicle', { token, body: enquiryBody });
record('enquiry', 'POST', '/api/v1/enquiries/vehicle', enquiryBody, enquiry);

await call('PUT', `/me/favourites/${vehicleId}`, { token });
const dash = await call('GET', '/me/dashboard', { token });
record('dashboard', 'GET', '/api/v1/me/dashboard', null, dash);

const sellBody = { type: 'SELL', name: 'Sipho Dlamini', email, phone: '+27 82 555 0101', consent: true, province: 'GAUTENG', makeName: 'Volkswagen', modelName: 'Polo', year: 2019, mileage: 85000, condition: 'GOOD' };
const sell = await call('POST', '/sell-requests', { token, body: sellBody });
record('sellRequest', 'POST', '/api/v1/sell-requests', sellBody, sell);

const owner = (await call('POST', '/auth/login', { body: { email: 'owner@demo-dealer.co.za', password: 'Password123' } })).body;
const leads = await call('GET', '/dealer/leads?pageSize=1', { token: owner.accessToken });
record('leads', 'GET', '/api/v1/dealer/leads?pageSize=1', null, leads);
const dealerMe = await call('GET', '/dealer/me', { token: owner.accessToken });
record('dealerMe', 'GET', '/api/v1/dealer/me', null, dealerMe);

const notFound = await call('GET', '/vehicles/does-not-exist');
record('errorNotFound', 'GET', '/api/v1/vehicles/does-not-exist', null, notFound);

const sold = await call('POST', '/dealer/vehicles/' + vehicleId + '/publish', { token: owner.accessToken });
record('errorTransition', 'POST', `/api/v1/dealer/vehicles/${vehicleId}/publish`, null, sold);

const notifications = await call('GET', '/me/notifications?pageSize=2', { token });
record('notifications', 'GET', '/api/v1/me/notifications?pageSize=2', null, notifications);

writeFileSync(process.argv[2], JSON.stringify(samples, null, 1));
console.log(Object.entries(samples).map(([k, v]) => `${k}:${v.status}`).join(' '));
