import { Flex, Card, Skeleton } from "@radix-ui/themes";
import { AdminPageLayout } from "@/app/components/admin";

export default function RequestDetailLoading() {
  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/dashboard", name: "Dashboard" },
        { url: "/dashboard/requests", name: "My Requests" },
        { url: "#", name: "Loading..." },
      ]}
    >
      <Card size="3">
        <Flex direction="column" gap="4">
          <Skeleton height="24px" width="200px" />
          <Flex gap="4" wrap="wrap">
            <Skeleton height="20px" width="120px" />
            <Skeleton height="20px" width="100px" />
            <Skeleton height="20px" width="80px" />
          </Flex>
          <Skeleton height="60px" />
          <Flex gap="3">
            <Skeleton height="36px" width="140px" />
            <Skeleton height="36px" width="160px" />
          </Flex>
        </Flex>
      </Card>
    </AdminPageLayout>
  );
}
