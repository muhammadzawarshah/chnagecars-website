import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '../../generated/prisma/client';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import { slugify } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PUBLIC_SEARCH_STATUSES } from '../vehicles/vehicle-lifecycle';
import { publicVehicleSelect, withAvailability } from '../vehicles/vehicle.presenter';
import {
  AdminArticleQueryDto,
  ArticleDto,
  ArticleQueryDto,
  ContentBlock,
  FaqDto,
  MediaItemDto,
  MediaQueryDto,
  PromotionDto,
  PublishDto,
  StaticPageDto,
  UpdateArticleDto,
  UpdateFaqDto,
  UpdateMediaItemDto,
  UpdatePromotionDto,
  UpdateStaticPageDto,
} from './dto/content.dto';

const CONTENT_TTL = 300;
const SAFE_URL = /^(https:\/\/|\/)[^\s<>"']*$/i;

/** Rejects anything that is not one of the known block shapes (no raw HTML is ever stored). */
export function validateBlocks(blocks: ContentBlock[]): void {
  const fail = (index: number, message: string) => {
    throw Errors.badRequest('INVALID_CONTENT_BLOCK', `Block ${index}: ${message}`);
  };
  const text = (value: unknown, max = 20_000) => typeof value === 'string' && value.length > 0 && value.length <= max;
  blocks.forEach((block, index) => {
    switch (block?.type) {
      case 'paragraph':
      case 'quote':
        if (!text(block.text)) fail(index, 'text is required');
        break;
      case 'heading':
        if (!text(block.text, 300)) fail(index, 'text is required');
        if (block.level !== undefined && ![2, 3, 4].includes(block.level as number)) fail(index, 'level must be 2, 3 or 4');
        break;
      case 'image':
        if (typeof block.src !== 'string' || !SAFE_URL.test(block.src)) fail(index, 'src must be an https or relative URL');
        if (block.alt !== undefined && !text(block.alt, 300)) fail(index, 'alt must be text');
        break;
      case 'link':
        if (!text(block.text, 300)) fail(index, 'text is required');
        if (typeof block.href !== 'string' || !SAFE_URL.test(block.href)) fail(index, 'href must be an https or relative URL');
        break;
      case 'list':
        if (!Array.isArray(block.items) || !block.items.length || !block.items.every((item) => text(item, 2000))) fail(index, 'items must be non-empty strings');
        break;
      case 'video':
        if (typeof block.url !== 'string' || !/^https:\/\//i.test(block.url)) fail(index, 'url must be https');
        break;
      default:
        fail(index, `unknown block type "${String(block?.type)}"`);
    }
  });
}

/** Articles, news, reviews, media, FAQs, static pages and promotions (FR-23, FR-28..FR-31, FR-35). */
@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  private async changed(action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
    await this.audit.record({ action, entityType, entityId, before, after });
    await this.cache.bump(CacheNs.content);
  }

  private published(now = new Date()) {
    return { status: ContentStatus.PUBLISHED, publishedAt: { lte: now } };
  }

  // ───────────── articles ─────────────

  async listArticles(query: ArticleQueryDto) {
    const key = await this.cache.versionedKey(CacheNs.content, `articles:${JSON.stringify(query)}`);
    return this.cache.wrap(key, CONTENT_TTL, async () => {
      const { page, pageSize, skip, take } = pageArgs(query, 50);
      const where: Prisma.ArticleWhereInput = {
        ...this.published(),
        ...(query.type ? { type: query.type } : {}),
        ...(query.category ? { category: { slug: query.category } } : {}),
        ...(query.tag ? { tags: { has: query.tag } } : {}),
        ...(query.q ? { OR: [{ title: { contains: query.q, mode: 'insensitive' } }, { excerpt: { contains: query.q, mode: 'insensitive' } }] } : {}),
      };
      const [rows, total] = await Promise.all([
        this.prisma.replica.article.findMany({
          where,
          orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
          skip,
          take,
          omit: { body: true },
          include: { category: { select: { slug: true, name: true } } },
        }),
        this.prisma.replica.article.count({ where }),
      ]);
      return toPage(rows, total, page, pageSize);
    });
  }

  async getArticle(slug: string) {
    const key = await this.cache.versionedKey(CacheNs.content, `article:${slug}`);
    const article = await this.cache.wrap(key, CONTENT_TTL, () =>
      this.prisma.replica.article.findFirst({
        where: { slug, ...this.published() },
        include: { category: { select: { slug: true, name: true } }, author: { select: { firstName: true, lastName: true } } },
      }),
    );
    if (!article) throw Errors.notFound('Article');
    return article;
  }

  articleCategories() {
    return this.prisma.replica.articleCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async adminListArticles(query: AdminArticleQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.ArticleWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.q ? { title: { contains: query.q, mode: 'insensitive' } } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take, omit: { body: true } }),
      this.prisma.article.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  adminGetArticle(id: string) {
    return this.prisma.article.findUniqueOrThrow({ where: { id } });
  }

  async createArticle(dto: ArticleDto, authorId: string) {
    validateBlocks(dto.body);
    const article = await this.prisma.article.create({
      data: { ...dto, slug: slugify(dto.slug ?? dto.title), body: dto.body as Prisma.InputJsonValue, authorId },
    });
    await this.changed('content.article_create', 'article', article.id, null, { title: article.title });
    return article;
  }

  async updateArticle(id: string, dto: UpdateArticleDto) {
    if (dto.body) validateBlocks(dto.body);
    const before = await this.prisma.article.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Article');
    const { body, ...fields } = dto;
    const after = await this.prisma.article.update({
      where: { id },
      data: { ...fields, ...(dto.slug ? { slug: slugify(dto.slug) } : {}), ...(body ? { body: body as Prisma.InputJsonValue } : {}) },
    });
    await this.changed('content.article_update', 'article', id, { title: before.title, status: before.status }, { title: after.title, status: after.status });
    return after;
  }

  async publishArticle(id: string, dto: PublishDto) {
    const before = await this.prisma.article.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Article');
    const after = await this.prisma.article.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === ContentStatus.PUBLISHED ? { publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : before.publishedAt ?? new Date() } : {}),
      },
    });
    await this.changed('content.article_status', 'article', id, { status: before.status }, { status: after.status, publishedAt: after.publishedAt });
    return after;
  }

  async deleteArticle(id: string) {
    const before = await this.prisma.article.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Article');
    await this.prisma.article.delete({ where: { id } });
    await this.changed('content.article_delete', 'article', id, { title: before.title }, null);
  }

  async createArticleCategory(name: string) {
    const category = await this.prisma.articleCategory.create({ data: { name, slug: slugify(name) } });
    await this.changed('content.article_category_create', 'article_category', category.id, null, category);
    return category;
  }

  async deleteArticleCategory(id: string) {
    await this.prisma.articleCategory.delete({ where: { id } });
    await this.changed('content.article_category_delete', 'article_category', id, null, null);
  }

  // ───────────── videos & podcasts (FR-29) ─────────────

  async listMedia(query: MediaQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query, 50);
    const where: Prisma.MediaItemWhereInput = { ...this.published(), ...(query.type ? { type: query.type } : {}) };
    const [rows, total] = await Promise.all([
      this.prisma.replica.mediaItem.findMany({ where, orderBy: { publishedAt: 'desc' }, skip, take }),
      this.prisma.replica.mediaItem.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  async getMedia(slug: string) {
    const item = await this.prisma.replica.mediaItem.findFirst({ where: { slug, ...this.published() } });
    if (!item) throw Errors.notFound('Media item');
    return item;
  }

  async adminListMedia(query: MediaQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.MediaItemWhereInput = query.type ? { type: query.type } : {};
    const [rows, total] = await Promise.all([
      this.prisma.mediaItem.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take }),
      this.prisma.mediaItem.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  async createMedia(dto: MediaItemDto) {
    const item = await this.prisma.mediaItem.create({ data: { ...dto, slug: slugify(dto.title) } });
    await this.changed('content.media_create', 'media_item', item.id, null, { title: item.title });
    return item;
  }

  async updateMedia(id: string, dto: UpdateMediaItemDto) {
    const after = await this.prisma.mediaItem.update({ where: { id }, data: dto });
    await this.changed('content.media_update', 'media_item', id, null, { title: after.title });
    return after;
  }

  async publishMedia(id: string, dto: PublishDto) {
    const before = await this.prisma.mediaItem.findUniqueOrThrow({ where: { id } });
    const after = await this.prisma.mediaItem.update({
      where: { id },
      data: { status: dto.status, ...(dto.status === ContentStatus.PUBLISHED ? { publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : before.publishedAt ?? new Date() } : {}) },
    });
    await this.changed('content.media_status', 'media_item', id, { status: before.status }, { status: after.status });
    return after;
  }

  async deleteMedia(id: string) {
    await this.prisma.mediaItem.delete({ where: { id } });
    await this.changed('content.media_delete', 'media_item', id, null, null);
  }

  // ───────────── FAQs ─────────────

  async faqs(category?: string) {
    const key = await this.cache.versionedKey(CacheNs.content, `faqs:${category ?? '*'}`);
    return this.cache.wrap(key, CONTENT_TTL, () =>
      this.prisma.replica.faq.findMany({ where: { isActive: true, ...(category ? { category } : {}) }, orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
    );
  }

  adminFaqs() {
    return this.prisma.faq.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });
  }

  async createFaq(dto: FaqDto) {
    const faq = await this.prisma.faq.create({ data: dto });
    await this.changed('content.faq_create', 'faq', faq.id, null, faq);
    return faq;
  }

  async updateFaq(id: string, dto: UpdateFaqDto) {
    const after = await this.prisma.faq.update({ where: { id }, data: dto });
    await this.changed('content.faq_update', 'faq', id, null, after);
    return after;
  }

  async deleteFaq(id: string) {
    await this.prisma.faq.delete({ where: { id } });
    await this.changed('content.faq_delete', 'faq', id, null, null);
  }

  // ───────────── static pages (privacy policy, insurance info FR-30, EV & charging FR-31) ─────────────

  async page(slug: string) {
    const key = await this.cache.versionedKey(CacheNs.content, `page:${slug}`);
    const page = await this.cache.wrap(key, CONTENT_TTL, () => this.prisma.replica.staticPage.findFirst({ where: { slug, status: ContentStatus.PUBLISHED } }));
    if (!page) throw Errors.notFound('Page');
    return page;
  }

  adminPages() {
    return this.prisma.staticPage.findMany({ orderBy: { slug: 'asc' }, omit: { body: true } });
  }

  adminPage(id: string) {
    return this.prisma.staticPage.findUniqueOrThrow({ where: { id } });
  }

  async createPage(dto: StaticPageDto) {
    validateBlocks(dto.body);
    const page = await this.prisma.staticPage.create({ data: { ...dto, slug: slugify(dto.slug), body: dto.body as Prisma.InputJsonValue } });
    await this.changed('content.page_create', 'static_page', page.id, null, { slug: page.slug });
    return page;
  }

  async updatePage(id: string, dto: UpdateStaticPageDto) {
    if (dto.body) validateBlocks(dto.body);
    const { body, ...fields } = dto;
    const after = await this.prisma.staticPage.update({
      where: { id },
      data: { ...fields, ...(dto.slug ? { slug: slugify(dto.slug) } : {}), ...(body ? { body: body as Prisma.InputJsonValue } : {}) },
    });
    await this.changed('content.page_update', 'static_page', id, null, { slug: after.slug });
    return after;
  }

  async publishPage(id: string, dto: PublishDto) {
    const after = await this.prisma.staticPage.update({ where: { id }, data: { status: dto.status } });
    await this.changed('content.page_status', 'static_page', id, null, { status: after.status });
    return after;
  }

  async deletePage(id: string) {
    await this.prisma.staticPage.delete({ where: { id } });
    await this.changed('content.page_delete', 'static_page', id, null, null);
  }

  // ───────────── promotions (FR-23) ─────────────

  private activePromotion(now = new Date()): Prisma.PromotionWhereInput {
    return { isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
  }

  async promotions() {
    const key = await this.cache.versionedKey(CacheNs.content, 'promotions');
    return this.cache.wrap(key, 120, () =>
      this.prisma.replica.promotion.findMany({
        where: this.activePromotion(),
        orderBy: { startsAt: 'desc' },
        include: { dealer: { select: { id: true, name: true, slug: true } }, _count: { select: { vehicles: { where: { status: { in: PUBLIC_SEARCH_STATUSES } } } } } },
      }),
    );
  }

  async promotion(slug: string, query: { page?: number; pageSize?: number }) {
    const promotion = await this.prisma.replica.promotion.findFirst({ where: { slug, ...this.activePromotion() } });
    if (!promotion) throw Errors.notFound('Promotion');
    const { page, pageSize, skip, take } = pageArgs(query, 50);
    const where: Prisma.VehicleWhereInput = { promotionId: promotion.id, status: { in: PUBLIC_SEARCH_STATUSES }, dealer: { status: 'APPROVED' } };
    const [rows, total] = await Promise.all([
      this.prisma.replica.vehicle.findMany({ where, select: publicVehicleSelect, orderBy: { publishedAt: 'desc' }, skip, take }),
      this.prisma.replica.vehicle.count({ where }),
    ]);
    return { promotion, vehicles: toPage(rows.map(withAvailability), total, page, pageSize) };
  }

  adminPromotions() {
    return this.prisma.promotion.findMany({ orderBy: { startsAt: 'desc' }, include: { _count: { select: { vehicles: true } } } });
  }

  async createPromotion(dto: PromotionDto) {
    const promotion = await this.prisma.promotion.create({
      data: { ...dto, slug: slugify(dto.title), startsAt: new Date(dto.startsAt), endsAt: dto.endsAt ? new Date(dto.endsAt) : null },
    });
    await this.changed('content.promotion_create', 'promotion', promotion.id, null, promotion);
    return promotion;
  }

  async updatePromotion(id: string, dto: UpdatePromotionDto) {
    const after = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.endsAt ? { endsAt: new Date(dto.endsAt) } : {}),
      },
    });
    await this.changed('content.promotion_update', 'promotion', id, null, after);
    await this.cache.bump(CacheNs.vehicles);
    return after;
  }

  /** Attach listings to a promotion (they then appear in the specials section). */
  async setPromotionVehicles(id: string, vehicleIds: string[]) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion) throw Errors.notFound('Promotion');
    await this.prisma.$transaction([
      this.prisma.vehicle.updateMany({ where: { promotionId: id, id: { notIn: vehicleIds } }, data: { promotionId: null } }),
      this.prisma.vehicle.updateMany({
        where: { id: { in: vehicleIds }, ...(promotion.dealerId ? { dealerId: promotion.dealerId } : {}) },
        data: { promotionId: id, isSpecial: true },
      }),
    ]);
    await this.changed('content.promotion_vehicles', 'promotion', id, null, { vehicleIds });
    await this.cache.bump(CacheNs.vehicles);
    return { promotionId: id, vehicles: vehicleIds.length };
  }

  async deletePromotion(id: string) {
    await this.prisma.$transaction([
      this.prisma.vehicle.updateMany({ where: { promotionId: id }, data: { promotionId: null } }),
      this.prisma.promotion.delete({ where: { id } }),
    ]);
    await this.changed('content.promotion_delete', 'promotion', id, null, null);
    await this.cache.bump(CacheNs.vehicles);
  }
}
