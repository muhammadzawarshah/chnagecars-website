import { Transform } from 'class-transformer';
import { Body, Controller, Get, Module, Param, Patch, Post, Injectable, OnModuleInit } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Roles } from '../../common/decorators/auth.decorators';
import { Errors } from '../../common/errors/app-error';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { UserRole } from '../../generated/prisma/client';
import { GROUP1_APP_ID, GROUP1_APP_NAME, GROUP1_DEALER_IDS, isGroup1Scope } from './group1';
import { MAIN_APP } from './app-context';

class CreateCustomerAppDto {
  @IsString() @Matches(/^[a-z0-9][a-z0-9-]{2,63}$/) id: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(20) @IsString({ each: true }) @Matches(/^\d{1,10}$/, { each: true }) dealerIds: string[];
  @IsString() @MaxLength(2000) resetUrl: string;
}
class AppStatusDto { @IsBoolean() enabled: boolean; }

@ApiTags('Customer apps')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/customer-apps')
export class CustomerAppsController {
  constructor(private readonly db: PrismaService, private readonly audit: AuditService) {}

  @Get()
  list() { return this.db.customerApp.findMany({ orderBy: { name: 'asc' } }); }

  @Post()
  async create(@Body() dto: CreateCustomerAppDto) {
    if (dto.id !== GROUP1_APP_ID) throw Errors.forbidden('GROUP1_ONLY', 'Only the Group1 branded app is enabled');
    if (!isGroup1Scope(dto.dealerIds)) throw Errors.badRequest('GROUP1_BRANCHES_ONLY', 'Use the four configured Group1 branch IDs');
    let reset: URL;
    try { reset = new URL(dto.resetUrl); } catch { throw Errors.badRequest('INVALID_RESET_URL', 'Enter a valid HTTPS reset URL'); }
    if ((reset.protocol !== 'https:' && !(reset.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(reset.hostname))) || reset.username || reset.password || reset.hash) {
      throw Errors.badRequest('INVALID_RESET_URL', 'Use an HTTPS reset URL without credentials or fragment');
    }
    const dealerIds = [...new Set(dto.dealerIds)].sort();
    const count = await this.db.dealer.count({ where: { id: { in: dealerIds }, status: 'APPROVED' } });
    if (count !== dealerIds.length) throw Errors.badRequest('INVALID_DEALERS', 'All dealers must be approved');
    try {
      return await this.db.$transaction(async tx => {
        const app = await tx.customerApp.upsert({ where: { id: GROUP1_APP_ID },
          create: { id: GROUP1_APP_ID, name: GROUP1_APP_NAME, dealerIds, resetUrl: dto.resetUrl },
          update: { name: GROUP1_APP_NAME, dealerIds, resetUrl: dto.resetUrl } });
        await this.audit.record({ action: 'customer_app.create', entityType: 'CustomerApp', entityId: app.id, after: app }, tx);
        return app;
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw Errors.conflict('APP_EXISTS', 'This app ID is already registered');
      throw error;
    }
  }

  @Patch(':id/status')
  async status(@Param('id') id: string, @Body() dto: AppStatusDto) {
    if (id === MAIN_APP) throw Errors.badRequest('MAIN_APP_PROTECTED', 'The main app cannot be disabled');
    if (id !== GROUP1_APP_ID) throw Errors.forbidden('GROUP1_ONLY', 'Only the Group1 branded app is enabled');
    if (!await this.db.customerApp.findUnique({ where: { id } })) throw Errors.notFound('App');
    return this.db.$transaction(async tx => {
      const app = await tx.customerApp.update({ where: { id }, data: dto });
      if (!dto.enabled) await tx.session.updateMany({ where: { user: { appId: id }, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit.record({ action: 'customer_app.status', entityType: 'CustomerApp', entityId: id, after: dto }, tx);
      return app;
    });
  }
}

/** No manual app creation or extra migration is needed after the app-directory migration. */
@Injectable()
export class Group1AppBootstrap implements OnModuleInit {
  constructor(private readonly db: PrismaService) {}
  async onModuleInit() {
    await this.db.customerApp.upsert({
      where: { id: GROUP1_APP_ID },
      create: { id: GROUP1_APP_ID, name: GROUP1_APP_NAME, dealerIds: [...GROUP1_DEALER_IDS] },
      // Keep enabled/resetUrl settings; branch selection and identity are fixed.
      update: { name: GROUP1_APP_NAME, dealerIds: [...GROUP1_DEALER_IDS] },
    });
  }
}

@Module({ controllers: [CustomerAppsController], providers: [Group1AppBootstrap] })
export class CustomerAppsModule {}
