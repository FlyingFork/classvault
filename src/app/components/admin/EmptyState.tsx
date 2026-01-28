"use client";

import { Flex, Text, Button, Heading } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="4"
      py="9"
      px="4"
      style={{
        backgroundColor: "var(--gray-a2)",
        borderRadius: "var(--radius-4)",
        border: "1px dashed var(--gray-a6)",
      }}
    >
      {icon && (
        <Flex
          align="center"
          justify="center"
          style={{
            width: 64,
            height: 64,
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--gray-a3)",
            color: "var(--gray-11)",
          }}
        >
          {icon}
        </Flex>
      )}
      <Flex direction="column" align="center" gap="1">
        <Heading size="4" weight="medium">
          {title}
        </Heading>
        <Text size="2" color="gray" align="center" style={{ maxWidth: 320 }}>
          {description}
        </Text>
      </Flex>
      {actionLabel && (actionHref || onAction) && (
        <>
          {actionHref ? (
            <Button asChild size="2">
              <Link href={actionHref}>
                <PlusIcon />
                {actionLabel}
              </Link>
            </Button>
          ) : (
            <Button size="2" onClick={onAction}>
              <PlusIcon />
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </Flex>
  );
}
