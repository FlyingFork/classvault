"use client";

import { Flex, Text, Checkbox, Grid } from "@radix-ui/themes";
import {
  FileTextIcon,
  FileIcon,
  TableIcon,
  CodeIcon,
} from "@radix-ui/react-icons";
import type { ReactNode } from "react";

const FILE_TYPES: { value: string; label: string; icon: ReactNode }[] = [
  { value: "pdf", label: "PDF", icon: <FileTextIcon width={18} height={18} /> },
  { value: "docx", label: "DOCX", icon: <FileIcon width={18} height={18} /> },
  { value: "xlsx", label: "XLSX", icon: <TableIcon width={18} height={18} /> },
  { value: "md", label: "Markdown", icon: <CodeIcon width={18} height={18} /> },
];

interface FileTypeCheckboxGridProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function FileTypeCheckboxGrid({
  value,
  onChange,
  disabled = false,
}: FileTypeCheckboxGridProps) {
  const handleToggle = (fileType: string) => {
    if (value.includes(fileType)) {
      onChange(value.filter((t) => t !== fileType));
    } else {
      onChange([...value, fileType]);
    }
  };

  return (
    <Grid columns={{ initial: "2", sm: "4" }} gap="3" width="100%">
      {FILE_TYPES.map((type) => {
        const isChecked = value.includes(type.value);
        return (
          <label
            key={type.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-3)",
              border: "1px solid var(--gray-a6)",
              borderRadius: "var(--radius-3)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              backgroundColor: isChecked ? "var(--accent-a3)" : "transparent",
              transition: "background-color 0.15s ease",
            }}
          >
            <Checkbox
              checked={isChecked}
              disabled={disabled}
              onCheckedChange={() => handleToggle(type.value)}
            />
            <Flex
              align="center"
              gap="2"
              style={{
                color: isChecked ? "var(--accent-9)" : "var(--gray-9)",
              }}
            >
              {type.icon}
            </Flex>
            <Text size="2" weight="medium">
              {type.label}
            </Text>
          </label>
        );
      })}
    </Grid>
  );
}

export { FILE_TYPES };
