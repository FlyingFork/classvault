"use client";

import { useState } from "react";
import { Dialog, Box, Button, Flex, ScrollArea } from "@radix-ui/themes";
import { HamburgerMenuIcon, Cross2Icon } from "@radix-ui/react-icons";
import { TOCItem } from "./TOCItem";
import type { Heading } from "./utils";

interface MobileTOCTriggerProps {
  headings: Heading[];
  activeId: string;
  onItemClick: (id: string) => void;
  /** Maximum heading level to display (default: 3) */
  maxLevel?: number;
}

/**
 * Mobile table of contents trigger button and sheet.
 * Displays as a floating action button that opens a bottom sheet with navigation.
 */
export function MobileTOCTrigger({
  headings,
  activeId,
  onItemClick,
  maxLevel = 3,
}: MobileTOCTriggerProps) {
  const [open, setOpen] = useState(false);

  const filteredHeadings = headings.filter((h) => h.level <= maxLevel);

  if (filteredHeadings.length === 0) {
    return null;
  }

  const handleItemClick = (id: string) => {
    setOpen(false);
    // Small delay to allow sheet to close before scrolling
    setTimeout(() => {
      onItemClick(id);
    }, 100);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Floating trigger button */}
      <Dialog.Trigger>
        <Button
          size="3"
          variant="solid"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 50,
          }}
          aria-label="Open table of contents"
        >
          <HamburgerMenuIcon width="24" height="24" />
        </Button>
      </Dialog.Trigger>

      {/* Bottom sheet */}
      <Dialog.Content
        aria-describedby={undefined}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          top: "auto",
          maxWidth: "100%",
          width: "100%",
          maxHeight: "70vh",
          borderRadius: "var(--radius-4) var(--radius-4) 0 0",
          margin: 0,
          padding: 0,
          animation: "slideUp 200ms ease-out",
        }}
      >
        {/* Header */}
        <Flex
          justify="between"
          align="center"
          px="4"
          py="3"
          style={{
            borderBottom: "1px solid var(--gray-5)",
          }}
        >
          <Dialog.Title size="4" weight="medium">
            Contents
          </Dialog.Title>
          <Dialog.Close>
            <Button variant="ghost" size="2" aria-label="Close">
              <Cross2Icon width="18" height="18" />
            </Button>
          </Dialog.Close>
        </Flex>

        {/* Scrollable content */}
        <ScrollArea
          type="auto"
          scrollbars="vertical"
          style={{
            maxHeight: "calc(70vh - 60px)",
          }}
        >
          <Box py="2" role="list">
            {filteredHeadings.map((heading) => (
              <TOCItem
                key={heading.id}
                heading={heading}
                isActive={activeId === heading.id}
                onClick={handleItemClick}
              />
            ))}
          </Box>
        </ScrollArea>
      </Dialog.Content>
    </Dialog.Root>
  );
}
