import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllClassesAdmin } from "@/lib/database";
import { prisma } from "@/prisma";
import { ClassesListClient } from "./ClassesListClient";

export default async function ClassesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  // Get all classes with file counts
  const classes = await getAllClassesAdmin();

  // Get file counts for each class
  const fileCounts = await prisma.file.groupBy({
    by: ["classId"],
    where: {
      isApproved: true,
      isDeleted: false,
      isCurrentVersion: true,
    },
    _count: { id: true },
  });

  const fileCountMap = new Map(
    fileCounts.map((fc) => [fc.classId, fc._count.id]),
  );

  const classesWithCounts = classes.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    allowedFileTypes: c.allowedFileTypes as string[],
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    fileCount: fileCountMap.get(c.id) || 0,
    createdByName:
      (c as { createdBy?: { name?: string } }).createdBy?.name || "Unknown",
  }));

  return <ClassesListClient classes={classesWithCounts} />;
}
