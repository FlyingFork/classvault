/**
 * Database Access Layer for ClassVault
 *
 * This module provides type-safe database operations for all non-auth models.
 * Import from '@/lib/database' to access all methods.
 *
 * @example
 * ```typescript
 * import { createClass, getAllClasses, approveRequest } from '@/lib/database';
 *
 * // Create a new class
 * const newClass = await createClass({
 *   name: 'Mathematics',
 *   description: 'Math files and resources',
 *   allowedFileTypes: ['pdf', 'xlsx'],
 *   createdById: adminUserId,
 * });
 *
 * // Get all active classes
 * const classes = await getAllClasses();
 * ```
 */

// ============================================================================
// Class Methods & Types
// ============================================================================

export {
  // Methods
  createClass,
  getClassById,
  getAllClasses,
  getAllClassesAdmin,
  updateClass,
  softDeleteClass,
  restoreClass,
  getClassWithFiles,
  countClasses,
  // Types
  type CreateClassInput,
  type UpdateClassInput,
  type PaginationParams,
} from "./class";

// ============================================================================
// File Methods & Types
// ============================================================================

export {
  // Methods
  createFile,
  createFileVersion,
  getFileById,
  getApprovedFilesForClass,
  getAllFilesForClassAdmin,
  getFileVersionHistory,
  approveFile,
  softDeleteFile,
  setCurrentVersion,
  getFileWithAccessLogs,
  countFilesInClass,
  getPendingFiles,
  renameFile,
  // Types
  type CreateFileInput,
  type CreateFileVersionInput,
} from "./file";

// ============================================================================
// FileUploadRequest Methods & Types
// ============================================================================

export {
  // Methods
  createUploadRequest,
  createUpdateRequest,
  getRequestById,
  getPendingRequests,
  getPendingRequestsForClass,
  getUserRequests,
  approveRequest,
  rejectRequest,
  deleteRequest,
  getRequestPendingFile,
  countPendingRequests,
  countUserRequests,
  // Types
  type CreateUploadRequestInput,
  type CreateUpdateRequestInput,
  type ApproveRequestInput,
  type ApproveRequestResult,
  type RejectRequestResult,
} from "./file-upload-request";

// ============================================================================
// Notification Methods & Types
// ============================================================================

export {
  // Constants
  NOTIFICATION_EXPIRY_DAYS,
  // Methods
  createNotification,
  getNotificationById,
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteExpiredNotifications,
  deleteNotification,
  countUserNotifications,
  // Types
  type CreateNotificationInput,
} from "./notification";

// ============================================================================
// FileAccessLog Methods & Types
// ============================================================================

export {
  // Methods
  logFileAccess,
  getFileAccessLogs,
  getUserAccessLogs,
  getAccessLogsByDateRange,
  getMostAccessedFiles,
  countFileAccesses,
  countUserAccesses,
  getFileAccessLogsByUser,
  // Types
  type LogFileAccessInput,
  type MostAccessedFile,
} from "./file-access-log";

// ============================================================================
// AdminAuditLog Methods & Types
// ============================================================================

export {
  // Methods
  createAuditLog,
  getAuditLogs,
  getAuditLogsByAdmin,
  getAuditLogsByEntity,
  getAuditLogsByAction,
  getAuditLogsByDateRange as getAuditLogsByDateRangeAdmin,
  countAuditLogs,
  getRecentAuditLogs,
  // Types
  type CreateAuditLogInput,
  type AdminAction,
  type EntityType,
} from "./admin-audit-log";
