"use client";

import { Heading, Flex, Box } from "@radix-ui/themes";
import { ShareButton } from "./ShareButton";
import type { ReactNode } from "react";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingWithAnchorProps {
  level: HeadingLevel;
  id: string;
  children: ReactNode;
  onShareSuccess?: () => void;
  onShareError?: () => void;
}

// Map heading levels to Radix Heading sizes
const levelToSize: Record<HeadingLevel, "7" | "6" | "5" | "4" | "3" | "2"> = {
  1: "7",
  2: "6",
  3: "5",
  4: "4",
  5: "3",
  6: "2",
};

// Map heading levels to margin styles
const levelToMargin: Record<HeadingLevel, { mt: string; mb: string }> = {
  1: { mt: "6", mb: "4" },
  2: { mt: "5", mb: "3" },
  3: { mt: "4", mb: "2" },
  4: { mt: "3", mb: "2" },
  5: { mt: "3", mb: "2" },
  6: { mt: "3", mb: "2" },
};

/**
 * Heading component with anchor ID and share button.
 * The share button appears on hover (desktop) or is always visible (mobile).
 */
export function HeadingWithAnchor({
  level,
  id,
  children,
  onShareSuccess,
  onShareError,
}: HeadingWithAnchorProps) {
  const size = levelToSize[level];
  const margins = levelToMargin[level];
  const tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <Flex
      align="center"
      gap="2"
      mt={margins.mt as "3" | "4" | "5" | "6"}
      mb={margins.mb as "2" | "3" | "4"}
      className="heading-with-anchor"
      style={{
        scrollMarginTop: "100px", // Account for fixed navbar
      }}
    >
      <Heading
        as={tag}
        size={size}
        id={id}
        style={{
          scrollMarginTop: "100px",
        }}
      >
        {children}
      </Heading>

      {/* Share button - visibility controlled by CSS in globals.css */}
      <Box
        className="share-button-wrapper"
        style={{
          flexShrink: 0,
        }}
      >
        <ShareButton
          headingId={id}
          onCopySuccess={onShareSuccess}
          onCopyError={onShareError}
        />
      </Box>
    </Flex>
  );
}

/**
 * Creates react-markdown component overrides for headings with anchors.
 */
export function createHeadingComponents(
  onShareSuccess?: () => void,
  onShareError?: () => void,
) {
  const createHeadingComponent = (level: HeadingLevel) => {
    // eslint-disable-next-line react/display-name
    return ({ children, id }: { children?: ReactNode; id?: string }) => {
      // If no id, fall back to a simple heading (shouldn't happen with rehypeSlug)
      if (!id) {
        const tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
        return (
          <Heading
            as={tag}
            size={levelToSize[level]}
            mt={levelToMargin[level].mt as "3" | "4" | "5" | "6"}
            mb={levelToMargin[level].mb as "2" | "3" | "4"}
          >
            {children}
          </Heading>
        );
      }

      return (
        <HeadingWithAnchor
          level={level}
          id={id}
          onShareSuccess={onShareSuccess}
          onShareError={onShareError}
        >
          {children}
        </HeadingWithAnchor>
      );
    };
  };

  return {
    h1: createHeadingComponent(1),
    h2: createHeadingComponent(2),
    h3: createHeadingComponent(3),
    h4: createHeadingComponent(4),
    h5: createHeadingComponent(5),
    h6: createHeadingComponent(6),
  };
}
