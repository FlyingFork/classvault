import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/prisma";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

// Get MIME type for Content-Type header
function getMimeType(fileType: string): string {
  return fileType || "application/octet-stream";
}

// Get storage path for pending files
function getPendingStoragePath(): string {
  return path.join(process.cwd(), "storage", "pending");
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;

    // Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isAdmin = session.user.role === "admin";

    // Get request record
    const uploadRequest = await prisma.fileUploadRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        status: true,
        pendingFileId: true,
      },
    });

    if (!uploadRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Permission check: user must be owner or admin
    if (!isAdmin && uploadRequest.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if there's a pending file
    if (!uploadRequest.pendingFileId) {
      return NextResponse.json(
        { error: "No file associated with this request" },
        { status: 404 },
      );
    }

    // Only allow download if request is still pending
    // (once approved/rejected, the file may have been moved/deleted)
    if (uploadRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Request is no longer pending" },
        { status: 400 },
      );
    }

    // Check if file exists on disk
    const filePath = path.join(
      getPendingStoragePath(),
      uploadRequest.pendingFileId,
    );

    if (!existsSync(filePath)) {
      console.error(`Pending file not found on disk: ${filePath}`);
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 },
      );
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(uploadRequest.fileType),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(uploadRequest.fileName)}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Pending file download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
