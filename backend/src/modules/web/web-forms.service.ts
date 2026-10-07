import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConditionGrade, EnquiryType, FuelType, Prisma, Province, SellRequestType, Transmission } from '../../generated/prisma/client';
import { AppError, Errors } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/types/auth-user';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { PHONE_RULE, RegisterDto } from '../auth/dto/auth.dto';
import { DealersService } from '../dealers/dealers.service';
import { EnquiriesService } from '../enquiries/enquiries.service';
import { NewsletterService } from '../newsletter/newsletter.module';
import { SellingService } from '../selling/selling.service';
import { cityFromAddress, provinceFromPlace } from './sa-places';
import { WebUploadsService } from './web-uploads.service';
import { CONDITION_FROM_LABEL, fromWebId, fuelsFromLabel, provinceFromName, transmissionFromLabel } from './web-format';

export const WEB_FORMS = [
  'newsletter',
  'contact',
  'vehicle-enquiry',
  'beat-my-quote',
  'keep-it',
  'new-vehicle-quote',
  'value-my-vehicle',
  'sell-vehicle',
  'sell-vehicle-site',
  'special',
] as const;
export type WebForm = (typeof WEB_FORMS)[number];

type Body = Record<string, unknown>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VIN = /^[A-HJ-NPR-Z0-9]{11,17}$/;
const MAX_TEXT = 4000;

/**
 * Why website enquiries may be processed without a separate consent tick box: the visitor asked us to
 * contact them about this request (POPIA s11(1)(b) and (f)). Marketing needs opt-in, which the
 * newsletter forms and the enquiry form's newsletter box provide.
 */
const LAWFUL_BASIS = 'request-by-data-subject';
const USERNAME = /^[a-z0-9._-]{3,30}$/;

/**
 * Reads one website form. Each call records a message per field the website can show
 * next to that input; `done()` throws them all together as FORM_INVALID { fields }.
 */
class FormReader {
  readonly fields: Record<string, string> = {};

  constructor(private readonly body: Body) {}

  text(key: string, label: string, options: { required?: boolean; max?: number } = {}): string | undefined {
    const raw = this.body[key];
    const value = typeof raw === 'string' ? raw.trim() : typeof raw === 'number' ? String(raw) : '';
    if (!value) {
      if (options.required) this.fields[key] = `${label} is required`;
      return undefined;
    }
    const max = options.max ?? 200;
    if (value.length > max) {
      this.fields[key] = `${label} must be at most ${max} characters`;
      return undefined;
    }
    return value;
  }

  email(key: string, label = 'Email address'): string {
    const value = this.text(key, label, { required: true, max: 254 });
    if (value && !EMAIL.test(value)) this.fields[key] = 'Please enter a valid email address';
    return value?.toLowerCase() ?? '';
  }

  phone(key: string, label = 'Contact number', required = true): string | undefined {
    const value = this.text(key, label, { required, max: 30 });
    if (value && !PHONE_RULE.test(value)) this.fields[key] = 'Please enter a valid contact number';
    return value;
  }

  int(key: string, label: string, options: { required?: boolean; min?: number; max?: number } = {}): number | undefined {
    const value = this.text(key, label, { required: options.required, max: 20 });
    if (value === undefined) return undefined;
    const number = Number(value.replace(/[\s,]/g, '').replace(/^R/i, ''));
    if (!Number.isFinite(number) || !Number.isInteger(number)) {
      this.fields[key] = `${label} must be a whole number`;
      return undefined;
    }
    if ((options.min !== undefined && number < options.min) || (options.max !== undefined && number > options.max)) {
      this.fields[key] = `${label} must be between ${options.min ?? 0} and ${options.max}`;
      return undefined;
    }
    return number;
  }

  province(key: string, label = 'Province', required = true): Province | undefined {
    const value = this.text(key, label, { required });
    if (!value) return undefined;
    const province = provinceFromName(value);
    if (!province) this.fields[key] = 'Please select your province';
    return province;
  }

  bool(key: string): boolean | undefined {
    const raw = this.body[key];
    if (typeof raw === 'boolean') return raw;
    if (typeof raw !== 'string') return undefined;
    const value = raw.trim().toLowerCase();
    return value === 'yes' || value === 'true' ? true : value === 'no' || value === 'false' ? false : undefined;
  }

  fail(key: string, message: string) {
    this.fields[key] = message;
  }

  done() {
    if (Object.keys(this.fields).length) {
      throw Errors.unprocessable('FORM_INVALID', 'Please correct the highlighted fields', { fields: this.fields });
    }
  }
}

const fullName = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ').slice(0, 160);
const notes = (lines: [string, string | number | boolean | undefined | null][]) =>
  lines
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => `${label}: ${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}`)
    .join('\n')
    .slice(0, MAX_TEXT);

/** "50,001 - 55,000 km" → 52 501; "400,001 km PLUS" → 400 001. */
export function mileageFromRange(value: string): number | undefined {
  const numbers = (value.match(/\d[\d,\s]*/g) ?? []).map((part) => Number(part.replace(/[,\s]/g, ''))).filter(Number.isFinite);
  if (!numbers.length) return undefined;
  return numbers.length === 1 ? numbers[0] : Math.round((numbers[0] + numbers[1]) / 2);
}

const serviceHistory = (label?: string) => (label ? !/^no\b/i.test(label.trim()) : undefined);

/** Splits "Thabo Nkosi" into first and last name for account forms that ask for one full name. */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') || parts[0] || '' };
}

/**
 * Adapter between the website's forms (app/Pages/**) and the API's services.
 * Field names are the website's own; every message is keyed by that field so the
 * website can show it under the right input without any UI change.
 */
@Injectable()
export class WebFormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enquiries: EnquiriesService,
    private readonly selling: SellingService,
    private readonly newsletter: NewsletterService,
    private readonly auth: AuthService,
    private readonly dealers: DealersService,
    private readonly audit: AuditService,
    private readonly uploads: WebUploadsService,
  ) {}

  submit(form: WebForm, body: Body, user?: AuthUser) {
    switch (form) {
      case 'newsletter':
        return this.subscribe(body, user);
      case 'contact':
        return this.contact(body, user);
      case 'vehicle-enquiry':
        return this.vehicleEnquiry(body, user);
      case 'beat-my-quote':
        return this.beatMyQuote(body, user);
      case 'keep-it':
        return this.keepIt(body, user);
      case 'new-vehicle-quote':
        return this.newVehicleQuote(body, user);
      case 'value-my-vehicle':
        return this.valueMyVehicle(body, user);
      case 'sell-vehicle':
        return this.sellVehicle(body, user);
      case 'sell-vehicle-site':
        return this.sellVehicleSite(body, user);
      case 'special':
        return this.special(body, user);
    }
  }

  // ───────────── simple enquiries ─────────────

  private async subscribe(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const firstName = form.text('name', 'Name', { required: true, max: 80 });
    const lastName = form.text('surname', 'Surname', { required: true, max: 80 });
    const email = form.email('email', 'E-mail address');
    const source = form.text('source', 'Source', { max: 60 }) ?? 'website';
    form.done();
    await this.newsletter.subscribe({ email, firstName, lastName, source }, user?.id);
    return { ok: true };
  }

  private async contact(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const name = form.text('name', 'Full name', { required: true, max: 160 });
    const email = form.email('email');
    const phone = form.phone('phone');
    const province = form.province('province');
    const hearAbout = form.text('hearAbout', 'This field', { required: true, max: 60 });
    const message = form.text('message', 'Message', { required: true, max: MAX_TEXT });
    form.done();
    return this.enquiry({ type: EnquiryType.GENERAL, name: name!, email, phone: phone!, message, details: { subject: 'Website contact form', province, hearAbout }, source: 'web:contact-us' }, user);
  }

  private async vehicleEnquiry(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const carId = form.text('carId', 'Vehicle', { required: true, max: 40 });
    const vehicleId = carId ? fromWebId(carId) : null;
    if (carId && !vehicleId) form.fail('carId', 'This vehicle could not be found');
    const title = form.text('title', 'Title', { max: 10 });
    const name = form.text('name', 'Name', { required: true, max: 80 });
    const surname = form.text('surname', 'Surname', { required: true, max: 80 });
    const email = form.email('email');
    const phone = form.phone('phone');
    const hearAbout = form.text('hearAbout', 'This field', { max: 60 });
    const message = form.text('message', 'Message', { max: MAX_TEXT });
    const newsletter = form.bool('newsletter');
    form.done();
    const receipt = await this.enquiry(
      { type: EnquiryType.VEHICLE, vehicleId: vehicleId!, name: fullName(title, name, surname), email, phone: phone!, message, details: { hearAbout }, source: 'web:car-detail' },
      user,
    );
    if (newsletter) await this.newsletter.subscribe({ email, firstName: name, lastName: surname, source: 'web:car-enquiry' }, user?.id);
    return receipt;
  }

  private async beatMyQuote(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const name = form.text('name', 'Name', { required: true, max: 80 });
    const surname = form.text('surname', 'Surname', { required: true, max: 80 });
    const phone = form.phone('mobile', 'Mobile number');
    const email = form.email('email');
    const stage = form.text('buyingStage', 'This field', { max: 80 });
    const quoteFile = form.text('quoteFileName', 'Quote', { max: 255 });
    const details = form.text('details', 'Quote details', { required: true, max: MAX_TEXT });
    const hearAbout = form.text('hearAbout', 'This field', { required: true, max: 60 });
    const province = form.province('province');
    form.done();
    return this.enquiry(
      { type: EnquiryType.BEAT_MY_QUOTE, name: fullName(name, surname), email, phone: phone!, message: details, details: { buyingStage: stage, quoteFileName: quoteFile, hearAbout, province }, source: 'web:beat-my-quote', uploads: true },
      user,
    );
  }

  private async keepIt(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const name = form.text('name', 'Name', { required: true, max: 80 });
    const surname = form.text('surname', 'Surname', { required: true, max: 80 });
    const phone = form.phone('mobile', 'Mobile number');
    const email = form.email('email');
    const province = form.province('province');
    const hearAbout = form.text('hearAbout', 'This field', { required: true, max: 60 });
    const story = form.text('story', 'Your story', { required: true, max: MAX_TEXT });
    form.done();
    return this.enquiry(
      { type: EnquiryType.GENERAL, name: fullName(name, surname), email, phone: phone!, message: story, details: { subject: 'Keep it or CHANGECARS advice', province, hearAbout }, source: 'web:keep-it-or-changecars' },
      user,
    );
  }

  private async newVehicleQuote(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const name = form.text('name', 'Name', { required: true, max: 80 });
    const surname = form.text('surname', 'Surname', { required: true, max: 80 });
    const phone = form.phone('mobile', 'Mobile number');
    const email = form.email('email');
    const province = form.province('province');
    const hearAbout = form.text('hearAbout', 'This field', { required: true, max: 60 });
    const message = form.text('message', 'Message', { required: true, max: MAX_TEXT });
    form.done();
    return this.enquiry({ type: EnquiryType.QUOTE, name: fullName(name, surname), email, phone: phone!, message, details: { province, hearAbout }, source: 'web:new-vehicle-quote' }, user);
  }

  private async special(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const slug = form.text('special', 'Special', { max: 120 });
    const title = form.text('specialTitle', 'Special', { max: 200 });
    const firstName = form.text('firstName', 'First name', { required: true, max: 80 });
    const surname = form.text('surname', 'Surname', { required: true, max: 80 });
    const email = form.email('email');
    const phone = form.phone('contact');
    const message = form.text('message', 'Message', { max: MAX_TEXT });
    form.done();
    return this.enquiry(
      { type: EnquiryType.GENERAL, name: fullName(firstName, surname), email, phone: phone!, message, details: { subject: `Special offer enquiry${title ? `: ${title}` : ''}`, special: slug }, source: 'web:specials' },
      user,
    );
  }

  private async enquiry(
    input: { type: EnquiryType; name: string; email: string; phone: string; message?: string; vehicleId?: string; details: Record<string, unknown>; source: string; uploads?: boolean },
    user?: AuthUser,
  ) {
    const details = Object.fromEntries(
      Object.entries({ ...input.details, lawfulBasis: LAWFUL_BASIS }).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
    const receipt = await this.enquiries.submit(
      {
        type: input.type,
        contact: { name: input.name, email: input.email, phone: input.phone, consent: true },
        message: input.message ?? null,
        vehicleId: input.vehicleId,
        details,
        source: input.source,
      },
      user,
    );
    return { ok: true, reference: receipt.reference, ...(input.uploads ? { uploadToken: this.uploads.tokenFor({ type: 'enquiry', id: receipt.id }) } : {}) };
  }

  // ───────────── selling ─────────────

  private async valueMyVehicle(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const name = form.text('name', 'Name', { required: true, max: 80 });
    const surname = form.text('surname', 'Surname', { required: true, max: 80 });
    const phone = form.phone('mobile', 'Mobile number');
    const email = form.email('email');
    const province = form.province('province');
    const hearAbout = form.text('hearAbout', 'This field', { required: true, max: 60 });
    const make = form.text('make', 'Make', { required: true, max: 80 });
    const model = form.text('model', 'Model', { required: true, max: 80 });
    // Optional: the website's model list has no variants for some models, so a visitor cannot always pick one.
    const variant = form.text('variant', 'Variant', { max: 120 });
    const expectedPrice = form.int('expectedPrice', 'Expected price', { required: true, min: 0, max: 100_000_000 });
    const vin = form.text('vin', 'VIN number', { required: true, max: 17 })?.toUpperCase();
    if (vin && !VIN.test(vin)) form.fail('vin', 'Please enter a valid VIN (11-17 letters and numbers)');
    const mileage = form.int('mileage', 'Mileage', { required: true, min: 0, max: 2_000_000 });
    const year = form.int('year', 'Year', { required: true, min: 1950, max: new Date().getFullYear() + 1 });
    const details = form.text('details', 'Vehicle details', { required: true, max: MAX_TEXT });
    form.done();
    return this.sellRequest(
      {
        type: SellRequestType.VALUATION,
        name: fullName(name, surname),
        email,
        phone: phone!,
        province: province!,
        make: make!,
        model: model!,
        variant,
        year: year!,
        mileage: mileage!,
        // The valuation form does not ask about condition; "Good" is the neutral grade and is flagged in the notes.
        condition: ConditionGrade.GOOD,
        vin,
        askingPrice: expectedPrice,
        notes: notes([
          ['Details', details],
          ['Condition', 'not asked on the website form (assumed Good)'],
          ['Heard about us', hearAbout],
        ]),
      },
      user,
    );
  }

  /** The app-style "Sell your vehicle" form (Pages/SellVehicle). */
  private async sellVehicle(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const name = form.text('name', 'Name', { required: true, max: 80 });
    const surname = form.text('surname', 'Surname', { required: true, max: 80 });
    const email = form.email('email', 'Email');
    const phone = form.phone('phone', 'Phone number');
    const altPhone = form.phone('altPhone', 'Alternative phone number', false);
    const suburb = form.text('suburb', 'Suburb or vehicle location', { required: true, max: 120 });
    const province = provinceFromPlace(suburb);
    if (suburb && !province) form.fail('suburb', 'Please add the town or province, e.g. "Sandton, Gauteng"');
    const make = form.text('make', 'Make', { required: true, max: 80 });
    const model = form.text('modelGroup', 'Model group', { required: true, max: 80 });
    const variant = form.text('modelSpecific', 'Model specific', { required: true, max: 120 });
    const year = form.int('year', 'Year of registration', { required: true, min: 1950, max: new Date().getFullYear() + 1 });
    const transmission = this.transmission(form, 'transmission', 'Transmission');
    const mileage = form.int('mileage', 'Mileage', { required: true, min: 0, max: 2_000_000 });
    const fuelType = this.fuel(form, 'fuel', 'Fuel type');
    const askingPrice = form.int('price', 'Asking price', { required: true, min: 0, max: 100_000_000 });
    const condition = this.condition(form, 'condition');
    const service = form.text('service', 'Service history', { required: true, max: 120 });
    const owned = form.text('owned', 'This field', { required: true, max: 80 });
    const damages = form.text('damages', 'Damages', { max: 500 });
    const knowsRegistration = form.bool('registration');
    const warranty = form.bool('warranty');
    const financed = form.bool('financed');
    for (const [key, value] of [['registration', knowsRegistration], ['warranty', warranty], ['financed', financed]] as const) {
      if (value === undefined) form.fail(key, 'This field is required');
    }
    const sellTime = form.text('sellTime', 'This field', { required: true, max: 40 });
    const photoTiming = form.text('photoTiming', 'This field', { required: true, max: 40 });
    const imageCount = form.int('imageCount', 'Images', { min: 0, max: 100 });
    const documentName = form.text('documentName', 'Registration document', { max: 255 });
    form.done();
    return this.sellRequest(
      {
        type: SellRequestType.SELL,
        name: fullName(name, surname),
        email,
        phone: phone!,
        province: province!,
        city: suburb,
        make: make!,
        model: model!,
        variant,
        year: year!,
        mileage: mileage!,
        condition: condition!,
        transmission,
        fuelType,
        askingPrice,
        hasServiceHistory: serviceHistory(service),
        hasOutstandingFinance: financed,
        notes: notes([
          ['Service history', service],
          ['Owned for', owned],
          ['Damages', damages],
          ['Knows registration number', knowsRegistration],
          ['Under warranty', warranty],
          ['Wants to sell', sellTime],
          ['Photos', photoTiming === 'Upload Now' ? `${imageCount ?? 0} selected on the website (send them to the seller's contact when following up)` : photoTiming],
          ['Registration document', documentName],
          ['Alternative phone', altPhone],
        ]),
      },
      user,
    );
  }

  /** The 3-step website sell form (Pages/SellVehicleSite/WeeleeForm). */
  private async sellVehicleSite(body: Body, user?: AuthUser) {
    const form = new FormReader(body);
    const make = form.text('make', 'Make', { required: true, max: 80 });
    const year = form.int('year', 'Registration year', { required: true, min: 1950, max: new Date().getFullYear() + 1 });
    const model = form.text('model', 'Model', { required: true, max: 80 });
    const fuelType = this.fuel(form, 'fuel', 'Fuel type');
    const transmission = this.transmission(form, 'gears', 'Gearbox');
    const variant = form.text('variant', 'Model variant', { required: true, max: 120 });
    const mileageText = form.text('mileage', 'Mileage', { required: true, max: 40 });
    const mileage = mileageText ? mileageFromRange(mileageText) : undefined;
    if (mileageText && mileage === undefined) form.fail('mileage', 'Mileage is required');
    const condition = this.condition(form, 'condition');
    const damage = form.text('damage', 'Damages', { max: 2000 });
    const service = form.text('service', 'Service history', { required: true, max: 160 });
    const owned = form.text('owned', 'This field', { required: true, max: 40 });
    const knowsRegistration = form.bool('registration');
    const regNumber = knowsRegistration ? form.text('regNumber', 'Registration number', { required: true, max: 20 }) : undefined;
    const warranty = form.bool('warranty');
    const financed = form.bool('financed');
    const settlementKnown = financed ? form.bool('settlementKnown') : undefined;
    const settlement = settlementKnown ? form.int('settlement', 'Settlement amount', { required: true, min: 0, max: 100_000_000 }) : undefined;
    const hasPapers = financed === false ? form.bool('owner') : undefined;
    const firstName = form.text('firstname', 'First name', { required: true, max: 80 });
    const surname = form.text('surname', 'Surname', { required: true, max: 80 });
    const suburb = form.text('suburb', 'Suburb', { required: true, max: 120 });
    const province = provinceFromPlace(suburb);
    if (suburb && !province) form.fail('suburb', 'Please add the town or province, e.g. "Sandton, Gauteng"');
    const phone = form.phone('cellphone', 'Cell phone number');
    const altPhone = form.phone('altnumber', 'Alternative number', false);
    const email = form.email('email', 'Email');
    const askingPrice = form.int('price', 'Price expectation', { min: 0, max: 100_000_000 });
    const sellTime = form.text('sellTime', 'This field', { required: true, max: 40 });
    const photos = form.text('photos', 'Photos', { max: 40 });
    const photoCount = form.int('photoCount', 'Photos', { min: 0, max: 100 });
    form.done();
    return this.sellRequest(
      {
        type: SellRequestType.SELL,
        name: fullName(firstName, surname),
        email,
        phone: phone!,
        province: province!,
        city: suburb,
        make: make!,
        model: model!,
        variant,
        year: year!,
        mileage: mileage!,
        condition: condition!,
        transmission,
        fuelType,
        registrationNumber: regNumber,
        askingPrice,
        hasServiceHistory: serviceHistory(service),
        hasOutstandingFinance: financed,
        notes: notes([
          ['Mileage band', mileageText],
          ['Service history', service],
          ['Owned for', owned],
          ['Damages / repairs', damage],
          ['Under warranty', warranty],
          ['Knows settlement amount', settlementKnown],
          ['Settlement amount', settlement !== undefined ? `R${settlement}` : undefined],
          ['Has ownership documents', hasPapers],
          ['Wants to sell', sellTime],
          ['Photos', photos === 'Upload Now' ? `${photoCount ?? 0} selected on the website (send them to the seller's contact when following up)` : photos],
          ['Alternative phone', altPhone],
        ]),
      },
      user,
    );
  }

  private transmission(form: FormReader, key: string, label: string): Transmission | undefined {
    const value = form.text(key, label, { required: true, max: 20 });
    const transmission = value ? transmissionFromLabel(value) : undefined;
    if (value && !transmission) form.fail(key, `${label} is required`);
    return transmission;
  }

  private fuel(form: FormReader, key: string, label: string): FuelType | undefined {
    const value = form.text(key, label, { required: true, max: 20 });
    const fuel = value ? fuelsFromLabel(value)[0] : undefined;
    if (value && !fuel) form.fail(key, `${label} is required`);
    return fuel;
  }

  private condition(form: FormReader, key: string): ConditionGrade | undefined {
    const value = form.text(key, 'Condition', { required: true, max: 20 });
    const condition = value ? CONDITION_FROM_LABEL[value.toLowerCase()] : undefined;
    if (value && !condition) form.fail(key, 'Condition is required');
    return condition;
  }

  private async sellRequest(
    input: {
      type: SellRequestType;
      name: string;
      email: string;
      phone: string;
      province: Province;
      city?: string;
      make: string;
      model: string;
      variant?: string;
      year: number;
      mileage: number;
      condition: ConditionGrade;
      transmission?: Transmission;
      fuelType?: FuelType;
      registrationNumber?: string;
      vin?: string;
      askingPrice?: number;
      hasServiceHistory?: boolean;
      hasOutstandingFinance?: boolean;
      notes?: string;
    },
    user?: AuthUser,
  ) {
    // Link to the catalogue when the names match it: catalogue ids give the most accurate automatic valuation.
    const makeRow = await this.prisma.make.findFirst({ where: { name: { equals: input.make, mode: 'insensitive' } }, select: { id: true } });
    const modelRow = makeRow
      ? await this.prisma.model.findFirst({ where: { makeId: makeRow.id, name: { equals: input.model, mode: 'insensitive' } }, select: { id: true } })
      : null;
    const receipt = await this.selling.create(
      {
        type: input.type,
        name: input.name,
        email: input.email,
        phone: input.phone,
        consent: true,
        province: input.province,
        city: input.city,
        makeId: makeRow?.id,
        modelId: modelRow?.id,
        makeName: input.make,
        modelName: input.model,
        variantName: input.variant,
        year: input.year,
        mileage: input.mileage,
        condition: input.condition,
        transmission: input.transmission,
        fuelType: input.fuelType,
        registrationNumber: input.registrationNumber,
        vin: input.vin,
        hasServiceHistory: input.hasServiceHistory,
        hasOutstandingFinance: input.hasOutstandingFinance,
        askingPrice: input.askingPrice,
        notes: input.notes || undefined,
      },
      user,
    );
    return { ok: true, reference: receipt.reference, uploadToken: this.uploads.tokenFor({ type: 'sell', id: receipt.id }) };
  }

  // ───────────── accounts ─────────────

  /**
   * Website sign-up (Register page and Register popup). A "Dealer" sign-up with a dealership
   * name, number and address becomes a pending dealer for admin approval; without those details
   * the person gets a normal account and the team receives a dealer application to follow up.
   */
  async register(body: Body) {
    const form = new FormReader(body);
    const accountType = form.text('accountType', 'Account type', { max: 10 }) === 'dealer' ? 'dealer' : 'private';
    const email = form.email('email', 'Email');
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) form.fail('password', 'Password is required');
    const firstName = form.text('firstName', 'First name', { required: true, max: 80 });
    const lastName = form.text('lastName', 'Last name', { required: true, max: 80 });
    const phone = form.phone('phone', 'Contact number', false);
    const dealerName = form.text('dealerName', 'Dealer name', { max: 120 });
    const address = form.text('address', 'Address', { max: 300 });
    const username = form.text('username', 'Username', { max: 30 })?.toLowerCase();
    if (username && !USERNAME.test(username)) form.fail('username', 'Use 3-30 letters, numbers, dots, dashes or underscores');
    form.done();
    // Report every taken value at once rather than one per attempt.
    const [usernameTaken, emailTaken] = await Promise.all([
      username ? this.prisma.user.findUnique({ where: { username }, select: { id: true } }) : null,
      this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (usernameTaken) form.fail('username', 'This username is already taken');
    if (emailTaken) form.fail('email', 'An account with this email already exists');
    form.done();

    const owner = plainToInstance(RegisterDto, { email, password, firstName, lastName, phone, acceptTerms: true });
    const problems = await validate(owner);
    for (const problem of problems) form.fail(problem.property, Object.values(problem.constraints ?? {})[0] ?? 'Invalid value');
    form.done();

    const fullDealer = accountType === 'dealer' && dealerName && phone && address;
    try {
      if (fullDealer) {
        const province = provinceFromPlace(address);
        if (!province) {
          form.fail('address', 'Please include your town and province, e.g. "1 Main Road, Sandton, Gauteng"');
          form.done();
        }
        await this.dealers.register({
          owner,
          dealership: { name: dealerName, email, phone, province: province!, city: cityFromAddress(address), address },
        });
        await this.saveUsername(email, username);
        return { ok: true, account: 'dealer', dealerStatus: 'pending' };
      }

      const user = await this.prisma.$transaction(async (tx) => {
        const created = await this.auth.createUser(tx, owner);
        await this.audit.record({ action: 'auth.register', entityType: 'user', entityId: created.id, actorId: created.id, actorRole: created.role }, tx);
        return created;
      });
      await this.saveUsername(email, username);
      if (accountType === 'dealer') {
        await this.enquiries.submit({
          type: EnquiryType.GENERAL,
          contact: { name: fullName(firstName, lastName), email, phone: phone ?? '', consent: true },
          message: 'Registered on the website as a dealer. Please contact them to complete the dealership details.',
          details: { subject: 'Dealer registration request', dealerName, address, userId: user.id },
          source: 'web:register',
        });
      }
      return { ok: true, account: 'customer', dealerApplication: accountType === 'dealer' };
    } catch (error) {
      if (error instanceof AppError && error.code === 'EMAIL_TAKEN') {
        throw Errors.unprocessable('FORM_INVALID', error.message, { fields: { email: error.message } });
      }
      throw error;
    }
  }

  /** The username was checked before sign-up; if someone took it in the meantime the account simply has none. */
  private async saveUsername(email: string, username?: string) {
    if (!username) return;
    await this.prisma.user.update({ where: { email }, data: { username } }).catch((error) => {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
    });
  }
}
