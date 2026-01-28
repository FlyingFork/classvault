-- CreateTable
CREATE TABLE "class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allowedFileTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "externalVpsId" TEXT NOT NULL,
    "externalVpsUrl" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL,
    "parentFileId" TEXT,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_upload_request" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "rejectionReason" TEXT,
    "fileId" TEXT,
    "basedOnFileId" TEXT,
    "notificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_upload_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_access_log" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "file_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_name_key" ON "class"("name");

-- CreateIndex
CREATE INDEX "class_createdById_idx" ON "class"("createdById");

-- CreateIndex
CREATE INDEX "file_classId_idx" ON "file"("classId");

-- CreateIndex
CREATE INDEX "file_uploadedById_idx" ON "file"("uploadedById");

-- CreateIndex
CREATE INDEX "file_approvedById_idx" ON "file"("approvedById");

-- CreateIndex
CREATE INDEX "file_parentFileId_idx" ON "file"("parentFileId");

-- CreateIndex
CREATE UNIQUE INDEX "file_parentFileId_version_key" ON "file"("parentFileId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "file_upload_request_fileId_key" ON "file_upload_request"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "file_upload_request_notificationId_key" ON "file_upload_request"("notificationId");

-- CreateIndex
CREATE INDEX "file_upload_request_classId_idx" ON "file_upload_request"("classId");

-- CreateIndex
CREATE INDEX "file_upload_request_userId_idx" ON "file_upload_request"("userId");

-- CreateIndex
CREATE INDEX "file_upload_request_status_idx" ON "file_upload_request"("status");

-- CreateIndex
CREATE UNIQUE INDEX "file_upload_request_classId_userId_fileName_key" ON "file_upload_request"("classId", "userId", "fileName");

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "notification_createdAt_idx" ON "notification"("createdAt");

-- CreateIndex
CREATE INDEX "notification_expiresAt_idx" ON "notification"("expiresAt");

-- CreateIndex
CREATE INDEX "file_access_log_fileId_idx" ON "file_access_log"("fileId");

-- CreateIndex
CREATE INDEX "file_access_log_userId_idx" ON "file_access_log"("userId");

-- CreateIndex
CREATE INDEX "file_access_log_accessedAt_idx" ON "file_access_log"("accessedAt");

-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_classId_fkey" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_parentFileId_fkey" FOREIGN KEY ("parentFileId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_request" ADD CONSTRAINT "file_upload_request_classId_fkey" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_request" ADD CONSTRAINT "file_upload_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_request" ADD CONSTRAINT "file_upload_request_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_request" ADD CONSTRAINT "file_upload_request_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_request" ADD CONSTRAINT "file_upload_request_basedOnFileId_fkey" FOREIGN KEY ("basedOnFileId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_request" ADD CONSTRAINT "file_upload_request_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_access_log" ADD CONSTRAINT "file_access_log_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_access_log" ADD CONSTRAINT "file_access_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
