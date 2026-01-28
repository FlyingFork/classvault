import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/prisma";
import { logFileAccess } from "@/lib/database";

type RouteParams = {
  params: Promise<{ fileId: string }>;
};

// Get MIME type for Content-Type header
function getMimeType(fileType: string): string {
  // Return the stored MIME type, or default to octet-stream
  return fileType || "application/octet-stream";
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = await params;

    // Optional auth check - public downloads allowed for approved files
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    const isAdmin = session?.user?.role === "admin";

    // Get file record
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        class: {
          select: { id: true, name: true, isActive: true },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Permission check: non-admins can only access approved, non-deleted files
    if (!isAdmin) {
      if (!file.isApproved) {
        return NextResponse.json(
          { error: "File is not approved" },
          { status: 403 },
        );
      }
      if (file.isDeleted) {
        return NextResponse.json(
          { error: "File has been deleted" },
          { status: 404 },
        );
      }
    }

    // Check if file exists on disk
    // Files are stored in storage/approved/{classId}/{filename} (private, not public)
    const approvedDir = path.join(
      process.cwd(),
      "storage",
      "approved",
      file.classId,
    );
    const filePath = path.join(approvedDir, file.externalVpsId);

    if (!existsSync(filePath)) {
      console.error(`File not found on disk: ${filePath}`);
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 },
      );
    }

    // Log file access (userId is optional - supports anonymous downloads)
    try {
      const headersList = await headers();
      await logFileAccess({
        fileId: file.id,
        userId, // May be undefined for anonymous users
        ipAddress: headersList.get("x-forwarded-for") || undefined,
        userAgent: headersList.get("user-agent") || undefined,
      });
    } catch (logError) {
      // Don't fail the download if logging fails
      console.error("Failed to log file access:", logError);
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath);

    // Check if inline display is requested (for viewing in browser)
    const inline = request.nextUrl.searchParams.get("inline") === "true";
    const disposition = inline ? "inline" : "attachment";

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(file.fileType),
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(file.originalFileName)}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
