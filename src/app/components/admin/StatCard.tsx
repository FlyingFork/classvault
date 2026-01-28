"use client";

import { Card, Flex, Text, Heading } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: "gray" | "violet" | "blue" | "green" | "orange" | "red";
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  color = "violet",
}: StatCardProps) {
  return (
    <Card size="2">
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-3)",
              backgroundColor: `var(--${color}-a3)`,
              color: `var(--${color}-11)`,
            }}
          >
            {icon}
          </Flex>
          {trend && (
            <Text
              size="1"
              weight="medium"
              style={{
                color: trend.positive ? "var(--green-11)" : "var(--red-11)",
              }}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </Text>
          )}
        </Flex>
        <Flex direction="column" gap="1">
          <Heading size="6" weight="bold">
            {value}
          </Heading>
          <Text size="2" color="gray">
            {label}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
