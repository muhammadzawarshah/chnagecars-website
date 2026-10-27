import { Module } from '@nestjs/common';
import { DealerTradeSyncService } from './dealertrade-sync.service';

/** Loaded by both API and worker; database locking prevents overlapping imports. */
@Module({ providers: [DealerTradeSyncService] })
export class DealerTradeSyncModule {}
