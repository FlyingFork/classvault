import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getClassById } from "@/lib/database";

// 50MB file size limit
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Map file extensions to MIME types
const MIME_TYPE_MAP: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  md: ["text/markdown", "text/plain"],
};

// Get allowed MIME types from file extensions
function getAllowedMimeTypes(allowedExtensions: string[]): string[] {
  const mimeTypes: string[] = [];
  for (const ext of allowedExtensions) {
    const types = MIME_TYPE_MAP[ext.toLowerCase()];
    if (types) {
      mimeTypes.push(...types);
    }
  }
  return mimeTypes;
}

// Generate unique filename with UUID prefix
function generateUniqueFilename(originalName: string): string {
  const uuid = crypto.randomUUID();
  // Sanitize original filename
  const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${uuid}-${sanitized}`;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check - admin only
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const classId = formData.get("classId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!classId) {
      return NextResponse.json(
        { error: "No classId provided" },
        { status: 400 },
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 },
      );
    }

    // Get class to validate allowed file types
    const classData = await getClassById(classId);
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Validate file type against class restrictions
    const allowedFileTypes = (classData.allowedFileTypes as string[]) || [];
    if (allowedFileTypes.length > 0) {
      const allowedMimeTypes = getAllowedMimeTypes(allowedFileTypes);
      if (!allowedMimeTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File type not allowed. Allowed types: ${allowedFileTypes.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    // Create approved storage directory if it doesn't exist (private, not public)
    const approvedDir = path.join(
      process.cwd(),
      "storage",
      "approved",
      classId,
    );
    if (!existsSync(approvedDir)) {
      await mkdir(approvedDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(approvedDir, uniqueFilename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store internal file reference (not a public URL - files served via API only)
    const internalFileRef = `${classId}/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      filePath: filePath,
      internalFileRef: internalFileRef,
      fileName: file.name,
      uniqueFileName: uniqueFilename,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
