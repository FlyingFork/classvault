import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserRequests, countUserRequests } from "@/lib/database";
import { RequestsClient } from "./RequestsClient";

export default async function UserRequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard/requests");
  }

  const [requests, totalCount] = await Promise.all([
    getUserRequests(session.user.id),
    countUserRequests(session.user.id),
  ]);

  // Serialize data for client component
  const serializedRequests = requests.map((request) => ({
    id: request.id,
    fileName: request.fileName,
    fileType: request.fileType,
    size: Number(request.size),
    status: request.status as "pending" | "approved" | "rejected",
    description: request.description,
    requestedAt: request.requestedAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() || null,
    rejectionReason: request.rejectionReason,
    classId: (request as { class?: { id?: string } }).class?.id || "",
    className:
      (request as { class?: { name?: string } }).class?.name || "Unknown",
    fileId: (request as { file?: { id?: string } }).file?.id || null,
    basedOnFileId: request.basedOnFileId,
  }));

  return (
    <RequestsClient requests={serializedRequests} totalCount={totalCount} />
  );
}
