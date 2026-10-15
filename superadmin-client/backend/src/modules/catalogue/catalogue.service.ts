import { Injectable } from '@nestjs/common';
import { FeatureAvailability, Prisma } from '../../generated/prisma/client';
import { Errors } from '../../common/errors/app-error';
import { slugify, splitCsv } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  AssignFeatureDto,
  CategoryDto,
  CreateGenerationDto,
  CreateMakeDto,
  CreateModelDto,
  CreateVariantDto,
  FeatureDto,
  UpdateCategoryDto,
  UpdateFeatureDto,
  UpdateGenerationDto,
  UpdateMakeDto,
  UpdateModelDto,
  UpdateVariantDto,
} from './dto/catalogue.dto';

const CATALOGUE_TTL = 3600;

export interface ResolvedFeature {
  id: string;
  name: string;
  slug: string;
  group: string;
  availability: FeatureAvailability;
  /** Level the feature was inherited from: make | model | generation | variant | vehicle */
  source: string;
}

/**
 * Make → Model → Generation → Year range → Variant → Specification (FR-26, FR-49) and
 * structured features (FR-50). Reference data is read-heavy, so public reads are cached
 * and every admin write bumps the catalogue cache namespace.
 */
@Injectable()
export class CatalogueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  // ───────────── public reads (cached) ─────────────

  async makes() {
    const key = await this.cache.versionedKey(CacheNs.catalogue, 'makes');
    return this.cache.wrap(key, CATALOGUE_TTL, () =>
      this.prisma.replica.make.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true, logoUrl: true, country: true },
      }),
    );
  }

  async models(makeSlug: string) {
    const key = await this.cache.versionedKey(CacheNs.catalogue, `models:${makeSlug}`);
    return this.cache.wrap(key, CATALOGUE_TTL, async () => {
      const make = await this.prisma.replica.make.findFirst({ where: { slug: makeSlug, isActive: true } });
      if (!make) throw Errors.notFound('Make');
      const models = await this.prisma.replica.model.findMany({
        where: { makeId: make.id, isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, defaultCategory: { select: { slug: true, name: true } } },
      });
      return { make: { id: make.id, name: make.name, slug: make.slug }, models };
    });
  }

  async model(makeSlug: string, modelSlug: string) {
    const key = await this.cache.versionedKey(CacheNs.catalogue, `model:${makeSlug}:${modelSlug}`);
    return this.cache.wrap(key, CATALOGUE_TTL, async () => {
      const model = await this.prisma.replica.model.findFirst({
        where: { slug: modelSlug, isActive: true, make: { slug: makeSlug, isActive: true } },
        include: {
          make: { select: { id: true, name: true, slug: true } },
          generations: { orderBy: { yearFrom: 'desc' } },
          variants: {
            where: { isActive: true },
            orderBy: [{ yearFrom: 'desc' }, { name: 'asc' }],
            include: { specification: true, bodyCategory: { select: { slug: true, name: true } } },
          },
        },
      });
      if (!model) throw Errors.notFound('Model');
      return model;
    });
  }

  async variant(id: string) {
    const variant = await this.prisma.replica.variant.findUnique({
      where: { id },
      include: {
        specification: true,
        generation: true,
        bodyCategory: { select: { slug: true, name: true } },
        model: { include: { make: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!variant) throw Errors.notFound('Variant');
    const features = await this.resolveFeatures({
      makeId: variant.model.makeId,
      modelId: variant.modelId,
      generationId: variant.generationId,
      variantId: variant.id,
    });
    return { ...variant, features };
  }

  /** FR-17 compare for catalogue variants (new vehicles). */
  async compareVariants(idsCsv: string) {
    const ids = [...new Set(splitCsv(idsCsv))];
    if (ids.length < 2 || ids.length > 4) throw Errors.badRequest('COMPARE_COUNT', 'Compare between 2 and 4 variants');
    const variants = await Promise.all(ids.map((id) => this.variant(id)));
    return { items: variants };
  }

  async categories() {
    const key = await this.cache.versionedKey(CacheNs.catalogue, 'categories');
    return this.cache.wrap(key, CATALOGUE_TTL, () =>
      this.prisma.replica.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    );
  }

  async features() {
    const key = await this.cache.versionedKey(CacheNs.catalogue, 'features');
    return this.cache.wrap(key, CATALOGUE_TTL, () =>
      this.prisma.replica.feature.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] }),
    );
  }

  /**
   * Features inherited down the hierarchy; the most specific level wins per feature
   * (vehicle > variant > generation > model > make).
   */
  async resolveFeatures(target: {
    makeId?: string | null;
    modelId?: string | null;
    generationId?: string | null;
    variantId?: string | null;
    vehicleId?: string | null;
  }): Promise<ResolvedFeature[]> {
    const or: Prisma.FeatureAssignmentWhereInput[] = [];
    if (target.makeId) or.push({ makeId: target.makeId });
    if (target.modelId) or.push({ modelId: target.modelId });
    if (target.generationId) or.push({ generationId: target.generationId });
    if (target.variantId) or.push({ variantId: target.variantId });
    if (target.vehicleId) or.push({ vehicleId: target.vehicleId });
    if (!or.length) return [];

    const rows = await this.prisma.replica.featureAssignment.findMany({ where: { OR: or }, include: { feature: true } });
    const rank = (row: (typeof rows)[number]) =>
      row.vehicleId ? 5 : row.variantId ? 4 : row.generationId ? 3 : row.modelId ? 2 : 1;
    const levelName = ['', 'make', 'model', 'generation', 'variant', 'vehicle'];
    const best = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const current = best.get(row.featureId);
      if (!current || rank(row) > rank(current)) best.set(row.featureId, row);
    }
    return [...best.values()]
      .map((row) => ({
        id: row.feature.id,
        name: row.feature.name,
        slug: row.feature.slug,
        group: row.feature.group,
        availability: row.availability,
        source: levelName[rank(row)],
      }))
      .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  }

  // ───────────── admin writes (FR-34, FR-35) ─────────────

  private async changed(action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
    await this.audit.record({ action, entityType, entityId, before, after });
    await this.cache.bump(CacheNs.catalogue);
  }

  adminListMakes() {
    return this.prisma.make.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { models: true, vehicles: true } } } });
  }

  async createMake(dto: CreateMakeDto) {
    const make = await this.prisma.make.create({ data: { ...dto, slug: slugify(dto.name) } });
    await this.changed('catalogue.make_create', 'make', make.id, null, make);
    return make;
  }

  async updateMake(id: string, dto: UpdateMakeDto) {
    const before = await this.prisma.make.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Make');
    const after = await this.prisma.make.update({ where: { id }, data: { ...dto, ...(dto.name ? { slug: slugify(dto.name) } : {}) } });
    await this.changed('catalogue.make_update', 'make', id, before, after);
    return after;
  }

  async deleteMake(id: string) {
    const before = await this.prisma.make.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Make');
    await this.prisma.make.delete({ where: { id } });
    await this.changed('catalogue.make_delete', 'make', id, before, null);
  }

  adminListModels(makeId: string) {
    return this.prisma.model.findMany({ where: { makeId }, orderBy: { name: 'asc' }, include: { _count: { select: { variants: true, vehicles: true } } } });
  }

  async createModel(dto: CreateModelDto) {
    const model = await this.prisma.model.create({ data: { ...dto, slug: slugify(dto.name) } });
    await this.changed('catalogue.model_create', 'model', model.id, null, model);
    return model;
  }

  async updateModel(id: string, dto: UpdateModelDto) {
    const before = await this.prisma.model.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Model');
    const after = await this.prisma.model.update({ where: { id }, data: { ...dto, ...(dto.name ? { slug: slugify(dto.name) } : {}) } });
    await this.changed('catalogue.model_update', 'model', id, before, after);
    return after;
  }

  async deleteModel(id: string) {
    const before = await this.prisma.model.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Model');
    await this.prisma.model.delete({ where: { id } });
    await this.changed('catalogue.model_delete', 'model', id, before, null);
  }

  async createGeneration(dto: CreateGenerationDto) {
    this.assertYears(dto.yearFrom, dto.yearTo);
    const generation = await this.prisma.generation.create({ data: { ...dto, slug: slugify(dto.name) } });
    await this.changed('catalogue.generation_create', 'generation', generation.id, null, generation);
    return generation;
  }

  async updateGeneration(id: string, dto: UpdateGenerationDto) {
    const before = await this.prisma.generation.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Generation');
    this.assertYears(dto.yearFrom ?? before.yearFrom, dto.yearTo ?? before.yearTo);
    const after = await this.prisma.generation.update({ where: { id }, data: { ...dto, ...(dto.name ? { slug: slugify(dto.name) } : {}) } });
    await this.changed('catalogue.generation_update', 'generation', id, before, after);
    return after;
  }

  async deleteGeneration(id: string) {
    const before = await this.prisma.generation.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Generation');
    await this.prisma.generation.delete({ where: { id } });
    await this.changed('catalogue.generation_delete', 'generation', id, before, null);
  }

  adminListVariants(modelId: string) {
    return this.prisma.variant.findMany({ where: { modelId }, orderBy: [{ yearFrom: 'desc' }, { name: 'asc' }], include: { specification: true } });
  }

  async createVariant(dto: CreateVariantDto) {
    this.assertYears(dto.yearFrom, dto.yearTo);
    const { specification, ...fields } = dto;
    if (dto.generationId) await this.assertGenerationOfModel(dto.generationId, dto.modelId);
    const variant = await this.prisma.variant.create({
      data: {
        ...fields,
        slug: slugify(`${dto.name}-${dto.yearFrom}`),
        ...(specification ? { specification: { create: this.specData(specification) } } : {}),
      },
      include: { specification: true },
    });
    await this.changed('catalogue.variant_create', 'variant', variant.id, null, variant);
    return variant;
  }

  async updateVariant(id: string, dto: UpdateVariantDto) {
    const before = await this.prisma.variant.findUnique({ where: { id }, include: { specification: true } });
    if (!before) throw Errors.notFound('Variant');
    this.assertYears(dto.yearFrom ?? before.yearFrom, dto.yearTo ?? before.yearTo);
    if (dto.generationId) await this.assertGenerationOfModel(dto.generationId, before.modelId);
    const { specification, ...fields } = dto;
    const after = await this.prisma.variant.update({
      where: { id },
      data: {
        ...fields,
        ...(specification
          ? { specification: { upsert: { create: this.specData(specification), update: this.specData(specification) } } }
          : {}),
      },
      include: { specification: true },
    });
    await this.changed('catalogue.variant_update', 'variant', id, before, after);
    return after;
  }

  async deleteVariant(id: string) {
    const before = await this.prisma.variant.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Variant');
    await this.prisma.variant.delete({ where: { id } });
    await this.changed('catalogue.variant_delete', 'variant', id, before, null);
  }

  private specData(spec: CreateVariantDto['specification']) {
    const { extra, ...rest } = spec ?? {};
    return { ...rest, ...(extra ? { extra: extra as Prisma.InputJsonValue } : {}) };
  }

  private assertYears(from: number, to?: number | null) {
    if (to != null && to < from) throw Errors.badRequest('INVALID_YEAR_RANGE', 'yearTo must be on or after yearFrom');
  }

  private async assertGenerationOfModel(generationId: string, modelId: string) {
    const generation = await this.prisma.generation.findFirst({ where: { id: generationId, modelId } });
    if (!generation) throw Errors.badRequest('GENERATION_MODEL_MISMATCH', 'Generation does not belong to this model');
  }

  adminListCategories() {
    return this.prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  async createCategory(dto: CategoryDto) {
    const category = await this.prisma.category.create({ data: { ...dto, slug: slugify(dto.name) } });
    await this.changed('catalogue.category_create', 'category', category.id, null, category);
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const before = await this.prisma.category.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Category');
    const after = await this.prisma.category.update({ where: { id }, data: { ...dto, ...(dto.name ? { slug: slugify(dto.name) } : {}) } });
    await this.changed('catalogue.category_update', 'category', id, before, after);
    return after;
  }

  async deleteCategory(id: string) {
    const before = await this.prisma.category.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Category');
    await this.prisma.category.delete({ where: { id } });
    await this.changed('catalogue.category_delete', 'category', id, before, null);
  }

  async createFeature(dto: FeatureDto) {
    const feature = await this.prisma.feature.create({ data: { ...dto, slug: slugify(dto.name) } });
    await this.changed('catalogue.feature_create', 'feature', feature.id, null, feature);
    return feature;
  }

  async updateFeature(id: string, dto: UpdateFeatureDto) {
    const before = await this.prisma.feature.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Feature');
    const after = await this.prisma.feature.update({ where: { id }, data: { ...dto, ...(dto.name ? { slug: slugify(dto.name) } : {}) } });
    await this.changed('catalogue.feature_update', 'feature', id, before, after);
    return after;
  }

  async deleteFeature(id: string) {
    const before = await this.prisma.feature.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Feature');
    await this.prisma.feature.delete({ where: { id } });
    await this.changed('catalogue.feature_delete', 'feature', id, before, null);
  }

  async assignFeature(dto: AssignFeatureDto) {
    const column = `${dto.level}Id` as 'makeId' | 'modelId' | 'generationId' | 'variantId';
    const existing = await this.prisma.featureAssignment.findFirst({ where: { featureId: dto.featureId, [column]: dto.targetId } });
    const assignment = existing
      ? await this.prisma.featureAssignment.update({ where: { id: existing.id }, data: { availability: dto.availability } })
      : await this.prisma.featureAssignment.create({ data: { featureId: dto.featureId, availability: dto.availability, [column]: dto.targetId } });
    await this.changed('catalogue.feature_assign', 'feature_assignment', assignment.id, existing, assignment);
    return assignment;
  }

  async unassignFeature(assignmentId: string) {
    const before = await this.prisma.featureAssignment.findUnique({ where: { id: assignmentId } });
    if (!before) throw Errors.notFound('Feature assignment');
    await this.prisma.featureAssignment.delete({ where: { id: assignmentId } });
    await this.changed('catalogue.feature_unassign', 'feature_assignment', assignmentId, before, null);
  }
}
