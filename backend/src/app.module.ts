import { Module } from '@nestjs/common';
import { HttpCoreModule, INFRASTRUCTURE_MODULES } from './core.module';
import { FEATURE_MODULES } from './modules/feature-modules';
import { WorkerCoreModule } from './worker-core.module';

const runWorkerInApi = ['true', '1'].includes(process.env.RUN_WORKER_IN_API ?? '');

/** HTTP API process. Stateless: every instance can serve any request (brief section 4). */
@Module({
  imports: [...INFRASTRUCTURE_MODULES, HttpCoreModule, ...FEATURE_MODULES, ...(runWorkerInApi ? [WorkerCoreModule] : [])],
})
export class AppModule {}
