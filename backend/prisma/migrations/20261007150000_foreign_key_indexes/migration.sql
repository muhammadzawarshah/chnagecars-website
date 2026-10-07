-- CreateIndex
CREATE INDEX "deals_sellRequestId_idx" ON "deals"("sellRequestId");

-- CreateIndex
CREATE INDEX "enquiries_vehicleId_idx" ON "enquiries"("vehicleId");

-- CreateIndex
CREATE INDEX "leads_vehicleId_idx" ON "leads"("vehicleId");

-- CreateIndex
CREATE INDEX "recently_viewed_vehicleId_idx" ON "recently_viewed"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicles_modelId_status_idx" ON "vehicles"("modelId", "status");

