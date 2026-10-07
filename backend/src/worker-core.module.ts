import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxProcessor } from './infrastructure/outbox/outbox.processor';

/** Background processing: outbox dispatch + scheduled jobs (@Cron/@Interval in feature modules). */
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [OutboxProcessor],
})
export class WorkerCoreModule {}
