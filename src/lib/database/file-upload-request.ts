/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/prisma";
import {
  Prisma,
  type FileUploadRequest,
  type File,
  type Notification,
} from "@/generated/prisma/client";
import type { PaginationParams } from "./class";
import { NOTIFICATION_EXPIRY_DAYS } from "./notification";

// ============================================================================
// Types
// ============================================================================

export type CreateUploadRequestInput = {
  classId: string;
  userId: string;
  fileName: string;
  fileType: string;
  size: bigint;
  description?: string;
  pendingFileId?: string;
  pendingFileUrl?: string;
};

export type CreateUpdateRequestInput = CreateUploadRequestInput & {
  basedOnFileId: string;
};

export type ApproveRequestInput = {
  requestId: string;
  respondedById: string;
  externalVpsId: string;
  externalVpsUrl: string;
};

export type ApproveRequestResult = {
  request: FileUploadRequest;
  file: File;
  notification: Notification;
};

export type RejectRequestResult = {
  request: FileUploadRequest;
  notification: Notification;
};

// Common includes for request queries
const requestIncludes = {
  class: {
    select: { id: true, name: true, isActive: true, allowedFileTypes: true },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
  respondedBy: {
    select: { id: true, name: true, email: true },
  },
  file: {
    select: { id: true, originalFileName: true, version: true },
  },
  basedOnFile: {
    select: { id: true, originalFileName: true, version: true },
  },
};

// ============================================================================
// FileUploadRequest Methods
// ============================================================================

/**
 * Create a new upload request
 */
export async function createUploadRequest(
  data: CreateUploadRequestInput,
): Promise<FileUploadRequest> {
  try {
    return await prisma.fileUploadRequest.create({
      data: {
        classId: data.classId,
        userId: data.userId,
        fileName: data.fileName,
        fileType: data.fileType,
        size: data.size,
        description: data.description,
        status: "pending",
        pendingFileId: data.pendingFileId,
        pendingFileUrl: data.pendingFileUrl,
      },
      include: requestIncludes,
    });
  } catch (err) {
    // Surface Prisma unique-constraint errors to callers for consistent handling
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err as any).code === "P2002"
    ) {
      throw err;
    }
    throw err;
  }
}

/**
 * Create an update request (for updating an existing file)
 */
export async function createUpdateRequest(
  data: CreateUpdateRequestInput,
): Promise<FileUploadRequest> {
  try {
    return await prisma.fileUploadRequest.create({
      data: {
        classId: data.classId,
        userId: data.userId,
        fileName: data.fileName,
        fileType: data.fileType,
        size: data.size,
        description: data.description,
        status: "pending",
        basedOnFileId: data.basedOnFileId,
        pendingFileId: data.pendingFileId,
        pendingFileUrl: data.pendingFileUrl,
      },
      include: requestIncludes,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err as any).code === "P2002"
    ) {
      throw err;
    }
    throw err;
  }
}

/**
 * Get a request by ID
 */
export async function getRequestById(
  id: string,
): Promise<FileUploadRequest | null> {
  return prisma.fileUploadRequest.findUnique({
    where: { id },
    include: requestIncludes,
  });
}

/**
 * Get all pending requests (admin queue)
 */
export async function getPendingRequests(
  pagination?: PaginationParams,
): Promise<FileUploadRequest[]> {
  return prisma.fileUploadRequest.findMany({
    where: { status: "pending" },
    include: requestIncludes,
    orderBy: { requestedAt: "asc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get pending requests for a specific class
 */
export async function getPendingRequestsForClass(
  classId: string,
  pagination?: PaginationParams,
): Promise<FileUploadRequest[]> {
  return prisma.fileUploadRequest.findMany({
    where: {
      classId,
      status: "pending",
    },
    include: requestIncludes,
    orderBy: { requestedAt: "asc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get all requests by a user
 */
export async function getUserRequests(
  userId: string,
  pagination?: PaginationParams,
): Promise<FileUploadRequest[]> {
  return prisma.fileUploadRequest.findMany({
    where: { userId },
    include: requestIncludes,
    orderBy: { requestedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Approve a file upload request
 * Transaction: Creates file, updates request, creates notification
 */
export async function approveRequest(
  input: ApproveRequestInput,
): Promise<ApproveRequestResult> {
  const request = await prisma.fileUploadRequest.findUnique({
    where: { id: input.requestId },
    include: {
      basedOnFile: true,
      user: { select: { id: true, name: true } },
    },
  });

  if (!request) {
    throw new Error(`Request not found: ${input.requestId}`);
  }

  if (request.status !== "pending") {
    throw new Error(`Request is not pending: ${request.status}`);
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
        externalVpsId: input.externalVpsId,
        externalVpsUrl: input.externalVpsUrl,
        uploadedById: request.userId,
        isApproved: true,
        approvedById: input.respondedById,
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
      where: { id: input.requestId },
      data: {
        status: "approved",
        respondedAt: new Date(),
        respondedById: input.respondedById,
        fileId: file.id,
      },
      include: requestIncludes,
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
      where: { id: input.requestId },
      data: { notificationId: notification.id },
    });

    return { request: updatedRequest, file, notification };
  });

  return result;
}

/**
 * Reject a file upload request
 * Transaction: Updates request, creates notification
 */
export async function rejectRequest(
  requestId: string,
  respondedById: string,
  rejectionReason: string,
): Promise<RejectRequestResult> {
  const request = await prisma.fileUploadRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  if (!request) {
    throw new Error(`Request not found: ${requestId}`);
  }

  if (request.status !== "pending") {
    throw new Error(`Request is not pending: ${request.status}`);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRY_DAYS);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update the request
    const updatedRequest = await tx.fileUploadRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        respondedAt: new Date(),
        respondedById,
        rejectionReason,
      },
      include: requestIncludes,
    });

    // 2. Create notification
    const notification = await tx.notification.create({
      data: {
        userId: request.userId,
        title: `Upload Rejected: ${request.fileName}`,
        description: `Your upload request for "${request.fileName}" was rejected: ${rejectionReason}`,
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

  return result;
}

/**
 * Delete a request (hard delete)
 */
export async function deleteRequest(id: string): Promise<FileUploadRequest> {
  return prisma.fileUploadRequest.delete({
    where: { id },
  });
}

/**
 * Get the pending file ID for a request (for file cleanup)
 */
export async function getRequestPendingFile(
  id: string,
): Promise<{ pendingFileId: string | null; status: string } | null> {
  return prisma.fileUploadRequest.findUnique({
    where: { id },
    select: {
      pendingFileId: true,
      status: true,
    },
  });
}

/**
 * Count pending requests
 */
export async function countPendingRequests(classId?: string): Promise<number> {
  return prisma.fileUploadRequest.count({
    where: {
      status: "pending",
      ...(classId ? { classId } : {}),
    },
  });
}

/**
 * Count user's requests
 */
export async function countUserRequests(userId: string): Promise<number> {
  return prisma.fileUploadRequest.count({
    where: { userId },
  });
}
