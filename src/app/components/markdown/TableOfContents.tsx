"use client";

import { Box, Text, ScrollArea } from "@radix-ui/themes";
import { TOCItem } from "./TOCItem";
import type { Heading } from "./utils";

interface TableOfContentsProps {
  headings: Heading[];
  activeId: string;
  onItemClick: (id: string) => void;
  /** Maximum heading level to display (default: 3) */
  maxLevel?: number;
}

/**
 * Table of contents navigation panel.
 * Displays a scrollable list of heading links with active state indication.
 */
export function TableOfContents({
  headings,
  activeId,
  onItemClick,
  maxLevel = 3,
}: TableOfContentsProps) {
  // Filter headings to only show up to maxLevel
  const filteredHeadings = headings.filter((h) => h.level <= maxLevel);

  if (filteredHeadings.length === 0) {
    return null;
  }

  return (
    <Box
      role="navigation"
      aria-label="Table of contents"
      style={{
        backgroundColor: "var(--gray-2)",
        borderRadius: "var(--radius-3)",
        border: "1px solid var(--gray-4)",
      }}
    >
      {/* Header */}
      <Box
        px="3"
        py="2"
        style={{
          borderBottom: "1px solid var(--gray-4)",
        }}
      >
        <Text size="2" weight="medium" style={{ color: "var(--gray-11)" }}>
          Contents
        </Text>
      </Box>

      {/* Scrollable list */}
      <ScrollArea
        type="auto"
        scrollbars="vertical"
        style={{
          maxHeight: "calc(100vh - 200px)",
        }}
      >
        <Box py="2" role="list">
          {filteredHeadings.map((heading) => (
            <TOCItem
              key={heading.id}
              heading={heading}
              isActive={activeId === heading.id}
              onClick={onItemClick}
            />
          ))}
        </Box>
      </ScrollArea>
    </Box>
  );
}
