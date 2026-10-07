import { PublicCache } from '../../common/interceptors/cache-headers.interceptor';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Module, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { ContentService } from './content.service';
import {
  AdminArticleQueryDto,
  ArticleCategoryDto,
  ArticleDto,
  ArticleQueryDto,
  FaqDto,
  MediaItemDto,
  MediaQueryDto,
  PromotionDto,
  PromotionVehiclesDto,
  PublishDto,
  StaticPageDto,
  UpdateArticleDto,
  UpdateFaqDto,
  UpdateMediaItemDto,
  UpdatePromotionDto,
  UpdateStaticPageDto,
} from './dto/content.dto';

@ApiTags('Content (public)')
@Public()
@Controller()
@PublicCache(300)
export class PublicContentController {
  constructor(private readonly content: ContentService) {}

  @Get('content/articles')
  @ApiOperation({ summary: 'News, reviews, buying advice and guides (FR-28)' })
  articles(@Query() query: ArticleQueryDto) {
    return this.content.listArticles(query);
  }

  @Get('content/articles/:slug')
  article(@Param('slug') slug: string) {
    return this.content.getArticle(slug);
  }

  @Get('content/article-categories')
  categories() {
    return this.content.articleCategories();
  }

  @Get('content/media')
  @ApiOperation({ summary: 'Videos and podcasts (FR-29)' })
  media(@Query() query: MediaQueryDto) {
    return this.content.listMedia(query);
  }

  @Get('content/media/:slug')
  mediaItem(@Param('slug') slug: string) {
    return this.content.getMedia(slug);
  }

  @Get('content/faqs')
  @ApiQuery({ name: 'category', required: false })
  faqs(@Query('category') category?: string) {
    return this.content.faqs(category);
  }

  @Get('content/pages/:slug')
  @ApiOperation({ summary: 'Static pages: privacy policy, terms, insurance (FR-30), EV & charging info (FR-31)' })
  page(@Param('slug') slug: string) {
    return this.content.page(slug);
  }

  @Get('promotions')
  @ApiOperation({ summary: 'Active specials and promotions (FR-23)' })
  promotions() {
    return this.content.promotions();
  }

  @Get('promotions/:slug')
  promotion(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.content.promotion(slug, query);
  }
}

@ApiTags('Admin: content')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get('articles')
  articles(@Query() query: AdminArticleQueryDto) {
    return this.content.adminListArticles(query);
  }

  @Get('articles/:id')
  article(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.adminGetArticle(id);
  }

  @Post('articles')
  createArticle(@Body() dto: ArticleDto, @CurrentUser() user: AuthUser) {
    return this.content.createArticle(dto, user.id);
  }

  @Patch('articles/:id')
  updateArticle(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateArticleDto) {
    return this.content.updateArticle(id, dto);
  }

  @Post('articles/:id/status')
  @ApiOperation({ summary: 'Publish (optionally scheduled), unpublish or archive' })
  publishArticle(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishDto) {
    return this.content.publishArticle(id, dto);
  }

  @Delete('articles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteArticle(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deleteArticle(id);
  }

  @Post('article-categories')
  createCategory(@Body() dto: ArticleCategoryDto) {
    return this.content.createArticleCategory(dto.name);
  }

  @Delete('article-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deleteArticleCategory(id);
  }

  @Get('media')
  media(@Query() query: MediaQueryDto) {
    return this.content.adminListMedia(query);
  }

  @Post('media')
  createMedia(@Body() dto: MediaItemDto) {
    return this.content.createMedia(dto);
  }

  @Patch('media/:id')
  updateMedia(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMediaItemDto) {
    return this.content.updateMedia(id, dto);
  }

  @Post('media/:id/status')
  publishMedia(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishDto) {
    return this.content.publishMedia(id, dto);
  }

  @Delete('media/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMedia(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deleteMedia(id);
  }

  @Get('faqs')
  faqs() {
    return this.content.adminFaqs();
  }

  @Post('faqs')
  createFaq(@Body() dto: FaqDto) {
    return this.content.createFaq(dto);
  }

  @Patch('faqs/:id')
  updateFaq(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFaqDto) {
    return this.content.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFaq(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deleteFaq(id);
  }

  @Get('pages')
  pages() {
    return this.content.adminPages();
  }

  @Get('pages/:id')
  pageById(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.adminPage(id);
  }

  @Post('pages')
  createPage(@Body() dto: StaticPageDto) {
    return this.content.createPage(dto);
  }

  @Patch('pages/:id')
  updatePage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaticPageDto) {
    return this.content.updatePage(id, dto);
  }

  @Post('pages/:id/status')
  publishPage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishDto) {
    return this.content.publishPage(id, dto);
  }

  @Delete('pages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePage(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deletePage(id);
  }

  @Get('promotions')
  promotions() {
    return this.content.adminPromotions();
  }

  @Post('promotions')
  createPromotion(@Body() dto: PromotionDto) {
    return this.content.createPromotion(dto);
  }

  @Patch('promotions/:id')
  updatePromotion(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromotionDto) {
    return this.content.updatePromotion(id, dto);
  }

  @Put('promotions/:id/vehicles')
  @ApiOperation({ summary: 'Set the vehicles included in a promotion' })
  setPromotionVehicles(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PromotionVehiclesDto) {
    return this.content.setPromotionVehicles(id, dto.vehicleIds);
  }

  @Delete('promotions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePromotion(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deletePromotion(id);
  }
}

@Module({
  controllers: [PublicContentController, AdminContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
