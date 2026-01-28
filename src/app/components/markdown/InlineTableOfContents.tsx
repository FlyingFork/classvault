"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  ScrollArea,
  IconButton,
} from "@radix-ui/themes";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUpIcon,
} from "@radix-ui/react-icons";
import { TOCItem } from "./TOCItem";
import type { Heading } from "./utils";

interface InlineTableOfContentsProps {
  headings: Heading[];
  activeId: string;
  onItemClick: (id: string) => void;
  /** Maximum heading level to display (default: 3) */
  maxLevel?: number;
}

/**
 * Inline collapsible table of contents for desktop.
 * Positioned between file info and markdown content.
 * Includes a scroll-to-top button when TOC is out of view.
 */
export function InlineTableOfContents({
  headings,
  activeId,
  onItemClick,
  maxLevel = 3,
}: InlineTableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);

  // Filter headings to only show up to maxLevel
  const filteredHeadings = headings.filter((h) => h.level <= maxLevel);

  // Track when TOC goes out of view
  useEffect(() => {
    if (!tocRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show scroll-to-top button when TOC is not visible
        setShowScrollTop(!entry.isIntersecting);
      },
      {
        rootMargin: "-100px 0px 0px 0px", // Account for navbar
        threshold: 0,
      },
    );

    observer.observe(tocRef.current);

    return () => observer.disconnect();
  }, []);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (filteredHeadings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Main TOC container */}
      <Box
        ref={tocRef}
        style={{
          backgroundColor: "var(--gray-2)",
          borderRadius: "var(--radius-3)",
          border: "1px solid var(--gray-4)",
          overflow: "hidden",
        }}
      >
        {/* Header with toggle */}
        <Flex
          justify="between"
          align="center"
          px="4"
          py="3"
          style={{
            borderBottom: isExpanded ? "1px solid var(--gray-4)" : "none",
            cursor: "pointer",
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Flex align="center" gap="2">
            <Text size="2" weight="medium" style={{ color: "var(--gray-11)" }}>
              Contents
            </Text>
            <Text size="1" style={{ color: "var(--gray-9)" }}>
              ({filteredHeadings.length} sections)
            </Text>
          </Flex>
          <Button
            variant="ghost"
            size="1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={isExpanded ? "Collapse contents" : "Expand contents"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronUpIcon width="16" height="16" />
            ) : (
              <ChevronDownIcon width="16" height="16" />
            )}
          </Button>
        </Flex>

        {/* Collapsible content */}
        {isExpanded && (
          <ScrollArea
            type="auto"
            scrollbars="vertical"
            style={{
              maxHeight: "280px",
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
        )}
      </Box>

      {/* Scroll to top button - fixed on right side */}
      {showScrollTop && (
        <IconButton
          size="3"
          variant="solid"
          onClick={handleScrollToTop}
          aria-label="Scroll to top"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 50,
          }}
        >
          <ArrowUpIcon width="20" height="20" />
        </IconButton>
      )}
    </>
  );
}
