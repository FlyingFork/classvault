import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getFileVersionHistory, getFileWithAccessLogs } from "@/lib/database";
import { FileDetailClient } from "./FileDetailClient";

interface PageProps {
  params: Promise<{ fileId: string }>;
}

export default async function FileDetailPage({ params }: PageProps) {
  const { fileId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const file = await getFileWithAccessLogs(fileId, { take: 20 });

  if (!file) {
    notFound();
  }

  const versionHistory = await getFileVersionHistory(fileId);

  const fileInfo = {
    id: file.id,
    originalFileName: file.originalFileName,
    fileType: file.fileType,
    size: Number(file.size),
    description: file.description,
    version: file.version,
    isApproved: file.isApproved,
    isDeleted: file.isDeleted,
    isCurrentVersion: file.isCurrentVersion,
    externalVpsUrl: file.externalVpsUrl,
    uploadedAt: file.uploadedAt.toISOString(),
    approvedAt: file.approvedAt?.toISOString() || null,
    deletedAt: file.deletedAt?.toISOString() || null,
    classId: file.classId,
    className: (file as { class?: { name?: string } }).class?.name || "Unknown",
    uploadedByName:
      (file as { uploadedBy?: { name?: string } }).uploadedBy?.name ||
      "Unknown",
    approvedByName:
      (file as { approvedBy?: { name?: string } }).approvedBy?.name || null,
    deletedByName:
      (file as { deletedBy?: { name?: string } }).deletedBy?.name || null,
  };

  const versionsInfo = versionHistory.map((v) => ({
    id: v.id,
    version: v.version,
    isCurrentVersion: v.isCurrentVersion,
    isDeleted: v.isDeleted,
    uploadedAt: v.uploadedAt.toISOString(),
    uploadedByName:
      (v as { uploadedBy?: { name?: string } }).uploadedBy?.name || "Unknown",
  }));

  const accessLogsInfo = (
    (
      file as {
        accessLogs?: Array<{
          id: string;
          accessedAt: Date;
          ipAddress: string | null;
          userAgent: string | null;
          user?: { name?: string; email?: string };
        }>;
      }
    ).accessLogs || []
  ).map((log) => ({
    id: log.id,
    accessedAt: log.accessedAt.toISOString(),
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    userName: log.user?.name || "Unknown",
    userEmail: log.user?.email || "",
  }));

  return (
    <FileDetailClient
      file={fileInfo}
      versions={versionsInfo}
      accessLogs={accessLogsInfo}
    />
  );
}
