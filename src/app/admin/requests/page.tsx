import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { RequestsListClient } from "./RequestsListClient";

export default async function RequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  // Get all requests
  const requests = await prisma.fileUploadRequest.findMany({
    include: {
      class: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
      respondedBy: { select: { id: true, name: true } },
      file: { select: { id: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  const requestsData = requests.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    fileType: r.fileType,
    size: Number(r.size),
    status: r.status,
    description: r.description,
    requestedAt: r.requestedAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() || null,
    rejectionReason: r.rejectionReason,
    className: r.class?.name || "Unknown",
    classId: r.classId,
    userName: r.user?.name || "Unknown",
    userEmail: r.user?.email || "",
    respondedByName: r.respondedBy?.name || null,
    fileId: r.file?.id || null,
  }));

  return <RequestsListClient requests={requestsData} />;
}
