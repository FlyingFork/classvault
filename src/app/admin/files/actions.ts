"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import {
  softDeleteFile,
  setCurrentVersion,
  renameFile,
  createAuditLog,
} from "@/lib/database";
import { prisma } from "@/prisma";

export async function softDeleteFileAction(fileId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  try {
    const file = await softDeleteFile(fileId, session.user.id);

    // Log admin action
    await createAuditLog({
      adminId: session.user.id,
      action: "delete_file",
      entityType: "file",
      entityId: fileId,
      description: `Deleted file "${file.originalFileName}"`,
      metadata: { fileName: file.originalFileName, classId: file.classId },
    });

    revalidatePath("/admin/files");
    revalidatePath(`/admin/files/${fileId}`);
    return { success: true };
  } catch (error) {
    console.error("Soft delete file error:", error);
    return { error: "Failed to delete file" };
  }
}

export async function restoreFileAction(fileId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  try {
    const file = await prisma.file.update({
      where: { id: fileId },
      data: {
        isDeleted: false,
        deletedById: null,
        deletedAt: null,
      },
    });

    // Log admin action
    await createAuditLog({
      adminId: session.user.id,
      action: "restore_file",
      entityType: "file",
      entityId: fileId,
      description: `Restored file "${file.originalFileName}"`,
      metadata: { fileName: file.originalFileName, classId: file.classId },
    });

    revalidatePath("/admin/files");
    revalidatePath(`/admin/files/${fileId}`);
    return { success: true };
  } catch (error) {
    console.error("Restore file error:", error);
    return { error: "Failed to restore file" };
  }
}

export async function setCurrentVersionAction(
  fileId: string,
  isCurrent: boolean,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  try {
    await setCurrentVersion(fileId, isCurrent);

    revalidatePath("/admin/files");
    revalidatePath(`/admin/files/${fileId}`);
    return { success: true };
  } catch (error) {
    console.error("Set current version error:", error);
    return { error: "Failed to update version status" };
  }
}

export async function renameFileAction(fileId: string, newFileName: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  if (!newFileName.trim()) {
    return { error: "File name cannot be empty" };
  }

  try {
    // Get old name for audit log
    const oldFile = await prisma.file.findUnique({
      where: { id: fileId },
      select: { originalFileName: true, classId: true },
    });

    const file = await renameFile(fileId, newFileName.trim());

    // Log admin action
    await createAuditLog({
      adminId: session.user.id,
      action: "rename_file",
      entityType: "file",
      entityId: fileId,
      description: `Renamed file from "${oldFile?.originalFileName}" to "${newFileName.trim()}"`,
      metadata: {
        oldFileName: oldFile?.originalFileName,
        newFileName: newFileName.trim(),
        classId: file.classId,
      },
    });

    revalidatePath("/admin/files");
    revalidatePath(`/admin/files/${fileId}`);
    revalidatePath(`/file/${fileId}`);
    return { success: true };
  } catch (error) {
    console.error("Rename file error:", error);
    return { error: "Failed to rename file" };
  }
}
