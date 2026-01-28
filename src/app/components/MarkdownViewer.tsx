"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { Box, Text, Heading, Code, Link as RadixLink } from "@radix-ui/themes";
import type { Components } from "react-markdown";

interface MarkdownViewerProps {
  content: string;
}

// Custom components for rendering markdown elements with Radix styling
const components: Components = {
  h1: ({ children }) => (
    <Heading as="h1" size="7" mb="4" mt="6">
      {children}
    </Heading>
  ),
  h2: ({ children }) => (
    <Heading as="h2" size="6" mb="3" mt="5">
      {children}
    </Heading>
  ),
  h3: ({ children }) => (
    <Heading as="h3" size="5" mb="2" mt="4">
      {children}
    </Heading>
  ),
  h4: ({ children }) => (
    <Heading as="h4" size="4" mb="2" mt="3">
      {children}
    </Heading>
  ),
  h5: ({ children }) => (
    <Heading as="h5" size="3" mb="2" mt="3">
      {children}
    </Heading>
  ),
  h6: ({ children }) => (
    <Heading as="h6" size="2" mb="2" mt="3">
      {children}
    </Heading>
  ),
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
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className?.includes("hljs");

    if (isInline) {
      return (
        <Code size="2" variant="soft">
          {children}
        </Code>
      );
    }

    // Block code - styled with syntax highlighting from rehype-highlight
    return (
      <Box
        asChild
        className={className}
        style={{
          display: "block",
          overflowX: "auto",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-3)",
          backgroundColor: "var(--gray-2)",
          fontSize: "var(--font-size-2)",
          lineHeight: 1.5,
          marginBottom: "var(--space-3)",
        }}
      >
        <pre>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </Box>
    );
  },
  pre: ({ children }) => <>{children}</>,
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

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <Box className="markdown-viewer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
