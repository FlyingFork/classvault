import {
  Card,
  Button,
  Flex,
  Text,
  TextField,
  Checkbox,
  Heading,
  Skeleton,
} from "@radix-ui/themes";

export function SignInSkeleton() {
  return (
    <Flex align="center" justify="center" height="100vh" px="4">
      <Card size="4" style={{ width: "100%", maxWidth: 360 }}>
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

          {/* Remember me checkbox */}
          <Flex align="center" gap="2">
            <Skeleton>
              <Checkbox />
            </Skeleton>
            <Skeleton>
              <Text as="label" size="2">
                Remember me
              </Text>
            </Skeleton>
          </Flex>

          {/* Submit button */}
          <Skeleton>
            <Button type="submit" style={{ width: "100%", maxWidth: 360 }}>
              Sign In
            </Button>
          </Skeleton>

          {/* Sign up link */}
          <Skeleton>
            <Text>Don&apos;t have an account? Sign up here!</Text>
          </Skeleton>
        </Flex>
      </Card>
    </Flex>
  );
}
