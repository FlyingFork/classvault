"use client";

import Link from "next/link";
import {
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Grid,
  Badge,
  Box,
} from "@radix-ui/themes";
import {
  FileTextIcon,
  ReaderIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  fileCount: number;
}

interface BrowseClientProps {
  classes: ClassData[];
}

export function BrowseClient({ classes }: BrowseClientProps) {
  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <ReaderIcon width={28} height={28} />
            <Heading size="7">Browse Classes</Heading>
          </Flex>
          <Text size="3" color="gray">
            Explore available classes and their files
          </Text>
        </Flex>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <Card size="4">
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="4"
              py="8"
            >
              <MagnifyingGlassIcon
                width={48}
                height={48}
                color="var(--gray-8)"
              />
              <Heading size="4" color="gray">
                No Classes Available
              </Heading>
              <Text size="2" color="gray" align="center">
                There are no active classes with files at the moment.
              </Text>
            </Flex>
          </Card>
        ) : (
          <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/browse/${cls.id}`}
                style={{ textDecoration: "none" }}
              >
                <Card
                  size="3"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  className="browse-class-card"
                >
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="start">
                      <Heading size="4" style={{ color: "var(--accent-11)" }}>
                        {cls.name}
                      </Heading>
                      <Badge variant="soft" color="violet">
                        <FileTextIcon />
                        {cls.fileCount} {cls.fileCount === 1 ? "file" : "files"}
                      </Badge>
                    </Flex>

                    {cls.description ? (
                      <Text
                        size="2"
                        color="gray"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {cls.description}
                      </Text>
                    ) : (
                      <Text size="2" color="gray">
                        No description
                      </Text>
                    )}

                    <Box>
                      <Text size="1" color="violet" weight="medium">
                        View files →
                      </Text>
                    </Box>
                  </Flex>
                </Card>
              </Link>
            ))}
          </Grid>
        )}
      </Flex>

      <style jsx global>{`
        .browse-class-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </Container>
  );
}
