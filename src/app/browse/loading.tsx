import {
  Container,
  Flex,
  Heading,
  Skeleton,
  Grid,
  Card,
} from "@radix-ui/themes";

export default function BrowseLoading() {
  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Header Skeleton */}
        <Flex direction="column" gap="2">
          <Skeleton style={{ width: 200, height: 32 }} />
          <Skeleton style={{ width: 280, height: 20 }} />
        </Flex>

        {/* Classes Grid Skeleton */}
        <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} size="3">
              <Flex direction="column" gap="3">
                <Flex justify="between" align="start">
                  <Skeleton style={{ width: 120, height: 24 }} />
                  <Skeleton style={{ width: 60, height: 20 }} />
                </Flex>
                <Skeleton style={{ width: "100%", height: 40 }} />
                <Skeleton style={{ width: 80, height: 16 }} />
              </Flex>
            </Card>
          ))}
        </Grid>
      </Flex>
    </Container>
  );
}
