import { Body, Controller, Get, HttpCode, HttpStatus, Module, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsIn } from 'class-validator';
import { CurrentUser, OptionalAuth, Public } from '../../common/decorators/auth.decorators';
import { Errors } from '../../common/errors/app-error';
import { PublicCache } from '../../common/interceptors/cache-headers.interceptor';
import type { AuthUser } from '../../common/types/auth-user';
import { AuthModule } from '../auth/auth.module';
import { DealersModule } from '../dealers/dealers.module';
import { EnquiriesModule } from '../enquiries/enquiries.module';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { SellingModule } from '../selling/selling.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WebArticlesService } from './web-articles.service';
import { WebCarsService, parseWebCarSearch } from './web-cars.service';
import { WebDashboardService } from './web-dashboard.service';
import { WEB_FORMS, WebForm, WebFormsService } from './web-forms.service';
import { WebUploadsService } from './web-uploads.service';

/**
 * Website adapter ("backend for frontend") for the Next.js website (the repository root).
 * Every response uses the exact shapes the site's types declare (app/lib/**),
 * so the site's pages and components work unchanged. The general /api/v1 endpoints
 * stay the contract for the mobile apps and partners.
 */

const limitOf = (value?: string) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : undefined;
};

/** Same limits as the API's public forms and credential endpoints. */
const FORM_LIMIT = { default: { limit: 10, ttl: 60_000 } };
const AUTH_LIMIT = { default: { limit: 10, ttl: 60_000 } };
/** Two calls per file (presign + confirm) for up to 20 photos and 2 documents. */
const UPLOAD_LIMIT = { default: { limit: 60, ttl: 60_000 } };

@ApiTags('Website adapter: cars and articles')
@Public()
@Controller('web')
export class WebContentController {
  constructor(
    private readonly cars: WebCarsService,
    private readonly articles: WebArticlesService,
  ) {}

  @Get('cars')
  @PublicCache(30)
  @ApiOperation({ summary: 'Car search with the website CarSearch fields → { cars, total, page, pageCount }' })
  search(@Query() query: Record<string, unknown>) {
    return this.cars.search(parseWebCarSearch(query));
  }

  @Get('cars/all')
  @PublicCache(60)
  @ApiOperation({ summary: 'Every listed car, newest first (capped at 1000)' })
  all(@Query('limit') limit?: string) {
    return this.cars.all(limitOf(limit));
  }

  @Get('cars/featured')
  @PublicCache(60)
  featured(@Query('limit') limit?: string) {
    return this.cars.featured(limitOf(limit));
  }

  @Get('cars/premium')
  @PublicCache(60)
  premium(@Query('limit') limit?: string) {
    return this.cars.featured(limitOf(limit) ?? 12);
  }

  @Get('cars/recent')
  @PublicCache(60)
  recent(@Query('limit') limit?: string) {
    return this.cars.recent(limitOf(limit));
  }

  @Get('cars/:id')
  @OptionalAuth()
  @ApiOperation({ summary: 'One car by its website id (32 hex characters). Counts a view.' })
  async car(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    const car = await this.cars.get(id, user?.id);
    if (!car) throw Errors.notFound('Vehicle');
    return car;
  }

  @Get('cars/:id/dealer-cars')
  @PublicCache(60)
  dealerCars(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.cars.dealerCars(id, limitOf(limit));
  }

  @Get('cars/:id/similar')
  @PublicCache(60)
  similar(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.cars.similar(id, limitOf(limit));
  }

  @Get('cars/:id/popular-dealers')
  @PublicCache(60)
  popularDealers(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.cars.popularDealers(id, limitOf(limit));
  }

  @Get('cars/:id/market-price')
  @PublicCache(300)
  marketPrice(@Param('id') id: string) {
    return this.cars.marketPrice(id);
  }

  @Get('article-categories')
  @PublicCache(300)
  articleCategories() {
    return this.articles.categories();
  }

  @Get('articles')
  @PublicCache(60)
  @ApiOperation({ summary: 'News search → { articles, total, page, pageCount }' })
  searchArticles(@Query('q') q?: string, @Query('category') category?: string, @Query('page') page?: string) {
    return this.articles.search({ q, category: category?.slice(0, 120), page: limitOf(page) });
  }

  @Get('articles/featured')
  @PublicCache(60)
  async featuredArticle() {
    return { article: await this.articles.featured() };
  }

  @Get('articles/latest')
  @PublicCache(60)
  latestArticles(@Query('limit') limit?: string) {
    return this.articles.latest(limitOf(limit));
  }

  @Get('articles/:slug')
  @PublicCache(60)
  async article(@Param('slug') slug: string) {
    const article = await this.articles.get(slug);
    if (!article) throw Errors.notFound('Article');
    return article;
  }
}

class DealerStatusBody {
  @ApiProperty({ enum: ['active', 'suspended', 'pending'] })
  @IsIn(['active', 'suspended', 'pending'])
  status: 'active' | 'suspended' | 'pending';
}

@ApiTags('Website adapter: dashboards')
@ApiBearerAuth()
@Controller('web/dashboard')
export class WebDashboardController {
  constructor(private readonly dashboard: WebDashboardService) {}

  @Get('overview')
  async overview(@CurrentUser() user: AuthUser) {
    return this.dashboard.overview(await this.dashboard.viewer(user));
  }

  @Get('dealers')
  async dealers(@CurrentUser() user: AuthUser) {
    return this.dashboard.dealersList(await this.dashboard.viewer(user));
  }

  @Get('dealers-by-id')
  async dealersById(@CurrentUser() user: AuthUser, @Query('ids') ids = '') {
    return this.dashboard.dealersById(await this.dashboard.viewer(user), ids.split(','));
  }

  @Get('dealers/:id')
  async dealer(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.dashboard.dealer(await this.dashboard.viewer(user), id);
  }

  @Post('dealers/:id/status')
  @HttpCode(HttpStatus.OK)
  async setDealerStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: DealerStatusBody) {
    return this.dashboard.setDealerStatus(await this.dashboard.viewer(user), id, body.status);
  }

  @Get('inventory')
  async inventory(@CurrentUser() user: AuthUser, @Query('dealerId') dealerId?: string) {
    return this.dashboard.inventory(await this.dashboard.viewer(user), dealerId || undefined);
  }

  @Get('leads')
  async leads(@CurrentUser() user: AuthUser, @Query('dealerId') dealerId?: string) {
    return this.dashboard.leads(await this.dashboard.viewer(user), dealerId || undefined);
  }

  @Get('staff')
  async staff(@CurrentUser() user: AuthUser) {
    return this.dashboard.staff(await this.dashboard.viewer(user));
  }

  @Get('activity')
  async activity(@CurrentUser() user: AuthUser) {
    return this.dashboard.activity(await this.dashboard.viewer(user));
  }
}

@ApiTags('Website adapter: forms')
@Controller('web')
export class WebFormsController {
  constructor(
    private readonly forms: WebFormsService,
    private readonly uploads: WebUploadsService,
  ) {}

  @Post('forms/:form')
  @OptionalAuth()
  @Throttle(FORM_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: `Submit a website form (${WEB_FORMS.join(', ')}). Errors: 422 FORM_INVALID { details.fields }` })
  submit(@Param('form') form: string, @Body() body: Record<string, unknown>, @CurrentUser() user?: AuthUser) {
    if (!WEB_FORMS.includes(form as WebForm)) throw Errors.notFound('Form');
    return this.forms.submit(form as WebForm, body ?? {}, user);
  }

  @Post('uploads/url')
  @Public()
  @Throttle(UPLOAD_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Presigned upload for a photo or document of a submitted website form (token from the form receipt)' })
  uploadUrl(@Body() body: Record<string, unknown>) {
    return this.uploads.uploadUrl({ token: body?.token, kind: body?.kind, contentType: body?.contentType });
  }

  @Post('uploads/confirm')
  @Public()
  @Throttle(UPLOAD_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach an uploaded file to the request the token belongs to' })
  confirmUpload(@Body() body: Record<string, unknown>) {
    return this.uploads.confirm({ token: body?.token, kind: body?.kind, storageKey: body?.storageKey, contentType: body?.contentType, fileName: body?.fileName });
  }

  @Post('auth/register')
  @Public()
  @Throttle(AUTH_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Website sign-up (private seller or dealer). Errors: 422 FORM_INVALID { details.fields }' })
  register(@Body() body: Record<string, unknown>) {
    return this.forms.register(body ?? {});
  }
}

@Module({
  imports: [AuthModule, DealersModule, EnquiriesModule, NewsletterModule, SellingModule, VehiclesModule],
  controllers: [WebContentController, WebDashboardController, WebFormsController],
  providers: [WebCarsService, WebArticlesService, WebDashboardService, WebFormsService, WebUploadsService],
})
export class WebModule {}
