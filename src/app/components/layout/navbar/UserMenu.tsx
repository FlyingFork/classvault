"use client";

import * as React from "react";
import Link from "next/link";
import { authClient } from "@/auth-client";
import {
  AlertDialog,
  Avatar,
  Button,
  DropdownMenu,
  Flex,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { ChevronDownIcon, ExitIcon } from "@radix-ui/react-icons";
import { USER_MENU_LINKS, ADMIN_MENU_LINKS } from "@/app/config/navigation";

export function UserMenu() {
  const [loading, startTransition] = React.useTransition();
  const [signOutDialogOpen, setSignOutDialogOpen] = React.useState(false);
  const { data: session } = authClient.useSession();

  const user = session?.user;

  if (!user) {
    return (
      <Button asChild variant="solid">
        <Link href="/sign-in">Sign In</Link>
      </Button>
    );
  }

  const displayName = user.name || user.email || "User";
  const avatarFallback = displayName.charAt(0).toUpperCase();
  const isAdmin = user.role === "admin";

  const handleSignOut = () => {
    setSignOutDialogOpen(true);
  };

  const confirmSignOut = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setSignOutDialogOpen(false);
          },
        },
      });
    });
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button
            variant="ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              padding: "4px 12px 4px 4px",
            }}
          >
            <Avatar size="2" fallback={avatarFallback} radius="full" />
            <Text size="2" weight="medium">
              {displayName}
            </Text>
            <ChevronDownIcon width={14} height={14} />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="end" sideOffset={8}>
          <Flex direction="column" gap="1" p="2" pb="3">
            <Text size="2" weight="medium">
              {displayName}
            </Text>
            {user.email && (
              <Text size="1" color="gray">
                {user.email}
              </Text>
            )}
          </Flex>

          <DropdownMenu.Separator />

          {USER_MENU_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <DropdownMenu.Item key={link.href} asChild>
                <Link
                  href={link.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none",
                  }}
                >
                  {Icon && <Icon width={16} height={16} />}
                  {link.label}
                </Link>
              </DropdownMenu.Item>
            );
          })}

          {isAdmin && (
            <>
              <DropdownMenu.Separator />
              {ADMIN_MENU_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <DropdownMenu.Item key={link.href} asChild>
                    <Link
                      href={link.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none",
                      }}
                    >
                      {Icon && <Icon width={16} height={16} />}
                      {link.label}
                    </Link>
                  </DropdownMenu.Item>
                );
              })}
            </>
          )}

          <DropdownMenu.Separator />

          <DropdownMenu.Item color="red" onClick={handleSignOut}>
            <Flex align="center" gap="2">
              <ExitIcon width={16} height={16} />
              Sign Out
            </Flex>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog.Root
        open={signOutDialogOpen}
        onOpenChange={setSignOutDialogOpen}
      >
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Sign Out</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure you want to sign out? You will need to sign in again to
            access your account.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action disabled={loading}>
              <Button variant="solid" color="red" onClick={confirmSignOut}>
                {loading ? <Spinner /> : "Sign Out"}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}
