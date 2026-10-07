import { PublicCache } from '../../common/interceptors/cache-headers.interceptor';
import { Controller, Get, Header, Injectable, Module, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ContentStatus, DealerStatus } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';
import { Public } from '../../common/decorators/auth.decorators';
import { Errors } from '../../common/errors/app-error';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PUBLIC_SEARCH_STATUSES } from '../vehicles/vehicle-lifecycle';
import { effectivePrice } from '../vehicles/vehicle.presenter';

const URLS_PER_SITEMAP = 10_000;
const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * NFR-12: XML sitemaps (chunked so 150k+ listings stay within the 50k-URL limit per file) and
 * schema.org structured data for vehicle pages. URLs point at the public website.
 */
@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly config: AppConfig,
  ) {}

  private get site() {
    return this.config.get('PUBLIC_WEB_URL').replace(/\/+$/, '');
  }

  private get api() {
    return `${this.site}/${this.config.get('API_PREFIX')}`;
  }

  private urlset(entries: { loc: string; lastmod?: Date | null }[]) {
    const body = entries
      .map((entry) => `<url><loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod.toISOString()}</lastmod>` : ''}</url>`)
      .join('');
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
  }

  async index() {
    const key = await this.cache.versionedKey(CacheNs.vehicles, 'sitemap:index');
    return this.cache.wrap(key, 3600, async () => {
      const vehicles = await this.prisma.replica.vehicle.count({ where: { status: { in: PUBLIC_SEARCH_STATUSES } } });
      const pages = Math.max(1, Math.ceil(vehicles / URLS_PER_SITEMAP));
      const maps = [`${this.api}/seo/sitemap-static.xml`, ...Array.from({ length: pages }, (_, index) => `${this.api}/seo/sitemap-vehicles-${index + 1}.xml`)];
      return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${maps
        .map((loc) => `<sitemap><loc>${escapeXml(loc)}</loc></sitemap>`)
        .join('')}</sitemapindex>`;
    });
  }

  async vehicles(page: number) {
    if (page < 1 || page > 1000) throw Errors.notFound('Sitemap');
    const key = await this.cache.versionedKey(CacheNs.vehicles, `sitemap:vehicles:${page}`);
    return this.cache.wrap(key, 3600, async () => {
      const rows = await this.prisma.replica.vehicle.findMany({
        where: { status: { in: PUBLIC_SEARCH_STATUSES } },
        orderBy: { id: 'asc' },
        skip: (page - 1) * URLS_PER_SITEMAP,
        take: URLS_PER_SITEMAP,
        select: { slug: true, updatedAt: true },
      });
      return this.urlset(rows.map((row) => ({ loc: `${this.site}/car/${row.slug}`, lastmod: row.updatedAt })));
    });
  }

  async staticPages() {
    const key = await this.cache.versionedKey(CacheNs.content, 'sitemap:static');
    return this.cache.wrap(key, 3600, async () => {
      const [dealers, articles, pages, makes] = await Promise.all([
        this.prisma.replica.dealer.findMany({ where: { status: DealerStatus.APPROVED }, select: { slug: true, updatedAt: true } }),
        this.prisma.replica.article.findMany({ where: { status: ContentStatus.PUBLISHED, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true }, take: 20_000 }),
        this.prisma.replica.staticPage.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { slug: true, updatedAt: true } }),
        this.prisma.replica.make.findMany({ where: { isActive: true }, select: { slug: true, models: { where: { isActive: true }, select: { slug: true } } } }),
      ]);
      return this.urlset([
        { loc: `${this.site}/` },
        { loc: `${this.site}/cars` },
        ...makes.flatMap((make) => [
          { loc: `${this.site}/cars?make=${make.slug}` },
          ...make.models.map((model) => ({ loc: `${this.site}/cars?make=${make.slug}&model=${make.slug}:${model.slug}` })),
        ]),
        ...dealers.map((row) => ({ loc: `${this.site}/featured-dealer/${row.slug}`, lastmod: row.updatedAt })),
        ...articles.map((row) => ({ loc: `${this.site}/blogs/${row.slug}`, lastmod: row.updatedAt })),
        ...pages.map((row) => ({ loc: `${this.site}/${row.slug}`, lastmod: row.updatedAt })),
      ]);
    });
  }

  /** schema.org JSON-LD for a vehicle page ("Car" + "Offer"). */
  async vehicleStructuredData(slug: string) {
    const vehicle = await this.prisma.replica.vehicle.findFirst({
      where: { slug, status: { in: PUBLIC_SEARCH_STATUSES } },
      include: { make: true, model: true, dealer: { select: { name: true } } },
    });
    if (!vehicle) throw Errors.notFound('Vehicle');
    return {
      '@context': 'https://schema.org',
      '@type': 'Car',
      name: vehicle.title,
      url: `${this.site}/car/${vehicle.slug}`,
      image: vehicle.primaryImageUrl ?? undefined,
      brand: { '@type': 'Brand', name: vehicle.make.name },
      model: vehicle.model.name,
      vehicleModelDate: String(vehicle.year),
      mileageFromOdometer: { '@type': 'QuantitativeValue', value: vehicle.mileage, unitCode: 'KMT' },
      fuelType: vehicle.fuelType,
      vehicleTransmission: vehicle.transmission,
      itemCondition: vehicle.condition === 'NEW' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      offers: {
        '@type': 'Offer',
        price: effectivePrice(vehicle),
        priceCurrency: 'ZAR',
        availability: vehicle.status === 'RESERVED' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
        seller: { '@type': 'AutoDealer', name: vehicle.dealer.name },
      },
    };
  }
}

@ApiTags('SEO')
@Public()
@SkipThrottle()
@Controller('seo')
@PublicCache(3600)
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Sitemap index (NFR-12)' })
  index() {
    return this.seo.index();
  }

  @Get('sitemap-static.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  staticPages() {
    return this.seo.staticPages();
  }

  @Get('sitemap-vehicles-:page.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  vehicles(@Param('page', ParseIntPipe) page: number) {
    return this.seo.vehicles(page);
  }

  @Get('vehicles/:slug/structured-data')
  @ApiOperation({ summary: 'schema.org JSON-LD for a vehicle page' })
  structuredData(@Param('slug') slug: string) {
    return this.seo.vehicleStructuredData(slug);
  }
}

@Module({ controllers: [SeoController], providers: [SeoService] })
export class SeoModule {}
