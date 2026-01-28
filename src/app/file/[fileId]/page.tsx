import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { getFileVersionHistory, logFileAccess } from "@/lib/database";
import { prisma } from "@/prisma";
import { FileViewClient } from "./FileViewClient";

interface FilePageProps {
  params: Promise<{ fileId: string }>;
}

// Check if a file type is markdown
function isMarkdownFile(fileType: string, fileName: string): boolean {
  const markdownMimeTypes = ["text/markdown", "text/x-markdown"];
  const markdownExtensions = [".md", ".markdown"];

  if (markdownMimeTypes.includes(fileType)) {
    return true;
  }

  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  return markdownExtensions.includes(ext);
}

// Get the storage path for approved files
function getApprovedStoragePath(
  classId: string,
  externalVpsId: string,
): string {
  return path.join(
    process.cwd(),
    "storage",
    "approved",
    classId,
    externalVpsId,
  );
}

export default async function FilePage({ params }: FilePageProps) {
  const { fileId } = await params;

  // Optional authentication - file pages are public for approved files
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "admin";
  const isAuthenticated = !!session?.user;

  // Fetch file with related data
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      class: {
        select: { id: true, name: true, isActive: true },
      },
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!file) {
    notFound();
  }

  // Check if current user is the uploader
  const isUploader = userId === file.uploadedById;

  // Authorization check for non-admins
  if (!isAdmin) {
    // Regular users and anonymous can only access approved, non-deleted, current version files
    if (!file.isApproved || file.isDeleted || !file.isCurrentVersion) {
      notFound(); // Do not reveal existence
    }
  }

  // Check if the file is markdown
  const isMarkdown = isMarkdownFile(file.fileType, file.originalFileName);

  // For non-markdown files, non-admin users are redirected to download immediately
  if (!isMarkdown && !isAdmin) {
    redirect(`/api/files/${fileId}/download`);
  }

  // Check if file exists on disk
  const filePath = getApprovedStoragePath(file.classId, file.externalVpsId);
  const fileExistsOnDisk = existsSync(filePath);

  // Read markdown content if applicable
  let markdownContent: string | null = null;
  if (isMarkdown && fileExistsOnDisk) {
    try {
      const buffer = await readFile(filePath);
      markdownContent = buffer.toString("utf-8");

      // Log file access for markdown view (counts as accessing the file)
      // userId is optional - supports anonymous access logging
      const headersList = await headers();
      await logFileAccess({
        fileId: file.id,
        userId, // May be undefined for anonymous users
        ipAddress: headersList.get("x-forwarded-for") || undefined,
        userAgent: headersList.get("user-agent") || undefined,
      });
    } catch (error) {
      console.error("Failed to read markdown file:", error);
      markdownContent = null;
    }
  }

  // Fetch version history for admins
  let versions: Array<{
    id: string;
    version: number;
    isCurrentVersion: boolean;
    isDeleted: boolean;
    uploadedAt: string;
  }> = [];

  if (isAdmin) {
    const versionHistory = await getFileVersionHistory(fileId);
    versions = versionHistory.map((v) => ({
      id: v.id,
      version: v.version,
      isCurrentVersion: v.isCurrentVersion,
      isDeleted: v.isDeleted,
      uploadedAt: v.uploadedAt.toISOString(),
    }));
  }

  // Prepare file data for client component
  const fileData = {
    id: file.id,
    originalFileName: file.originalFileName,
    fileType: file.fileType,
    size: Number(file.size),
    description: file.description,
    version: file.version,
    isApproved: file.isApproved,
    isDeleted: file.isDeleted,
    isCurrentVersion: file.isCurrentVersion,
    uploadedAt: file.uploadedAt.toISOString(),
    approvedAt: file.approvedAt?.toISOString() || null,
    classId: file.classId,
    className: file.class.name,
    uploadedByName: file.uploadedBy.name,
  };

  return (
    <FileViewClient
      file={fileData}
      versions={versions}
      isAdmin={isAdmin}
      isUploader={isUploader}
      isAuthenticated={isAuthenticated}
      isMarkdown={isMarkdown}
      markdownContent={markdownContent}
      fileExistsOnDisk={fileExistsOnDisk}
    />
  );
}
