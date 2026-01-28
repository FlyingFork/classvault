"use client";

import { Fragment } from "react";
import { Card, Flex, Link, Text } from "@radix-ui/themes";

type Crumb = {
  url: string;
  name: string;
};

export function BreadCrumb({ items = [] }: { items?: Crumb[] }) {
  return (
    <Card>
      <Flex direction="row" gap="2">
        {items.map((item, idx) => (
          <Fragment key={`${item.url}-${idx}`}>
            {idx === items.length - 1 ? (
              <Text>{item.name}</Text>
            ) : (
              <Link href={item.url}>{item.name}</Link>
            )}

            {idx !== items.length - 1 && <Text color="gray">/</Text>}
          </Fragment>
        ))}
      </Flex>
    </Card>
  );
}
