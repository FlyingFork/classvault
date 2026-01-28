"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from ".";
import { isNavbarHidden } from "@/app/config/navigation";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavbar = pathname ? isNavbarHidden(pathname) : false;

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div style={!hideNavbar ? { marginTop: "80px" } : {}}>{children}</div>
    </>
  );
}
