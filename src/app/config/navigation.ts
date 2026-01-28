import {
  HomeIcon,
  ReaderIcon,
  GearIcon,
  BellIcon,
  PersonIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";

export interface NavLink {
  href: string;
  label: string;
  icon?: React.ComponentType<{ width?: number; height?: number }>;
}

// Main navigation links shown in navbar
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/browse", label: "Browse", icon: ReaderIcon },
];

// User dropdown menu links
export const USER_MENU_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: PersonIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
  { href: "/notifications", label: "Notifications", icon: BellIcon },
];

// Admin-only menu links
export const ADMIN_MENU_LINKS: NavLink[] = [
  { href: "/admin", label: "Admin Panel", icon: LockClosedIcon },
];

// Routes where navbar should be hidden
export const NAVBAR_BLACKLIST: Array<string | RegExp> = [
  "/sign-in",
  "/sign-up",
];

export function isNavbarHidden(pathname: string): boolean {
  return NAVBAR_BLACKLIST.some((rule) =>
    typeof rule === "string" ? pathname === rule : rule.test(pathname),
  );
}
