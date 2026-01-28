import { Card, Flex, Grid, Heading, Skeleton } from "@radix-ui/themes";

export default function DashboardLoading() {
  return (
    <Flex direction="column" gap="6" p={{ initial: "4", md: "6" }}>
      <Flex direction="column" gap="2">
        <Skeleton>
          <Heading size="8">Loading dashboard</Heading>
        </Skeleton>
        <Skeleton>
          <Heading size="3">Preparing your latest activity</Heading>
        </Skeleton>
      </Flex>

      <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`stat-skeleton-${index}`} size="3">
            <Flex direction="column" gap="3">
              <Skeleton>
                <Heading size="3">Stat placeholder</Heading>
              </Skeleton>
              <Skeleton>
                <Heading size="5">0</Heading>
              </Skeleton>
            </Flex>
          </Card>
        ))}
      </Grid>

      <Flex direction="column" gap="3">
        <Skeleton>
          <Heading size="6">Quick Actions</Heading>
        </Skeleton>
        <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`action-skeleton-${index}`} size="3">
              <Flex direction="column" gap="3">
                <Skeleton>
                  <Heading size="3">Action placeholder</Heading>
                </Skeleton>
                <Skeleton>
                  <Heading size="2">Description placeholder</Heading>
                </Skeleton>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Flex>

      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={`activity-skeleton-${index}`} size="3">
            <Flex direction="column" gap="3">
              <Skeleton>
                <Heading size="5">Section placeholder</Heading>
              </Skeleton>
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <Skeleton key={`row-${rowIndex}`}>
                  <Heading size="3">Row placeholder</Heading>
                </Skeleton>
              ))}
            </Flex>
          </Card>
        ))}
      </Grid>
    </Flex>
  );
}
