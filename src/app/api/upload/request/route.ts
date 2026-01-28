import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getClassById } from "@/lib/database";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";

// 50MB file size limit
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Map file extensions to MIME types for validation
const EXTENSION_TO_MIME: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  md: ["text/markdown", "text/plain"],
  txt: ["text/plain"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
};

// Get allowed MIME types from file extensions
function getAllowedMimeTypes(allowedExtensions: string[]): string[] {
  const mimeTypes: string[] = [];
  for (const ext of allowedExtensions) {
    const types = EXTENSION_TO_MIME[ext.toLowerCase()];
    if (types) {
      mimeTypes.push(...types);
    }
  }
  return mimeTypes;
}

// Get file extension from MIME type
function getExtensionFromMime(mimeType: string): string | null {
  for (const [ext, mimes] of Object.entries(EXTENSION_TO_MIME)) {
    if (mimes.includes(mimeType)) {
      return ext;
    }
  }
  return null;
}

// Get file extension from filename
function getExtensionFromFilename(filename: string): string | null {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filename.length - 1) return null;
  return filename.slice(lastDot + 1).toLowerCase();
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Generate unique filename with UUID prefix
function generateUniqueFilename(originalName: string): string {
  const uuid = crypto.randomUUID();
  const sanitized = sanitizeFilename(originalName);
  return `${uuid}-${sanitized}`;
}

// Get storage path for pending files (outside public/)
function getPendingStoragePath(): string {
  return path.join(process.cwd(), "storage", "pending");
}

export async function POST(request: NextRequest) {
  try {
    // Auth check - any authenticated user can upload
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const classId = formData.get("classId") as string | null;
    const description = (formData.get("description") as string | null)?.trim();
    // Optional: for update requests, links to the file being updated
    const basedOnFileId =
      (formData.get("basedOnFileId") as string | null)?.trim() || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!classId) {
      return NextResponse.json(
        { error: "No classId provided" },
        { status: 400 },
      );
    }

    // Derive metadata from file (server-side, never trust client)
    const fileName = file.name;
    // Handle empty MIME type (common for .md files) by deriving from extension
    let fileType = file.type;
    if (!fileType || !fileType.trim()) {
      const ext = getExtensionFromFilename(fileName);
      if (ext) {
        const mimes = EXTENSION_TO_MIME[ext];
        fileType = mimes && mimes.length > 0 ? mimes[0] : `application/${ext}`;
      } else {
        fileType = "application/octet-stream";
      }
    }
    const size = file.size;

    // Check file size
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 },
      );
    }

    if (size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // Get class to validate allowed file types
    const classData = await getClassById(classId);
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!classData.isActive) {
      return NextResponse.json(
        { error: "Class is not active" },
        { status: 400 },
      );
    }

    // Validate file type against class restrictions
    const allowedFileTypes = (classData.allowedFileTypes as string[]) || [];
    if (allowedFileTypes.length > 0) {
      const allowedMimeTypes = getAllowedMimeTypes(allowedFileTypes);
      const fileExtFromMime = getExtensionFromMime(fileType);
      const fileExtFromName = getExtensionFromFilename(fileName);

      // Check MIME type, extension from MIME, and extension from filename
      const mimeAllowed = allowedMimeTypes.includes(fileType);
      const extFromMimeAllowed =
        fileExtFromMime &&
        allowedFileTypes.includes(fileExtFromMime.toLowerCase());
      const extFromNameAllowed =
        fileExtFromName &&
        allowedFileTypes.includes(fileExtFromName.toLowerCase());

      if (!mimeAllowed && !extFromMimeAllowed && !extFromNameAllowed) {
        return NextResponse.json(
          {
            error: `File type not allowed. Allowed types: ${allowedFileTypes.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    // For update requests, verify the original file exists and user owns it
    if (basedOnFileId) {
      const originalFile = await prisma.file.findUnique({
        where: { id: basedOnFileId },
        select: {
          id: true,
          uploadedById: true,
          isApproved: true,
          classId: true,
        },
      });

      if (!originalFile) {
        return NextResponse.json(
          { error: "Original file not found" },
          { status: 404 },
        );
      }

      if (originalFile.uploadedById !== userId) {
        return NextResponse.json(
          { error: "You can only update files you uploaded" },
          { status: 403 },
        );
      }

      if (!originalFile.isApproved) {
        return NextResponse.json(
          { error: "Cannot update a file that is not approved" },
          { status: 400 },
        );
      }

      // Check for existing pending update request for this file
      const existingUpdateRequest = await prisma.fileUploadRequest.findFirst({
        where: {
          userId,
          basedOnFileId,
          status: "pending",
        },
        select: { id: true },
      });

      if (existingUpdateRequest) {
        return NextResponse.json(
          {
            error: "You already have a pending update request for this file",
          },
          { status: 409 },
        );
      }
    } else {
      // For new uploads, check for duplicate pending request
      const existingPending = await prisma.fileUploadRequest.findFirst({
        where: {
          userId,
          classId,
          fileName,
          status: "pending",
        },
        select: { id: true },
      });

      if (existingPending) {
        return NextResponse.json(
          {
            error:
              "You already have a pending request for this file in this class",
          },
          { status: 409 },
        );
      }
    }

    // Ensure pending storage directory exists
    const pendingDir = getPendingStoragePath();
    if (!existsSync(pendingDir)) {
      await mkdir(pendingDir, { recursive: true });
    }

    // Generate unique filename (flat storage, no subdirectories needed)
    const uniqueFilename = generateUniqueFilename(fileName);
    const filePath = path.join(pendingDir, uniqueFilename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      await writeFile(filePath, buffer);
    } catch (writeError) {
      // Cleanup file on failure
      try {
        await rm(filePath, { force: true });
      } catch {
        // Ignore cleanup errors
      }
      console.error("File write error:", writeError);
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 },
      );
    }

    // Create FileUploadRequest record
    // pendingFileUrl will be constructed from pendingFileId when serving

    try {
      const uploadRequest = await prisma.fileUploadRequest.create({
        data: {
          classId,
          userId,
          fileName,
          fileType,
          size: BigInt(size),
          description: description || undefined,
          status: "pending",
          pendingFileId: uniqueFilename,
          pendingFileUrl: uniqueFilename, // Store the filename, API route uses request ID
          basedOnFileId: basedOnFileId, // Set for update requests, undefined for new uploads
        },
      });

      return NextResponse.json({
        success: true,
        requestId: uploadRequest.id,
        fileName,
        fileType,
        size,
        isUpdate: !!basedOnFileId,
      });
    } catch (dbError) {
      // Cleanup file on database failure
      try {
        await rm(filePath, { force: true });
      } catch {
        // Ignore cleanup errors
      }

      console.error("Database error:", dbError);

      // Check for unique constraint violation (Prisma error code P2002)
      if (
        dbError instanceof Prisma.PrismaClientKnownRequestError &&
        dbError.code === "P2002"
      ) {
        return NextResponse.json(
          {
            error: "You already have a request for this file in this class",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Failed to create upload request" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Upload request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
