/**
 * Idempotent seed. Always: reference data (categories, catalogue, features, pages) + a super admin.
 * With SEED_DEMO=true (never in production): a demo dealer, staff, customer and published vehicles.
 * With SEED_WEBSITE_DEMO=true: the sample cars, news, dealers, stock and leads the website used before
 * it was connected (prisma/fixtures/website-demo.json, see prisma/seed-website-demo.ts).
 *
 *   npm run db:seed
 *   SEED_DEMO=true npm run db:seed
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import {
  DealerMemberRole,
  DealerStatus,
  Drivetrain,
  FeatureAvailability,
  FuelType,
  PrismaClient,
  Province,
  Transmission,
  UserRole,
  VehicleCondition,
  VehicleStatus,
} from '../src/generated/prisma/client';
import { loadWebsiteFixture, seedWebsiteArticleCategories, seedWebsiteDemo } from './seed-website-demo';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, options: '-c TimeZone=UTC' }) });

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CATEGORIES = [
  'Hatchbacks',
  'Sedans',
  'SUVs',
  'Crossovers',
  'Coupés',
  'Convertibles',
  'Bakkies',
  'Super Cabs',
  'King Cabs',
  'Double Cabs',
  'MPVs',
  'Motorbikes',
  'Electric Vehicles',
  'Hybrid Vehicles',
  // Body types and curated lists the website filters on (see src/modules/web/web-format.ts).
  'Station Wagons',
  'Minibuses',
  'Panel Vans',
  'Caravans',
  'Boats',
  'Exotic Cars',
  'Classic Cars',
  'Leisure Vehicles',
];

type VariantSeed = {
  name: string;
  yearFrom: number;
  yearTo?: number;
  body: string;
  basePrice: number;
  spec: {
    engine: string;
    engineCapacityCc?: number;
    cylinders?: number;
    powerKw: number;
    torqueNm: number;
    transmission: Transmission;
    gears?: number;
    drivetrain: Drivetrain;
    fuelType: FuelType;
    fuelConsumptionL100?: number;
    co2GKm?: number;
    seats: number;
    doors: number;
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    bootLitres?: number;
    zeroTo100Sec?: number;
    topSpeedKmh?: number;
    batteryKwh?: number;
    electricRangeKm?: number;
    warranty: string;
    servicePlan?: string;
    safetyRating?: string;
  };
};

const CATALOGUE: { make: string; country: string; models: { name: string; generation: { name: string; yearFrom: number; yearTo?: number }; variants: VariantSeed[] }[] }[] = [
  {
    make: 'BMW',
    country: 'Germany',
    models: [
      {
        name: '3 Series',
        generation: { name: 'G20', yearFrom: 2019 },
        variants: [
          {
            name: '320i',
            yearFrom: 2022,
            body: 'Sedans',
            basePrice: 879_000,
            spec: { engine: '2.0L 4-cylinder turbo petrol', engineCapacityCc: 1998, cylinders: 4, powerKw: 135, torqueNm: 300, transmission: 'AUTOMATIC', gears: 8, drivetrain: 'RWD', fuelType: 'PETROL', fuelConsumptionL100: 6.4, co2GKm: 146, seats: 5, doors: 4, lengthMm: 4713, widthMm: 1827, heightMm: 1440, bootLitres: 480, zeroTo100Sec: 7.4, topSpeedKmh: 235, warranty: '2 years / unlimited km', servicePlan: '5 years / 100 000 km', safetyRating: '5-star Euro NCAP' },
          },
          {
            name: '320d M Sport',
            yearFrom: 2022,
            body: 'Sedans',
            basePrice: 965_000,
            spec: { engine: '2.0L 4-cylinder turbo diesel', engineCapacityCc: 1995, cylinders: 4, powerKw: 140, torqueNm: 400, transmission: 'AUTOMATIC', gears: 8, drivetrain: 'RWD', fuelType: 'DIESEL', fuelConsumptionL100: 4.8, co2GKm: 126, seats: 5, doors: 4, lengthMm: 4713, widthMm: 1827, heightMm: 1440, bootLitres: 480, zeroTo100Sec: 6.8, topSpeedKmh: 240, warranty: '2 years / unlimited km', servicePlan: '5 years / 100 000 km', safetyRating: '5-star Euro NCAP' },
          },
        ],
      },
    ],
  },
  {
    make: 'Toyota',
    country: 'Japan',
    models: [
      {
        name: 'Hilux',
        generation: { name: '8th generation', yearFrom: 2016 },
        variants: [
          {
            name: '2.8 GD-6 Raised Body Legend 4x4 Double Cab',
            yearFrom: 2021,
            body: 'Double Cabs',
            basePrice: 899_700,
            spec: { engine: '2.8L 4-cylinder turbo diesel', engineCapacityCc: 2755, cylinders: 4, powerKw: 150, torqueNm: 500, transmission: 'AUTOMATIC', gears: 6, drivetrain: 'FOUR_X_FOUR', fuelType: 'DIESEL', fuelConsumptionL100: 8.2, co2GKm: 216, seats: 5, doors: 4, lengthMm: 5325, widthMm: 1900, heightMm: 1815, zeroTo100Sec: 10.7, warranty: '3 years / 100 000 km', servicePlan: '9 services / 90 000 km', safetyRating: '5-star ANCAP' },
          },
          {
            name: '2.4 GD-6 Raider Xtra Cab',
            yearFrom: 2021,
            body: 'King Cabs',
            basePrice: 591_000,
            spec: { engine: '2.4L 4-cylinder turbo diesel', engineCapacityCc: 2393, cylinders: 4, powerKw: 110, torqueNm: 400, transmission: 'MANUAL', gears: 6, drivetrain: 'FOUR_X_TWO', fuelType: 'DIESEL', fuelConsumptionL100: 7.1, seats: 4, doors: 2, lengthMm: 5325, widthMm: 1855, heightMm: 1800, warranty: '3 years / 100 000 km', servicePlan: '6 services / 90 000 km' },
          },
        ],
      },
      {
        name: 'Corolla Cross',
        generation: { name: 'XG10', yearFrom: 2021 },
        variants: [
          {
            name: '1.8 XS Hybrid',
            yearFrom: 2022,
            body: 'Crossovers',
            basePrice: 498_900,
            spec: { engine: '1.8L 4-cylinder petrol hybrid', engineCapacityCc: 1798, cylinders: 4, powerKw: 90, torqueNm: 142, transmission: 'AUTOMATIC', drivetrain: 'FWD', fuelType: 'HYBRID', fuelConsumptionL100: 4.3, co2GKm: 101, seats: 5, doors: 5, lengthMm: 4460, widthMm: 1825, heightMm: 1620, bootLitres: 440, warranty: '3 years / 100 000 km', servicePlan: '6 services / 90 000 km', safetyRating: '5-star ANCAP' },
          },
        ],
      },
    ],
  },
  {
    make: 'Volkswagen',
    country: 'Germany',
    models: [
      {
        name: 'Polo',
        generation: { name: 'AW', yearFrom: 2018 },
        variants: [
          {
            name: '1.0 TSI Life',
            yearFrom: 2022,
            body: 'Hatchbacks',
            basePrice: 379_100,
            spec: { engine: '1.0L 3-cylinder turbo petrol', engineCapacityCc: 999, cylinders: 3, powerKw: 70, torqueNm: 175, transmission: 'MANUAL', gears: 5, drivetrain: 'FWD', fuelType: 'PETROL', fuelConsumptionL100: 4.8, co2GKm: 110, seats: 5, doors: 5, lengthMm: 4074, widthMm: 1751, heightMm: 1451, bootLitres: 351, zeroTo100Sec: 10.8, topSpeedKmh: 187, warranty: '3 years / 120 000 km', servicePlan: '3 years / 45 000 km', safetyRating: '5-star Euro NCAP' },
          },
        ],
      },
    ],
  },
  {
    make: 'Ford',
    country: 'United States',
    models: [
      {
        name: 'Ranger',
        generation: { name: 'P703', yearFrom: 2022 },
        variants: [
          {
            name: '2.0 BiTurbo Wildtrak 4x4 Double Cab',
            yearFrom: 2023,
            body: 'Double Cabs',
            basePrice: 949_900,
            spec: { engine: '2.0L 4-cylinder bi-turbo diesel', engineCapacityCc: 1996, cylinders: 4, powerKw: 154, torqueNm: 500, transmission: 'AUTOMATIC', gears: 10, drivetrain: 'FOUR_X_FOUR', fuelType: 'DIESEL', fuelConsumptionL100: 7.6, seats: 5, doors: 4, lengthMm: 5370, widthMm: 1918, heightMm: 1884, warranty: '4 years / 120 000 km', servicePlan: '4 years / 60 000 km', safetyRating: '5-star ANCAP' },
          },
        ],
      },
    ],
  },
  {
    make: 'BYD',
    country: 'China',
    models: [
      {
        name: 'Atto 3',
        generation: { name: 'First generation', yearFrom: 2022 },
        variants: [
          {
            name: 'Extended Range',
            yearFrom: 2023,
            body: 'SUVs',
            basePrice: 818_300,
            spec: { engine: 'Single permanent-magnet synchronous motor', powerKw: 150, torqueNm: 310, transmission: 'AUTOMATIC', gears: 1, drivetrain: 'FWD', fuelType: 'ELECTRIC', seats: 5, doors: 5, lengthMm: 4455, widthMm: 1875, heightMm: 1615, bootLitres: 440, zeroTo100Sec: 7.3, topSpeedKmh: 160, batteryKwh: 60.5, electricRangeKm: 420, warranty: '6 years / 150 000 km; battery 8 years / 160 000 km', safetyRating: '5-star Euro NCAP' },
          },
        ],
      },
    ],
  },
  {
    make: 'Suzuki',
    country: 'Japan',
    models: [
      {
        name: 'Swift',
        generation: { name: 'Fourth generation', yearFrom: 2024 },
        variants: [
          {
            name: '1.2 GL',
            yearFrom: 2024,
            body: 'Hatchbacks',
            basePrice: 237_900,
            spec: { engine: '1.2L 3-cylinder petrol', engineCapacityCc: 1197, cylinders: 3, powerKw: 60, torqueNm: 108, transmission: 'MANUAL', gears: 5, drivetrain: 'FWD', fuelType: 'PETROL', fuelConsumptionL100: 4.4, seats: 5, doors: 5, lengthMm: 3860, widthMm: 1735, heightMm: 1495, bootLitres: 265, warranty: '5 years / 200 000 km', servicePlan: '4 years / 60 000 km' },
          },
        ],
      },
    ],
  },
];

const FEATURES: { name: string; group: string }[] = [
  { name: 'ABS with EBD', group: 'SAFETY' },
  { name: 'Driver and passenger airbags', group: 'SAFETY' },
  { name: 'Stability control', group: 'SAFETY' },
  { name: 'Lane keeping assist', group: 'SAFETY' },
  { name: 'Adaptive cruise control', group: 'TECHNOLOGY' },
  { name: 'Apple CarPlay and Android Auto', group: 'TECHNOLOGY' },
  { name: 'Rear-view camera', group: 'TECHNOLOGY' },
  { name: 'Climate control', group: 'COMFORT' },
  { name: 'Leather seats', group: 'INTERIOR' },
  { name: 'Heated front seats', group: 'COMFORT' },
  { name: 'Sunroof', group: 'EXTERIOR' },
  { name: 'Tow bar', group: 'EXTERIOR' },
  { name: 'Diff lock', group: 'PERFORMANCE' },
];

const PAGES = [
  { slug: 'privacy-policy', title: 'Privacy Policy', text: 'How ChangeCars collects, uses and protects your personal information in line with POPIA.' },
  { slug: 'terms-and-conditions', title: 'Terms and Conditions', text: 'The terms that apply when you use the ChangeCars platform.' },
  { slug: 'insurance', title: 'Vehicle Insurance', text: 'Get help comparing comprehensive, third-party fire and theft and third-party cover. Request a quote and our partners will contact you.' },
  { slug: 'electric-vehicles', title: 'Electric Vehicles in South Africa', text: 'Everything you need to know about EV models, running costs, home charging and the public charging network.' },
  { slug: 'ev-charging', title: 'EV Charging Resources', text: 'Charging types (AC and DC), typical charging times and where to find public chargers along major routes.' },
];

const FAQS = [
  { category: 'buying', question: 'How do I contact a dealer about a car?', answer: 'Open the vehicle page and use "Contact dealer". The dealer receives your enquiry immediately and you can follow it in your dashboard.' },
  { category: 'selling', question: 'How does selling my car work?', answer: 'Submit your vehicle details, receive an estimated valuation, then let verified dealers bid. You choose whether to accept any offer.' },
  { category: 'selling', question: 'How long are dealer offers valid?', answer: 'Every offer shows its expiry time. Expired offers can no longer be accepted unless the dealer renews them.' },
  { category: 'finance', question: 'Is the finance calculator a quote?', answer: 'No. It is an estimate. Your bank or finance house confirms the final rate and repayment.' },
];

async function seedCategories() {
  for (const [index, name] of CATEGORIES.entries()) {
    const slug = slugify(name);
    await prisma.category.upsert({ where: { slug }, create: { name, slug, sortOrder: index }, update: { name, sortOrder: index } });
  }
  for (const name of ['News', 'Reviews', 'Buying Advice', 'Guides', 'Electric Vehicles']) {
    await prisma.articleCategory.upsert({ where: { slug: slugify(name) }, create: { name, slug: slugify(name) }, update: {} });
  }
}

async function seedCatalogue() {
  const categories = await prisma.category.findMany();
  const categoryId = (name: string) => categories.find((category) => category.name === name)?.id ?? null;
  const variantIds: Record<string, string> = {};

  for (const [order, entry] of CATALOGUE.entries()) {
    const make = await prisma.make.upsert({
      where: { slug: slugify(entry.make) },
      create: { name: entry.make, slug: slugify(entry.make), country: entry.country, sortOrder: order },
      update: { country: entry.country },
    });
    for (const modelSeed of entry.models) {
      const model = await prisma.model.upsert({
        where: { makeId_slug: { makeId: make.id, slug: slugify(modelSeed.name) } },
        create: { makeId: make.id, name: modelSeed.name, slug: slugify(modelSeed.name), defaultCategoryId: categoryId(modelSeed.variants[0].body) },
        update: {},
      });
      const generation = await prisma.generation.upsert({
        where: { modelId_slug: { modelId: model.id, slug: slugify(modelSeed.generation.name) } },
        create: { modelId: model.id, ...modelSeed.generation, slug: slugify(modelSeed.generation.name) },
        update: {},
      });
      for (const variantSeed of modelSeed.variants) {
        const slug = slugify(`${variantSeed.name}-${variantSeed.yearFrom}`);
        const variant = await prisma.variant.upsert({
          where: { modelId_slug: { modelId: model.id, slug } },
          create: {
            modelId: model.id,
            generationId: generation.id,
            name: variantSeed.name,
            slug,
            yearFrom: variantSeed.yearFrom,
            yearTo: variantSeed.yearTo,
            bodyCategoryId: categoryId(variantSeed.body),
            basePrice: variantSeed.basePrice,
            specification: { create: variantSeed.spec },
          },
          update: { basePrice: variantSeed.basePrice, specification: { upsert: { create: variantSeed.spec, update: variantSeed.spec } } },
        });
        variantIds[`${entry.make}|${modelSeed.name}|${variantSeed.name}`] = variant.id;
      }
    }
  }

  for (const feature of FEATURES) {
    await prisma.feature.upsert({ where: { slug: slugify(feature.name) }, create: { ...feature, slug: slugify(feature.name) }, update: { group: feature.group } });
  }
  // Brand-wide standard safety kit, plus variant-specific extras (FR-50 inheritance).
  const features = await prisma.feature.findMany();
  const featureId = (name: string) => features.find((feature) => feature.name === name)!.id;
  const assign = async (name: string, target: { makeId?: string; variantId?: string }, availability: FeatureAvailability = 'STANDARD') => {
    const existing = await prisma.featureAssignment.findFirst({ where: { featureId: featureId(name), ...target } });
    if (!existing) await prisma.featureAssignment.create({ data: { featureId: featureId(name), availability, ...target } });
  };
  for (const make of await prisma.make.findMany()) {
    for (const name of ['ABS with EBD', 'Driver and passenger airbags', 'Stability control']) await assign(name, { makeId: make.id });
  }
  await assign('Adaptive cruise control', { variantId: variantIds['BMW|3 Series|320d M Sport'] });
  await assign('Leather seats', { variantId: variantIds['BMW|3 Series|320d M Sport'] });
  await assign('Sunroof', { variantId: variantIds['BMW|3 Series|320i'] }, 'OPTIONAL');
  await assign('Diff lock', { variantId: variantIds['Toyota|Hilux|2.8 GD-6 Raised Body Legend 4x4 Double Cab'] });
  await assign('Tow bar', { variantId: variantIds['Ford|Ranger|2.0 BiTurbo Wildtrak 4x4 Double Cab'] }, 'OPTIONAL');
  await assign('Apple CarPlay and Android Auto', { variantId: variantIds['BYD|Atto 3|Extended Range'] });
  return variantIds;
}

async function seedContent() {
  for (const page of PAGES) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      create: { slug: page.slug, title: page.title, status: 'PUBLISHED', body: [{ type: 'paragraph', text: page.text }] },
      update: {},
    });
  }
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({ data: FAQS.map((faq, index) => ({ ...faq, sortOrder: index })) });
  }
}

async function seedSuperAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@changecars.co.za').toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;
  const password = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(12).toString('base64url');
  await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 12), firstName: 'Platform', lastName: 'Admin', role: UserRole.SUPER_ADMIN, termsAcceptedAt: new Date() },
  });
  console.log(`Super admin created: ${email} / ${process.env.SEED_ADMIN_PASSWORD ? '(password from SEED_ADMIN_PASSWORD)' : password}`);
}

async function seedDemo(variantIds: Record<string, string>) {
  const password = await bcrypt.hash('Password123', 10);
  const user = (email: string, firstName: string, lastName: string, role: UserRole) =>
    prisma.user.upsert({ where: { email }, create: { email, passwordHash: password, firstName, lastName, role, termsAcceptedAt: new Date(), phone: '+27 82 000 0000' }, update: {} });

  const owner = await user('owner@demo-dealer.co.za', 'Thabo', 'Nkosi', UserRole.DEALER);
  const sales = await user('sales@demo-dealer.co.za', 'Lerato', 'Mokoena', UserRole.DEALER);
  await user('customer@example.com', 'Ayesha', 'Patel', UserRole.CUSTOMER);

  const dealer = await prisma.dealer.upsert({
    where: { slug: 'sandton-auto' },
    create: {
      name: 'Sandton Auto',
      slug: 'sandton-auto',
      email: 'sales@sandtonauto.co.za',
      phone: '+27 11 000 0000',
      province: Province.GAUTENG,
      city: 'Sandton',
      address: '1 Rivonia Road, Sandton',
      status: DealerStatus.APPROVED,
      approvedAt: new Date(),
      plan: 'GOLD',
      rating: 4.6,
    },
    update: {},
  });
  const branch = await prisma.branch.upsert({
    where: { dealerId_slug: { dealerId: dealer.id, slug: 'sandton' } },
    create: {
      dealerId: dealer.id,
      name: 'Sandton Auto - Sandton',
      slug: 'sandton',
      address: '1 Rivonia Road, Sandton',
      city: 'Sandton',
      province: Province.GAUTENG,
      latitude: -26.1076,
      longitude: 28.0567,
      isHeadOffice: true,
      operatingHours: [
        { day: 'Mon', open: '08:00', close: '17:30' },
        { day: 'Sat', open: '08:30', close: '13:00' },
        { day: 'Sun', closed: true },
      ],
    },
    update: {},
  });
  await prisma.dealerMember.upsert({ where: { userId: owner.id }, create: { dealerId: dealer.id, userId: owner.id, role: DealerMemberRole.OWNER }, update: {} });
  await prisma.dealerMember.upsert({ where: { userId: sales.id }, create: { dealerId: dealer.id, userId: sales.id, role: DealerMemberRole.SALES, branchId: branch.id }, update: {} });

  if ((await prisma.vehicle.count({ where: { dealerId: dealer.id } })) > 0) return;

  const variants = await prisma.variant.findMany({ include: { model: { include: { make: true } }, specification: true } });
  const categories = await prisma.category.findMany();
  const plan: { key: string; year: number; mileage: number; price: number; condition: VehicleCondition; colour: string; special?: number }[] = [
    { key: 'BMW|3 Series|320i', year: 2022, mileage: 38_000, price: 639_900, condition: 'USED', colour: 'Alpine White' },
    { key: 'BMW|3 Series|320d M Sport', year: 2023, mileage: 21_500, price: 789_900, condition: 'USED', colour: 'Black Sapphire', special: 759_900 },
    { key: 'Toyota|Hilux|2.8 GD-6 Raised Body Legend 4x4 Double Cab', year: 2022, mileage: 64_000, price: 689_900, condition: 'USED', colour: 'Glacier White' },
    { key: 'Toyota|Hilux|2.4 GD-6 Raider Xtra Cab', year: 2021, mileage: 92_000, price: 409_900, condition: 'USED', colour: 'Silver' },
    { key: 'Toyota|Corolla Cross|1.8 XS Hybrid', year: 2024, mileage: 9_800, price: 474_900, condition: 'DEMO', colour: 'Celestite Grey' },
    { key: 'Volkswagen|Polo|1.0 TSI Life', year: 2022, mileage: 41_000, price: 289_900, condition: 'USED', colour: 'Reflex Silver', special: 274_900 },
    { key: 'Ford|Ranger|2.0 BiTurbo Wildtrak 4x4 Double Cab', year: 2025, mileage: 0, price: 949_900, condition: 'NEW', colour: 'Luxe Yellow' },
    { key: 'BYD|Atto 3|Extended Range', year: 2024, mileage: 12_000, price: 699_900, condition: 'USED', colour: 'Ski White' },
    { key: 'Suzuki|Swift|1.2 GL', year: 2025, mileage: 0, price: 237_900, condition: 'NEW', colour: 'Burning Red' },
  ];

  for (const [index, item] of plan.entries()) {
    const variant = variants.find((row) => variantIds[item.key] === row.id)!;
    const spec = variant.specification!;
    const title = `${item.year} ${variant.model.make.name} ${variant.model.name} ${variant.name}`;
    const categoryIds = [variant.bodyCategoryId, spec.fuelType === 'ELECTRIC' ? categories.find((c) => c.slug === 'electric-vehicles')?.id : null, spec.fuelType === 'HYBRID' ? categories.find((c) => c.slug === 'hybrid-vehicles')?.id : null].filter(
      (id): id is string => !!id,
    );
    const publishedAt = new Date(Date.now() - index * 86_400_000);
    await prisma.vehicle.create({
      data: {
        slug: `${slugify(title)}-demo${index}`,
        dealerId: dealer.id,
        branchId: branch.id,
        makeId: variant.model.makeId,
        modelId: variant.modelId,
        generationId: variant.generationId,
        variantId: variant.id,
        stockNumber: `SA-${1000 + index}`,
        condition: item.condition,
        status: VehicleStatus.PUBLISHED,
        title,
        description: `${title} in ${item.colour}. Full service history, one owner. Finance and trade-ins welcome.`,
        year: item.year,
        mileage: item.mileage,
        price: item.price,
        specialPrice: item.special,
        isSpecial: !!item.special,
        isFeatured: index < 3,
        transmission: spec.transmission!,
        fuelType: spec.fuelType!,
        drivetrain: spec.drivetrain,
        colour: item.colour,
        engineCapacityCc: spec.engineCapacityCc,
        powerKw: spec.powerKw,
        cylinders: spec.cylinders,
        seats: spec.seats,
        doors: spec.doors,
        province: Province.GAUTENG,
        city: 'Sandton',
        latitude: branch.latitude,
        longitude: branch.longitude,
        submittedAt: publishedAt,
        approvedAt: publishedAt,
        publishedAt,
        popularityScore: (plan.length - index) * 7,
        viewCount: (plan.length - index) * 7,
        categories: { connect: categoryIds.map((id) => ({ id })) },
        statusHistory: { create: { toStatus: VehicleStatus.PUBLISHED, reason: 'Seeded demo listing' } },
      },
    });
  }

  await prisma.article.upsert({
    where: { slug: 'how-to-sell-your-car-for-the-best-price' },
    create: {
      slug: 'how-to-sell-your-car-for-the-best-price',
      title: 'How to sell your car for the best price',
      excerpt: 'Five practical steps to get more for your vehicle in South Africa.',
      type: 'ADVICE',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      featured: true,
      categoryId: (await prisma.articleCategory.findUnique({ where: { slug: 'buying-advice' } }))?.id,
      body: [
        { type: 'heading', text: 'Know what your car is worth', level: 2 },
        { type: 'paragraph', text: 'Start with a free valuation so you know a fair range before you talk to buyers.' },
        { type: 'list', items: ['Gather your service history', 'Fix small cosmetic issues', 'Let dealers compete for your car'] },
      ],
    },
    update: {},
  });
  console.log('Demo data: dealer owner@demo-dealer.co.za, sales@demo-dealer.co.za, customer customer@example.com (password Password123)');
}

async function main() {
  await seedCategories();
  const variantIds = await seedCatalogue();
  await seedContent();
  await seedSuperAdmin();
  // The website filters news by these categories, so they are reference data.
  const websiteFixture = loadWebsiteFixture();
  await seedWebsiteArticleCategories(prisma, websiteFixture);
  if (process.env.SEED_DEMO === 'true') {
    if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production');
    await seedDemo(variantIds);
  }
  if (process.env.SEED_WEBSITE_DEMO === 'true') {
    if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production');
    await seedWebsiteDemo(prisma, websiteFixture);
  }
  console.log('Seed complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
