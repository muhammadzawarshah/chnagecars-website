/**
 * Adds the website's blog articles (fixtures/website-blogs.json) to the articles table, so the
 * website and the super admin Blogs screen read them from the database. Articles whose full text
 * exists are published; the rest arrive as drafts (title, date, category and cover photo only)
 * for an editor to complete and publish from the super admin console. Publishing keeps each
 * article's original date.
 *
 * Only missing slugs are created: an article already in the database, possibly edited, is never
 * overwritten, so the script is safe to run again.
 *
 *   npx tsx prisma/import-website-blogs.ts
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

type FixtureBlog = { slug: string; title: string; category: string; image: string; excerpt: string | null; publishedAt: string; status: 'PUBLISHED' | 'DRAFT'; body: object[] };

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const blogs: FixtureBlog[] = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/website-blogs.json'), 'utf8'));

async function main() {
  const categories = new Map((await db.articleCategory.findMany()).map((category) => [category.slug, category.id]));
  const existing = new Set((await db.article.findMany({ where: { slug: { in: blogs.map((blog) => blog.slug) } }, select: { slug: true } })).map((row) => row.slug));
  const missing = blogs.filter((blog) => !existing.has(blog.slug));
  const unknownCategories = [...new Set(missing.map((blog) => blog.category).filter((slug) => !categories.has(slug)))];
  if (unknownCategories.length) throw new Error(`Unknown article categories: ${unknownCategories.join(', ')}`);

  await db.$transaction(missing.map((blog) => db.article.create({
    data: {
      slug: blog.slug,
      title: blog.title,
      excerpt: blog.excerpt,
      body: blog.body,
      status: blog.status,
      coverImageUrl: blog.image,
      publishedAt: new Date(`${blog.publishedAt}T06:00:00Z`),
      categoryId: categories.get(blog.category),
    },
  })));

  const created = (status: FixtureBlog['status']) => missing.filter((blog) => blog.status === status).length;
  console.log({ inFixture: blogs.length, alreadyInDatabase: existing.size, createdPublished: created('PUBLISHED'), createdDrafts: created('DRAFT') });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
