"use client";

import { Flex, Spinner, Text } from "@radix-ui/themes";

export function AuthLoadingScreen() {
  return (
    <Flex
      justify="center"
      align="center"
      style={{ width: "100%", height: "100vh" }}
    >
      <Flex direction="column" align="center" gap="4">
        <Spinner />
        <Text size="3" color="gray">
          Loading...
        </Text>
      </Flex>
    </Flex>
  );
}
