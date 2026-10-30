import { Global, Module } from '@nestjs/common';
import { DealerTradeSyncService } from './dealertrade-sync.service';
import { DealerTradeStockService } from './dealertrade-stock.service';
import { DealerTradeMediaService } from './dealertrade-media.service';

/** Loaded by both API and worker; database locking prevents overlapping imports. */
@Global()
@Module({ providers: [DealerTradeSyncService, DealerTradeStockService, DealerTradeMediaService], exports: [DealerTradeStockService, DealerTradeMediaService] })
export class DealerTradeSyncModule {}
