"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Dialog,
  Flex,
  Text,
  TextField,
  TextArea,
  Badge,
  Progress,
  Callout,
} from "@radix-ui/themes";
import {
  UploadIcon,
  Cross2Icon,
  FileTextIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

interface UpdateVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  currentFileName: string;
  classId: string;
  className: string;
  allowedFileTypes: string[];
  currentVersion: number;
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

export function UpdateVersionDialog({
  open,
  onOpenChange,
  fileId,
  currentFileName,
  classId,
  className,
  allowedFileTypes,
  currentVersion,
}: UpdateVersionDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState(currentFileName);
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const acceptAttribute = useMemo(() => {
    if (allowedFileTypes.length === 0) return undefined;
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
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      // Update filename to match selected file if user hasn't changed it
      if (fileName === currentFileName) {
        setFileName(file.name);
      }
    },
    [validateFile, fileName, currentFileName],
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

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setFileName(currentFileName);
    setDescription("");
    setDragOver(false);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentFileName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!fileName.trim()) {
      setError("Please enter a file name");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      // Upload the file with basedOnFileId to create an update request
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("classId", classId);
      formData.append("basedOnFileId", fileId); // This makes it an update request
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      setUploadProgress(50);

      const uploadResponse = await fetch("/api/upload/request", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      setUploadProgress(100);
      toast.success("Update request submitted for approval");
      resetForm();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
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
        <Dialog.Title>Upload New Version</Dialog.Title>
        <Dialog.Description size="2" color="gray">
          Create a new version of this file. The update will require admin
          approval.
        </Dialog.Description>

        <form onSubmit={handleSubmit} style={{ marginTop: "var(--space-4)" }}>
          <Flex direction="column" gap="4">
            {/* Current File Info */}
            <Callout.Root color="blue" size="1">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Updating <Text weight="medium">{currentFileName}</Text> (v
                {currentVersion}) in <Text weight="medium">{className}</Text>
              </Callout.Text>
            </Callout.Root>

            {/* Allowed File Types */}
            {allowedFileTypes.length > 0 && (
              <Flex gap="1" wrap="wrap" align="center">
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

            {/* File Dropzone */}
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                New File
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleInputChange}
                accept={acceptAttribute}
                disabled={isUploading}
                style={{ display: "none" }}
                id="update-file-input"
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
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? "var(--accent-9)" : "var(--gray-a6)"}`,
                    borderRadius: "var(--radius-3)",
                    backgroundColor: dragOver
                      ? "var(--accent-a2)"
                      : "var(--gray-a2)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <UploadIcon width={24} height={24} color="var(--gray-9)" />
                  <Text size="2" color="gray" align="center">
                    Drop a file here or click to browse
                  </Text>
                  <Text size="1" color="gray">
                    Max file size: 50MB
                  </Text>
                </Flex>
              )}
            </Flex>

            {/* File Name (editable) */}
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                File Name
              </Text>
              <TextField.Root
                placeholder="Enter file name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                disabled={isUploading}
              />
            </Flex>

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
                placeholder="Describe what changed in this version"
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
              <Button type="submit" disabled={!selectedFile || isUploading}>
                {isUploading ? "Uploading..." : "Submit Update"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
