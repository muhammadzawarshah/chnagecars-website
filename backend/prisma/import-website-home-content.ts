/**
 * Moves the website home page content that used to live in the website code
 * (fixtures/website-home-content.json) into the database, so the super admin console manages it:
 * customer testimonials, advert banners, featured dealers and specials (promotions).
 *
 * Only missing records are created; anything already in the database, possibly edited, is left
 * as it is, so the script is safe to run again. Featured dealers are linked to the marketplace
 * dealer with exactly the same name (when there is exactly one), so their page shows that
 * dealer's stock; the rest can be linked from the console.
 *
 *   npx tsx prisma/import-website-home-content.ts
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { AdPlacement, PrismaClient } from '../src/generated/prisma/client';

type Fixture = {
  testimonials: { name: string; text: string }[];
  adBanners: { title: string; placement: AdPlacement; imageUrl: string; linkUrl: string; altText: string }[];
  featuredDealers: { name: string; slug: string; logoUrl: string; description: string; about: string }[];
  specials: { title: string; slug: string; bannerUrl: string; description: string }[];
};

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const fixture: Fixture = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/website-home-content.json'), 'utf8'));

async function main() {
  const existingTestimonials = new Set((await db.testimonial.findMany({ select: { name: true, text: true } })).map((row) => `${row.name}\n${row.text}`));
  const testimonials = fixture.testimonials
    .map((row, index) => ({ ...row, sortOrder: index }))
    .filter((row) => !existingTestimonials.has(`${row.name}\n${row.text}`));

  const existingBanners = new Set((await db.adBanner.findMany({ select: { placement: true, imageUrl: true } })).map((row) => `${row.placement} ${row.imageUrl}`));
  const adBanners = fixture.adBanners.filter((row) => !existingBanners.has(`${row.placement} ${row.imageUrl}`));

  const existingFeatured = new Set((await db.featuredDealer.findMany({ select: { slug: true } })).map((row) => row.slug));
  const featured = fixture.featuredDealers.map((row, index) => ({ ...row, sortOrder: index })).filter((row) => !existingFeatured.has(row.slug));
  const matches = await db.dealer.findMany({ where: { OR: featured.map((row) => ({ name: { equals: row.name, mode: 'insensitive' as const } })) }, select: { id: true, name: true } });
  const dealerFor = (name: string) => {
    const found = matches.filter((dealer) => dealer.name.toLowerCase() === name.toLowerCase());
    return found.length === 1 ? found[0].id : null;
  };

  const existingSpecials = new Set((await db.promotion.findMany({ where: { slug: { in: fixture.specials.map((row) => row.slug) } }, select: { slug: true } })).map((row) => row.slug));
  const specials = fixture.specials.filter((row) => !existingSpecials.has(row.slug));
  const now = new Date();

  await db.$transaction([
    ...testimonials.map((row) => db.testimonial.create({ data: row })),
    ...adBanners.map((row) => db.adBanner.create({ data: row })),
    ...featured.map((row) => db.featuredDealer.create({ data: { ...row, dealerId: dealerFor(row.name) } })),
    ...specials.map((row) => db.promotion.create({ data: { ...row, startsAt: now, isActive: true } })),
  ]);

  console.log({
    testimonials: { created: testimonials.length, alreadyInDatabase: fixture.testimonials.length - testimonials.length },
    adBanners: { created: adBanners.length, alreadyInDatabase: fixture.adBanners.length - adBanners.length },
    featuredDealers: { created: featured.length, linkedToDealer: featured.filter((row) => dealerFor(row.name)).length, alreadyInDatabase: fixture.featuredDealers.length - featured.length },
    specials: { created: specials.length, alreadyInDatabase: fixture.specials.length - specials.length },
  });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
