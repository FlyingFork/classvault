import { getAllClasses, countFilesInClass } from "@/lib/database";
import { BrowseClient } from "./BrowseClient";

export const metadata = {
  title: "Browse Classes | ClassVault",
  description: "Browse available classes and files",
};

export default async function BrowsePage() {
  // Get all active classes
  const classes = await getAllClasses();

  // Get file counts for each class
  const classesWithCounts = await Promise.all(
    classes.map(async (cls) => {
      const fileCount = await countFilesInClass(cls.id, true);
      return {
        id: cls.id,
        name: cls.name,
        description: cls.description,
        fileCount,
      };
    }),
  );

  return <BrowseClient classes={classesWithCounts} />;
}
