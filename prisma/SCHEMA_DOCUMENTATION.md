# ClassVault Schema Documentation

This document explains the complete Prisma schema for ClassVault, a file management and approval system with class-based organization, version tracking, and comprehensive audit logging.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Data Models](#data-models)
3. [Relationships](#relationships)
4. [Features Enabled](#features-enabled)
5. [Implementation Patterns](#implementation-patterns)

---

## Core Concepts

### Classes

Classes are admin-managed categories that serve as containers for organizing files. Think of them as the main organizational unit (e.g., "Mathematics", "Physics", "Biology"). Classes are:

- Created, modified, and deleted exclusively by admins
- Soft-deletable via the `isActive` flag
- Can specify allowed file types through JSON array
- Not considered teams, purely for file organization

### Files

Files are the core content with full version tracking and approval workflows:

- Stored externally on your VPS with metadata tracked in database
- Support unlimited versioning with parent-child relationships
- Require approval before user visibility (except to admins)
- Can be soft-deleted while maintaining version history
- Each version is immutable in the database

### Upload Requests

Users request file uploads which go through an admin approval workflow:

- User submits a request to upload a file to a class
- Request is validated against class file type restrictions
- Admin approves (creates File record) or rejects (with reason)
- Duplicate prevention: same user cannot request same filename twice per class
- Update requests link to previous version via `basedOnFileId`

### Notifications

Users receive notifications when their upload requests are responded to:

- Auto-created when admin approves or rejects a request
- Expire after 30 days (cleanup via `expiresAt`)
- Include actionable CTAs (click-to-action URLs and labels)
- Marked as read when user views them
- Track related entity (file, request, etc.)

### Access Logs

Complete audit trail of who accessed what files when:

- Created on every download/access event
- Capture IP address and user agent for security
- Enable compliance reporting and analytics
- Never deleted (immutable audit trail)

---

## Data Models

### Table: `user`

**Source:** Better Auth (extended with file management relations)

**Fields:**

- `id` - Unique identifier (from Better Auth)
- `name` - User's display name
- `email` - Unique email address
- `emailVerified` - Email verification status
- `image` - User avatar URL
- `username` - Unique username (from username plugin)
- `displayUsername` - Custom display name (from username plugin)
- `role` - User role: "admin" or "user" (from admin plugin)
- `banned` - Whether user is banned (from admin plugin)
- `banReason` - Reason for ban, if applicable
- `banExpires` - When ban expires, if applicable
- `createdAt` - Account creation timestamp
- `updatedAt` - Last account update

**Relations:**

- `classesCreated` → Class[] (classes created by this admin)
- `filesUploaded` → File[] (files uploaded by this user)
- `fileApprovals` → File[] (files approved by this admin)
- `fileDeletions` → File[] (file versions deleted by this admin)
- `fileUploadRequests` → FileUploadRequest[] (requests made by user)
- `respondedRequests` → FileUploadRequest[] (requests responded to by admin)
- `notificationsReceived` → Notification[] (notifications sent to user)
- `fileAccessLogs` → FileAccessLog[] (access audit trail for user)

**Admin Operations:**

- Admins use `role === "admin"` to gate class/file management
- Can create, update, delete classes
- Can approve or reject file upload requests
- Can delete old file versions (soft delete via `isDeleted`)

---

### Table: `class`

**Purpose:** Admin-managed categories for organizing files

**Fields:**

- `id` - UUID identifier (CUID)
- `name` - Unique class name (e.g., "Mathematics", "Advanced Physics")
- `description` - Optional markdown description
- `allowedFileTypes` - JSON array of permitted file types (e.g., ["pdf", "xlsx", "md"])
- `isActive` - Soft delete flag (default: true)
- `createdById` - FK to User (admin who created it)
- `createdAt` - Creation timestamp
- `updatedAt` - Last modification timestamp

**Relations:**

- `createdBy` → User (the admin who created this class)
- `files` → File[] (all files in this class)
- `uploadRequests` → FileUploadRequest[] (all requests for this class)

**Constraints:**

- `name` is unique
- `createdById` cannot be set to NULL (admin who creates class cannot be deleted)

**Soft Delete Pattern:**

- To delete: set `isActive = false`
- To restore: set `isActive = true`
- Queries should filter: `WHERE isActive = true`

---

### Table: `file`

**Purpose:** Metadata and version tracking for files stored on external VPS

**Fields:**

_Identity & Metadata:_

- `id` - UUID identifier (CUID)
- `classId` - FK to Class
- `originalFileName` - Original filename (e.g., "Lecture_Notes_Ch5.pdf")
- `fileType` - MIME type (e.g., "application/pdf")
- `externalVpsId` - Your external VPS file identifier/path
- `externalVpsUrl` - CDN or direct URL to retrieve the file
- `size` - File size in bytes (BigInt)
- `description` - Optional user-provided description

_Upload Tracking:_

- `uploadedById` - FK to User (who uploaded/requested it)
- `uploadedAt` - When file was uploaded

_Approval Gate:_

- `isApproved` - Boolean (false = hidden from regular users, true = visible)
- `approvedById` - FK to User (admin who approved, nullable)
- `approvedAt` - When approved (nullable)

_Version Tracking:_

- `version` - Integer version number (1, 2, 3, ...)
- `parentFileId` - FK to File (parent version, nullable for v1)
- `isCurrentVersion` - Boolean flag (optimization for queries)
- `childVersions` → File[] (reverse relation to versions)

_Soft Delete (for old versions):_

- `isDeleted` - Whether this version is deleted (default: false)
- `deletedById` - FK to User (admin who deleted this version)
- `deletedAt` - When deleted (nullable)

_Audit:_

- `createdAt` - Record creation timestamp
- `updatedAt` - Record update timestamp

**Relations:**

- `class` → Class
- `uploadedBy` → User (FK: uploadedById)
- `approvedBy` → User? (FK: approvedById, optional)
- `deletedBy` → User? (FK: deletedById, optional)
- `parentFile` → File? (FK: parentFileId)
- `childVersions` → File[] (back-relation via parentFileId)
- `uploadRequest` → FileUploadRequest (one-to-one, nullable)
- `accessLogs` → FileAccessLog[] (access history)

**Constraints:**

- `@@unique([parentFileId, version])` - Each version number is unique per file lineage
- Cascade delete on classId (deleting class deletes all its files)
- SetNull on approvedById and deletedById (if admin deleted, keep file record)

**Version Chain Pattern:**

```
File v1 (id: file-001)
  ├─ parentFileId: NULL
  ├─ version: 1
  └─ childVersions:
      └─ File v2 (id: file-002)
          ├─ parentFileId: file-001
          ├─ version: 2
          └─ childVersions:
              └─ File v3 (id: file-003)
                  ├─ parentFileId: file-002
                  └─ version: 3
```

**Approval Gate Pattern:**

```
isApproved = false → Hidden from users (only admins see in pending queue)
isApproved = true  → Visible to all users in class
isDeleted = true   → Soft-deleted version (history preserved for tracking)
```

**Access Control Query Example:**

```sql
-- Regular user: see only approved files in active classes
SELECT * FROM file
WHERE classId IN (
  SELECT id FROM class WHERE isActive = true
)
AND isApproved = true
AND isDeleted = false
AND isCurrentVersion = true;

-- Admin: see all files including pending and deleted versions
SELECT * FROM file WHERE classId = ? ORDER BY version DESC;
```

---

### Table: `file_upload_request`

**Purpose:** Workflow for users requesting file uploads with admin approval

**Fields:**

_Request Identity:_

- `id` - UUID identifier (CUID)
- `classId` - FK to Class (which class to upload to)
- `userId` - FK to User (requester)
- `fileName` - Requested filename
- `fileType` - Requested MIME type (validated against class allowed types)
- `size` - Requested file size
- `description` - Optional user description (why uploading)

_Status & Timeline:_

- `status` - Enum: "pending" | "approved" | "rejected" (default: "pending")
- `requestedAt` - When user submitted request
- `respondedAt` - When admin responded (nullable)

_Admin Response:_

- `respondedById` - FK to User (admin who responded, nullable)
- `respondedBy` → User? (relation for admin info)
- `rejectionReason` - Why request was rejected (nullable, only for rejected)

_File Reference:_

- `fileId` - FK to File (nullable, populated only on approval)
- `file` → File? (one-to-one, the approved file)

_Version Update Support:_

- `basedOnFileId` - FK to File (nullable, if this is updating existing file)
- `basedOnFile` → File? (links to previous version being updated)

_Notification Integration:_

- `notificationId` - FK to Notification (nullable, auto-created on response)
- `notification` → Notification? (the response notification)

_Audit:_

- `createdAt` - Record creation timestamp
- `updatedAt` - Record update timestamp

**Relations:**

- `class` → Class (FK: classId)
- `user` → User (FK: userId)
- `file` → File? (FK: fileId)
- `basedOnFile` → File? (reverse relation)
- `respondedBy` → User? (FK: respondedById)
- `notification` → Notification? (reverse relation)

**Constraints:**

- `@@unique([classId, userId, fileName])` - Prevent duplicate requests for same file
- Cascade delete on userId and classId (user/class deletion cascades)
- SetNull on fileId (if file deleted, request remains for history)

**Workflow State Machine:**

```
Request Created (status: "pending")
  ↓
Admin Views Queue
  ↓
├─→ Admin Approves
│   ├─ File created with isApproved = true
│   ├─ fileId populated
│   ├─ respondedAt set
│   ├─ status = "approved"
│   ├─ Notification created: "file_approved"
│   └─ User can now download file
│
└─→ Admin Rejects
    ├─ status = "rejected"
    ├─ rejectionReason set
    ├─ respondedAt set
    ├─ Notification created: "file_rejected"
    └─ User can create new request
```

**Update Workflow (basedOnFileId):**

```
User wants to update existing file v1:
  ├─ Creates new FileUploadRequest
  ├─ Sets basedOnFileId = file-v1.id
  ├─ Request goes to "pending" status
  │
  Admin Approves:
  ├─ Creates new File record with:
  │   ├─ parentFileId = file-v1.id
  │   ├─ version = 2
  │   ├─ isApproved = true
  │   └─ isCurrentVersion = true
  ├─ Sets old file v1.isCurrentVersion = false
  ├─ FileUploadRequest.fileId = new file v2
  └─ Notification: "file_approved"
```

---

### Table: `notification`

**Purpose:** User notifications with actionable content for request responses

**Fields:**

_Identity & Recipient:_

- `id` - UUID identifier (CUID)
- `userId` - FK to User (recipient)

_Content:_

- `title` - Notification title (e.g., "Your upload was approved!")
- `description` - Optional markdown content with details
- `type` - Enum: "file_approved" | "file_rejected" | "file_uploaded"
- `actionUrl` - Optional CTA URL (e.g., "/files/file-123", "/requests/req-456")
- `actionLabel` - Optional CTA button text (e.g., "View File", "Retry Upload")

_State:_

- `isRead` - Whether user has read notification (default: false)
- `readAt` - When user read it (nullable)

_Context Tracking:_

- `relatedEntityType` - What type entity this relates to: "file" | "request" | "class"
- `relatedEntityId` - The ID of that entity (for deep linking)

_Lifecycle:_

- `createdAt` - When notification was created
- `expiresAt` - When notification should be deleted (default: now + 30 days)

**Relations:**

- `user` → User (FK: userId)
- `uploadRequest` → FileUploadRequest? (reverse relation, one-to-one)

**Constraints:**

- Cascade delete on userId (user deletion removes their notifications)

**Auto-Expiration Pattern:**

- Set `expiresAt = CURRENT_TIMESTAMP + INTERVAL '30 days'` on creation
- Periodic job deletes: `DELETE FROM notification WHERE expiresAt < CURRENT_TIMESTAMP`
- OR query filter: `WHERE expiresAt > CURRENT_TIMESTAMP`

**Content Examples:**

_File Approved Notification:_

```json
{
  "title": "File Approved: Lecture_Notes_Ch5.pdf",
  "description": "Your upload request for Lecture_Notes_Ch5.pdf has been approved!",
  "type": "file_approved",
  "actionUrl": "/files/file-123",
  "actionLabel": "View File",
  "relatedEntityType": "file",
  "relatedEntityId": "file-123"
}
```

_File Rejected Notification:_

```json
{
  "title": "Upload Rejected: Assignment_Week3.docx",
  "description": "Your upload was rejected with reason: File format not allowed. Only PDF and XLSX are accepted.",
  "type": "file_rejected",
  "actionUrl": "/requests/req-456",
  "actionLabel": "Retry Upload",
  "relatedEntityType": "request",
  "relatedEntityId": "req-456"
}
```

---

### Table: `file_access_log`

**Purpose:** Immutable audit trail of file access and downloads

**Fields:**

_Identity & References:_

- `id` - UUID identifier (CUID)
- `fileId` - FK to File (which file was accessed)
- `userId` - FK to User (who accessed it, **nullable** for anonymous access)

_Access Details:_

- `accessedAt` - When the access occurred (with timestamp)
- `ipAddress` - Client IP address (nullable, from request)
- `userAgent` - Client user agent string (nullable, from request headers)

**Relations:**

- `file` → File (FK: fileId)
- `user` → User? (FK: userId, optional - null for anonymous downloads)

**Constraints:**

- Cascade delete on fileId and userId (deleting file/user cascades)
- All fields immutable (never updated after creation)

**Indexes:**

- `@@index([fileId])` - Query: "all downloads of a file"
- `@@index([userId])` - Query: "all files accessed by user"
- `@@index([accessedAt])` - Query: "access history by date range"

**Use Cases:**

_Compliance & Audit:_

```sql
-- Who accessed file X and when? (includes anonymous via NULL userId)
SELECT user.email, file_access_log.accessedAt, ipAddress
FROM file_access_log
LEFT JOIN user ON file_access_log.userId = user.id
WHERE fileId = 'file-123'
ORDER BY accessedAt DESC;

-- What files did user Y access?
SELECT file.originalFileName, file_access_log.accessedAt
FROM file_access_log
JOIN file ON file_access_log.fileId = file.id
WHERE userId = 'user-456'
ORDER BY accessedAt DESC;
```

_Analytics:_

```sql
-- Most accessed files
SELECT fileId, COUNT(*) as downloads
FROM file_access_log
WHERE accessedAt > CURRENT_DATE - INTERVAL '30 days'
GROUP BY fileId
ORDER BY downloads DESC
LIMIT 10;
```

---

## Relationships

### Entity Relationship Diagram (Text Format)

```
┌─────────────────┐
│      User       │
│  (Better Auth)  │
└────────┬────────┘
         │
    ┌────┼────┬────────────────┬──────────┬───────────┐
    │    │    │                │          │           │
    │    │    │                │          │           │
    ▼    ▼    ▼                ▼          ▼           ▼
┌────────┐ ┌─────────┐   ┌──────────────┐  ┌────────────────┐
│ Class  │ │  File   │◄─┤File Upload   │  │ Notification   │
│        │ │         │  │ Request      │  │                │
│ 1:M    │ │ 1:M     │  │              │  │ 1:M            │
└────────┘ └─────────┘  └──────────────┘  └────────────────┘
           │
           │ version chain
           │
           ▼
       ┌─────────┐
       │FileAccess
       │  Log    │
       │  1:M    │
       └─────────┘
```

### Key Relationships

| From              | To                | Type             | Notes                                 |
| ----------------- | ----------------- | ---------------- | ------------------------------------- |
| User              | Class             | 1:M              | Admin creates classes                 |
| User              | File              | 1:M (3×)         | Upload, approve, delete relationships |
| User              | FileUploadRequest | 1:M (2×)         | Requester and responder relations     |
| User              | Notification      | 1:M              | User receives notifications           |
| User              | FileAccessLog     | 1:M              | Access audit trail                    |
| Class             | File              | 1:M              | Cascade delete files with class       |
| Class             | FileUploadRequest | 1:M              | Requests tied to class                |
| File              | File              | Self-referential | Parent-child version chain            |
| File              | FileUploadRequest | 1:1              | Approved request creates file         |
| File              | FileAccessLog     | 1:M              | Access history for file               |
| FileUploadRequest | Notification      | 1:1              | Response notification                 |

---

## Features Enabled

### 1. **Class-Based File Organization**

- Admins create isolated categories for file organization
- Each class can restrict allowed file types via JSON array
- Classes are soft-deletable without losing file history

**Implementation:**

```
- Admin creates Class with name, description, allowedFileTypes
- User uploads file to specific class
- System validates fileType against class.allowedFileTypes
- File query always filters by classId
```

### 2. **Complete Version Tracking**

- Every file update creates a new version
- Full history preserved (parent → child chain)
- Track who uploaded each version and when
- See what changed from version to version

**Implementation:**

```
- User requests file upload (FileUploadRequest)
- Admin approves → creates File record with version=1
- User requests update (basedOnFileId=file-v1)
- Admin approves → creates File with version=2, parentFileId=file-v1
- Query all versions: WHERE parentFileId = 'first-version' OR id = 'first-version'
```

### 3. **Admin Approval Workflow**

- Files only visible to users after admin approval
- Before approval: visible only to admins and requester
- Rejection with reason tracking
- Approval audit trail (who, when)

**Implementation:**

```
Query logic:
- Regular user: SELECT * FROM files WHERE isApproved=true AND classId=X
- Admin: SELECT * FROM files WHERE classId=X (see all)
- Before approval: isApproved=false (hidden gate)
```

### 4. **Update Request System**

- Users can request to update existing files
- Old versions preserved in history
- Update request references previous version (basedOnFileId)
- Create new version chain if approved

**Implementation:**

```
- FileUploadRequest with basedOnFileId points to previous File
- On approval: create new File with parentFileId=basedOnFile.id
- Version number auto-increments
- Previous version isCurrentVersion set to false
```

### 5. **Duplicate Prevention**

- Same user cannot request upload of same filename in same class
- Enforced via unique constraint: `@@unique([classId, userId, fileName])`
- Prevents accidental duplicate requests

**Implementation:**

```
- Constraint blocks second request for (class-1, user-5, "notes.pdf")
- User must delete/cancel first request or use different filename
```

### 6. **Soft Delete for Classes**

- Delete classes without losing file data
- Recover deleted classes by setting isActive=true
- File history remains intact

**Implementation:**

```
- Admin sets class.isActive = false
- Query filters: WHERE isActive = true
- To recover: UPDATE class SET isActive = true WHERE id = 'class-x'
```

### 7. **Soft Delete for Old File Versions**

- Admins can delete old versions (e.g., v1, v2) while keeping v3 current
- Deletion history preserved (who deleted, when)
- Version chain remains visible for reference

**Implementation:**

```
- Admin deletes File version 1
- SET isDeleted = true, deletedBy = admin-id, deletedAt = NOW()
- File still in database, hidden from users
- History query shows: "Version 1 deleted by Admin John on 2026-01-28"
```

### 8. **Automated Notifications**

- Notify users when upload requests are approved/rejected
- Notifications auto-created on admin response
- Include actionable CTAs (links to file or retry)
- Auto-expire after 30 days

**Implementation:**

```
- FileUploadRequest approved → INSERT Notification with file link
- Notification.expiresAt = NOW() + 30 days
- Cron job: DELETE FROM notification WHERE expiresAt < NOW()
```

### 9. **Access Auditing & Compliance**

- Immutable log of who accessed which files
- Capture IP and user agent for security
- Never deleted (audit trail integrity)
- Enable compliance reporting

**Implementation:**

```
- On file download: INSERT FileAccessLog
- Immutable: no updates allowed
- Query audit: SELECT * FROM file_access_log WHERE fileId = 'x' ORDER BY accessedAt
```

### 10. **User-Only File Visibility**

- Regular users see only approved files in active classes
- Cannot see pending (unapproved) files
- Cannot see deleted file versions
- Admins see everything (for management)

**Implementation:**

```
- User query: WHERE isApproved=true AND isDeleted=false AND isCurrentVersion=true
- Admin query: no restriction (see all for management)
- Access control enforced at query level
```

### 11. **Request History & Status Tracking**

- Users see all their upload requests (pending, approved, rejected)
- Can see rejection reasons
- Can create new request if previous was rejected
- Unique constraint prevents re-requesting same filename

**Implementation:**

```
- User dashboard query: SELECT * FROM FileUploadRequest WHERE userId = 'user-x'
- Show status badges: Pending ⏳ | Approved ✓ | Rejected ✗
- Display rejectionReason on rejected requests
```

### 12. **File Metadata & Storage Separation**

- Metadata stored in database (filename, type, description)
- Actual file content stored on external VPS
- externalVpsId and externalVpsUrl decouple storage location
- Supports easy migration between VPS providers

**Implementation:**

```
- FileUploadRequest submitted with metadata
- Admin stores actual file on VPS, gets VPS ID back
- File record created with externalVpsId + externalVpsUrl
- Retrieval: use externalVpsUrl to fetch from CDN/VPS
```

---

## Implementation Patterns

### Pattern 1: Approval Gate

**Problem:** Hide unapproved files from regular users
**Solution:** `isApproved` boolean flag + query filter

```typescript
// Regular user file query
const files = await prisma.file.findMany({
  where: {
    classId: classId,
    isApproved: true,
    isDeleted: false,
    isCurrentVersion: true,
  },
  include: {
    class: true,
    uploadedBy: { select: { name: true, email: true } },
  },
});

// Admin file query (no isApproved filter)
const allFiles = await prisma.file.findMany({
  where: {
    classId: classId,
  },
  orderBy: { createdAt: "desc" },
});
```

### Pattern 2: Version Tracking

**Problem:** Track file updates and history
**Solution:** Parent-child chain with immutable version numbers

```typescript
// Upload new version
async function approveFileUpdate(requestId, vpsId, vpsUrl) {
  const request = await prisma.fileUploadRequest.findUnique({
    where: { id: requestId },
    include: { basedOnFile: true },
  });

  // Get next version number
  const nextVersion = (request.basedOnFile?.version || 0) + 1;

  // Create new version
  const newFile = await prisma.file.create({
    data: {
      classId: request.classId,
      originalFileName: request.fileName,
      fileType: request.fileType,
      size: request.size,
      description: request.description,
      externalVpsId: vpsId,
      externalVpsUrl: vpsUrl,
      uploadedById: request.userId,
      approvedById: adminId,
      approvedAt: new Date(),
      isApproved: true,
      version: nextVersion,
      parentFileId: request.basedOnFileId,
      isCurrentVersion: true,
    },
  });

  // Mark previous version as not current
  if (request.basedOnFile) {
    await prisma.file.update({
      where: { id: request.basedOnFile.id },
      data: { isCurrentVersion: false },
    });
  }

  // Link request to file
  await prisma.fileUploadRequest.update({
    where: { id: requestId },
    data: { fileId: newFile.id, status: "approved" },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: request.userId,
      title: `File Approved: ${request.fileName}`,
      type: "file_approved",
      actionUrl: `/files/${newFile.id}`,
      actionLabel: "View File",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      relatedEntityType: "file",
      relatedEntityId: newFile.id,
    },
  });
}
```

### Pattern 3: Duplicate Prevention

**Problem:** Prevent same user from requesting same file twice
**Solution:** Unique constraint on (classId, userId, fileName)

```typescript
// Attempting to create duplicate request throws error
try {
  await prisma.fileUploadRequest.create({
    data: {
      classId: "class-1",
      userId: "user-5",
      fileName: "notes.pdf", // Same as previous
      fileType: "application/pdf",
      size: 1024,
    },
  });
} catch (error) {
  if (error.code === "P2002") {
    // Unique constraint violation
    console.error("This file request already exists");
  }
}
```

### Pattern 4: Soft Delete for Versions

**Problem:** Delete old file versions but keep history
**Solution:** `isDeleted` flag instead of hard delete

```typescript
// Delete old version
async function deleteFileVersion(fileId) {
  await prisma.file.update({
    where: { id: fileId },
    data: {
      isDeleted: true,
      deletedById: adminId,
      deletedAt: new Date(),
    },
  });

  // Version still queryable for history
  // Excluded from user views via isDeleted=false filter
}

// Query all versions including deleted
const allVersions = await prisma.file.findMany({
  where: {
    OR: [{ id: originFileId }, { parentFileId: originFileId }],
  },
  orderBy: { version: "asc" },
  // Result includes deleted versions
});
```

### Pattern 5: Notification Auto-Creation

**Problem:** Automatically notify users on request response
**Solution:** Create notification within same transaction as request update

```typescript
// Reject request with notification
async function rejectFileUpload(requestId, reason) {
  await prisma.$transaction([
    prisma.fileUploadRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        rejectionReason: reason,
        respondedAt: new Date(),
        respondedById: adminId,
      },
    }),
    prisma.notification.create({
      data: {
        userId: request.userId,
        title: "Upload Rejected",
        description: `Your upload for "${request.fileName}" was rejected: ${reason}`,
        type: "file_rejected",
        actionUrl: `/requests/${requestId}`,
        actionLabel: "Create New Request",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        relatedEntityType: "request",
        relatedEntityId: requestId,
      },
    }),
  ]);
}
```

### Pattern 6: Access Logging

**Problem:** Audit all file downloads
**Solution:** Log every access with metadata

```typescript
// Log file access
async function logFileAccess(fileId, userId, request) {
  await prisma.fileAccessLog.create({
    data: {
      fileId,
      userId,
      ipAddress:
        request.headers["x-forwarded-for"] || request.socket.remoteAddress,
      userAgent: request.headers["user-agent"],
    },
  });
}

// In download handler
app.get("/api/files/:fileId/download", async (req, res) => {
  const file = await getFile(req.params.fileId);

  // Log the access
  await logFileAccess(file.id, req.user.id, req);

  // Return file from VPS
  res.redirect(file.externalVpsUrl);
});
```

### Pattern 7: Automatic Notification Expiration

**Problem:** Keep notifications for 30 days then delete
**Solution:** Set `expiresAt` on creation, cleanup with recurring task

```typescript
// On creation (already in Pattern 5)
expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

// Cleanup task (run daily)
app.get("/api/cron/cleanup-notifications", async (req, res) => {
  const deleted = await prisma.notification.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  res.json({ success: true, deleted: deleted.count });
});
```

---

## Migration Command

To apply this schema to your database:

```bash
# Generate migration
npx prisma migrate dev --name add_file_management_system

# Or with specific name
npx prisma migrate dev --name "add-classes-files-requests-notifications"

# View migration status
npx prisma migrate status

# Push to production (if not using migrate dev)
npx prisma db push
```

After migration, regenerate Prisma Client:

```bash
npx prisma generate
```

---

## Summary

This schema enables a complete, audit-traceable file management system with:

✅ Admin-controlled class organization  
✅ Full version history with parent-child chains  
✅ Approval-based visibility control  
✅ Update request workflows  
✅ Duplicate prevention  
✅ Soft deletion for recovery  
✅ Automatic user notifications  
✅ Complete access audit logs  
✅ Support for external VPS storage  
✅ Compliance-ready architecture

All models integrate seamlessly with Better Auth's existing User/Session/Account models and enforce admin-only operations through role-based checks.
