# Database Access Layer

This module provides a type-safe, modular database access layer for ClassVault's non-auth models. All methods are designed to be used in server components, server actions, and API routes.

## Quick Start

```typescript
import {
  createClass,
  getAllClasses,
  approveRequest,
  logFileAccess,
} from "@/lib/database";
```

## File Structure

```
src/lib/database/
├── index.ts              # Barrel export (import from here)
├── class.ts              # Class CRUD operations
├── file.ts               # File operations with version tracking
├── file-upload-request.ts # Request workflow with transactions
├── notification.ts       # Notification lifecycle
├── file-access-log.ts    # Immutable audit logging
└── README.md             # This file
```

---

## Models Overview

| Model             | Purpose                                  | Key Features                        |
| ----------------- | ---------------------------------------- | ----------------------------------- |
| Class             | Admin-managed categories for files       | Soft delete, file type restrictions |
| File              | File metadata with version tracking      | Version chains, approval gate       |
| FileUploadRequest | User upload requests with admin workflow | Transactional approve/reject        |
| Notification      | User notifications for request responses | Auto-expiry (30 days)               |
| FileAccessLog     | Immutable audit trail of file access     | Analytics, compliance               |

---

## Class Methods

### `createClass(data: CreateClassInput): Promise<Class>`

Create a new class.

```typescript
const newClass = await createClass({
  name: "Mathematics",
  description: "Math files and resources",
  allowedFileTypes: ["pdf", "xlsx", "docx"],
  createdById: adminUserId,
});
```

### `getClassById(id: string): Promise<Class | null>`

Get a class by ID with creator info.

```typescript
const mathClass = await getClassById("class-123");
```

### `getAllClasses(pagination?: PaginationParams): Promise<Class[]>`

Get all **active** classes (for regular users).

```typescript
// Get all active classes
const classes = await getAllClasses();

// With pagination
const pagedClasses = await getAllClasses({ skip: 0, take: 10 });
```

### `getAllClassesAdmin(pagination?: PaginationParams): Promise<Class[]>`

Get all classes including inactive (for admins).

```typescript
const allClasses = await getAllClassesAdmin();
```

### `updateClass(id: string, data: UpdateClassInput): Promise<Class>`

Update a class.

```typescript
const updated = await updateClass("class-123", {
  name: "Advanced Mathematics",
  allowedFileTypes: ["pdf", "xlsx", "md"],
});
```

### `softDeleteClass(id: string): Promise<Class>`

Soft delete a class (set `isActive = false`).

```typescript
await softDeleteClass("class-123");
```

### `restoreClass(id: string): Promise<Class>`

Restore a soft-deleted class.

```typescript
await restoreClass("class-123");
```

### `getClassWithFiles(id: string, isAdmin?: boolean, pagination?: PaginationParams): Promise<Class | null>`

Get a class with its files. For non-admins, only returns approved, non-deleted, current version files.

```typescript
// User view (approved files only)
const classWithFiles = await getClassWithFiles("class-123", false);

// Admin view (all files)
const classWithAllFiles = await getClassWithFiles("class-123", true);
```

### `countClasses(activeOnly?: boolean): Promise<number>`

Count total classes (for pagination).

```typescript
const totalActive = await countClasses(true);
const totalAll = await countClasses(false);
```

---

## File Methods

### `createFile(data: CreateFileInput): Promise<File>`

Create a new file (version 1).

```typescript
const file = await createFile({
  classId: "class-123",
  originalFileName: "lecture-notes.pdf",
  fileType: "application/pdf",
  externalVpsId: "vps-file-abc",
  externalVpsUrl: "https://cdn.example.com/files/abc.pdf",
  size: BigInt(1024000),
  description: "Chapter 5 lecture notes",
  uploadedById: userId,
  isApproved: true, // optional, default false
  approvedById: adminId, // optional
});
```

### `createFileVersion(data: CreateFileVersionInput): Promise<File>`

Create a new version of an existing file. Automatically:

- Sets version to `parent.version + 1`
- Sets new file as current version
- Marks parent as `isCurrentVersion = false`

```typescript
const v2 = await createFileVersion({
  classId: "class-123",
  originalFileName: "lecture-notes.pdf",
  fileType: "application/pdf",
  externalVpsId: "vps-file-def",
  externalVpsUrl: "https://cdn.example.com/files/def.pdf",
  size: BigInt(1048576),
  description: "Updated with corrections",
  uploadedById: userId,
  parentFileId: "file-v1-id",
});
// v2.version === 2
```

### `getFileById(id: string): Promise<File | null>`

Get a file by ID with class and uploader info.

```typescript
const file = await getFileById("file-123");
```

### `getApprovedFilesForClass(classId: string, pagination?: PaginationParams): Promise<File[]>`

Get approved, non-deleted, current version files for a class (user view).

```typescript
const files = await getApprovedFilesForClass("class-123");
```

### `getAllFilesForClassAdmin(classId: string, pagination?: PaginationParams): Promise<File[]>`

Get all files for a class including pending and deleted (admin view).

```typescript
const allFiles = await getAllFilesForClassAdmin("class-123");
```

### `getFileVersionHistory(fileId: string): Promise<File[]>`

Get all versions of a file (entire version chain).

```typescript
const versions = await getFileVersionHistory("file-v3-id");
// Returns [v1, v2, v3] sorted by version number
```

### `approveFile(id: string, approvedById: string): Promise<File>`

Approve a file.

```typescript
const approved = await approveFile("file-123", adminId);
```

### `softDeleteFile(id: string, deletedById: string): Promise<File>`

Soft delete a file.

```typescript
await softDeleteFile("file-123", adminId);
```

### `setCurrentVersion(id: string, isCurrent: boolean): Promise<File>`

Toggle the current version flag.

```typescript
await setCurrentVersion("file-v2-id", true);
```

### `getFileWithAccessLogs(id: string, pagination?: PaginationParams): Promise<File | null>`

Get a file with its access logs.

```typescript
const fileWithLogs = await getFileWithAccessLogs("file-123", { take: 50 });
```

### `getPendingFiles(pagination?: PaginationParams): Promise<File[]>`

Get pending (unapproved) files for admin review.

```typescript
const pending = await getPendingFiles();
```

### `countFilesInClass(classId: string, approvedOnly?: boolean): Promise<number>`

Count files in a class.

```typescript
const approvedCount = await countFilesInClass("class-123", true);
const totalCount = await countFilesInClass("class-123", false);
```

### `renameFile(id: string, newFileName: string): Promise<File>`

Rename a file (update the display name). This updates the `originalFileName` which is used as the display nickname throughout the UI. Does NOT affect storage path or the actual file on disk.

```typescript
const renamed = await renameFile("file-123", "Updated Lecture Notes.pdf");
```

---

## FileUploadRequest Methods

### `createUploadRequest(data: CreateUploadRequestInput): Promise<FileUploadRequest>`

Create a new upload request.

```typescript
const request = await createUploadRequest({
  classId: "class-123",
  userId: userId,
  fileName: "assignment.pdf",
  fileType: "application/pdf",
  size: BigInt(512000),
  description: "Week 3 assignment submission",
});
```

### `createUpdateRequest(data: CreateUpdateRequestInput): Promise<FileUploadRequest>`

Create a request to update an existing file.

```typescript
const updateRequest = await createUpdateRequest({
  classId: "class-123",
  userId: userId,
  fileName: "lecture-notes.pdf",
  fileType: "application/pdf",
  size: BigInt(1048576),
  description: "Updated with corrections",
  basedOnFileId: "file-v1-id",
});
```

### `getRequestById(id: string): Promise<FileUploadRequest | null>`

Get a request by ID.

```typescript
const request = await getRequestById("request-123");
```

### `getPendingRequests(pagination?: PaginationParams): Promise<FileUploadRequest[]>`

Get all pending requests (admin queue).

```typescript
const pending = await getPendingRequests();
```

### `getPendingRequestsForClass(classId: string, pagination?: PaginationParams): Promise<FileUploadRequest[]>`

Get pending requests for a specific class.

```typescript
const classPending = await getPendingRequestsForClass("class-123");
```

### `getUserRequests(userId: string, pagination?: PaginationParams): Promise<FileUploadRequest[]>`

Get all requests by a user.

```typescript
const myRequests = await getUserRequests(userId);
```

### `approveRequest(input: ApproveRequestInput): Promise<ApproveRequestResult>`

Approve a request. **Transactional operation** that:

1. Creates a new File record
2. Updates the request status to "approved"
3. Creates an approval notification for the user
4. If updating existing file, marks previous version as not current

```typescript
const { request, file, notification } = await approveRequest({
  requestId: "request-123",
  respondedById: adminId,
  externalVpsId: "vps-file-xyz",
  externalVpsUrl: "https://cdn.example.com/files/xyz.pdf",
});

// file is the newly created File
// notification was sent to the user
```

### `rejectRequest(requestId: string, respondedById: string, rejectionReason: string): Promise<RejectRequestResult>`

Reject a request. **Transactional operation** that:

1. Updates the request status to "rejected"
2. Creates a rejection notification for the user

```typescript
const { request, notification } = await rejectRequest(
  "request-123",
  adminId,
  "File format not allowed. Only PDF and XLSX are accepted.",
);
```

### `deleteRequest(id: string): Promise<FileUploadRequest>`

Hard delete a request.

```typescript
await deleteRequest("request-123");
```

### `countPendingRequests(classId?: string): Promise<number>`

Count pending requests.

```typescript
const totalPending = await countPendingRequests();
const classPending = await countPendingRequests("class-123");
```

### `countUserRequests(userId: string): Promise<number>`

Count a user's requests.

```typescript
const myRequestCount = await countUserRequests(userId);
```

---

## Notification Methods

### Constants

```typescript
import { NOTIFICATION_EXPIRY_DAYS } from "@/lib/database";
// NOTIFICATION_EXPIRY_DAYS === 30
```

### `createNotification(data: CreateNotificationInput): Promise<Notification>`

Create a notification with auto-expiry (30 days by default).

```typescript
const notification = await createNotification({
  userId: userId,
  title: "File Approved: lecture-notes.pdf",
  description: "Your upload request has been approved!",
  type: "file_approved",
  actionUrl: "/files/file-123",
  actionLabel: "View File",
  relatedEntityType: "file",
  relatedEntityId: "file-123",
  // expiresAt: optional, defaults to 30 days from now
});
```

### `getNotificationById(id: string): Promise<Notification | null>`

Get a notification by ID.

```typescript
const notification = await getNotificationById("notif-123");
```

### `getUserNotifications(userId: string, pagination?: PaginationParams): Promise<Notification[]>`

Get all non-expired notifications for a user.

```typescript
const notifications = await getUserNotifications(userId);
```

### `getUnreadNotifications(userId: string, pagination?: PaginationParams): Promise<Notification[]>`

Get unread, non-expired notifications.

```typescript
const unread = await getUnreadNotifications(userId);
```

### `markAsRead(id: string): Promise<Notification>`

Mark a notification as read.

```typescript
await markAsRead("notif-123");
```

### `markAllAsRead(userId: string): Promise<{ count: number }>`

Mark all user's notifications as read.

```typescript
const { count } = await markAllAsRead(userId);
console.log(`Marked ${count} notifications as read`);
```

### `deleteExpiredNotifications(): Promise<{ count: number }>`

Cleanup job: delete all expired notifications.

```typescript
// Run this in a cron job
const { count } = await deleteExpiredNotifications();
console.log(`Deleted ${count} expired notifications`);
```

### `deleteNotification(id: string): Promise<Notification>`

Hard delete a notification.

```typescript
await deleteNotification("notif-123");
```

### `countUserNotifications(userId: string, unreadOnly?: boolean): Promise<number>`

Count notifications for a user.

```typescript
const total = await countUserNotifications(userId);
const unreadCount = await countUserNotifications(userId, true);
```

---

## FileAccessLog Methods

### `logFileAccess(data: LogFileAccessInput): Promise<FileAccessLog>`

Log a file access (immutable audit entry). The `userId` is optional to support anonymous/unauthenticated file downloads.

```typescript
// Authenticated user download
await logFileAccess({
  fileId: "file-123",
  userId: userId,
  ipAddress: request.headers.get("x-forwarded-for") || undefined,
  userAgent: request.headers.get("user-agent") || undefined,
});

// Anonymous download (no userId)
await logFileAccess({
  fileId: "file-123",
  ipAddress: request.headers.get("x-forwarded-for") || undefined,
  userAgent: request.headers.get("user-agent") || undefined,
});
```

### `getFileAccessLogs(fileId: string, pagination?: PaginationParams): Promise<FileAccessLog[]>`

Get all access logs for a file.

```typescript
const logs = await getFileAccessLogs("file-123");
```

### `getUserAccessLogs(userId: string, pagination?: PaginationParams): Promise<FileAccessLog[]>`

Get all access logs for a user.

```typescript
const userLogs = await getUserAccessLogs(userId);
```

### `getAccessLogsByDateRange(startDate: Date, endDate: Date, pagination?: PaginationParams): Promise<FileAccessLog[]>`

Get access logs within a date range.

```typescript
const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate() - 7);

const logs = await getAccessLogsByDateRange(lastWeek, new Date());
```

### `getMostAccessedFiles(limit?: number, days?: number): Promise<MostAccessedFile[]>`

Get the most accessed files (analytics).

```typescript
// Top 10 files in last 30 days (default)
const topFiles = await getMostAccessedFiles();

// Top 5 files in last 7 days
const weeklyTop = await getMostAccessedFiles(5, 7);

// Result format:
// {
//   fileId: "file-123",
//   fileName: "lecture-notes.pdf",
//   classId: "class-456",
//   className: "Mathematics",
//   accessCount: 42
// }
```

### `countFileAccesses(fileId: string): Promise<number>`

Count total accesses for a file.

```typescript
const downloadCount = await countFileAccesses("file-123");
```

### `countUserAccesses(userId: string): Promise<number>`

Count total file accesses by a user.

```typescript
const userDownloads = await countUserAccesses(userId);
```

### `getFileAccessLogsByUser(fileId: string, userId: string, pagination?: PaginationParams): Promise<FileAccessLog[]>`

Get access logs for a specific file by a specific user.

```typescript
const logs = await getFileAccessLogsByUser("file-123", userId);
```

---

## Pagination

All list methods support optional pagination via `PaginationParams`:

```typescript
type PaginationParams = {
  skip?: number; // Number of records to skip
  take?: number; // Number of records to take
};
```

Example with pagination:

```typescript
// Page 1 (first 10 items)
const page1 = await getAllClasses({ skip: 0, take: 10 });

// Page 2 (next 10 items)
const page2 = await getAllClasses({ skip: 10, take: 10 });

// Get total count for pagination UI
const total = await countClasses();
const totalPages = Math.ceil(total / 10);
```

---

## Transactions

The following methods use Prisma transactions to ensure atomicity:

| Method              | Operations                                           |
| ------------------- | ---------------------------------------------------- |
| `createFileVersion` | Create new file + update parent's `isCurrentVersion` |
| `approveRequest`    | Create file + update request + create notification   |
| `rejectRequest`     | Update request + create notification                 |

If any operation fails, all changes are rolled back.

---

## Error Handling

Methods throw errors in these cases:

- `createFileVersion`: Parent file not found
- `approveRequest`: Request not found or not pending
- `rejectRequest`: Request not found or not pending

Example:

```typescript
try {
  const result = await approveRequest({
    requestId: "request-123",
    respondedById: adminId,
    externalVpsId: "vps-file-xyz",
    externalVpsUrl: "https://cdn.example.com/files/xyz.pdf",
  });
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // "Request not found: request-123"
    // "Request is not pending: approved"
  }
}
```

---

## Type Exports

All input types are exported from the main module:

```typescript
import type {
  // Class
  CreateClassInput,
  UpdateClassInput,
  PaginationParams,

  // File
  CreateFileInput,
  CreateFileVersionInput,

  // FileUploadRequest
  CreateUploadRequestInput,
  CreateUpdateRequestInput,
  ApproveRequestInput,
  ApproveRequestResult,
  RejectRequestResult,

  // Notification
  CreateNotificationInput,

  // FileAccessLog
  LogFileAccessInput,
  MostAccessedFile,
} from "@/lib/database";
```

For entity types (Class, File, etc.), import from the Prisma client:

```typescript
import type {
  Class,
  File,
  FileUploadRequest,
  Notification,
  FileAccessLog,
} from "@/generated/prisma/client";
```
