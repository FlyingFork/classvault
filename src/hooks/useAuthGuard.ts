"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/auth-client";

interface UseAuthGuardOptions {
  requiredRole?: string;
}

export function useAuthGuard(options?: UseAuthGuardOptions) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { requiredRole } = options || {};

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/sign-in");
      } else if (requiredRole && session.user?.role !== requiredRole) {
        router.push("/");
      }
    }
  }, [session, isPending, router, requiredRole]);

  return { session, isPending };
}
