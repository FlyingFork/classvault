"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Flex,
  Text,
  SegmentedControl,
  Button,
  IconButton,
  Avatar,
  Dialog,
  AlertDialog,
  TextField,
  Heading,
  Separator,
  Box,
  Badge,
  Grid,
  Table,
} from "@radix-ui/themes";
import {
  EyeOpenIcon,
  EyeNoneIcon,
  PersonIcon,
  LockClosedIcon,
  CrossCircledIcon,
  CheckCircledIcon,
  DownloadIcon,
  FileTextIcon,
  CalendarIcon,
  EnvelopeClosedIcon,
  ClockIcon,
  ExternalLinkIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";
import { UserWithRole } from "better-auth/plugins";
import { AdminPageLayout, StatCard, EmptyState } from "@/app/components/admin";
import {
  updateUserRole,
  updateUserPassword,
  banUser,
  unbanUser,
} from "./actions";

interface ActivityLog {
  id: string;
  accessedAt: string;
  fileName: string;
  fileId: string;
  className: string;
  ipAddress: string | null;
}

interface UserEditClientProps {
  initialUser: UserWithRole;
  stats: {
    totalRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalDownloads: number;
  };
  recentActivity: ActivityLog[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export default function UserEditClient({
  initialUser,
  stats,
  recentActivity,
}: UserEditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<UserWithRole>(initialUser);
  const [role, setRole] = useState<"admin" | "user">(
    initialUser.role === "admin" ? "admin" : "user",
  );

  // Role change dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<"admin" | "user" | null>(null);

  // Password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ban dialog state
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");

  const handleRoleChange = (newRole: string) => {
    const roleValue = newRole as "admin" | "user";
    if (roleValue !== role) {
      setPendingRole(roleValue);
      setRoleDialogOpen(true);
    }
  };

  const confirmRoleChange = () => {
    if (pendingRole) {
      startTransition(async () => {
        const result = await updateUserRole(user.id, pendingRole);

        if (result.error) {
          toast.error(result.error);
          setRoleDialogOpen(false);
          setPendingRole(null);
          return;
        }

        setRole(pendingRole);
        setUser({ ...user, role: pendingRole });
        toast.success(
          `Role updated to ${pendingRole === "admin" ? "Admin" : "Regular"}`,
        );
        setRoleDialogOpen(false);
        setPendingRole(null);
        router.refresh();
      });
    }
  };

  const cancelRoleChange = () => {
    setRoleDialogOpen(false);
    setPendingRole(null);
  };

  const handlePasswordChange = () => {
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    startTransition(async () => {
      const result = await updateUserPassword(user.id, password);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Password updated successfully");
      setPasswordDialogOpen(false);
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    });
  };

  const handleBanToggle = () => {
    const isBanned = user.banned || false;

    if (isBanned) {
      startTransition(async () => {
        const result = await unbanUser(user.id);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success("User unbanned successfully");
        setUser({ ...user, banned: false, banReason: null });
        setBanDialogOpen(false);
        router.refresh();
      });
    } else {
      if (!banReason.trim()) {
        toast.error("Please provide a reason for banning");
        return;
      }

      startTransition(async () => {
        const result = await banUser(user.id, banReason);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success("User banned successfully");
        setUser({ ...user, banned: true, banReason: banReason });
        setBanDialogOpen(false);
        setBanReason("");
        router.refresh();
      });
    }
  };

  const isBanned = user.banned || false;

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/users", name: "Users" },
        { url: `/admin/users/${user.id}`, name: user.name || user.email },
      ]}
    >
      {/* User Header */}
      <Card size="2">
        <Flex gap="4" align="center" wrap="wrap">
          <Avatar
            size="6"
            fallback={user.name?.charAt(0) || user.email.charAt(0)}
            radius="full"
          />
          <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 200 }}>
            <Flex align="center" gap="2" wrap="wrap">
              <Heading size="5">{user.name || "Unnamed User"}</Heading>
              <Badge
                color={role === "admin" ? "violet" : "gray"}
                variant="soft"
                size="1"
              >
                {role === "admin" ? "Admin" : "User"}
              </Badge>
              {isBanned && (
                <Badge color="red" variant="soft" size="1">
                  Banned
                </Badge>
              )}
            </Flex>
            <Flex align="center" gap="2">
              <EnvelopeClosedIcon width={12} height={12} />
              <Text size="2" color="gray">
                {user.email}
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <CalendarIcon width={12} height={12} />
              <Text size="1" color="gray">
                Joined {formatDate(user.createdAt.toString())}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Card>

      {/* Stats */}
      <Grid columns={{ initial: "2", sm: "4" }} gap="4">
        <StatCard
          icon={<FileTextIcon width={20} height={20} />}
          label="Upload Requests"
          value={stats.totalRequests}
          color="blue"
        />
        <StatCard
          icon={<CheckCircledIcon width={20} height={20} />}
          label="Approved"
          value={stats.approvedRequests}
          color="green"
        />
        <StatCard
          icon={<CrossCircledIcon width={20} height={20} />}
          label="Rejected"
          value={stats.rejectedRequests}
          color={stats.rejectedRequests > 0 ? "red" : "gray"}
        />
        <StatCard
          icon={<DownloadIcon width={20} height={20} />}
          label="Downloads"
          value={stats.totalDownloads}
          color="violet"
        />
      </Grid>

      {/* Ban Alert */}
      {isBanned && user.banReason && (
        <Card size="2" style={{ backgroundColor: "var(--red-a3)" }}>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <CrossCircledIcon width={16} height={16} color="var(--red-9)" />
              <Text size="2" weight="bold" color="red">
                This user is banned
              </Text>
            </Flex>
            <Text size="2" color="red">
              Reason: {user.banReason}
            </Text>
          </Flex>
        </Card>
      )}

      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        {/* Account Settings */}
        <Card size="2">
          <Flex direction="column" gap="4">
            <Heading size="4">Account Settings</Heading>

            {/* Role Section */}
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <PersonIcon width={14} height={14} />
                <Text size="2" weight="medium">
                  Role
                </Text>
              </Flex>
              <SegmentedControl.Root
                value={role}
                onValueChange={handleRoleChange}
                size="2"
              >
                <SegmentedControl.Item value="user">User</SegmentedControl.Item>
                <SegmentedControl.Item value="admin">
                  Admin
                </SegmentedControl.Item>
              </SegmentedControl.Root>
            </Flex>

            <Separator size="4" />

            {/* Password Section */}
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <LockClosedIcon width={14} height={14} />
                <Text size="2" weight="medium">
                  Password
                </Text>
              </Flex>
              <Dialog.Root
                open={passwordDialogOpen}
                onOpenChange={setPasswordDialogOpen}
              >
                <Dialog.Trigger>
                  <Button variant="outline" size="2">
                    Change Password
                  </Button>
                </Dialog.Trigger>

                <Dialog.Content style={{ maxWidth: 400 }}>
                  <Dialog.Title>Set Password</Dialog.Title>
                  <Dialog.Description size="2" mb="4">
                    Enter a new password (minimum 8 characters).
                  </Dialog.Description>

                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="medium">
                        Password
                      </Text>
                      <TextField.Root
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                    </Flex>

                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="medium">
                        Confirm Password
                      </Text>
                      <TextField.Root
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    </Flex>

                    <Flex gap="3" mt="2" justify="end">
                      <Dialog.Close>
                        <Button variant="soft" color="gray">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button
                        onClick={handlePasswordChange}
                        disabled={isPending}
                      >
                        Update Password
                      </Button>
                    </Flex>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>
            </Flex>

            <Separator size="4" />

            {/* Status Section */}
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                {isBanned ? (
                  <CrossCircledIcon width={14} height={14} />
                ) : (
                  <CheckCircledIcon width={14} height={14} />
                )}
                <Text size="2" weight="medium">
                  Account Status
                </Text>
              </Flex>

              {isBanned ? (
                <AlertDialog.Root
                  open={banDialogOpen}
                  onOpenChange={setBanDialogOpen}
                >
                  <AlertDialog.Trigger>
                    <Button variant="soft" color="green" size="2">
                      Unban User
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Content style={{ maxWidth: 400 }}>
                    <AlertDialog.Title>Unban User?</AlertDialog.Title>
                    <AlertDialog.Description size="2">
                      This will restore {user.name || user.email}&apos;s access
                      to their account.
                    </AlertDialog.Description>
                    <Flex gap="3" mt="4" justify="end">
                      <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">
                          Cancel
                        </Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action>
                        <Button
                          color="green"
                          onClick={handleBanToggle}
                          disabled={isPending}
                        >
                          Unban User
                        </Button>
                      </AlertDialog.Action>
                    </Flex>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              ) : (
                <Dialog.Root
                  open={banDialogOpen}
                  onOpenChange={setBanDialogOpen}
                >
                  <Dialog.Trigger>
                    <Button variant="soft" color="red" size="2">
                      Ban User
                    </Button>
                  </Dialog.Trigger>

                  <Dialog.Content style={{ maxWidth: 400 }}>
                    <Dialog.Title>Ban User</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                      Provide a reason for banning {user.name || user.email}.
                    </Dialog.Description>

                    <Flex direction="column" gap="3">
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="medium">
                          Ban Reason
                        </Text>
                        <TextField.Root
                          placeholder="e.g., Spamming, inappropriate behavior"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                        />
                      </Flex>

                      <Flex gap="3" mt="2" justify="end">
                        <Dialog.Close>
                          <Button variant="soft" color="gray">
                            Cancel
                          </Button>
                        </Dialog.Close>
                        <Button
                          color="red"
                          onClick={handleBanToggle}
                          disabled={isPending}
                        >
                          Ban User
                        </Button>
                      </Flex>
                    </Flex>
                  </Dialog.Content>
                </Dialog.Root>
              )}
            </Flex>
          </Flex>
        </Card>

        {/* Quick Links */}
        <Card size="2">
          <Flex direction="column" gap="4">
            <Heading size="4">Quick Links</Heading>
            <Flex direction="column" gap="2">
              <Button variant="soft" asChild>
                <Link href={`/admin/logs?userId=${user.id}`}>
                  <ClockIcon width={16} height={16} />
                  View All Activity Logs
                  <ExternalLinkIcon width={14} height={14} />
                </Link>
              </Button>
              <Button variant="soft" asChild>
                <Link href={`/admin/requests?userId=${user.id}`}>
                  <FileTextIcon width={16} height={16} />
                  View Upload Requests
                  <ExternalLinkIcon width={14} height={14} />
                </Link>
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Card size="2">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="4">Recent Downloads</Heading>
            {recentActivity.length > 0 && (
              <Button variant="ghost" size="1" asChild>
                <Link href={`/admin/logs?userId=${user.id}`}>View All</Link>
              </Button>
            )}
          </Flex>

          {recentActivity.length === 0 ? (
            <EmptyState
              icon={<DownloadIcon width={32} height={32} />}
              title="No downloads yet"
              description="This user hasn't downloaded any files"
            />
          ) : (
            <Box style={{ overflowX: "auto" }}>
              <Table.Root variant="surface" size="1">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>File</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Class</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>When</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell width="50px">
                      IP
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {recentActivity.map((log) => (
                    <Table.Row key={log.id}>
                      <Table.Cell>
                        <Link
                          href={`/admin/files/${log.fileId}`}
                          style={{ color: "var(--accent-9)" }}
                        >
                          <Text size="2">{log.fileName}</Text>
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {log.className}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {formatRelativeTime(log.accessedAt)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="1" color="gray">
                          {log.ipAddress || "—"}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Flex>
      </Card>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog.Root
        open={roleDialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelRoleChange();
        }}
      >
        <AlertDialog.Content style={{ maxWidth: 400 }}>
          <AlertDialog.Title>Change User Role?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure you want to change {user.name || user.email}&apos;s
            role to {pendingRole === "admin" ? "Admin" : "User"}?
            {pendingRole === "admin"
              ? " This will grant them administrative privileges."
              : " This will remove their administrative privileges."}
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button onClick={confirmRoleChange} disabled={isPending}>
                Confirm Change
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </AdminPageLayout>
  );
}
