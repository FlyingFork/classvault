"use client";

import { Flex } from "@radix-ui/themes";
import { BreadCrumb } from "@/app/components/BreadCrumb";

export interface BreadcrumbItem {
  url: string;
  name: string;
}

interface AdminPageLayoutProps {
  children: React.ReactNode;
  breadcrumbs: BreadcrumbItem[];
  maxWidth?: string;
}

export function AdminPageLayout({
  children,
  breadcrumbs,
  maxWidth = "1200px",
}: AdminPageLayoutProps) {
  return (
    <Flex
      justify="center"
      style={{ width: "100%" }}
      px={{ initial: "3", sm: "4" }}
    >
      <Flex
        direction="column"
        gap="5"
        style={{ width: "100%", maxWidth }}
        py="4"
      >
        <BreadCrumb items={breadcrumbs} />
        {children}
      </Flex>
    </Flex>
  );
}
