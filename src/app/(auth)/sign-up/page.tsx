"use client";

import * as z from "zod";
import { Form } from "radix-ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldErrors } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";

import {
  Card,
  Button,
  Flex,
  Text,
  TextField,
  Heading,
  Link,
  Spinner,
  IconButton,
} from "@radix-ui/themes";
import { EyeOpenIcon, EyeNoneIcon } from "@radix-ui/react-icons";

import { toast } from "sonner";
import { useTransition, Suspense, useState } from "react";
import { authClient } from "@/auth-client";
import { SignUpSkeleton } from "./skeleton";

const signUpSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

const emailOnlySchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { data: session, isPending } = authClient.useSession();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),

    defaultValues: {
      email: "",
      password: "",
      username: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    startTransition(async () => {
      const { data: usernameResponse } = await authClient.isUsernameAvailable({
        username: data.username,
      });

      if (!usernameResponse?.available) {
        toast.error("Username is not available.");
        return;
      }

      await authClient.signUp.email(
        {
          email: data.email,
          name: data.username,
          username: data.username,
          password: data.password,
          callbackURL: callbackUrl,
        },
        {
          onError() {
            toast.error("Failed to sign up.");
          },
        },
      );
    });
  };

  const onError = (errors: FieldErrors<SignUpFormValues>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  if (isPending) {
    return <SignUpSkeleton />;
  }

  if (session && session.user) {
    const onSignOut = () => {
      startTransition(async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/");
            },
          },
        });
      });
    };

    return (
      <Flex align="center" justify="center" height="100vh" px="4">
        <Card size="4">
          <Flex direction="column">
            <Heading>You&apos;re already signed in.</Heading>
            <Text color="gray">
              To log in or create a new account, please sign out first.
            </Text>
            <Button
              onClick={onSignOut}
              disabled={loading}
              style={{ marginTop: 20 }}
            >
              {loading ? <Spinner /> : "Sign Out"}
            </Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" height="100vh" px="4">
      <Card size="4" variant="classic" style={{ width: "100%", maxWidth: 360 }}>
        <Flex direction="column">
          <Heading size="6">Welcome to ClassVault!</Heading>
          <Text color="gray">Please enter your details.</Text>
        </Flex>

        <Form.Root
          onSubmit={form.handleSubmit(onSubmit, onError)}
          style={{ marginTop: 20 }}
        >
          <Flex direction="column" gap="4" style={{ width: "100%" }}>
            <Form.Field name="email">
              <Flex direction="column" gap="2">
                <Form.Label asChild>
                  <Text as="label" size="2" weight="medium">
                    Email
                  </Text>
                </Form.Label>

                <Form.Control asChild>
                  <TextField.Root
                    type="email"
                    required
                    placeholder="Please enter your email."
                    style={{ width: "100%", maxWidth: 360 }}
                    {...form.register("email")}
                  />
                </Form.Control>

                <Form.Message match="valueMissing" asChild>
                  <Text size="1" color="red">
                    Email is required
                  </Text>
                </Form.Message>
                <Form.Message match="typeMismatch" asChild>
                  <Text size="1" color="red">
                    Please enter a valid email address
                  </Text>
                </Form.Message>
                <Form.Message
                  match={(value: string) => {
                    return !emailOnlySchema.safeParse({ email: value }).success;
                  }}
                  asChild
                >
                  <Text size="1" color="red">
                    Please enter a valid email address
                  </Text>
                </Form.Message>
              </Flex>
            </Form.Field>

            <Form.Field name="username">
              <Flex direction="column" gap="2">
                <Form.Label asChild>
                  <Text as="label" size="2" weight="medium">
                    Username
                  </Text>
                </Form.Label>

                <Form.Control asChild>
                  <TextField.Root
                    type="text"
                    required
                    placeholder="Please enter your username."
                    style={{ width: "100%", maxWidth: 360 }}
                    {...form.register("username")}
                  />
                </Form.Control>

                <Form.Message match="valueMissing" asChild>
                  <Text size="1" color="red">
                    Username is required
                  </Text>
                </Form.Message>
              </Flex>
            </Form.Field>

            <Form.Field name="password">
              <Flex direction="column" gap="2">
                <Form.Label asChild>
                  <Text as="label" size="2" weight="medium">
                    Password
                  </Text>
                </Form.Label>

                <Form.Control asChild>
                  <TextField.Root
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Please enter your password."
                    style={{ width: "100%", maxWidth: 360 }}
                    {...form.register("password")}
                  >
                    <TextField.Slot side="right">
                      <IconButton
                        size="1"
                        variant="ghost"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                      </IconButton>
                    </TextField.Slot>
                  </TextField.Root>
                </Form.Control>

                <Form.Message match="valueMissing" asChild>
                  <Text size="1" color="red">
                    Password is required
                  </Text>
                </Form.Message>
              </Flex>
            </Form.Field>

            <Form.Field name="passwordConfirmation">
              <Flex direction="column" gap="2">
                <Form.Label asChild>
                  <Text as="label" size="2" weight="medium">
                    Confirm Password
                  </Text>
                </Form.Label>

                <Form.Control asChild>
                  <TextField.Root
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Please enter your password."
                    style={{ width: "100%", maxWidth: 360 }}
                    {...form.register("passwordConfirmation")}
                  >
                    <TextField.Slot side="right">
                      <IconButton
                        size="1"
                        variant="ghost"
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeNoneIcon />
                        ) : (
                          <EyeOpenIcon />
                        )}
                      </IconButton>
                    </TextField.Slot>
                  </TextField.Root>
                </Form.Control>

                <Form.Message match="valueMissing" asChild>
                  <Text size="1" color="red">
                    Password is required
                  </Text>
                </Form.Message>
              </Flex>
            </Form.Field>

            <Form.Submit disabled={loading} asChild>
              <Button type="submit" style={{ width: "100%", maxWidth: 360 }}>
                {loading ? <Spinner /> : "Sign Up"}
              </Button>
            </Form.Submit>

            <Text>
              Already have an account?{" "}
              <Link
                href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                Sign in here!
              </Link>
            </Text>
          </Flex>
        </Form.Root>
      </Card>
    </Flex>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SignUpSkeleton />}>
      <SignUpContent />
    </Suspense>
  );
}
