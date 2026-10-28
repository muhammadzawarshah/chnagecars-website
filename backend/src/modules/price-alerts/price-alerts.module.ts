import { Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { CurrentUser, OptionalAuth } from '../../common/decorators/auth.decorators';
import { Errors } from '../../common/errors/app-error';
import { IsMarketplaceId } from '../../common/pipes/marketplace-id.pipe';
import type { AuthUser } from '../../common/types/auth-user';
import { normalizeEmail } from '../../common/utils/strings';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PHONE_RULE } from '../auth/dto/auth.dto';
import { acceptsEnquiries } from '../vehicles/vehicle-lifecycle';
import { effectivePrice } from '../vehicles/vehicle.presenter';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
/** The app sends an empty string when the optional WhatsApp field is left blank. */
const optionalText = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || undefined : value);

export class CreatePriceAlertDto {
  @ApiProperty({ example: '1575860' }) @IsMarketplaceId() vehicleId: string;
  @ApiProperty({ example: 'Thabo Nkosi' }) @Transform(trim) @IsString() @Length(2, 160) name: string;
  @ApiProperty({ example: 'thabo@example.com' }) @Transform(trim) @IsEmail() @MaxLength(254) email: string;
  @ApiPropertyOptional({ example: '+27 82 123 4567' })
  @IsOptional() @Transform(optionalText) @Matches(PHONE_RULE, { message: 'whatsappNumber must be a valid phone number' })
  whatsappNumber?: string;
}

/** Stores price-drop alert sign-ups. Sending the alerts is not built yet. */
@Injectable()
export class PriceAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePriceAlertDto, userId?: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      select: { id: true, status: true, price: true, specialPrice: true, isSpecial: true, dealer: { select: { status: true } } },
    });
    if (!vehicle || vehicle.dealer.status !== 'APPROVED') throw Errors.notFound('Vehicle');
    if (!acceptsEnquiries(vehicle.status)) throw Errors.conflict('VEHICLE_NOT_AVAILABLE', 'This vehicle is no longer available');
    const email = normalizeEmail(dto.email);
    const key = { vehicleId_email: { vehicleId: vehicle.id, email } };
    const existing = await this.prisma.priceAlert.findUnique({ where: key, select: { id: true } });
    // Signing up again keeps the original sign-up price, so a later drop is measured from the first sign-up.
    const alert = await this.prisma.priceAlert.upsert({
      where: key,
      update: { name: dto.name, whatsappNumber: dto.whatsappNumber ?? null, ...(userId ? { userId } : {}) },
      create: { vehicleId: vehicle.id, email, name: dto.name, whatsappNumber: dto.whatsappNumber ?? null, priceAtSignup: effectivePrice(vehicle), userId: userId ?? null },
    });
    return { id: alert.id, vehicleId: alert.vehicleId, priceAtSignup: alert.priceAtSignup, createdAt: alert.createdAt, duplicate: !!existing };
  }
}

@ApiTags('Price alerts')
@Controller('price-alerts')
export class PriceAlertsController {
  constructor(private readonly alerts: PriceAlertsService) {}

  @OptionalAuth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  @ApiOperation({ summary: "Track this vehicle's price: store a price-drop alert sign-up (name, email, optional WhatsApp)" })
  create(@Body() dto: CreatePriceAlertDto, @CurrentUser() user?: AuthUser) {
    return this.alerts.create(dto, user?.id);
  }
}

@Module({ controllers: [PriceAlertsController], providers: [PriceAlertsService] })
export class PriceAlertsModule {}
