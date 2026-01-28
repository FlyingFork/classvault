"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flex } from "@radix-ui/themes";
import { NAV_LINKS } from "@/app/config/navigation";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <Flex gap="6" align="center" display={{ initial: "none", md: "flex" }}>
      {NAV_LINKS.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: isActive ? "var(--accent-9)" : "var(--gray-11)",
              transition: "color 0.2s ease",
              position: "relative",
              paddingBottom: "4px",
            }}
          >
            {Icon && <Icon width={16} height={16} />}
            {link.label}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: 0,
                  right: 0,
                  height: "2px",
                  backgroundColor: "var(--accent-9)",
                  borderRadius: "1px",
                }}
              />
            )}
          </Link>
        );
      })}
    </Flex>
  );
}
