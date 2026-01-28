"use client";

import { Card, Flex, Text, Heading } from "@radix-ui/themes";
import Link from "next/link";
import type { ReactNode } from "react";

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  color?: "violet" | "blue" | "green" | "orange" | "red" | "gray";
}

export function QuickActionCard({
  icon,
  title,
  description,
  href,
  onClick,
  color = "violet",
}: QuickActionCardProps) {
  const content = (
    <Flex direction="column" gap="3">
      <Flex
        align="center"
        justify="center"
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-3)",
          backgroundColor: `var(--${color}-a3)`,
          color: `var(--${color}-11)`,
        }}
      >
        {icon}
      </Flex>
      <Flex direction="column" gap="1">
        <Heading size="3" weight="medium">
          {title}
        </Heading>
        <Text size="2" color="gray">
          {description}
        </Text>
      </Flex>
    </Flex>
  );

  if (href) {
    return (
      <Card asChild size="2" style={{ cursor: "pointer" }}>
        <Link href={href} style={{ textDecoration: "none" }}>
          {content}
        </Link>
      </Card>
    );
  }

  return (
    <Card size="2" style={{ cursor: onClick ? "pointer" : "default" }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          all: "unset",
          width: "100%",
          display: "block",
        }}
        aria-label={title}
      >
        {content}
      </button>
    </Card>
  );
}
