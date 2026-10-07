import { PublicCache } from '../../common/interceptors/cache-headers.interceptor';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Module, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CatalogueService } from './catalogue.service';
import {
  AssignFeatureDto,
  CategoryDto,
  CompareQueryDto,
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

@ApiTags('Catalogue')
@Public()
@Controller('catalogue')
@PublicCache(3600)
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get('makes')
  @ApiOperation({ summary: 'All active manufacturers (FR-26)' })
  makes() {
    return this.catalogue.makes();
  }

  @Get('makes/:makeSlug/models')
  @ApiOperation({ summary: 'Models of a manufacturer' })
  models(@Param('makeSlug') makeSlug: string) {
    return this.catalogue.models(makeSlug);
  }

  @Get('makes/:makeSlug/models/:modelSlug')
  @ApiOperation({ summary: 'Model with generations, variants, specs and pricing (FR-06 new-vehicle flow)' })
  model(@Param('makeSlug') makeSlug: string, @Param('modelSlug') modelSlug: string) {
    return this.catalogue.model(makeSlug, modelSlug);
  }

  @Get('variants/compare')
  @ApiOperation({ summary: 'Compare 2-4 catalogue variants side by side (FR-17)' })
  compare(@Query() query: CompareQueryDto) {
    return this.catalogue.compareVariants(query.ids);
  }

  @Get('variants/:id')
  @ApiOperation({ summary: 'Variant with full specification and resolved features (FR-49, FR-50)' })
  variant(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.variant(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Vehicle categories: hatchbacks, SUVs, bakkies, EVs... (FR-25)' })
  categories() {
    return this.catalogue.categories();
  }

  @Get('features')
  features() {
    return this.catalogue.features();
  }
}

@ApiTags('Admin: catalogue')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/catalogue')
export class AdminCatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get('makes')
  listMakes() {
    return this.catalogue.adminListMakes();
  }

  @Post('makes')
  createMake(@Body() dto: CreateMakeDto) {
    return this.catalogue.createMake(dto);
  }

  @Patch('makes/:id')
  updateMake(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMakeDto) {
    return this.catalogue.updateMake(id, dto);
  }

  @Delete('makes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a make (fails with 409 if models or vehicles reference it; deactivate instead)' })
  deleteMake(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.deleteMake(id);
  }

  @Get('makes/:makeId/models')
  listModels(@Param('makeId', ParseUUIDPipe) makeId: string) {
    return this.catalogue.adminListModels(makeId);
  }

  @Post('models')
  createModel(@Body() dto: CreateModelDto) {
    return this.catalogue.createModel(dto);
  }

  @Patch('models/:id')
  updateModel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModelDto) {
    return this.catalogue.updateModel(id, dto);
  }

  @Delete('models/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteModel(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.deleteModel(id);
  }

  @Post('generations')
  createGeneration(@Body() dto: CreateGenerationDto) {
    return this.catalogue.createGeneration(dto);
  }

  @Patch('generations/:id')
  updateGeneration(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGenerationDto) {
    return this.catalogue.updateGeneration(id, dto);
  }

  @Delete('generations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteGeneration(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.deleteGeneration(id);
  }

  @Get('models/:modelId/variants')
  listVariants(@Param('modelId', ParseUUIDPipe) modelId: string) {
    return this.catalogue.adminListVariants(modelId);
  }

  @Post('variants')
  createVariant(@Body() dto: CreateVariantDto) {
    return this.catalogue.createVariant(dto);
  }

  @Patch('variants/:id')
  updateVariant(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVariantDto) {
    return this.catalogue.updateVariant(id, dto);
  }

  @Delete('variants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteVariant(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.deleteVariant(id);
  }

  @Get('categories')
  listCategories() {
    return this.catalogue.adminListCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CategoryDto) {
    return this.catalogue.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogue.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.deleteCategory(id);
  }

  @Post('features')
  createFeature(@Body() dto: FeatureDto) {
    return this.catalogue.createFeature(dto);
  }

  @Patch('features/:id')
  updateFeature(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeatureDto) {
    return this.catalogue.updateFeature(id, dto);
  }

  @Delete('features/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFeature(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.deleteFeature(id);
  }

  @Post('feature-assignments')
  @ApiOperation({ summary: 'Assign a standard/optional feature to a make, model, generation or variant (FR-50)' })
  assignFeature(@Body() dto: AssignFeatureDto) {
    return this.catalogue.assignFeature(dto);
  }

  @Delete('feature-assignments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  unassignFeature(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.unassignFeature(id);
  }
}

@Module({
  controllers: [CatalogueController, AdminCatalogueController],
  providers: [CatalogueService],
  exports: [CatalogueService],
})
export class CatalogueModule {}
