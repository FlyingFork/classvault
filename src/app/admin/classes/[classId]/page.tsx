import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getClassById, getAllFilesForClassAdmin } from "@/lib/database";
import { EditClassClient } from "./EditClassClient";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function EditClassPage({ params }: PageProps) {
  const { classId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const classData = await getClassById(classId);

  if (!classData) {
    notFound();
  }

  const files = await getAllFilesForClassAdmin(classId, { take: 10 });

  const classInfo = {
    id: classData.id,
    name: classData.name,
    description: classData.description,
    allowedFileTypes: classData.allowedFileTypes as string[],
    isActive: classData.isActive,
    createdAt: classData.createdAt.toISOString(),
  };

  const filesInfo = files.map((f) => ({
    id: f.id,
    originalFileName: f.originalFileName,
    version: f.version,
    isApproved: f.isApproved,
    isDeleted: f.isDeleted,
    uploadedAt: f.uploadedAt.toISOString(),
    uploadedByName:
      (f as { uploadedBy?: { name?: string } }).uploadedBy?.name || "Unknown",
  }));

  return <EditClassClient classData={classInfo} files={filesInfo} />;
}
