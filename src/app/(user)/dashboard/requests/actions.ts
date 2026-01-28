"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { rm } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { createUpdateRequest } from "@/lib/database/file-upload-request";

const REQUESTS_PATH = "/dashboard/requests";

type ActionResult = {
  success: boolean;
  error?: string;
  requestId?: string;
};

type SubmitUpdateRequestInput = {
  basedOnFileId: string;
  classId: string;
  fileName: string;
  fileType: string;
  size: number;
  description?: string | null;
  pendingFileId?: string;
  pendingFileUrl?: string;
};

/**
 * Submit an update request for an existing file (creates a new version request)
 */
export async function submitUpdateRequest(
  input: SubmitUpdateRequestInput,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const basedOnFileId = input.basedOnFileId?.trim();
  const classId = input.classId?.trim();
  const fileName = input.fileName?.trim();
  const fileType = input.fileType?.trim().toLowerCase();
  const description = input.description?.trim() || undefined;
  const sizeNumber = Number(input.size);

  if (!basedOnFileId) {
    return { success: false, error: "Original file reference is required" };
  }

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

  // Verify the original file exists, is approved, and belongs to the user
  const originalFile = await prisma.file.findUnique({
    where: { id: basedOnFileId },
    select: {
      id: true,
      uploadedById: true,
      isApproved: true,
      classId: true,
      class: {
        select: {
          isActive: true,
          allowedFileTypes: true,
        },
      },
    },
  });

  if (!originalFile) {
    return { success: false, error: "Original file not found" };
  }

  if (originalFile.uploadedById !== session.user.id) {
    return {
      success: false,
      error: "You can only update files you uploaded",
    };
  }

  if (!originalFile.isApproved) {
    return {
      success: false,
      error: "Cannot update a file that is not approved",
    };
  }

  if (!originalFile.class?.isActive) {
    return { success: false, error: "Selected class is not available" };
  }

  // Validate file type against class restrictions
  const allowedTypes = (originalFile.class.allowedFileTypes || []).map((type) =>
    type.toLowerCase(),
  );

  if (allowedTypes.length > 0 && !allowedTypes.includes(fileType)) {
    return { success: false, error: "File type is not allowed for this class" };
  }

  // Check for existing pending update request
  const existingPending = await prisma.fileUploadRequest.findFirst({
    where: {
      userId: session.user.id,
      basedOnFileId,
      status: "pending",
    },
    select: { id: true },
  });

  if (existingPending) {
    return {
      success: false,
      error: "You already have a pending update request for this file",
    };
  }

  try {
    const request = await createUpdateRequest({
      classId,
      userId: session.user.id,
      fileName,
      fileType,
      size: BigInt(Math.round(sizeNumber)),
      description,
      basedOnFileId,
      pendingFileId: input.pendingFileId,
      pendingFileUrl: input.pendingFileUrl,
    });

    revalidatePath(REQUESTS_PATH);
    revalidatePath(`/dashboard/requests/${request.id}`);
    return { success: true, requestId: request.id };
  } catch (error) {
    console.error("submitUpdateRequest error", error);

    // Clean up pending file if request creation failed
    if (input.pendingFileId) {
      try {
        const pendingFilePath = path.join(
          process.cwd(),
          "storage",
          "pending",
          input.pendingFileId,
        );
        await rm(pendingFilePath, { force: true });
      } catch (fileError) {
        console.error("Failed to clean up pending file:", fileError);
      }
    }

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("unique constraint")
    ) {
      return {
        success: false,
        error: "You already have a pending request for this file",
      };
    }
    return { success: false, error: "Failed to submit update request" };
  }
}
