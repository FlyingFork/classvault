import { Container, Flex, Box, Card, Skeleton } from "@radix-ui/themes";

export default function FilePageLoading() {
  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="4">
        {/* Back link skeleton */}
        <Box>
          <Skeleton width="120px" height="16px" />
        </Box>

        {/* Header skeleton */}
        <Flex
          justify="between"
          align={{ initial: "start", sm: "center" }}
          wrap="wrap"
          gap="3"
          direction={{ initial: "column", sm: "row" }}
        >
          <Flex align="center" gap="2">
            <Skeleton width="24px" height="24px" />
            <Skeleton width="200px" height="28px" />
            <Skeleton width="40px" height="20px" />
            <Skeleton width="70px" height="20px" />
          </Flex>

          <Flex gap="2" align="center">
            <Skeleton width="100px" height="36px" />
          </Flex>
        </Flex>

        {/* Metadata card skeleton */}
        <Card variant="surface">
          <Flex
            gap="4"
            wrap="wrap"
            direction={{ initial: "column", sm: "row" }}
            p="3"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Flex
                key={i}
                direction="column"
                gap="1"
                style={{ minWidth: 100 }}
              >
                <Skeleton width="60px" height="12px" />
                <Skeleton width="80px" height="18px" />
              </Flex>
            ))}
          </Flex>
        </Card>

        {/* Content card skeleton */}
        <Card>
          <Box p="4">
            <Flex direction="column" gap="3">
              <Skeleton width="60%" height="28px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="80%" height="16px" />
              <Box height="16px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="90%" height="16px" />
              <Box height="16px" />
              <Skeleton width="40%" height="24px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="70%" height="16px" />
            </Flex>
          </Box>
        </Card>
      </Flex>
    </Container>
  );
}
