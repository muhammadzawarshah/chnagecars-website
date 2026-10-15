export * from '../../generated/prisma/client';
export { PrismaService } from './prisma.service';
export { DatabaseModule } from './database.module';

import type { Prisma } from '../../generated/prisma/client';
/** A Prisma client usable both inside and outside an interactive transaction. */
export type Db = Prisma.TransactionClient;
