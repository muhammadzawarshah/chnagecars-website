import { Injectable } from '@nestjs/common';
import { Errors } from '../../common/errors/app-error';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { VehicleStatus } from '../../generated/prisma/client';
import { DealersService } from '../dealers/dealers.service';
import { UpdateDealerProfileDto } from '../dealers/dto/dealer.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateVehicleDto, DealerVehicleQueryDto, UpdateVehicleDto } from '../vehicles/dto/vehicle.dto';
import type { DealerAppContext } from './dealer-app.guard';

@Injectable()
export class DealerAppService {
  constructor(private readonly prisma: PrismaService, private readonly dealers: DealersService, private readonly vehicles: VehiclesService) {}

  async profile(app: DealerAppContext) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id: app.dealerId },
      select: {
        id: true, name: true, slug: true, legalName: true, registrationNumber: true, vatNumber: true,
        dealerLicenceNumber: true, email: true, phone: true, website: true, description: true, logoUrl: true,
        province: true, city: true, address: true, status: true, plan: true, rating: true,
        googleReviewUrl: true, hellopeterReviewUrl: true, createdAt: true, updatedAt: true,
        branches: { orderBy: { name: 'asc' } },
      },
    });
    if (!dealer) throw Errors.notFound('Dealer');
    return dealer;
  }

  async bootstrap(app: DealerAppContext, query: DealerVehicleQueryDto) {
    const [dealer, vehicles] = await Promise.all([this.profile(app), this.inventory(app, query)]);
    return { dealer, vehicles };
  }

  inventory(app: DealerAppContext, query: DealerVehicleQueryDto) {
    return this.vehicles.listForDealer(app, {
      ...query,
      status: query.status?.length ? query.status : Object.values(VehicleStatus).filter(status => status !== VehicleStatus.ARCHIVED),
    });
  }

  async updateProfile(app: DealerAppContext, dto: UpdateDealerProfileDto) {
    await this.dealers.updateProfile(app, dto);
    return this.profile(app);
  }

  async createVehicle(app: DealerAppContext, dto: CreateVehicleDto) {
    await this.ownPromotion(app, dto.promotionId);
    return this.vehicles.create(app, dto);
  }

  async updateVehicle(app: DealerAppContext, id: string, dto: UpdateVehicleDto) {
    // Check the vehicle before resolving any supplied related identity.
    await this.vehicles.getForDealer(app, id);
    await this.ownPromotion(app, dto.promotionId);
    return this.vehicles.update(app, id, dto);
  }

  async removeVehicle(app: DealerAppContext, id: string) {
    const current = await this.vehicles.getForDealer(app, id);
    if (current.status === VehicleStatus.ARCHIVED) return current;
    // Preserve the existing lifecycle, including review withdrawal and reservation release.
    if (current.status === VehicleStatus.PENDING_REVIEW) await this.action(app, id, VehicleStatus.DRAFT, 'withdraw');
    if (current.status === VehicleStatus.RESERVED) await this.action(app, id, VehicleStatus.SUSPENDED, 'suspend');
    return this.action(app, id, VehicleStatus.ARCHIVED, 'archive');
  }

  action(app: DealerAppContext, id: string, status: VehicleStatus, action: string) {
    return this.vehicles.transition(id, status, { type: 'dealer', userId: null, dealer: app }, { action });
  }

  private async ownPromotion(app: DealerAppContext, promotionId?: string) {
    if (!promotionId) return;
    const promotion = await this.prisma.promotion.findFirst({ where: { id: promotionId, OR: [{ dealerId: app.dealerId }, { dealerId: null }] }, select: { id: true } });
    if (!promotion) throw Errors.badRequest('INVALID_PROMOTION', 'Promotion is not available to this dealership');
  }
}
