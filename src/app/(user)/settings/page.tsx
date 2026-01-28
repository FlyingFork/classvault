"use client";

import { useEffect } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function SettingsPage() {
  const { session, isPending } = useAuthGuard();

  useEffect(() => {
    if (session?.user) {
      console.log("Settings - Full user data:", session.user);
    }
  }, [session]);

  if (isPending || !session?.user) {
    return (
      <div className="container mx-auto p-8">
        <div>Loading...</div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="bg-card rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>

        <div className="space-y-2">
          <div>
            <span className="font-medium">Email:</span>{" "}
            <span>{user.email}</span>
          </div>

          <div>
            <span className="font-medium">Username:</span>{" "}
            <span>{user.displayUsername || user.username || "Not set"}</span>
          </div>

          <div>
            <span className="font-medium">Role:</span>{" "}
            <span>{user.role || "user"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
