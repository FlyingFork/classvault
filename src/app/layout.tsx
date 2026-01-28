import type { Metadata } from "next";

import "./globals.css";
import "@radix-ui/themes/styles.css";

import { Toaster } from "./components/Toaster";

import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";

import LayoutShell from "./components/layout/navbar/layout";
import { Background } from "./components/BodyBackground";

export const metadata: Metadata = {
  title: "ClassVault",
  description: "Class Vault",
};

const THEME_CONTEXT_VALUE = { light: "light-theme", dark: "dark-theme" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          disableTransitionOnChange
          attribute="class"
          value={THEME_CONTEXT_VALUE}
          defaultTheme="system"
        >
          <Theme accentColor="violet" grayColor="slate">
            <Background />
            <LayoutShell>{children}</LayoutShell>
            <Toaster />
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
