import { Module } from '@nestjs/common';
import { INFRASTRUCTURE_MODULES } from './core.module';
import { FEATURE_MODULES } from './modules/feature-modules';
import { WorkerCoreModule } from './worker-core.module';

/** Worker process: no HTTP server, runs outbox handlers and scheduled jobs. Scale independently of the API. */
@Module({
  imports: [...INFRASTRUCTURE_MODULES, ...FEATURE_MODULES, WorkerCoreModule],
})
export class WorkerModule {}
