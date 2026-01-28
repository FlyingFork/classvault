"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Flex, Text } from "@radix-ui/themes";

import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Logo } from "@/app/components/Logo";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";

import styles from "./style.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Box
      asChild
      className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}
    >
      <header>
        <Flex
          align="center"
          justify="between"
          px={{ initial: "4", sm: "6" }}
          py="3"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Left: Logo */}
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "var(--gray-12)",
              transition: "color 0.2s ease",
            }}
          >
            <Flex align="center" gap="2">
              <Logo size={36} />
              <Text size="5" weight="bold">
                ClassVault
              </Text>
            </Flex>
          </Link>

          {/* Center: Navigation Links (Desktop) */}
          <NavLinks />

          {/* Right: Desktop Actions */}
          <Flex
            gap="4"
            align="center"
            display={{ initial: "none", md: "flex" }}
          >
            <ThemeToggle />
            <UserMenu />
          </Flex>

          {/* Right: Mobile Actions */}
          <Flex
            gap="3"
            align="center"
            display={{ initial: "flex", md: "none" }}
          >
            <ThemeToggle />
            <MobileMenu />
          </Flex>
        </Flex>
      </header>
    </Box>
  );
}
