-- DropIndex
DROP INDEX "file_upload_request_classId_userId_fileName_status_key";

-- CreateIndex
CREATE INDEX "file_upload_request_classId_userId_fileName_status_idx" ON "file_upload_request"("classId", "userId", "fileName", "status");
