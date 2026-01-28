-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_log_adminId_idx" ON "admin_audit_log"("adminId");

-- CreateIndex
CREATE INDEX "admin_audit_log_action_idx" ON "admin_audit_log"("action");

-- CreateIndex
CREATE INDEX "admin_audit_log_entityType_idx" ON "admin_audit_log"("entityType");

-- CreateIndex
CREATE INDEX "admin_audit_log_performedAt_idx" ON "admin_audit_log"("performedAt");

-- AddForeignKey
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
