import { Flex, Card, Skeleton } from "@radix-ui/themes";
import { AdminPageLayout } from "@/app/components/admin";

export default function NotificationsLoading() {
  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/dashboard", name: "Dashboard" },
        { url: "/notifications", name: "Notifications" },
      ]}
    >
      <Flex justify="between" align="center">
        <Skeleton height="32px" width="200px" />
        <Skeleton height="36px" width="140px" />
      </Flex>
      <Skeleton height="40px" width="200px" />
      <Flex direction="column" gap="3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} size="2">
            <Flex gap="3" align="start">
              <Skeleton
                height="36px"
                width="36px"
                style={{ borderRadius: "var(--radius-2)" }}
              />
              <Flex direction="column" gap="2" style={{ flex: 1 }}>
                <Skeleton height="20px" width="60%" />
                <Skeleton height="16px" width="80%" />
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    </AdminPageLayout>
  );
}
