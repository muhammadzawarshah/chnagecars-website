CREATE TABLE "customer_documents" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "customer_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "customer_documents_type_check" CHECK ("type" IN ('DRIVING_LICENSE','VEHICLE_REGISTRATION','INSURANCE','WARRANTY','FINES','SERVICE_REPAIRS')),
  CONSTRAINT "customer_documents_status_check" CHECK ("status" IN ('PENDING','UPLOADED','SUBMITTED')),
  CONSTRAINT "customer_documents_size_check" CHECK ("size" > 0 AND "size" <= 15728640)
);
CREATE UNIQUE INDEX "customer_documents_storageKey_key" ON "customer_documents"("storageKey");
CREATE INDEX "customer_documents_userId_type_idx" ON "customer_documents"("userId", "type");
