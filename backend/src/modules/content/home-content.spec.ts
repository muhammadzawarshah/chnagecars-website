import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdPlacement } from '../../generated/prisma/client';
import { ContentService } from './content.service';
import { AdBannerDto, FeaturedDealerDto, PromotionDto, TestimonialDto } from './dto/content.dto';

const errors = async (type: new () => object, plain: object) =>
  (await validate(plainToInstance(type, plain))).map((error) => error.property);

describe('home page content DTOs', () => {
  const banner = { title: 'Standard Bank', placement: AdPlacement.HOME_HERO, imageUrl: '/images/ad_banners/1/a.gif', linkUrl: 'https://www.standardbank.co.za' };

  it('accepts website paths and https links for images and links', async () => {
    expect(await errors(AdBannerDto, banner)).toEqual([]);
    expect(await errors(TestimonialDto, { name: 'Nazli', text: 'Excellent service from start to finish.', photoUrl: 'https://cdn.example/n.jpg', rating: 5 })).toEqual([]);
    expect(await errors(FeaturedDealerDto, { name: 'Reeds Bellville', slug: 'reeds-bellville', logoUrl: '/images/dealers/reeds.png' })).toEqual([]);
    expect(await errors(PromotionDto, { title: 'Truck Month', bannerUrl: '/images/specials/truck.jpg', startsAt: '2026-10-01T00:00:00Z' })).toEqual([]);
  });

  it.each([['javascript:alert(1)'], ['http://insecure.example/a.gif'], ['https://ok.example/"onerror="x'], ['data:image/png;base64,AAAA']])('rejects unsafe image URL %s', async (imageUrl) => {
    expect(await errors(AdBannerDto, { ...banner, imageUrl })).toContain('imageUrl');
  });

  it('rejects an unknown placement, a rating outside 1–5 and a malformed slug', async () => {
    expect(await errors(AdBannerDto, { ...banner, placement: 'SIDEBAR' })).toContain('placement');
    expect(await errors(TestimonialDto, { name: 'A B', text: 'Long enough text here.', rating: 6 })).toContain('rating');
    expect(await errors(FeaturedDealerDto, { name: 'Reeds', slug: 'Reeds Bellville!' })).toContain('slug');
  });
});

describe('home page content service', () => {
  const setup = () => {
    const prisma = {
      adBanner: { create: jest.fn(async ({ data }) => ({ id: 'b1', ...data })), findUnique: jest.fn(), update: jest.fn(async ({ data }) => ({ id: 'b1', ...data })) },
      featuredDealer: { findUnique: jest.fn(), create: jest.fn(async ({ data }) => ({ id: 'f1', ...data })) },
      replica: { adBanner: { findMany: jest.fn(async (_args: { where: Record<string, unknown> }) => []) } },
    };
    const cache = { versionedKey: jest.fn(async (_ns: string, key: string) => key), wrap: jest.fn((_key: string, _ttl: number, load: () => unknown) => load()), bump: jest.fn() };
    const audit = { record: jest.fn() };
    return { prisma, cache, audit, service: new ContentService(prisma as never, cache as never, audit as never) };
  };

  it('lists only active banners inside their dates', async () => {
    const { prisma, service } = setup();
    await service.adBanners();
    const { where } = prisma.replica.adBanner.findMany.mock.calls[0][0];
    expect(where.isActive).toBe(true);
    expect(where.AND).toEqual([
      { OR: [{ startsAt: null }, { startsAt: { lte: expect.any(Date) } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: expect.any(Date) } }] },
    ]);
  });

  it('clears an end date sent empty, keeps one left out, and refreshes the website', async () => {
    const { prisma, cache, service } = setup();
    prisma.adBanner.findUnique.mockResolvedValue({ id: 'b1', title: 'Old' });
    await service.updateAdBanner('b1', { endsAt: '' as never });
    expect(prisma.adBanner.update.mock.calls[0][0].data.endsAt).toBeNull();
    await service.updateAdBanner('b1', { title: 'New' });
    expect(prisma.adBanner.update.mock.calls[1][0].data.endsAt).toBeUndefined();
    expect(cache.bump).toHaveBeenCalledWith('content');
  });

  it('gives a featured dealer a slug from its name and refuses one already in use', async () => {
    const { prisma, service } = setup();
    prisma.featuredDealer.findUnique.mockResolvedValueOnce(null);
    const created = await service.createFeaturedDealer({ name: 'Reeds Bellville' });
    expect(created.slug).toBe('reeds-bellville');
    prisma.featuredDealer.findUnique.mockResolvedValueOnce({ id: 'other' });
    await expect(service.createFeaturedDealer({ name: 'Reeds Bellville' })).rejects.toMatchObject({ code: 'FEATURED_DEALER_SLUG_TAKEN' });
  });
});
