"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Link as RadixLink,
  Section,
  Text,
} from "@radix-ui/themes";
import {
  RocketIcon,
  DownloadIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
  MobileIcon,
  GitHubLogoIcon,
  ChevronDownIcon,
  FileTextIcon,
  LayersIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useState } from "react";

interface TopFile {
  fileId: string;
  fileName: string;
  classId: string;
  className: string;
  accessCount: number;
}

interface Stats {
  filesCount: number;
  classesCount: number;
  studentsCount: number;
}

interface LandingClientProps {
  topFiles: TopFile[];
  stats: Stats;
}

export default function LandingClient({ topFiles, stats }: LandingClientProps) {
  return (
    <>
      {/* Hero Section */}
      <Section size="3">
        <Container size="4">
          <Flex
            direction="column"
            align="center"
            gap="6"
            style={{ textAlign: "center" }}
          >
            <Badge size="2" color="violet" radius="full">
              <RocketIcon /> Now in Beta
            </Badge>

            <Heading size="9" weight="bold">
              Your Class Files, Organized & Accessible
            </Heading>

            <Text size="5" color="gray" style={{ maxWidth: "600px" }}>
              Upload, share, and discover study materials in seconds.
            </Text>

            <Flex gap="3" wrap="wrap" justify="center">
              <Link href="/sign-up">
                <Button size="4" color="violet">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/browse">
                <Button size="4" variant="soft" color="violet">
                  Browse Files
                </Button>
              </Link>
            </Flex>

            <Flex
              gap="6"
              wrap="wrap"
              justify="center"
              style={{ marginTop: "24px" }}
            >
              <Text size="2" color="gray">
                <strong>{stats.filesCount}</strong>{" "}
                {stats.filesCount === 1 ? "File" : "Files"}
              </Text>
              <Text size="2" color="gray">
                <strong>{stats.classesCount}</strong>{" "}
                {stats.classesCount === 1 ? "Class" : "Classes"}
              </Text>
              <Text size="2" color="gray">
                <strong>{stats.studentsCount}</strong>{" "}
                {stats.studentsCount === 1 ? "Student" : "Students"}
              </Text>
            </Flex>
          </Flex>
        </Container>
      </Section>

      {/* Features Section */}
      <Section size="3">
        <Container size="4">
          <Flex
            direction="column"
            align="center"
            gap="6"
            style={{ marginBottom: "48px" }}
          >
            <Heading size="8" align="center">
              Everything You Need
            </Heading>
            <Text
              size="3"
              color="gray"
              align="center"
              style={{ maxWidth: "600px" }}
            >
              Powerful features designed for students and educators
            </Text>
          </Flex>

          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
            <FeatureCard
              icon={<MagnifyingGlassIcon width="24" height="24" />}
              title="Fast Search"
              description="Find exactly what you need in seconds with smart search and filters."
              color="violet"
            />
            <FeatureCard
              icon={<LayersIcon width="24" height="24" />}
              title="Version Control"
              description="Track file revisions and always access the latest version."
              color="blue"
            />
            <FeatureCard
              icon={<DownloadIcon width="24" height="24" />}
              title="Easy Uploads"
              description="Drag and drop files or upload directly from your device."
              color="green"
            />
            <FeatureCard
              icon={<FileTextIcon width="24" height="24" />}
              title="Smart Organization"
              description="Files organized by class, automatically tagged and categorized."
              color="orange"
            />
            <FeatureCard
              icon={<LockClosedIcon width="24" height="24" />}
              title="Secure Storage"
              description="Your files are encrypted and safely stored in the cloud."
              color="red"
            />
            <FeatureCard
              icon={<MobileIcon width="24" height="24" />}
              title="Mobile-Friendly"
              description="Access your files anywhere, on any device, anytime."
              color="violet"
            />
          </Grid>
        </Container>
      </Section>

      {/* How It Works Section */}
      <Section size="3" style={{ background: "var(--gray-a2)" }}>
        <Container size="4">
          <Flex
            direction="column"
            align="center"
            gap="6"
            style={{ marginBottom: "48px" }}
          >
            <Heading size="8" align="center">
              How It Works
            </Heading>
            <Text
              size="3"
              color="gray"
              align="center"
              style={{ maxWidth: "600px" }}
            >
              Get started in three simple steps
            </Text>
          </Flex>

          <Grid columns={{ initial: "1", md: "3" }} gap="6">
            <StepCard
              number="1"
              title="Browse or Search"
              description="Explore classes and find the files you need using our powerful search."
            />
            <StepCard
              number="2"
              title="Access Files Instantly"
              description="View, download, or bookmark files with a single click."
            />
            <StepCard
              number="3"
              title="Contribute Your Own"
              description="Upload and share your study materials to help the community."
            />
          </Grid>
        </Container>
      </Section>

      {/* Top 3 Most Accessed Files Section */}
      {topFiles.length > 0 && (
        <Section size="3">
          <Container size="4">
            <Flex
              direction="column"
              align="center"
              gap="6"
              style={{ marginBottom: "48px" }}
            >
              <Heading size="8" align="center">
                Most Popular Files
              </Heading>
              <Text
                size="3"
                color="gray"
                align="center"
                style={{ maxWidth: "600px" }}
              >
                See what students are accessing right now
              </Text>
            </Flex>

            <Grid columns={{ initial: "1", md: "3" }} gap="4">
              {topFiles.map((file) => (
                <Card
                  key={file.fileId}
                  style={{ cursor: "pointer" }}
                  className="file-card"
                >
                  <Flex direction="column" gap="3">
                    <Flex align="center" gap="2">
                      <FileTextIcon
                        width="20"
                        height="20"
                        color="var(--violet-11)"
                      />
                      <Text weight="bold" size="3" style={{ flex: 1 }}>
                        {file.fileName}
                      </Text>
                    </Flex>

                    <Text size="2" color="gray">
                      {file.className}
                    </Text>

                    <Flex align="center" justify="between">
                      <Text size="1" color="gray">
                        {file.accessCount}{" "}
                        {file.accessCount === 1 ? "view" : "views"}
                      </Text>
                      <Link href={`/file/${file.fileId}`}>
                        <Button size="1" variant="soft" color="violet">
                          View File
                        </Button>
                      </Link>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Container>
        </Section>
      )}

      {/* FAQ Section */}
      <Section size="3" style={{ background: "var(--gray-a2)" }}>
        <Container size="4">
          <Flex
            direction="column"
            align="center"
            gap="6"
            style={{ marginBottom: "48px" }}
          >
            <Heading size="8" align="center">
              Frequently Asked Questions
            </Heading>
          </Flex>

          <Box style={{ maxWidth: "800px", margin: "0 auto" }}>
            <FAQItem
              question="Who can upload files?"
              answer="Any registered user can upload files. All uploads go through an approval process by administrators to ensure quality and relevance."
            />
            <FAQItem
              question="Is it free to use?"
              answer="Yes! ClassVault is completely free for students and educators. You can browse, download, and upload files without any cost."
            />
            <FAQItem
              question="How are files organized?"
              answer="Files are organized by class and automatically tagged. You can browse by class or use our search feature to find specific materials."
            />
            <FAQItem
              question="Can I download files for offline access?"
              answer="Yes, all approved files can be downloaded for offline access. Simply click the download button on any file page."
            />
          </Box>
        </Container>
      </Section>

      {/* Final CTA Section */}
      <Section size="3">
        <Container size="4">
          <Flex
            direction="column"
            align="center"
            gap="5"
            style={{ textAlign: "center", padding: "48px 0" }}
          >
            <Heading size="8">Ready to Get Started?</Heading>
            <Text size="4" color="gray" style={{ maxWidth: "500px" }}>
              Join hundreds of students organizing and sharing their class
              materials.
            </Text>
            <Link href="/sign-up">
              <Button size="4" color="violet">
                Create Free Account
              </Button>
            </Link>
          </Flex>
        </Container>
      </Section>

      {/* Footer */}
      <Box style={{ borderTop: "1px solid var(--gray-a5)" }}>
        <Container size="4">
          <Flex
            justify="between"
            align="center"
            gap="4"
            style={{ padding: "24px 0" }}
            wrap="wrap"
          >
            <Text size="2" color="gray">
              Made by{" "}
              <RadixLink
                href="https://github.com/FlyingFork"
                target="_blank"
                rel="noopener noreferrer"
              >
                FlyingFork
              </RadixLink>
            </Text>

            <RadixLink
              href="https://github.com/FlyingFork/classvault"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
            >
              <Flex align="center" gap="2">
                <GitHubLogoIcon width="20" height="20" />
              </Flex>
            </RadixLink>
          </Flex>
        </Container>
      </Box>

      {/* Inline styles for card hover effects */}
      <style jsx global>{`
        .file-card {
          transition:
            transform 0.15s,
            box-shadow 0.15s;
        }
        .file-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .feature-card {
          transition:
            transform 0.15s,
            box-shadow 0.15s;
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Card className="feature-card">
      <Flex direction="column" gap="3">
        <Box
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "8px",
            background: `var(--${color}-a3)`,
            color: `var(--${color}-11)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Heading size="4">{title}</Heading>
        <Text size="2" color="gray">
          {description}
        </Text>
      </Flex>
    </Card>
  );
}

// Step Card Component
function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      gap="3"
      style={{ textAlign: "center" }}
    >
      <Box
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "var(--violet-a3)",
          color: "var(--violet-11)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        {number}
      </Box>
      <Heading size="5">{title}</Heading>
      <Text size="2" color="gray">
        {description}
      </Text>
    </Flex>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box style={{ marginBottom: "16px" }}>
      <Button
        variant="soft"
        color="gray"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          justifyContent: "space-between",
          padding: "16px",
          cursor: "pointer",
        }}
      >
        <Text weight="medium">{question}</Text>
        <ChevronDownIcon
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </Button>
      {isOpen && (
        <Box
          style={{
            padding: "16px",
            background: "var(--gray-a2)",
            borderRadius: "8px",
            marginTop: "8px",
          }}
        >
          <Text size="2" color="gray">
            {answer}
          </Text>
        </Box>
      )}
    </Box>
  );
}
