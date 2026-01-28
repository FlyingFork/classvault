"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

type ActionResponse = {
  success?: boolean;
  error?: string;
};

/**
 * Update a user's role (admin or user)
 * Includes protection against self-demotion
 */
export async function updateUserRole(
  userId: string,
  role: "admin" | "user",
): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Prevent admin from demoting themselves
    if (session.user.id === userId && role !== "admin") {
      return { error: "Cannot remove your own admin privileges" };
    }

    // Update the role using Better Auth
    await auth.api.setRole({
      body: {
        userId,
        role,
      },
      headers: await headers(),
    });

    // Revalidate the page to reflect changes
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { error: "An error occurred while updating role" };
  }
}

/**
 * Set a new password for a user
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string,
): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Validate password length
    if (!newPassword || newPassword.length < 8) {
      return { error: "Password must be at least 8 characters long" };
    }

    // Update password using Better Auth
    await auth.api.setUserPassword({
      body: {
        newPassword,
        userId,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user password:", error);
    return { error: "An error occurred while updating password" };
  }
}

/**
 * Ban a user with a reason
 */
export async function banUser(
  userId: string,
  banReason: string,
): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Prevent admin from banning themselves
    if (session.user.id === userId) {
      return { error: "Cannot ban yourself" };
    }

    // Validate ban reason
    if (!banReason || !banReason.trim()) {
      return { error: "Ban reason is required" };
    }

    // Ban user using Better Auth
    await auth.api.banUser({
      body: {
        userId,
        banReason: banReason.trim(),
      },
      headers: await headers(),
    });

    // Revalidate the page to reflect changes
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Error banning user:", error);
    return { error: "An error occurred while banning user" };
  }
}

/**
 * Unban a user
 */
export async function unbanUser(userId: string): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Unban user using Better Auth
    await auth.api.unbanUser({
      body: {
        userId,
      },
      headers: await headers(),
    });

    // Revalidate the page to reflect changes
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Error unbanning user:", error);
    return { error: "An error occurred while unbanning user" };
  }
}
