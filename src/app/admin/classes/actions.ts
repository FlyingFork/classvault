"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import {
  createClass,
  updateClass,
  softDeleteClass,
  restoreClass,
  createAuditLog,
} from "@/lib/database";

export async function createClassAction(formData: {
  name: string;
  description?: string;
  allowedFileTypes: string[];
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  try {
    const newClass = await createClass({
      name: formData.name,
      description: formData.description || undefined,
      allowedFileTypes: formData.allowedFileTypes,
      createdById: session.user.id,
    });

    // Log admin action
    await createAuditLog({
      adminId: session.user.id,
      action: "create_class",
      entityType: "class",
      entityId: newClass.id,
      description: `Created class "${formData.name}"`,
      metadata: {
        className: formData.name,
        allowedFileTypes: formData.allowedFileTypes,
      },
    });

    revalidatePath("/admin/classes");
    return { success: true, classId: newClass.id };
  } catch (error) {
    console.error("Create class error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "A class with this name already exists" };
    }
    return { error: "Failed to create class" };
  }
}

export async function updateClassAction(
  classId: string,
  formData: {
    name: string;
    description?: string;
    allowedFileTypes: string[];
  },
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  try {
    const updatedClass = await updateClass(classId, {
      name: formData.name,
      description: formData.description || undefined,
      allowedFileTypes: formData.allowedFileTypes,
    });

    // Log admin action
    await createAuditLog({
      adminId: session.user.id,
      action: "update_class",
      entityType: "class",
      entityId: classId,
      description: `Updated class "${formData.name}"`,
      metadata: {
        className: formData.name,
        allowedFileTypes: formData.allowedFileTypes,
      },
    });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${classId}`);
    return { success: true };
  } catch (error) {
    console.error("Update class error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "A class with this name already exists" };
    }
    return { error: "Failed to update class" };
  }
}

export async function toggleClassActiveAction(
  classId: string,
  isActive: boolean,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  try {
    let cls;
    if (isActive) {
      cls = await restoreClass(classId);
    } else {
      cls = await softDeleteClass(classId);
    }

    // Log admin action
    await createAuditLog({
      adminId: session.user.id,
      action: isActive ? "restore_class" : "delete_class",
      entityType: "class",
      entityId: classId,
      description: isActive
        ? `Restored class "${cls.name}"`
        : `Archived class "${cls.name}"`,
      metadata: { className: cls.name },
    });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${classId}`);
    return { success: true };
  } catch (error) {
    console.error("Toggle class active error:", error);
    return { error: "Failed to update class status" };
  }
}
