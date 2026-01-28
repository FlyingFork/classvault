"use client";

import { Box, Flex, Section } from "@radix-ui/themes";
import Lecture from "./components/illustrations/Lecture";

export default function Home() {
  return (
    <Section>
      <Flex direction="column" align="center" justify="center">
        <Box>
          <Lecture />
        </Box>
      </Flex>
    </Section>
  );
}
