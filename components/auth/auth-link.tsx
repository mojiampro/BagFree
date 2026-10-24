"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";

/** A link-like button that opens the login modal for guests before going to a protected page. */
export function AuthLink({
  href,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const { requireAuth } = useAuth();
  return (
    <button type="button" className={className} onClick={() => requireAuth(href)} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
