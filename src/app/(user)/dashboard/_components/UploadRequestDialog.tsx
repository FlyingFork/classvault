"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Dialog,
  Flex,
  Text,
  Select,
  TextArea,
  TextField,
  Badge,
  Progress,
} from "@radix-ui/themes";
import { UploadIcon, Cross2Icon, FileTextIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ActiveClassOption } from "@/lib/database/dashboard";

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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface UploadRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeClasses: ActiveClassOption[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtensionFromMime(mimeType: string): string | null {
  for (const [ext, mimes] of Object.entries(EXTENSION_TO_MIME)) {
    if (mimes.includes(mimeType)) {
      return ext;
    }
  }
  // Fallback: extract from MIME type itself
  const parts = mimeType.split("/");
  if (parts.length === 2) {
    return parts[1];
  }
  return null;
}

function getExtensionFromFilename(filename: string): string | null {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filename.length - 1) return null;
  return filename.slice(lastDot + 1).toLowerCase();
}

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

export function UploadRequestDialog({
  open,
  onOpenChange,
  activeClasses,
}: UploadRequestDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [classId, setClassId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectedClass = useMemo(() => {
    return activeClasses.find((cls) => cls.id === classId);
  }, [activeClasses, classId]);

  const allowedFileTypes = useMemo(() => {
    return selectedClass?.allowedFileTypes ?? [];
  }, [selectedClass]);

  const acceptAttribute = useMemo(() => {
    if (allowedFileTypes.length === 0) return undefined;
    // Create accept attribute for file input
    const extensions = allowedFileTypes.map((t) => `.${t}`);
    const mimes = getAllowedMimeTypes(allowedFileTypes);
    return [...extensions, ...mimes].join(",");
  }, [allowedFileTypes]);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > MAX_FILE_SIZE) {
        return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
      }
      if (file.size === 0) {
        return "File is empty";
      }
      if (allowedFileTypes.length > 0) {
        const allowedMimes = getAllowedMimeTypes(allowedFileTypes);
        const fileExtFromMime = getExtensionFromMime(file.type);
        const fileExtFromName = getExtensionFromFilename(file.name);
        const mimeAllowed = allowedMimes.includes(file.type);
        const extFromMimeAllowed =
          fileExtFromMime &&
          allowedFileTypes.includes(fileExtFromMime.toLowerCase());
        const extFromNameAllowed =
          fileExtFromName &&
          allowedFileTypes.includes(fileExtFromName.toLowerCase());

        // Allow if any validation passes: MIME type, extension from MIME, or extension from filename
        if (!mimeAllowed && !extFromMimeAllowed && !extFromNameAllowed) {
          return `File type not allowed. Allowed: ${allowedFileTypes.join(", ")}`;
        }
      }
      return null;
    },
    [allowedFileTypes],
  );

  const handleFileSelect = useCallback(
    (file: File | null) => {
      setError(null);
      if (!file) {
        setSelectedFile(null);
        return;
      }
      if (!classId) {
        setError("Please select a class first");
        return;
      }
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      // Auto-fill display name from filename if empty
      if (!displayName.trim()) {
        setDisplayName(file.name);
      }
    },
    [classId, validateFile, displayName],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      handleFileSelect(file ?? null);
    },
    [handleFileSelect],
  );

  const handleClassChange = useCallback(
    (value: string) => {
      setClassId(value);
      // Re-validate file if one is selected
      if (selectedFile) {
        const newClass = activeClasses.find((c) => c.id === value);
        const allowed = newClass?.allowedFileTypes ?? [];
        if (allowed.length > 0) {
          const allowedMimes = getAllowedMimeTypes(allowed);
          const fileExtFromMime = getExtensionFromMime(selectedFile.type);
          const fileExtFromName = getExtensionFromFilename(selectedFile.name);
          const mimeAllowed = allowedMimes.includes(selectedFile.type);
          const extFromMimeAllowed =
            fileExtFromMime && allowed.includes(fileExtFromMime.toLowerCase());
          const extFromNameAllowed =
            fileExtFromName && allowed.includes(fileExtFromName.toLowerCase());
          if (!mimeAllowed && !extFromMimeAllowed && !extFromNameAllowed) {
            setError(
              `File type not allowed for this class. Allowed: ${allowed.join(", ")}`,
            );
            setSelectedFile(null);
          } else {
            setError(null);
          }
        } else {
          setError(null);
        }
      }
    },
    [activeClasses, selectedFile],
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const resetForm = useCallback(() => {
    setClassId("");
    setSelectedFile(null);
    setDisplayName("");
    setDescription("");
    setDragOver(false);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classId) {
      setError("Please select a class");
      return;
    }
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("classId", classId);
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      setUploadProgress(30);

      const response = await fetch("/api/upload/request", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadProgress(100);
      toast.success("Upload request submitted");
      resetForm();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Request File Upload</Dialog.Title>
        <Dialog.Description size="2" color="gray">
          Upload a file for admin review. Once approved, it will be available to
          all users.
        </Dialog.Description>

        <form onSubmit={handleSubmit} style={{ marginTop: "var(--space-4)" }}>
          <Flex direction="column" gap="4">
            {/* Class Selection */}
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Class
              </Text>
              <Select.Root
                value={classId}
                onValueChange={handleClassChange}
                disabled={activeClasses.length === 0 || isUploading}
              >
                <Select.Trigger placeholder="Select a class" />
                <Select.Content>
                  {activeClasses.length === 0 ? (
                    <Select.Item value="" disabled>
                      No classes available
                    </Select.Item>
                  ) : (
                    activeClasses.map((cls) => (
                      <Select.Item key={cls.id} value={cls.id}>
                        {cls.name}
                      </Select.Item>
                    ))
                  )}
                </Select.Content>
              </Select.Root>
              {activeClasses.length === 0 && (
                <Text size="1" color="gray">
                  No active classes are available yet. Please try again later.
                </Text>
              )}
              {selectedClass && allowedFileTypes.length > 0 && (
                <Flex gap="1" wrap="wrap">
                  <Text size="1" color="gray">
                    Allowed:
                  </Text>
                  {allowedFileTypes.map((type) => (
                    <Badge key={type} size="1" variant="soft">
                      {type.toUpperCase()}
                    </Badge>
                  ))}
                </Flex>
              )}
            </Flex>

            {/* File Dropzone */}
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Select File
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleInputChange}
                accept={acceptAttribute}
                disabled={!classId || isUploading}
                style={{ display: "none" }}
                id="file-upload-input"
              />

              {selectedFile ? (
                <Flex
                  p="3"
                  gap="3"
                  align="center"
                  style={{
                    border: "1px solid var(--gray-a6)",
                    borderRadius: "var(--radius-3)",
                    backgroundColor: "var(--gray-a2)",
                  }}
                >
                  <FileTextIcon width={24} height={24} />
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Text size="2" weight="medium">
                      {selectedFile.name}
                    </Text>
                    <Flex gap="2" align="center">
                      <Text size="1" color="gray">
                        {formatFileSize(selectedFile.size)}
                      </Text>
                      <Badge size="1" variant="soft">
                        {getExtensionFromMime(
                          selectedFile.type,
                        )?.toUpperCase() || selectedFile.type}
                      </Badge>
                    </Flex>
                  </Flex>
                  <Button
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="1"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <Cross2Icon />
                  </Button>
                </Flex>
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  gap="2"
                  p="4"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => classId && fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? "var(--accent-9)" : "var(--gray-a6)"}`,
                    borderRadius: "var(--radius-3)",
                    backgroundColor: dragOver
                      ? "var(--accent-a2)"
                      : "var(--gray-a2)",
                    cursor: classId ? "pointer" : "not-allowed",
                    transition: "all 0.15s ease",
                    opacity: classId ? 1 : 0.5,
                  }}
                >
                  <UploadIcon width={24} height={24} color="var(--gray-9)" />
                  <Text size="2" color="gray" align="center">
                    {classId
                      ? "Drop a file here or click to browse"
                      : "Select a class first"}
                  </Text>
                  <Text size="1" color="gray">
                    Max file size: 50MB
                  </Text>
                </Flex>
              )}
            </Flex>

            {/* Display Name - shown after file selection */}
            {selectedFile && (
              <Flex direction="column" gap="2">
                <Text size="2" weight="medium">
                  Display Name
                </Text>
                <TextField.Root
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter a display name for this file"
                  disabled={isUploading}
                  maxLength={255}
                />
                <Text size="1" color="gray">
                  This name will be shown throughout the app (can differ from
                  the actual filename)
                </Text>
              </Flex>
            )}

            {/* Error Message */}
            {error && (
              <Text size="2" color="red">
                {error}
              </Text>
            )}

            {/* Description */}
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Description (optional)
              </Text>
              <TextArea
                placeholder="Add context or instructions for the reviewer"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                maxLength={500}
              />
            </Flex>

            {/* Upload Progress */}
            {isUploading && (
              <Progress value={uploadProgress} size="2" color="violet" />
            )}

            {/* Actions */}
            <Flex justify="end" gap="3">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!classId || !selectedFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Submit request"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
