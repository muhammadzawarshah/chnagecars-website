/**
 * Website demo data: the cars, news, dealers, stock, leads and staff the Next.js website showed
 * as samples before it was connected (exported by scripts/export-website-fixture.cjs).
 * Loaded with SEED_WEBSITE_DEMO=true so the connected website looks exactly as it did.
 */
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DealerMemberRole,
  DealerPlan,
  DealerStatus,
  Drivetrain,
  FuelType,
  ImageStatus,
  LeadSource,
  LeadStage,
  PrismaClient,
  Province,
  Transmission,
  UserRole,
  VehicleCondition,
  VehicleStatus,
} from '../src/generated/prisma/client';

type FixtureCar = {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  bodyType: string;
  fuel: string;
  transmission: string;
  drive: '4X2' | '4X4';
  colour: string;
  engine: string;
  mileage: number;
  image: string;
  gallery: string[];
  province: string;
  featured: boolean;
  listedAt: string;
};
type FixtureDealer = { id: string; name: string; contactName: string; email: string; phone: string; city: string; province: string; plan: string; status: string; joinedAt: string; rating: number };
type FixtureInventory = { id: string; dealerId: string; title: string; image: string; price: number; mileage: number; status: string; views: number; leads: number; listedAt: string };
type FixtureLead = { id: string; dealerId: string; customer: string; phone: string; vehicle: string; source: string; status: string; createdAt: string };
type FixtureStats = { avgDaysToSell: number; responseHours: number; monthlyViews: { month: string; value: number }[] };
type FixtureStaff = { id: string; name: string; email: string; role: 'super-admin' | 'admin'; status: string; lastActive: string };
type FixtureArticle = { slug: string; title: string; publishedAt: string; category: string; image: string; excerpt?: string; body: unknown[]; featured?: boolean };

export type WebsiteFixture = {
  cars: FixtureCar[];
  articleCategories: { slug: string; name: string }[];
  articles: FixtureArticle[];
  dealers: FixtureDealer[];
  dealerStats: Record<string, FixtureStats>;
  inventory: FixtureInventory[];
  leads: FixtureLead[];
  staff: FixtureStaff[];
};

export function loadWebsiteFixture(): WebsiteFixture {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', 'website-demo.json'), 'utf8')) as WebsiteFixture;
}

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const PROVINCES: Record<string, Province> = {
  'eastern-cape': Province.EASTERN_CAPE,
  'free-state': Province.FREE_STATE,
  gauteng: Province.GAUTENG,
  'kwazulu-natal': Province.KWAZULU_NATAL,
  limpopo: Province.LIMPOPO,
  mpumalanga: Province.MPUMALANGA,
  'northern-cape': Province.NORTHERN_CAPE,
  'north-west': Province.NORTH_WEST,
  'western-cape': Province.WESTERN_CAPE,
};
const province = (name: string) => PROVINCES[slugify(name)] ?? Province.GAUTENG;

const BODY_CATEGORY: Record<string, string> = {
  SUV: 'suvs',
  Sedan: 'sedans',
  Hatchback: 'hatchbacks',
  'Coupé': 'coupes',
  Convertible: 'convertibles',
  'Double Cab Bakkie': 'double-cabs',
  'Single Cab Bakkie': 'bakkies',
  'Extended Cab': 'king-cabs',
  MPV: 'mpvs',
  Minibus: 'minibuses',
  'Panel Van': 'panel-vans',
  'Station Wagon': 'station-wagons',
  Motorbike: 'motorbikes',
  Caravan: 'caravans',
  Boat: 'boats',
};

const FUELS: Record<string, FuelType> = { Petrol: FuelType.PETROL, Diesel: FuelType.DIESEL, Hybrid: FuelType.HYBRID, Electric: FuelType.ELECTRIC };
const DEALER_STATUS: Record<string, DealerStatus> = { active: DealerStatus.APPROVED, pending: DealerStatus.PENDING, suspended: DealerStatus.SUSPENDED };
const PLANS: Record<string, DealerPlan> = { Gold: DealerPlan.GOLD, Silver: DealerPlan.SILVER, Basic: DealerPlan.BASIC };
const LEAD_SOURCES: Record<string, LeadSource> = { Call: LeadSource.PHONE, WhatsApp: LeadSource.WHATSAPP, Email: LeadSource.EMAIL, 'Website form': LeadSource.WEBSITE_ENQUIRY };
const LEAD_STAGES: Record<string, LeadStage> = { new: LeadStage.NEW, contacted: LeadStage.CONTACTED, won: LeadStage.WON, lost: LeadStage.LOST };
/** Website dashboard listing tabs → lifecycle states. "active" stock is the public cars, so it is not duplicated. */
const STOCK_STATUS: Record<string, VehicleStatus | undefined> = { sold: VehicleStatus.SOLD, draft: VehicleStatus.DRAFT, flagged: VehicleStatus.SUSPENDED };

const HOURS = [
  { day: 'Mon', open: '08:00', close: '17:00' },
  { day: 'Tue', open: '08:00', close: '17:00' },
  { day: 'Wed', open: '08:00', close: '17:00' },
  { day: 'Thu', open: '08:00', close: '17:00' },
  { day: 'Fri', open: '08:00', close: '17:00' },
  { day: 'Sat', open: '08:30', close: '13:00' },
  { day: 'Sun', closed: true },
  { day: 'PublicHoliday', closed: true },
];

const DAY = 86_400_000;
const utc = (value: string) => new Date(value.length > 10 ? `${value}:00Z` : `${value}T08:00:00Z`);
const engineCc = (engine: string) => {
  const litres = Number.parseFloat(engine);
  return Number.isFinite(litres) ? Math.round(litres * 1000) : null;
};

function splitName(name: string) {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') || firstName };
}

export async function seedWebsiteArticleCategories(prisma: PrismaClient, fixture: WebsiteFixture) {
  for (const category of fixture.articleCategories) {
    await prisma.articleCategory.upsert({ where: { slug: category.slug }, create: category, update: { name: category.name } });
  }
}

export async function seedWebsiteDemo(prisma: PrismaClient, fixture: WebsiteFixture) {
  const passwordHash = await bcrypt.hash('Password123', 10);
  const now = Date.now();

  // ── staff (console users) ──
  for (const person of fixture.staff) {
    const { firstName, lastName } = splitName(person.name);
    await prisma.user.upsert({
      where: { email: person.email },
      create: {
        email: person.email,
        passwordHash,
        firstName,
        lastName,
        role: person.role === 'super-admin' ? UserRole.SUPER_ADMIN : UserRole.ADMIN,
        termsAcceptedAt: new Date(),
        lastLoginAt: person.lastActive ? utc(person.lastActive) : null,
      },
      update: {},
    });
  }

  // ── dealers, owners and head-office branches ──
  const dealerIds = new Map<string, string>();
  const branchIds = new Map<string, string>();
  for (const item of fixture.dealers) {
    const { firstName, lastName } = splitName(item.contactName);
    const owner = await prisma.user.upsert({
      where: { email: item.email },
      create: { email: item.email, passwordHash, firstName, lastName, phone: item.phone, role: UserRole.DEALER, termsAcceptedAt: new Date() },
      update: {},
    });
    const status = DEALER_STATUS[item.status] ?? DealerStatus.PENDING;
    const dealer = await prisma.dealer.upsert({
      where: { slug: slugify(item.name) },
      create: {
        name: item.name,
        slug: slugify(item.name),
        email: item.email,
        phone: item.phone,
        province: province(item.province),
        city: item.city,
        address: `${item.city}, ${item.province}`,
        status,
        plan: PLANS[item.plan] ?? DealerPlan.BASIC,
        rating: item.rating || null,
        approvedAt: status === DealerStatus.PENDING ? null : utc(item.joinedAt),
        suspensionReason: status === DealerStatus.SUSPENDED ? 'Account review' : null,
        createdAt: utc(item.joinedAt),
      },
      update: {},
    });
    const branch = await prisma.branch.upsert({
      where: { dealerId_slug: { dealerId: dealer.id, slug: slugify(item.city) } },
      create: {
        dealerId: dealer.id,
        name: `${item.name} - ${item.city}`,
        slug: slugify(item.city),
        address: `${item.city}, ${item.province}`,
        city: item.city,
        province: province(item.province),
        phone: item.phone,
        email: item.email,
        isHeadOffice: true,
        operatingHours: HOURS,
      },
      update: {},
    });
    await prisma.dealerMember.upsert({ where: { userId: owner.id }, create: { dealerId: dealer.id, userId: owner.id, role: DealerMemberRole.OWNER }, update: {} });
    dealerIds.set(item.id, dealer.id);
    branchIds.set(item.id, branch.id);

    if (!(await prisma.auditLog.findFirst({ where: { action: 'dealer.register', entityId: dealer.id } }))) {
      await prisma.auditLog.create({ data: { action: 'dealer.register', entityType: 'dealer', entityId: dealer.id, actorId: owner.id, actorRole: UserRole.DEALER, createdAt: utc(item.joinedAt) } });
      if (status === DealerStatus.SUSPENDED) {
        const admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN }, orderBy: { createdAt: 'asc' } });
        await prisma.auditLog.create({
          data: { action: 'dealer.status_change', entityType: 'dealer', entityId: dealer.id, actorId: admin?.id, actorRole: UserRole.ADMIN, after: { status: DealerStatus.SUSPENDED }, createdAt: new Date(now - 11 * DAY) },
        });
      }
    }
  }

  const websiteDealerIds = [...dealerIds.values()];
  if ((await prisma.vehicle.count({ where: { dealerId: { in: websiteDealerIds } } })) > 0) {
    console.log('Website demo: vehicles already seeded, skipping stock and leads');
  } else {
    await seedStock(prisma, fixture, dealerIds, branchIds);
  }

  // ── news ──
  await seedWebsiteArticleCategories(prisma, fixture);
  const categories = await prisma.articleCategory.findMany();
  for (const article of fixture.articles) {
    const data = {
      title: article.title,
      excerpt: article.excerpt ?? null,
      body: article.body as object[],
      status: 'PUBLISHED' as const,
      featured: !!article.featured,
      coverImageUrl: article.image,
      publishedAt: new Date(`${article.publishedAt}T06:00:00Z`),
      categoryId: categories.find((category) => category.slug === article.category)?.id ?? null,
    };
    await prisma.article.upsert({ where: { slug: article.slug }, create: { slug: article.slug, ...data }, update: data });
  }
  console.log(`Website demo: ${fixture.dealers.length} dealers, ${fixture.cars.length} public cars, ${fixture.articles.length} articles (logins use password Password123)`);
}

async function seedStock(prisma: PrismaClient, fixture: WebsiteFixture, dealerIds: Map<string, string>, branchIds: Map<string, string>) {
  const now = Date.now();
  const categories = await prisma.category.findMany();
  const categoryId = (slug?: string) => categories.find((category) => category.slug === slug)?.id;
  const active = fixture.dealers.filter((dealer) => dealer.status === 'active');
  const dealerFor = (provinceName: string) => active.find((dealer) => slugify(dealer.province) === slugify(provinceName)) ?? active[0];

  // Catalogue rows for the makes and models the samples use.
  const modelIds = new Map<string, { makeId: string; modelId: string }>();
  for (const car of fixture.cars) {
    const key = `${car.make}|${car.model}`;
    if (modelIds.has(key)) continue;
    const make = await prisma.make.upsert({ where: { slug: slugify(car.make) }, create: { name: car.make, slug: slugify(car.make) }, update: {} });
    const model = await prisma.model.upsert({
      where: { makeId_slug: { makeId: make.id, slug: slugify(car.model) } },
      create: { makeId: make.id, name: car.model, slug: slugify(car.model), defaultCategoryId: categoryId(BODY_CATEGORY[car.bodyType]) },
      update: {},
    });
    modelIds.set(key, { makeId: make.id, modelId: model.id });
  }

  const vehicleData = (car: FixtureCar, dealerKey: string, overrides: { status: VehicleStatus; price: number; mileage: number; listedAt: string; image: string; gallery: string[]; featured: boolean; stock: string }) => {
    const dealer = fixture.dealers.find((item) => item.id === dealerKey)!;
    const ids = modelIds.get(`${car.make}|${car.model}`)!;
    const publishedAt = utc(overrides.listedAt);
    const body = categoryId(BODY_CATEGORY[car.bodyType]);
    return {
      slug: `${slugify(car.title)}-${overrides.stock.toLowerCase()}`,
      dealerId: dealerIds.get(dealerKey)!,
      branchId: branchIds.get(dealerKey)!,
      makeId: ids.makeId,
      modelId: ids.modelId,
      stockNumber: overrides.stock,
      condition: car.mileage < 1000 ? VehicleCondition.DEMO : VehicleCondition.USED,
      status: overrides.status,
      title: car.title,
      description: `${car.title} in ${car.colour}. Finance and trade-ins welcome.`,
      year: car.year,
      mileage: overrides.mileage,
      price: overrides.price,
      isFeatured: overrides.featured,
      transmission: car.transmission === 'Manual' ? Transmission.MANUAL : Transmission.AUTOMATIC,
      fuelType: FUELS[car.fuel] ?? FuelType.OTHER,
      drivetrain: car.drive === '4X4' ? Drivetrain.FOUR_X_FOUR : Drivetrain.FOUR_X_TWO,
      colour: car.colour,
      engineCapacityCc: engineCc(car.engine),
      province: province(dealer.province),
      city: dealer.city,
      primaryImageUrl: overrides.image,
      imageCount: overrides.gallery.length,
      submittedAt: publishedAt,
      approvedAt: overrides.status === VehicleStatus.DRAFT ? null : publishedAt,
      publishedAt: overrides.status === VehicleStatus.DRAFT ? null : publishedAt,
      categories: body ? { connect: [{ id: body }] } : undefined,
      images: {
        create: overrides.gallery.map((url, position) => ({
          storageKey: `website-demo/${overrides.stock}/${position}`,
          url,
          largeUrl: url,
          mediumUrl: url,
          thumbnailUrl: url,
          contentType: url.endsWith('.png') ? 'image/png' : 'image/jpeg',
          position,
          isPrimary: position === 0,
          status: ImageStatus.READY,
        })),
      },
      statusHistory: { create: { toStatus: overrides.status, reason: 'Seeded website demo listing' } },
    };
  };

  // The public cars, each placed with an active dealer in its province.
  const vehiclesByDealer = new Map<string, { id: string; title: string }[]>();
  const remember = (dealerKey: string, vehicle: { id: string; title: string }) => vehiclesByDealer.set(dealerKey, [...(vehiclesByDealer.get(dealerKey) ?? []), vehicle]);
  for (const car of fixture.cars) {
    const dealer = dealerFor(car.province);
    const created = await prisma.vehicle.create({
      data: vehicleData(car, dealer.id, { status: VehicleStatus.PUBLISHED, price: car.price, mileage: car.mileage, listedAt: car.listedAt, image: car.image, gallery: car.gallery, featured: car.featured, stock: `W-${car.id}` }),
      select: { id: true, title: true },
    });
    remember(dealer.id, created);
  }

  // Each dealer's sold, draft and flagged stock from the dashboard samples.
  for (const item of fixture.inventory) {
    const status = STOCK_STATUS[item.status];
    const car = fixture.cars.find((sample) => sample.title === item.title);
    if (!status || !car || !dealerIds.has(item.dealerId)) continue;
    const stats = fixture.dealerStats[item.dealerId];
    const listedAt = utc(item.listedAt).getTime();
    const created = await prisma.vehicle.create({
      data: {
        ...vehicleData(car, item.dealerId, { status, price: item.price, mileage: item.mileage, listedAt: item.listedAt, image: item.image, gallery: [item.image], featured: false, stock: item.id.toUpperCase() }),
        viewCount: item.views,
        ...(status === VehicleStatus.SOLD ? { soldAt: new Date(Math.min(now - DAY, listedAt + (stats?.avgDaysToSell || 30) * DAY)) } : {}),
      },
      select: { id: true, title: true },
    });
    remember(item.dealerId, created);
  }

  // Monthly listing views per dealer, spread over each month's days.
  for (const [dealerKey, stats] of Object.entries(fixture.dealerStats)) {
    const vehicles = vehiclesByDealer.get(dealerKey);
    if (!vehicles?.length || !stats.monthlyViews.length) continue;
    const today = new Date();
    for (const [index, point] of stats.monthlyViews.entries()) {
      // The samples end with last month; place them on the six months before the current one.
      const month = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (stats.monthlyViews.length - index), 1));
      const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
      const perDay = Math.floor(point.value / days);
      const rows = Array.from({ length: days }, (_, day) => ({
        vehicleId: vehicles[day % vehicles.length].id,
        day: new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day + 1)),
        views: perDay + (day < point.value % days ? 1 : 0),
      }));
      await prisma.vehicleViewDaily.createMany({ data: rows, skipDuplicates: true });
    }
  }
  await prisma.$executeRaw`
    UPDATE vehicles v SET "viewCount" = GREATEST(v."viewCount", t.total)
      FROM (SELECT "vehicleId", sum(views)::int AS total FROM vehicle_view_daily GROUP BY 1) t
     WHERE v.id = t."vehicleId"`;

  // Leads, linked to the dealer's matching vehicle when there is one.
  for (const lead of fixture.leads) {
    const dealerId = dealerIds.get(lead.dealerId);
    if (!dealerId) continue;
    const vehicle = vehiclesByDealer.get(lead.dealerId)?.find((item) => item.title === lead.vehicle);
    const stage = LEAD_STAGES[lead.status] ?? LeadStage.NEW;
    const createdAt = utc(lead.createdAt);
    const responseHours = fixture.dealerStats[lead.dealerId]?.responseHours || 2;
    const responded = stage !== LeadStage.NEW ? new Date(createdAt.getTime() + responseHours * 3_600_000) : null;
    await prisma.lead.create({
      data: {
        dealerId,
        branchId: branchIds.get(lead.dealerId),
        vehicleId: vehicle?.id,
        name: lead.customer,
        phone: lead.phone,
        source: LEAD_SOURCES[lead.source] ?? LeadSource.OTHER,
        stage,
        createdAt,
        firstResponseAt: responded,
        lastContactedAt: responded,
        wonAt: stage === LeadStage.WON ? responded : null,
        lostAt: stage === LeadStage.LOST ? responded : null,
        lostReason: stage === LeadStage.LOST ? 'Bought elsewhere' : null,
      },
    });
  }
}
