"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SonnerToaster
      position="top-center"
      richColors
      theme={(resolvedTheme as "light" | "dark") ?? "light"}
      toastOptions={{
        style: {
          background: "var(--color-panel)",
          color: "var(--gray-12)",
          border: "1px solid var(--gray-6)",
        },
      }}
    />
  );
}
