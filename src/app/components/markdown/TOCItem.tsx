"use client";

import { Text, Box } from "@radix-ui/themes";
import type { Heading } from "./utils";

interface TOCItemProps {
  heading: Heading;
  isActive: boolean;
  onClick: (id: string) => void;
}

/**
 * Individual table of contents item.
 * Handles indentation based on heading level and active state styling.
 */
export function TOCItem({ heading, isActive, onClick }: TOCItemProps) {
  // Cap indentation at H3 level (levels 1-3 get unique indentation)
  const indentLevel = Math.min(heading.level - 1, 2);
  const paddingLeft = indentLevel * 12;

  return (
    <Box
      asChild
      style={{
        display: "block",
        paddingLeft: `${paddingLeft + 12}px`,
        paddingRight: "12px",
        paddingTop: "6px",
        paddingBottom: "6px",
        borderLeft: isActive
          ? "2px solid var(--accent-9)"
          : "2px solid transparent",
        backgroundColor: isActive ? "var(--accent-3)" : "transparent",
        cursor: "pointer",
        transition: "all 150ms ease",
        textDecoration: "none",
      }}
    >
      <a
        href={`#${heading.id}`}
        onClick={(e) => {
          e.preventDefault();
          onClick(heading.id);
        }}
        aria-current={isActive ? "true" : undefined}
      >
        <Text
          size="2"
          weight={isActive ? "medium" : "regular"}
          style={{
            color: isActive ? "var(--accent-11)" : "var(--gray-11)",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {heading.text}
        </Text>
      </a>
    </Box>
  );
}
