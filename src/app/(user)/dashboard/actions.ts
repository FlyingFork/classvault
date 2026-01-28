"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { rm } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { createUploadRequest } from "@/lib/database/file-upload-request";
import { markAllAsRead, markAsRead } from "@/lib/database/notification";

const DASHBOARD_PATH = "/dashboard";

type SubmitUploadRequestInput = {
  classId: string;
  fileName: string;
  fileType: string;
  size: number;
  description?: string | null;
};

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function submitUploadRequest(
  input: SubmitUploadRequestInput,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const classId = input.classId?.trim();
  const fileName = input.fileName?.trim();
  const fileType = input.fileType?.trim().toLowerCase();
  const description = input.description?.trim() || undefined;
  const sizeNumber = Number(input.size);

  if (!classId) {
    return { success: false, error: "Class is required" };
  }

  if (!fileName) {
    return { success: false, error: "File name is required" };
  }

  if (!fileType) {
    return { success: false, error: "File type is required" };
  }

  if (!Number.isFinite(sizeNumber) || sizeNumber <= 0) {
    return { success: false, error: "File size must be greater than zero" };
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      isActive: true,
      allowedFileTypes: true,
    },
  });

  if (!targetClass || !targetClass.isActive) {
    return { success: false, error: "Selected class is not available" };
  }

  const allowedTypes = targetClass.allowedFileTypes.map((type) =>
    type.toLowerCase(),
  );

  if (allowedTypes.length > 0 && !allowedTypes.includes(fileType)) {
    return { success: false, error: "File type is not allowed for this class" };
  }

  const existingPending = await prisma.fileUploadRequest.findFirst({
    where: {
      userId: session.user.id,
      classId,
      fileName,
      status: "pending",
    },
    select: { id: true },
  });

  if (existingPending) {
    return {
      success: false,
      error: "You already have a pending request for this file in this class",
    };
  }

  try {
    await createUploadRequest({
      classId,
      userId: session.user.id,
      fileName,
      fileType,
      size: BigInt(Math.round(sizeNumber)),
      description,
    });

    revalidatePath(DASHBOARD_PATH);
    return { success: true };
  } catch (error) {
    console.error("submitUploadRequest error", error);
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("unique constraint")
    ) {
      return {
        success: false,
        error: "You already have a pending request for this file in this class",
      };
    }
    return { success: false, error: "Failed to submit upload request" };
  }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<ActionResult> {
  if (!notificationId) {
    return { success: false, error: "Notification ID is required" };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true, isRead: true },
  });

  if (!notification || notification.userId !== session.user.id) {
    return { success: false, error: "Notification not found" };
  }

  if (!notification.isRead) {
    await markAsRead(notificationId);
    revalidatePath(DASHBOARD_PATH);
  }

  return { success: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await markAllAsRead(session.user.id);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

/**
 * Cancel a pending upload request
 * Deletes the pending file from storage and removes the request from the database
 */
export async function cancelUploadRequest(
  requestId: string,
): Promise<ActionResult> {
  if (!requestId) {
    return { success: false, error: "Request ID is required" };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get the request to verify ownership and get pending file info
  const request = await prisma.fileUploadRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      status: true,
      pendingFileId: true,
    },
  });

  if (!request) {
    return { success: false, error: "Request not found" };
  }

  // Users can only cancel their own requests
  if (request.userId !== session.user.id) {
    return { success: false, error: "Not authorized to cancel this request" };
  }

  // Can only cancel pending requests
  if (request.status !== "pending") {
    return { success: false, error: "Only pending requests can be cancelled" };
  }

  try {
    // Delete the pending file if it exists
    if (request.pendingFileId) {
      const pendingFilePath = path.join(
        process.cwd(),
        "storage",
        "pending",
        request.pendingFileId,
      );
      try {
        await rm(pendingFilePath, { force: true });
      } catch (fileError) {
        // Log but don't fail if file cleanup fails
        console.error("Failed to delete pending file:", fileError);
      }
    }

    // Delete the request from the database
    await prisma.fileUploadRequest.delete({
      where: { id: requestId },
    });

    revalidatePath(DASHBOARD_PATH);
    return { success: true };
  } catch (error) {
    console.error("cancelUploadRequest error:", error);
    return { success: false, error: "Failed to cancel request" };
  }
}
