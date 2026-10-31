CREATE TABLE "push_devices" (
 "id" UUID NOT NULL, "userId" UUID NOT NULL, "token" TEXT NOT NULL,
 "platform" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "push_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "push_devices_token_key" ON "push_devices"("token");
CREATE INDEX "push_devices_userId_idx" ON "push_devices"("userId");
