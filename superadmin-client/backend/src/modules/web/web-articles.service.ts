import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ymd } from './web-format';

/** Same page size as the website (app/lib/articles/api.ts ARTICLES_PAGE_SIZE). */
export const WEB_ARTICLES_PAGE_SIZE = 24;

type WebBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'link'; text: string; href: string };

const articleSelect = {
  slug: true,
  title: true,
  excerpt: true,
  body: true,
  featured: true,
  coverImageUrl: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { slug: true } },
} satisfies Prisma.ArticleSelect;

type ArticleRow = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;

const str = (value: unknown) => (typeof value === 'string' ? value : '');

/**
 * Stored blocks → the four block types the website renders (it never injects raw HTML).
 * Lists become one paragraph per item and quotes become paragraphs.
 */
export function toWebBlocks(body: unknown): WebBlock[] {
  if (!Array.isArray(body)) return typeof body === 'string' && body.trim() ? [{ type: 'paragraph', text: body }] : [];
  return body.flatMap((raw): WebBlock[] => {
    const block = (raw ?? {}) as Record<string, unknown>;
    switch (block.type) {
      case 'heading':
        return str(block.text) ? [{ type: 'heading', text: str(block.text) }] : [];
      case 'image': {
        const src = str(block.src) || str(block.url);
        return src ? [{ type: 'image', src, ...(str(block.alt) || str(block.caption) ? { alt: str(block.alt) || str(block.caption) } : {}) }] : [];
      }
      case 'link':
        return str(block.href) ? [{ type: 'link', text: str(block.text) || str(block.href), href: str(block.href) }] : [];
      case 'list':
        return Array.isArray(block.items) ? block.items.filter((item) => typeof item === 'string' && item.trim()).map((item) => ({ type: 'paragraph' as const, text: `• ${item}` })) : [];
      default: {
        const text = str(block.text);
        return text ? [{ type: 'paragraph', text }] : [];
      }
    }
  });
}

export function toWebArticle(row: ArticleRow) {
  return {
    slug: row.slug,
    title: row.title,
    publishedAt: ymd(row.publishedAt ?? row.createdAt),
    category: row.category?.slug ?? '',
    image: row.coverImageUrl ?? '',
    excerpt: row.excerpt ?? undefined,
    body: toWebBlocks(row.body),
    featured: row.featured,
  };
}

@Injectable()
export class WebArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma.replica;
  }

  private published(extra: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput {
    return { status: ContentStatus.PUBLISHED, publishedAt: { lte: new Date() }, ...extra };
  }

  categories() {
    return this.db.articleCategory.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } });
  }

  async featured() {
    const row = await this.db.article.findFirst({ where: this.published({ featured: true }), select: articleSelect, orderBy: { publishedAt: 'desc' } });
    return row ? toWebArticle(row) : null;
  }

  async latest(limit = 4) {
    const rows = await this.db.article.findMany({
      where: this.published({ featured: false }),
      select: articleSelect,
      orderBy: { publishedAt: 'desc' },
      take: Math.min(Math.max(Math.floor(limit) || 4, 1), 24),
    });
    return rows.map(toWebArticle);
  }

  async get(slug: string) {
    const row = await this.db.article.findFirst({ where: this.published({ slug }), select: articleSelect });
    return row ? toWebArticle(row) : null;
  }

  /** The featured article is shown separately on the news page, so it is left out unless searching. */
  async search(query: { q?: string; category?: string; page?: number }) {
    const q = query.q?.trim().slice(0, 200);
    const where = this.published({
      ...(q || query.category ? {} : { featured: false }),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
    });
    const total = await this.db.article.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / WEB_ARTICLES_PAGE_SIZE));
    const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);
    const rows = await this.db.article.findMany({
      where,
      select: articleSelect,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * WEB_ARTICLES_PAGE_SIZE,
      take: WEB_ARTICLES_PAGE_SIZE,
    });
    return { articles: rows.map(toWebArticle), total, page, pageCount };
  }
}
