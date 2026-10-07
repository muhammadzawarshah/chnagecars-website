import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { CustomersModule } from './customers/customers.module';
import { DealerDashboardModule } from './dealer-dashboard/dealer-dashboard.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { SeoModule } from './seo/seo.module';
import { BiddingModule } from './bidding/bidding.module';
import { CrmModule } from './crm/crm.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { SellingModule } from './selling/selling.module';
import { CatalogueModule } from './catalogue/catalogue.controller';
import { FinanceModule } from './finance/finance.module';
import { SearchModule } from './search/search.service';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DealersModule } from './dealers/dealers.module';
import { HealthModule } from './health/health.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { WebModule } from './web/web.module';

/**
 * Domain modules (brief section 2). Each owns its tables, services and outbox handlers;
 * modules talk through exported services, never through each other's tables directly
 * where a service exists. High-load modules (search, notifications) can later be
 * extracted into their own deployables without changing the others.
 */
export const FEATURE_MODULES = [
  HealthModule,
  AuthModule,
  NotificationsModule,
  DealersModule,
  CatalogueModule,
  SearchModule,
  VehiclesModule,
  FinanceModule,
  CrmModule,
  EnquiriesModule,
  SellingModule,
  BiddingModule,
  CustomersModule,
  ContentModule,
  NewsletterModule,
  DealerDashboardModule,
  AdminModule,
  SeoModule,
  WebModule,
];
