"use client";

import { Container, Flex, Heading, Text, Button, Card } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function FilePageError({ error, reset }: ErrorProps) {
  return (
    <Container size="2" py="9">
      <Card>
        <Flex direction="column" align="center" gap="4" p="6">
          <ExclamationTriangleIcon
            width={48}
            height={48}
            color="var(--red-9)"
          />
          <Heading size="5" align="center">
            Unable to Load File
          </Heading>
          <Text size="2" color="gray" align="center">
            {error.message ||
              "An unexpected error occurred while loading the file."}
          </Text>
          <Flex gap="3" wrap="wrap" justify="center">
            <Button onClick={reset} variant="soft">
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Container>
  );
}
