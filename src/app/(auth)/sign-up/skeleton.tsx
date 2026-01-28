import {
  Card,
  Button,
  Flex,
  Text,
  TextField,
  Heading,
  Skeleton,
} from "@radix-ui/themes";

export function SignUpSkeleton() {
  return (
    <Flex align="center" justify="center" height="100vh" px="4">
      <Card size="4" variant="classic" style={{ width: "100%", maxWidth: 360 }}>
        <Flex direction="column" gap="2">
          <Skeleton>
            <Heading size="6">Loading placeholder text</Heading>
          </Skeleton>
          <Skeleton>
            <Text color="gray">Loading placeholder description</Text>
          </Skeleton>
        </Flex>

        <Flex
          direction="column"
          gap="4"
          style={{ width: "100%", marginTop: 20 }}
        >
          {/* Email field */}
          <Flex direction="column" gap="2">
            <Skeleton>
              <Text as="label" size="2" weight="medium">
                Email
              </Text>
            </Skeleton>
            <Skeleton>
              <TextField.Root
                type="email"
                placeholder="Please enter your email."
                style={{ width: "100%", maxWidth: 360 }}
              />
            </Skeleton>
          </Flex>

          {/* Username field */}
          <Flex direction="column" gap="2">
            <Skeleton>
              <Text as="label" size="2" weight="medium">
                Username
              </Text>
            </Skeleton>
            <Skeleton>
              <TextField.Root
                type="text"
                placeholder="Please enter your username."
                style={{ width: "100%", maxWidth: 360 }}
              />
            </Skeleton>
          </Flex>

          {/* Password field */}
          <Flex direction="column" gap="2">
            <Skeleton>
              <Text as="label" size="2" weight="medium">
                Password
              </Text>
            </Skeleton>
            <Skeleton>
              <TextField.Root
                type="password"
                placeholder="Please enter your password."
                style={{ width: "100%", maxWidth: 360 }}
              />
            </Skeleton>
          </Flex>

          {/* Confirm Password field */}
          <Flex direction="column" gap="2">
            <Skeleton>
              <Text as="label" size="2" weight="medium">
                Confirm Password
              </Text>
            </Skeleton>
            <Skeleton>
              <TextField.Root
                type="password"
                placeholder="Please enter your password."
                style={{ width: "100%", maxWidth: 360 }}
              />
            </Skeleton>
          </Flex>

          {/* Submit button */}
          <Skeleton>
            <Button type="submit" style={{ width: "100%", maxWidth: 360 }}>
              Sign Up
            </Button>
          </Skeleton>

          {/* Sign in link */}
          <Skeleton>
            <Text>Already have an account? Sign in here!</Text>
          </Skeleton>
        </Flex>
      </Card>
    </Flex>
  );
}
