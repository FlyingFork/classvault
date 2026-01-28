import { Container, Flex, Heading, Text, Button, Card } from "@radix-ui/themes";
import { FileIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function FileNotFound() {
  return (
    <Container size="2" py="9">
      <Card>
        <Flex direction="column" align="center" gap="4" p="6">
          <FileIcon width={48} height={48} color="var(--gray-9)" />
          <Heading size="5" align="center">
            File Not Found
          </Heading>
          <Text size="2" color="gray" align="center">
            The file you are looking for does not exist or you do not have
            permission to view it.
          </Text>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </Flex>
      </Card>
    </Container>
  );
}
