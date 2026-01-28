/*
  Warnings:

  - A unique constraint covering the columns `[classId,userId,fileName,status]` on the table `file_upload_request` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "file_upload_request_classId_userId_fileName_key";

-- CreateIndex
CREATE UNIQUE INDEX "file_upload_request_classId_userId_fileName_status_key" ON "file_upload_request"("classId", "userId", "fileName", "status");
