"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { Box, Flex } from "@radix-ui/themes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";

import { TableOfContents } from "./TableOfContents";
import { MobileTOCTrigger } from "./MobileTOCTrigger";
import { useActiveHeading } from "./useActiveHeading";
import { createHeadingComponents } from "./HeadingWithAnchor";
import { createCodeComponents } from "./CodeBlockWithCopy";
import rehypeSlug from "./rehypeSlug";
import { extractHeadings, scrollToHeading } from "./utils";
import { Text, Link as RadixLink } from "@radix-ui/themes";

import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

interface MarkdownViewerContainerProps {
  content: string;
  /** Show toast on copy success */
  onCopySuccess?: () => void;
  /** Show toast on copy error */
  onCopyError?: () => void;
}

// Base markdown components (non-heading, non-code elements)
const baseComponents: Partial<Components> = {
  p: ({ children }) => (
    <Text as="p" size="3" mb="3" style={{ lineHeight: 1.7 }}>
      {children}
    </Text>
  ),
  a: ({ href, children }) => (
    <RadixLink href={href || "#"} target="_blank" rel="noopener noreferrer">
      {children}
    </RadixLink>
  ),
  ul: ({ children }) => (
    <Box
      asChild
      mb="3"
      style={{ paddingLeft: "var(--space-5)", listStyleType: "disc" }}
    >
      <ul>{children}</ul>
    </Box>
  ),
  ol: ({ children }) => (
    <Box
      asChild
      mb="3"
      style={{ paddingLeft: "var(--space-5)", listStyleType: "decimal" }}
    >
      <ol>{children}</ol>
    </Box>
  ),
  li: ({ children }) => (
    <Text
      asChild
      size="3"
      style={{ lineHeight: 1.7, marginBottom: "var(--space-1)" }}
    >
      <li>{children}</li>
    </Text>
  ),
  blockquote: ({ children }) => (
    <Box
      asChild
      my="3"
      style={{
        borderLeft: "4px solid var(--accent-9)",
        paddingLeft: "var(--space-4)",
        fontStyle: "italic",
        color: "var(--gray-11)",
      }}
    >
      <blockquote>{children}</blockquote>
    </Box>
  ),
  hr: () => (
    <Box
      my="5"
      style={{
        height: "1px",
        backgroundColor: "var(--gray-6)",
        border: "none",
      }}
    />
  ),
  table: ({ children }) => (
    <Box
      mb="4"
      style={{
        overflowX: "auto",
        width: "100%",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "var(--font-size-2)",
        }}
      >
        {children}
      </table>
    </Box>
  ),
  thead: ({ children }) => (
    <thead
      style={{
        backgroundColor: "var(--gray-3)",
        textAlign: "left",
      }}
    >
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom: "1px solid var(--gray-5)" }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th
      style={{
        padding: "var(--space-2) var(--space-3)",
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ padding: "var(--space-2) var(--space-3)" }}>{children}</td>
  ),
  img: ({ src, alt }) => (
    <Box mb="3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ""}
        style={{
          maxWidth: "100%",
          height: "auto",
          borderRadius: "var(--radius-2)",
        }}
      />
    </Box>
  ),
};

/**
 * Enhanced Markdown Viewer with table of contents navigation.
 * Provides desktop sidebar TOC and mobile floating button with sheet.
 */
export function MarkdownViewerContainer({
  content,
  onCopySuccess,
  onCopyError,
}: MarkdownViewerContainerProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Extract headings from markdown content
  const headings = useMemo(() => extractHeadings(content), [content]);

  // Track active heading
  const { activeId } = useActiveHeading(headings);

  // Handle TOC item click
  const handleTocClick = useCallback((id: string) => {
    scrollToHeading(id);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle initial hash navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Delay to ensure content is rendered
      setTimeout(() => {
        scrollToHeading(hash, "auto");

        // Add highlight effect
        const element = document.getElementById(hash);
        if (element) {
          element.setAttribute("data-highlighted", "true");
          setTimeout(() => {
            element.removeAttribute("data-highlighted");
          }, 2000);
        }
      }, 100);
    }
  }, []);

  // Create heading and code components with callbacks
  const components = useMemo(() => {
    return {
      ...baseComponents,
      ...createHeadingComponents(onCopySuccess, onCopyError),
      ...createCodeComponents(),
    } as Components;
  }, [onCopySuccess, onCopyError]);

  const hasToc = headings.length > 0;

  return (
    <Flex gap="6">
      {/* Desktop TOC Sidebar */}
      {hasToc && !isMobile && (
        <Box
          style={{
            width: "240px",
            flexShrink: 0,
            position: "sticky",
            top: "100px",
            alignSelf: "flex-start",
            maxHeight: "calc(100vh - 120px)",
          }}
        >
          <TableOfContents
            headings={headings}
            activeId={activeId}
            onItemClick={handleTocClick}
          />
        </Box>
      )}

      {/* Main content */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            rehypeSanitize,
            rehypeSlug,
            rehypeHighlight,
            rehypeKatex,
          ]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </Box>

      {/* Mobile TOC Trigger */}
      {hasToc && isMobile && (
        <MobileTOCTrigger
          headings={headings}
          activeId={activeId}
          onItemClick={handleTocClick}
        />
      )}
    </Flex>
  );
}
