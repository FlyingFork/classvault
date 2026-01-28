import { Container, Flex, Skeleton, Card, Table, Box } from "@radix-ui/themes";

export default function ClassFilesLoading() {
  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Back link skeleton */}
        <Box>
          <Skeleton style={{ width: 120, height: 16 }} />
        </Box>

        {/* Header Skeleton */}
        <Flex direction="column" gap="2">
          <Skeleton style={{ width: 200, height: 32 }} />
          <Skeleton style={{ width: 300, height: 20 }} />
          <Skeleton style={{ width: 100, height: 16 }} />
        </Flex>

        {/* Table Skeleton */}
        <Card size="3">
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>File</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Size</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Uploaded</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Array.from({ length: 5 }).map((_, i) => (
                <Table.Row key={i}>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      <Skeleton style={{ width: 180, height: 16 }} />
                      <Skeleton style={{ width: 120, height: 12 }} />
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Skeleton style={{ width: 60, height: 16 }} />
                  </Table.Cell>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      <Skeleton style={{ width: 80, height: 16 }} />
                      <Skeleton style={{ width: 60, height: 12 }} />
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <Skeleton style={{ width: 50, height: 24 }} />
                      <Skeleton style={{ width: 30, height: 24 }} />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Card>
      </Flex>
    </Container>
  );
}
