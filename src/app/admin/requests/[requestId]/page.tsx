import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getRequestById, getClassById } from "@/lib/database";
import { RequestDetailClient } from "./RequestDetailClient";

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { requestId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const request = await getRequestById(requestId);

  if (!request) {
    notFound();
  }

  const classData = await getClassById(request.classId);

  const requestInfo = {
    id: request.id,
    fileName: request.fileName,
    fileType: request.fileType,
    size: Number(request.size),
    status: request.status,
    description: request.description,
    requestedAt: request.requestedAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() || null,
    rejectionReason: request.rejectionReason,
    classId: request.classId,
    className:
      (request as { class?: { name?: string } }).class?.name || "Unknown",
    allowedFileTypes: (classData?.allowedFileTypes as string[]) || [],
    userName: (request as { user?: { name?: string } }).user?.name || "Unknown",
    userEmail: (request as { user?: { email?: string } }).user?.email || "",
    respondedByName:
      (request as { respondedBy?: { name?: string } }).respondedBy?.name ||
      null,
    fileId: (request as { file?: { id?: string } }).file?.id || null,
    basedOnFileId: request.basedOnFileId,
    basedOnFileName:
      (request as { basedOnFile?: { originalFileName?: string } }).basedOnFile
        ?.originalFileName || null,
    hasPendingFile: !!request.pendingFileId,
  };

  return <RequestDetailClient request={requestInfo} />;
}
