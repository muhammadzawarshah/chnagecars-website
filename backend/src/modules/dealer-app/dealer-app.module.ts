import { Module } from '@nestjs/common';
import { DealersModule } from '../dealers/dealers.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DealerAppController, AdminDealerAppTokensController } from './dealer-app.controller';
import { DealerAppGuard } from './dealer-app.guard';
import { DealerAppTokensService } from './dealer-app-tokens.service';
import { DealerAppService } from './dealer-app.service';

@Module({
  imports: [DealersModule, VehiclesModule],
  controllers: [AdminDealerAppTokensController, DealerAppController],
  providers: [DealerAppTokensService, DealerAppGuard, DealerAppService],
})
export class DealerAppModule {}
