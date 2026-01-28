import { Flex, Card, Skeleton } from "@radix-ui/themes";
import { AdminPageLayout } from "@/app/components/admin";

export default function RequestsLoading() {
  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/dashboard", name: "Dashboard" },
        { url: "/dashboard/requests", name: "My Requests" },
      ]}
    >
      <Skeleton height="32px" width="280px" />
      <Skeleton height="40px" width="400px" />
      <Card size="2">
        <Flex direction="column" gap="3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height="56px" />
          ))}
        </Flex>
      </Card>
    </AdminPageLayout>
  );
}
