"use client";

import { useState, useCallback } from "react";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { Share2Icon, CheckIcon } from "@radix-ui/react-icons";
import { copyToClipboard, generateShareUrl } from "./utils";

interface ShareButtonProps {
  headingId: string;
  onCopySuccess?: () => void;
  onCopyError?: () => void;
}

/**
 * Share button that copies a direct link to a heading section.
 * Shows a checkmark icon briefly after successful copy.
 */
export function ShareButton({
  headingId,
  onCopySuccess,
  onCopyError,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const url = generateShareUrl(headingId);
      const success = await copyToClipboard(url);

      if (success) {
        setCopied(true);
        onCopySuccess?.();

        // Reset after 1.5 seconds
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      } else {
        onCopyError?.();
      }
    },
    [headingId, onCopySuccess, onCopyError],
  );

  return (
    <Tooltip content={copied ? "Link copied!" : "Copy link to section"}>
      <IconButton
        size="1"
        variant="ghost"
        color={copied ? "green" : "gray"}
        onClick={handleClick}
        aria-label="Copy link to this section"
        style={{
          opacity: copied ? 1 : undefined,
          transition: "opacity 200ms ease",
        }}
        className="share-button"
      >
        {copied ? (
          <CheckIcon width="14" height="14" />
        ) : (
          <Share2Icon width="14" height="14" />
        )}
      </IconButton>
    </Tooltip>
  );
}
