-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'DEALER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "Province" AS ENUM ('EASTERN_CAPE', 'FREE_STATE', 'GAUTENG', 'KWAZULU_NATAL', 'LIMPOPO', 'MPUMALANGA', 'NORTHERN_CAPE', 'NORTH_WEST', 'WESTERN_CAPE');

-- CreateEnum
CREATE TYPE "DealerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DealerPlan" AS ENUM ('BASIC', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "DealerMemberRole" AS ENUM ('OWNER', 'MANAGER', 'SALES', 'STAFF');

-- CreateEnum
CREATE TYPE "DealerMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "DealerPermission" AS ENUM ('DEALER_PROFILE_MANAGE', 'BRANCHES_MANAGE', 'STAFF_MANAGE', 'INVENTORY_VIEW', 'INVENTORY_MANAGE', 'INVENTORY_PUBLISH', 'ENQUIRIES_VIEW', 'ENQUIRIES_RESPOND', 'LEADS_VIEW_ALL', 'LEADS_MANAGE_ALL', 'LEADS_MANAGE_ASSIGNED', 'LEADS_ASSIGN', 'BIDDING_VIEW', 'BIDDING_PARTICIPATE', 'REPORTS_VIEW');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('NEW', 'USED', 'DEMO');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'RESERVED', 'SOLD', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'PLUGIN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER');

-- CreateEnum
CREATE TYPE "Drivetrain" AS ENUM ('FWD', 'RWD', 'AWD', 'FOUR_X_TWO', 'FOUR_X_FOUR');

-- CreateEnum
CREATE TYPE "FeatureAvailability" AS ENUM ('STANDARD', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "EnquiryType" AS ENUM ('VEHICLE', 'QUOTE', 'BEAT_MY_QUOTE', 'TRADE_IN', 'CONCIERGE', 'HELP_ME_FIND', 'FINANCE', 'INSURANCE', 'TEST_DRIVE', 'GENERAL');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'OFFER_SENT', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE_ENQUIRY', 'QUOTE_REQUEST', 'TRADE_IN', 'OFFER_ACCEPTED', 'PHONE', 'WHATSAPP', 'EMAIL', 'WALK_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'MEETING', 'STAGE_CHANGE', 'ASSIGNMENT', 'FOLLOW_UP_SET', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SellRequestType" AS ENUM ('SELL', 'VALUATION');

-- CreateEnum
CREATE TYPE "SellRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VALUED', 'BIDDING', 'OFFER_ACCEPTED', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConditionGrade" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "ValuationMethod" AS ENUM ('AUTOMATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "BiddingStatus" AS ENUM ('SCHEDULED', 'OPEN', 'CLOSED', 'AWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('SUBMITTED', 'PENDING', 'UPDATED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "CounterOfferStatus" AS ENUM ('OPEN', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('NEWS', 'REVIEW', 'ADVICE', 'GUIDE', 'ARTICLE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'PODCAST');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'DEAD');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" UUID NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" UUID,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "registrationNumber" TEXT,
    "vatNumber" TEXT,
    "dealerLicenceNumber" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "province" "Province" NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" "DealerStatus" NOT NULL DEFAULT 'PENDING',
    "plan" "DealerPlan" NOT NULL DEFAULT 'BASIC',
    "biddingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION,
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_documents" (
    "id" UUID NOT NULL,
    "dealerId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "dealerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" "Province" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "operatingHours" JSONB,
    "isHeadOffice" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_members" (
    "id" UUID NOT NULL,
    "dealerId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "branchId" UUID,
    "role" "DealerMemberRole" NOT NULL DEFAULT 'STAFF',
    "status" "DealerMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "extraPermissions" "DealerPermission"[] DEFAULT ARRAY[]::"DealerPermission"[],
    "invitedById" UUID,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "makes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "makes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" UUID NOT NULL,
    "makeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "defaultCategoryId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generations" (
    "id" UUID NOT NULL,
    "modelId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "yearFrom" INTEGER NOT NULL,
    "yearTo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" UUID NOT NULL,
    "modelId" UUID NOT NULL,
    "generationId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "yearFrom" INTEGER NOT NULL,
    "yearTo" INTEGER,
    "bodyCategoryId" UUID,
    "basePrice" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_specifications" (
    "variantId" UUID NOT NULL,
    "engine" TEXT,
    "engineCapacityCc" INTEGER,
    "cylinders" INTEGER,
    "powerKw" INTEGER,
    "torqueNm" INTEGER,
    "transmission" "Transmission",
    "gears" INTEGER,
    "drivetrain" "Drivetrain",
    "fuelType" "FuelType",
    "fuelConsumptionL100" DOUBLE PRECISION,
    "co2GKm" INTEGER,
    "seats" INTEGER,
    "doors" INTEGER,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "wheelbaseMm" INTEGER,
    "bootLitres" INTEGER,
    "kerbWeightKg" INTEGER,
    "fuelTankLitres" INTEGER,
    "topSpeedKmh" INTEGER,
    "zeroTo100Sec" DOUBLE PRECISION,
    "batteryKwh" DOUBLE PRECISION,
    "electricRangeKm" INTEGER,
    "warranty" TEXT,
    "servicePlan" TEXT,
    "safetyRating" TEXT,
    "extra" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_specifications_pkey" PRIMARY KEY ("variantId")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_assignments" (
    "id" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "availability" "FeatureAvailability" NOT NULL DEFAULT 'STANDARD',
    "makeId" UUID,
    "modelId" UUID,
    "generationId" UUID,
    "variantId" UUID,
    "vehicleId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "dealerId" UUID NOT NULL,
    "branchId" UUID,
    "makeId" UUID NOT NULL,
    "modelId" UUID NOT NULL,
    "generationId" UUID,
    "variantId" UUID,
    "stockNumber" TEXT,
    "condition" "VehicleCondition" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "specialPrice" INTEGER,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "promotionId" UUID,
    "transmission" "Transmission" NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "drivetrain" "Drivetrain",
    "colour" TEXT,
    "engineCapacityCc" INTEGER,
    "powerKw" INTEGER,
    "cylinders" INTEGER,
    "seats" INTEGER,
    "doors" INTEGER,
    "vin" TEXT,
    "registrationNumber" TEXT,
    "province" "Province" NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "primaryImageUrl" TEXT,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "enquiryCount" INTEGER NOT NULL DEFAULT 0,
    "favouriteCount" INTEGER NOT NULL DEFAULT 0,
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "reviewNotes" TEXT,
    "reservedUntil" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "reservedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "mediumUrl" TEXT,
    "largeUrl" TEXT,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "altText" TEXT,
    "status" "ImageStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_status_history" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "fromStatus" "VehicleStatus",
    "toStatus" "VehicleStatus" NOT NULL,
    "actorId" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_price_history" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "oldPrice" INTEGER NOT NULL,
    "newPrice" INTEGER NOT NULL,
    "changedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "bannerUrl" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'NONE',
    "discountValue" INTEGER,
    "dealerId" UUID,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favourites" (
    "userId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourites_pkey" PRIMARY KEY ("userId","vehicleId")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastAlertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recently_viewed" (
    "userId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("userId","vehicleId")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "EnquiryType" NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "customerId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "vehicleId" UUID,
    "dealerId" UUID,
    "branchId" UUID,
    "makeId" UUID,
    "modelId" UUID,
    "variantId" UUID,
    "details" JSONB,
    "source" TEXT,
    "consentAt" TIMESTAMP(3),
    "assignedAdminId" UUID,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_responses" (
    "id" UUID NOT NULL,
    "enquiryId" UUID NOT NULL,
    "authorId" UUID,
    "authorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "dealerId" UUID NOT NULL,
    "branchId" UUID,
    "assignedToId" UUID,
    "customerId" UUID,
    "enquiryId" UUID,
    "vehicleId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" "LeadSource" NOT NULL,
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "nextFollowUpAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "actorId" UUID,
    "type" "LeadActivityType" NOT NULL,
    "note" TEXT,
    "fromStage" "LeadStage",
    "toStage" "LeadStage",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sell_requests" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "SellRequestType" NOT NULL,
    "status" "SellRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "customerId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" "Province" NOT NULL,
    "city" TEXT,
    "makeId" UUID,
    "modelId" UUID,
    "variantId" UUID,
    "makeName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "variantName" TEXT,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "condition" "ConditionGrade" NOT NULL,
    "colour" TEXT,
    "transmission" "Transmission",
    "fuelType" "FuelType",
    "registrationNumber" TEXT,
    "vin" TEXT,
    "hasServiceHistory" BOOLEAN,
    "hasAccidentHistory" BOOLEAN,
    "hasOutstandingFinance" BOOLEAN,
    "askingPrice" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sell_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sell_request_images" (
    "id" UUID NOT NULL,
    "sellRequestId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sell_request_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valuations" (
    "id" UUID NOT NULL,
    "sellRequestId" UUID NOT NULL,
    "method" "ValuationMethod" NOT NULL,
    "estimateLow" INTEGER NOT NULL,
    "estimateMid" INTEGER NOT NULL,
    "estimateHigh" INTEGER NOT NULL,
    "comparableCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "valuedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bidding_sessions" (
    "id" UUID NOT NULL,
    "sellRequestId" UUID NOT NULL,
    "status" "BiddingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "allowBidModification" BOOLEAN NOT NULL DEFAULT true,
    "allowBidWithdrawal" BOOLEAN NOT NULL DEFAULT true,
    "allowCounterOffers" BOOLEAN NOT NULL DEFAULT true,
    "offerValidityHours" INTEGER NOT NULL DEFAULT 48,
    "reservePrice" INTEGER,
    "eligibleProvinces" "Province"[] DEFAULT ARRAY[]::"Province"[],
    "acceptedOfferId" UUID,
    "createdById" UUID,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bidding_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bidding_invites" (
    "sessionId" UUID NOT NULL,
    "dealerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bidding_invites_pkey" PRIMARY KEY ("sessionId","dealerId")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "dealerId" UUID NOT NULL,
    "submittedById" UUID,
    "amount" INTEGER NOT NULL,
    "terms" TEXT,
    "dealerNotes" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'SUBMITTED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_revisions" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "terms" TEXT,
    "status" "OfferStatus" NOT NULL,
    "changedById" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counter_offers" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "status" "CounterOfferStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" UUID,
    "respondedById" UUID,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counter_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "sellRequestId" UUID NOT NULL,
    "dealerId" UUID NOT NULL,
    "customerId" UUID,
    "leadId" UUID,
    "amount" INTEGER NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" JSONB NOT NULL,
    "type" "ArticleType" NOT NULL DEFAULT 'ARTICLE',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "categoryId" UUID,
    "coverImageUrl" TEXT,
    "authorId" UUID,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_items" (
    "id" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "embedUrl" TEXT,
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "static_pages" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "static_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "unsubscribeToken" TEXT NOT NULL,
    "source" TEXT,
    "userId" UUID,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 8,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToVehicle" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CategoryToVehicle_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_familyId_idx" ON "sessions"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dealers_slug_key" ON "dealers"("slug");

-- CreateIndex
CREATE INDEX "dealers_status_idx" ON "dealers"("status");

-- CreateIndex
CREATE INDEX "dealers_province_idx" ON "dealers"("province");

-- CreateIndex
CREATE INDEX "dealer_documents_dealerId_idx" ON "dealer_documents"("dealerId");

-- CreateIndex
CREATE INDEX "branches_dealerId_idx" ON "branches"("dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "branches_dealerId_slug_key" ON "branches"("dealerId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_members_userId_key" ON "dealer_members"("userId");

-- CreateIndex
CREATE INDEX "dealer_members_dealerId_idx" ON "dealer_members"("dealerId");

-- CreateIndex
CREATE INDEX "dealer_members_branchId_idx" ON "dealer_members"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "makes_name_key" ON "makes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "makes_slug_key" ON "makes"("slug");

-- CreateIndex
CREATE INDEX "models_makeId_idx" ON "models"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "models_makeId_slug_key" ON "models"("makeId", "slug");

-- CreateIndex
CREATE INDEX "generations_modelId_idx" ON "generations"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "generations_modelId_slug_key" ON "generations"("modelId", "slug");

-- CreateIndex
CREATE INDEX "variants_modelId_idx" ON "variants"("modelId");

-- CreateIndex
CREATE INDEX "variants_generationId_idx" ON "variants"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "variants_modelId_slug_key" ON "variants"("modelId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "features_slug_key" ON "features"("slug");

-- CreateIndex
CREATE INDEX "feature_assignments_featureId_idx" ON "feature_assignments"("featureId");

-- CreateIndex
CREATE INDEX "feature_assignments_makeId_idx" ON "feature_assignments"("makeId");

-- CreateIndex
CREATE INDEX "feature_assignments_modelId_idx" ON "feature_assignments"("modelId");

-- CreateIndex
CREATE INDEX "feature_assignments_generationId_idx" ON "feature_assignments"("generationId");

-- CreateIndex
CREATE INDEX "feature_assignments_variantId_idx" ON "feature_assignments"("variantId");

-- CreateIndex
CREATE INDEX "feature_assignments_vehicleId_idx" ON "feature_assignments"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_slug_key" ON "vehicles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_dealerId_status_idx" ON "vehicles"("dealerId", "status");

-- CreateIndex
CREATE INDEX "vehicles_branchId_idx" ON "vehicles"("branchId");

-- CreateIndex
CREATE INDEX "vehicles_status_publishedAt_idx" ON "vehicles"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "vehicles_status_price_idx" ON "vehicles"("status", "price");

-- CreateIndex
CREATE INDEX "vehicles_status_mileage_idx" ON "vehicles"("status", "mileage");

-- CreateIndex
CREATE INDEX "vehicles_status_year_idx" ON "vehicles"("status", "year");

-- CreateIndex
CREATE INDEX "vehicles_status_popularityScore_idx" ON "vehicles"("status", "popularityScore" DESC);

-- CreateIndex
CREATE INDEX "vehicles_makeId_modelId_status_idx" ON "vehicles"("makeId", "modelId", "status");

-- CreateIndex
CREATE INDEX "vehicles_variantId_idx" ON "vehicles"("variantId");

-- CreateIndex
CREATE INDEX "vehicles_province_status_idx" ON "vehicles"("province", "status");

-- CreateIndex
CREATE INDEX "vehicles_condition_status_idx" ON "vehicles"("condition", "status");

-- CreateIndex
CREATE INDEX "vehicles_fuelType_idx" ON "vehicles"("fuelType");

-- CreateIndex
CREATE INDEX "vehicles_transmission_idx" ON "vehicles"("transmission");

-- CreateIndex
CREATE INDEX "vehicles_promotionId_idx" ON "vehicles"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_dealerId_stockNumber_key" ON "vehicles"("dealerId", "stockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_images_storageKey_key" ON "vehicle_images"("storageKey");

-- CreateIndex
CREATE INDEX "vehicle_images_vehicleId_position_idx" ON "vehicle_images"("vehicleId", "position");

-- CreateIndex
CREATE INDEX "vehicle_status_history_vehicleId_createdAt_idx" ON "vehicle_status_history"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "vehicle_price_history_vehicleId_createdAt_idx" ON "vehicle_price_history"("vehicleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_slug_key" ON "promotions"("slug");

-- CreateIndex
CREATE INDEX "promotions_isActive_startsAt_idx" ON "promotions"("isActive", "startsAt");

-- CreateIndex
CREATE INDEX "favourites_vehicleId_idx" ON "favourites"("vehicleId");

-- CreateIndex
CREATE INDEX "saved_searches_userId_idx" ON "saved_searches"("userId");

-- CreateIndex
CREATE INDEX "saved_searches_alertsEnabled_idx" ON "saved_searches"("alertsEnabled");

-- CreateIndex
CREATE INDEX "recently_viewed_userId_viewedAt_idx" ON "recently_viewed"("userId", "viewedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_reference_key" ON "enquiries"("reference");

-- CreateIndex
CREATE INDEX "enquiries_dealerId_createdAt_idx" ON "enquiries"("dealerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "enquiries_customerId_createdAt_idx" ON "enquiries"("customerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "enquiries_type_status_idx" ON "enquiries"("type", "status");

-- CreateIndex
CREATE INDEX "enquiries_email_idx" ON "enquiries"("email");

-- CreateIndex
CREATE INDEX "enquiry_responses_enquiryId_createdAt_idx" ON "enquiry_responses"("enquiryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "leads_enquiryId_key" ON "leads"("enquiryId");

-- CreateIndex
CREATE INDEX "leads_dealerId_stage_idx" ON "leads"("dealerId", "stage");

-- CreateIndex
CREATE INDEX "leads_dealerId_createdAt_idx" ON "leads"("dealerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "leads_assignedToId_stage_idx" ON "leads"("assignedToId", "stage");

-- CreateIndex
CREATE INDEX "leads_branchId_idx" ON "leads"("branchId");

-- CreateIndex
CREATE INDEX "leads_nextFollowUpAt_idx" ON "leads"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_createdAt_idx" ON "lead_activities"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sell_requests_reference_key" ON "sell_requests"("reference");

-- CreateIndex
CREATE INDEX "sell_requests_customerId_createdAt_idx" ON "sell_requests"("customerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "sell_requests_status_idx" ON "sell_requests"("status");

-- CreateIndex
CREATE INDEX "sell_requests_email_idx" ON "sell_requests"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sell_request_images_storageKey_key" ON "sell_request_images"("storageKey");

-- CreateIndex
CREATE INDEX "sell_request_images_sellRequestId_idx" ON "sell_request_images"("sellRequestId");

-- CreateIndex
CREATE INDEX "valuations_sellRequestId_createdAt_idx" ON "valuations"("sellRequestId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bidding_sessions_acceptedOfferId_key" ON "bidding_sessions"("acceptedOfferId");

-- CreateIndex
CREATE INDEX "bidding_sessions_status_closesAt_idx" ON "bidding_sessions"("status", "closesAt");

-- CreateIndex
CREATE INDEX "bidding_sessions_sellRequestId_idx" ON "bidding_sessions"("sellRequestId");

-- CreateIndex
CREATE INDEX "bidding_invites_dealerId_idx" ON "bidding_invites"("dealerId");

-- CreateIndex
CREATE INDEX "offers_dealerId_status_idx" ON "offers"("dealerId", "status");

-- CreateIndex
CREATE INDEX "offers_status_expiresAt_idx" ON "offers"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "offers_sessionId_dealerId_key" ON "offers"("sessionId", "dealerId");

-- CreateIndex
CREATE INDEX "offer_revisions_offerId_createdAt_idx" ON "offer_revisions"("offerId", "createdAt");

-- CreateIndex
CREATE INDEX "counter_offers_offerId_createdAt_idx" ON "counter_offers"("offerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "deals_offerId_key" ON "deals"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "deals_leadId_key" ON "deals"("leadId");

-- CreateIndex
CREATE INDEX "deals_dealerId_status_idx" ON "deals"("dealerId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_eventType_channel_key" ON "notification_preferences"("userId", "eventType", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "article_categories_name_key" ON "article_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "article_categories_slug_key" ON "article_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_publishedAt_idx" ON "articles"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "articles_categoryId_status_idx" ON "articles"("categoryId", "status");

-- CreateIndex
CREATE INDEX "articles_type_status_idx" ON "articles"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "media_items_slug_key" ON "media_items"("slug");

-- CreateIndex
CREATE INDEX "media_items_type_status_publishedAt_idx" ON "media_items"("type", "status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "faqs_category_sortOrder_idx" ON "faqs"("category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "static_pages_slug_key" ON "static_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribeToken_key" ON "newsletter_subscribers"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "outbox_events_status_availableAt_idx" ON "outbox_events"("status", "availableAt");

-- CreateIndex
CREATE INDEX "outbox_events_aggregateType_aggregateId_idx" ON "outbox_events"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_userId_key_key" ON "idempotency_keys"("userId", "key");

-- CreateIndex
CREATE INDEX "_CategoryToVehicle_B_index" ON "_CategoryToVehicle"("B");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_documents" ADD CONSTRAINT "dealer_documents_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_members" ADD CONSTRAINT "dealer_members_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_members" ADD CONSTRAINT "dealer_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_members" ADD CONSTRAINT "dealer_members_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_defaultCategoryId_fkey" FOREIGN KEY ("defaultCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_bodyCategoryId_fkey" FOREIGN KEY ("bodyCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_specifications" ADD CONSTRAINT "variant_specifications_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_assignments" ADD CONSTRAINT "feature_assignments_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_assignments" ADD CONSTRAINT "feature_assignments_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_assignments" ADD CONSTRAINT "feature_assignments_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_assignments" ADD CONSTRAINT "feature_assignments_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_assignments" ADD CONSTRAINT "feature_assignments_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_assignments" ADD CONSTRAINT "feature_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_price_history" ADD CONSTRAINT "vehicle_price_history_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_responses" ADD CONSTRAINT "enquiry_responses_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "dealer_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_request_images" ADD CONSTRAINT "sell_request_images_sellRequestId_fkey" FOREIGN KEY ("sellRequestId") REFERENCES "sell_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_sellRequestId_fkey" FOREIGN KEY ("sellRequestId") REFERENCES "sell_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bidding_sessions" ADD CONSTRAINT "bidding_sessions_sellRequestId_fkey" FOREIGN KEY ("sellRequestId") REFERENCES "sell_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bidding_invites" ADD CONSTRAINT "bidding_invites_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "bidding_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bidding_invites" ADD CONSTRAINT "bidding_invites_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "bidding_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_revisions" ADD CONSTRAINT "offer_revisions_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counter_offers" ADD CONSTRAINT "counter_offers_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_sellRequestId_fkey" FOREIGN KEY ("sellRequestId") REFERENCES "sell_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "article_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToVehicle" ADD CONSTRAINT "_CategoryToVehicle_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToVehicle" ADD CONSTRAINT "_CategoryToVehicle_B_fkey" FOREIGN KEY ("B") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
