import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { getAllClassesAdmin } from "@/lib/database";
import { FilesListClient } from "./FilesListClient";

interface PageProps {
  searchParams: Promise<{ classId?: string }>;
}

export default async function FilesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  // Get all classes for filter
  const classes = await getAllClassesAdmin();

  // Get all files
  const files = await prisma.file.findMany({
    where: params.classId ? { classId: params.classId } : undefined,
    include: {
      class: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ uploadedAt: "desc" }],
  });

  const classesData = classes.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const filesData = files.map((f) => ({
    id: f.id,
    originalFileName: f.originalFileName,
    fileType: f.fileType,
    size: Number(f.size),
    version: f.version,
    isApproved: f.isApproved,
    isDeleted: f.isDeleted,
    isCurrentVersion: f.isCurrentVersion,
    uploadedAt: f.uploadedAt.toISOString(),
    approvedAt: f.approvedAt?.toISOString() || null,
    classId: f.classId,
    className: f.class?.name || "Unknown",
    uploadedByName: f.uploadedBy?.name || "Unknown",
    approvedByName: f.approvedBy?.name || null,
    externalVpsUrl: f.externalVpsUrl,
  }));

  return (
    <FilesListClient
      files={filesData}
      classes={classesData}
      initialClassFilter={params.classId}
    />
  );
}
