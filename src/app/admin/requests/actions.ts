"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { rename, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { NOTIFICATION_EXPIRY_DAYS, createAuditLog } from "@/lib/database";

// Get storage paths
function getPendingStoragePath(): string {
  return path.join(process.cwd(), "storage", "pending");
}

function getApprovedStoragePath(classId: string): string {
  return path.join(process.cwd(), "storage", "approved", classId);
}

export async function approveRequestAction(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  try {
    const request = await prisma.fileUploadRequest.findUnique({
      where: { id: requestId },
      include: {
        basedOnFile: true,
        user: { select: { id: true, name: true } },
      },
    });

    if (!request) {
      return { error: "Request not found" };
    }

    if (request.status !== "pending") {
      return { error: `Request is not pending: ${request.status}` };
    }

    if (!request.pendingFileId) {
      return { error: "No file associated with this request" };
    }

    // Move file from pending to uploads
    const pendingFilePath = path.join(
      getPendingStoragePath(),
      request.pendingFileId,
    );

    if (!existsSync(pendingFilePath)) {
      return { error: "Pending file not found on disk" };
    }

    // Ensure approved storage directory exists
    const approvedDir = getApprovedStoragePath(request.classId);
    if (!existsSync(approvedDir)) {
      await mkdir(approvedDir, { recursive: true });
    }

    const finalFilePath = path.join(approvedDir, request.pendingFileId);
    // Store internal file reference, not a public URL (files served via API only)
    const internalFileRef = `${request.classId}/${request.pendingFileId}`;

    try {
      await rename(pendingFilePath, finalFilePath);
    } catch (moveError) {
      console.error("Failed to move file:", moveError);
      return { error: "Failed to move file to final location" };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRY_DAYS);

    // Determine version number
    const version = request.basedOnFile ? request.basedOnFile.version + 1 : 1;

    // Transaction: create file, update request, create notification
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the file
      const file = await tx.file.create({
        data: {
          classId: request.classId,
          originalFileName: request.fileName,
          fileType: request.fileType,
          size: request.size,
          description: request.description,
          externalVpsId: request.pendingFileId!,
          externalVpsUrl: internalFileRef,
          uploadedById: request.userId,
          isApproved: true,
          approvedById: session.user.id,
          approvedAt: new Date(),
          version,
          parentFileId: request.basedOnFileId,
          isCurrentVersion: true,
        },
      });

      // 2. If this is a version update, mark previous as not current
      if (request.basedOnFileId) {
        await tx.file.update({
          where: { id: request.basedOnFileId },
          data: { isCurrentVersion: false },
        });
      }

      // 3. Update the request
      const updatedRequest = await tx.fileUploadRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          respondedAt: new Date(),
          respondedById: session.user.id,
          fileId: file.id,
        },
      });

      // 4. Create notification
      const notification = await tx.notification.create({
        data: {
          userId: request.userId,
          title: `File Approved: ${request.fileName}`,
          description: `Your upload request for "${request.fileName}" has been approved!`,
          type: "file_approved",
          actionUrl: `/file/${file.id}`,
          actionLabel: "View File",
          expiresAt,
          relatedEntityType: "file",
          relatedEntityId: file.id,
        },
      });

      // 5. Link notification to request
      await tx.fileUploadRequest.update({
        where: { id: requestId },
        data: { notificationId: notification.id },
      });

      return { request: updatedRequest, file, notification };
    });

    // Log admin action
    await createAuditLog({
      adminId: session.user.id,
      action: "approve_request",
      entityType: "request",
      entityId: requestId,
      description: `Approved upload request for "${request.fileName}"`,
      metadata: {
        fileName: request.fileName,
        fileId: result.file.id,
        userId: request.userId,
        classId: request.classId,
      },
    });

    revalidatePath("/admin/requests");
    revalidatePath("/admin");
    return { success: true, fileId: result.file.id };
  } catch (error) {
    console.error("Approve request error:", error);
    return { error: "Failed to approve request" };
  }
}

export async function rejectRequestAction(
  requestId: string,
  rejectionReason: string,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  if (!rejectionReason.trim()) {
    return { error: "Rejection reason is required" };
  }

  try {
    const request = await prisma.fileUploadRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!request) {
      return { error: "Request not found" };
    }

    if (request.status !== "pending") {
      return { error: `Request is not pending: ${request.status}` };
    }

    // Delete pending file if it exists
    if (request.pendingFileId) {
      const pendingFilePath = path.join(
        getPendingStoragePath(),
        request.pendingFileId,
      );
      try {
        await rm(pendingFilePath, { force: true });
      } catch (fileError) {
        // Log but don't fail if file cleanup fails
        console.error("Failed to delete pending file:", fileError);
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRY_DAYS);

    await prisma.$transaction(async (tx) => {
      // 1. Update the request
      const updatedRequest = await tx.fileUploadRequest.update({
        where: { id: requestId },
        data: {
          status: "rejected",
          respondedAt: new Date(),
          respondedById: session.user.id,
          rejectionReason: rejectionReason.trim(),
        },
      });

      // 2. Create notification
      const notification = await tx.notification.create({
        data: {
          userId: request.userId,
          title: `Upload Rejected: ${request.fileName}`,
          description: `Your upload request for "${request.fileName}" was rejected: ${rejectionReason.trim()}`,
          type: "file_rejected",
          actionUrl: `/requests/${requestId}`,
          actionLabel: "View Details",
          expiresAt,
          relatedEntityType: "request",
          relatedEntityId: requestId,
        },
      });

      // 3. Link notification to request
      await tx.fileUploadRequest.update({
        where: { id: requestId },
        data: { notificationId: notification.id },
      });

      return { request: updatedRequest, notification };
    });

    // Log admin action
    await createAuditLog({
      adminId: session.user.id,
      action: "reject_request",
      entityType: "request",
      entityId: requestId,
      description: `Rejected upload request for "${request.fileName}": ${rejectionReason.trim()}`,
      metadata: {
        fileName: request.fileName,
        rejectionReason: rejectionReason.trim(),
        userId: request.userId,
        classId: request.classId,
      },
    });

    revalidatePath("/admin/requests");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Reject request error:", error);
    return { error: "Failed to reject request" };
  }
}
