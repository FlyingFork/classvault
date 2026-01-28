import { notFound } from "next/navigation";
import { getClassById, getApprovedFilesForClass } from "@/lib/database";
import { ClassFilesClient } from "./ClassFilesClient";

interface ClassFilesPageProps {
  params: Promise<{ classId: string }>;
}

export async function generateMetadata({ params }: ClassFilesPageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);

  if (!cls) {
    return { title: "Class Not Found | ClassVault" };
  }

  return {
    title: `${cls.name} | ClassVault`,
    description: cls.description || `Browse files in ${cls.name}`,
  };
}

export default async function ClassFilesPage({ params }: ClassFilesPageProps) {
  const { classId } = await params;

  // Get class details
  const cls = await getClassById(classId);

  if (!cls || !cls.isActive) {
    notFound();
  }

  // Get approved files for this class
  const files = await getApprovedFilesForClass(classId);

  // Serialize data for client component
  // Type assertion needed because getApprovedFilesForClass includes relations
  // but the return type is the base File type
  const serializedFiles = files.map((file) => {
    const fileWithRelations = file as typeof file & {
      uploadedBy?: { name: string | null };
    };
    return {
      id: file.id,
      originalFileName: file.originalFileName,
      fileType: file.fileType,
      size: Number(file.size),
      description: file.description,
      version: file.version,
      uploadedAt: file.uploadedAt.toISOString(),
      uploadedByName: fileWithRelations.uploadedBy?.name ?? "Unknown",
    };
  });

  return (
    <ClassFilesClient
      classData={{
        id: cls.id,
        name: cls.name,
        description: cls.description,
      }}
      files={serializedFiles}
    />
  );
}
