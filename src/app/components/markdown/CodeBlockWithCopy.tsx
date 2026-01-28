"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import { Box, IconButton, Tooltip, Text } from "@radix-ui/themes";
import { CopyIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { copyToClipboard } from "./utils";

interface CodeBlockWithCopyProps {
  children: ReactNode;
  className?: string;
  language?: string;
}

type CopyState = "idle" | "success" | "error";

/**
 * Code block component with copy-to-clipboard functionality.
 * Displays a copy button in the top-right corner with visual feedback.
 */
export function CodeBlockWithCopy({
  children,
  className,
  language,
}: CodeBlockWithCopyProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const codeRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    // Extract text content from the code block
    const codeElement = codeRef.current?.querySelector("code");
    const text = codeElement?.textContent || "";

    const success = await copyToClipboard(text);

    if (success) {
      setCopyState("success");
    } else {
      setCopyState("error");
    }

    // Reset after 2 seconds
    setTimeout(() => {
      setCopyState("idle");
    }, 2000);
  }, []);

  const getIcon = () => {
    switch (copyState) {
      case "success":
        return <CheckIcon width="14" height="14" />;
      case "error":
        return <Cross2Icon width="14" height="14" />;
      default:
        return <CopyIcon width="14" height="14" />;
    }
  };

  const getTooltip = () => {
    switch (copyState) {
      case "success":
        return "Copied!";
      case "error":
        return "Failed to copy";
      default:
        return "Copy code";
    }
  };

  const getColor = () => {
    switch (copyState) {
      case "success":
        return "green";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <Box
      style={{
        position: "relative",
        marginBottom: "var(--space-3)",
      }}
    >
      {/* Language label (optional) */}
      {language && (
        <Text
          size="1"
          style={{
            position: "absolute",
            top: "8px",
            left: "12px",
            color: "var(--gray-10)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "10px",
            fontWeight: 500,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {language}
        </Text>
      )}

      {/* Copy button */}
      <Tooltip content={getTooltip()}>
        <IconButton
          size="1"
          variant="ghost"
          color={getColor()}
          onClick={handleCopy}
          aria-label="Copy code"
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 2,
          }}
        >
          {getIcon()}
        </IconButton>
      </Tooltip>

      {/* Code block */}
      <Box
        asChild
        className={className}
        ref={codeRef}
        style={{
          display: "block",
          overflowX: "auto",
          padding: "var(--space-4)",
          paddingTop: language ? "var(--space-6)" : "var(--space-4)",
          borderRadius: "var(--radius-3)",
          backgroundColor: "var(--gray-2)",
          fontSize: "var(--font-size-2)",
          lineHeight: 1.5,
        }}
      >
        <pre>
          <code className={className}>{children}</code>
        </pre>
      </Box>
    </Box>
  );
}

/**
 * Creates react-markdown component overrides for code blocks with copy.
 */
export function createCodeComponents() {
  return {
    code: ({
      className,
      children,
    }: {
      className?: string;
      children?: ReactNode;
    }) => {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match && !className?.includes("hljs");

      if (isInline) {
        // Inline code - use Radix Code component
        return (
          <Box
            asChild
            style={{
              backgroundColor: "var(--gray-3)",
              padding: "2px 6px",
              borderRadius: "var(--radius-1)",
              fontSize: "var(--font-size-2)",
            }}
          >
            <code>{children}</code>
          </Box>
        );
      }

      // Block code - use CodeBlockWithCopy
      const language = match ? match[1] : undefined;
      return (
        <CodeBlockWithCopy className={className} language={language}>
          {children}
        </CodeBlockWithCopy>
      );
    },
    // Let CodeBlockWithCopy handle the pre wrapper
    pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };
}
