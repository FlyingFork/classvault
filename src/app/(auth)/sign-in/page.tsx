"use client";

import * as z from "zod";
import { Form } from "radix-ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Controller, useForm, FieldErrors } from "react-hook-form";

import {
  Card,
  Button,
  Flex,
  Text,
  TextField,
  Checkbox,
  Heading,
  Link,
  Spinner,
  IconButton,
} from "@radix-ui/themes";
import { EyeOpenIcon, EyeNoneIcon } from "@radix-ui/react-icons";

import { toast } from "sonner";
import { useTransition, Suspense, useState } from "react";
import { authClient } from "@/auth-client";
import { SignInSkeleton } from "./skeleton";

const signInSchema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

const emailOnlySchema = signInSchema.pick({
  email: true,
});

type SignInFormValues = z.infer<typeof signInSchema>;

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { data: session, isPending } = authClient.useSession();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),

    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = (data: SignInFormValues) => {
    startTransition(async () => {
      await authClient.signIn.email(
        {
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
          callbackURL: callbackUrl,
        },
        {
          onError() {
            toast.error("Invalid Email or Password!");
          },
        },
      );
    });
  };

  const onError = (errors: FieldErrors<SignInFormValues>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  if (isPending) {
    return <SignInSkeleton />;
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
      <Card size="4" style={{ width: "100%", maxWidth: 360 }}>
        <Flex direction="column">
          <Heading size="6">Welcome back!</Heading>
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

            <Form.Field name="rememberMe">
              <Flex align="center" gap="2">
                <Form.Control asChild>
                  <Controller
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    )}
                  />
                </Form.Control>

                <Form.Label asChild>
                  <Text as="label" size="2">
                    Remember me
                  </Text>
                </Form.Label>
              </Flex>
            </Form.Field>

            <Form.Submit disabled={loading} asChild>
              <Button type="submit" style={{ width: "100%", maxWidth: 360 }}>
                {loading ? <Spinner /> : "Sign In"}
              </Button>
            </Form.Submit>

            <Text>
              Don&apos;t have an account?{" "}
              <Link
                href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                Sign up here!
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
    <Suspense fallback={<SignInSkeleton />}>
      <SignInContent />
    </Suspense>
  );
}
