import { Module } from '@nestjs/common';
import { CatalogueModule } from '../catalogue/catalogue.controller';
import { SearchModule } from '../search/search.service';
import { PublicVehiclesService } from './public-vehicles.service';
import { VehicleImagesService } from './vehicle-images.service';
import { AdminVehiclesController, DealerVehiclesController, PublicVehiclesController } from './vehicles.controller';
import { VehicleEventHandlers, VehicleJobs } from './vehicles.events';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [CatalogueModule, SearchModule],
  controllers: [PublicVehiclesController, DealerVehiclesController, AdminVehiclesController],
  providers: [VehiclesService, VehicleImagesService, PublicVehiclesService, VehicleEventHandlers, VehicleJobs],
  exports: [VehiclesService, PublicVehiclesService],
})
export class VehiclesModule {}
