import { getMostAccessedFiles } from "@/lib/database/file-access-log";
import { prisma } from "@/prisma";
import LandingClient from "./LandingClient";

export default async function Home() {
  // Fetch statistics and top files in parallel
  const [topFiles, filesCount, classesCount, studentsCount] = await Promise.all(
    [
      getMostAccessedFiles(3, 30),
      prisma.file.count({
        where: {
          isDeleted: false,
          isApproved: true,
        },
      }),
      prisma.class.count({
        where: {
          isActive: true,
        },
      }),
      prisma.user.count(),
    ],
  );

  // Serialize data for client component
  const serializedTopFiles = topFiles.map((file) => ({
    fileId: file.fileId,
    fileName: file.fileName,
    classId: file.classId,
    className: file.className,
    accessCount: Number(file.accessCount),
  }));

  return (
    <LandingClient
      topFiles={serializedTopFiles}
      stats={{
        filesCount,
        classesCount,
        studentsCount,
      }}
    />
  );
}
