"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOutIcon, LuggageIcon, MenuIcon, UserIcon, XIcon } from "@/components/icons";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/components/providers/auth-provider";
import { buttonClass } from "@/components/ui";

const NAV_LINKS = [
  { href: "/#services", label: "บริการ" },
  { href: "/#explore", label: "ที่เที่ยว" },
  { href: "/#pricing", label: "ราคา" },
  { href: "/#branches", label: "สาขา" },
  { href: "/#reviews", label: "รีวิว" },
];

const ACCOUNT_LINKS = [
  { href: "/dashboard", label: "การจองของฉัน" },
  { href: "/retrieve", label: "รับคืนกระเป๋า" },
  { href: "/driver", label: "Live Driver Mode" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, requireAuth, openLogin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close menus on navigation (state derived during render, no effect needed).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setAccountOpen(false);
  }

  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [accountOpen]);

  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4" aria-label="เมนูหลัก">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-xl bg-cta">
            <LuggageIcon className="text-xl" />
          </span>
          Bag Free
        </Link>

        <ul className="ml-6 hidden items-center gap-1 @4xl:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => requireAuth("/book")}
            className={buttonClass("primary", "sm", "hidden @md:inline-flex")}
          >
            จองเลย
          </button>

          {loading ? (
            <span className="size-9 animate-pulse rounded-full bg-white/20" aria-label="กำลังโหลด" />
          ) : user ? (
            <>
            <NotificationBell />
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label="เมนูบัญชี"
              >
                <UserIcon />
              </button>
              {accountOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 animate-pop-in overflow-hidden rounded-2xl border border-line bg-card text-ink shadow-xl"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  {ACCOUNT_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm transition hover:bg-alt"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="flex w-full cursor-pointer items-center gap-2 border-t border-line px-4 py-2.5 text-left text-sm text-danger transition hover:bg-danger-soft"
                  >
                    <LogOutIcon /> ออกจากระบบ
                  </button>
                </div>
              ) : null}
            </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              className="h-9 cursor-pointer rounded-xl border-2 border-white/70 px-3 text-sm font-semibold transition hover:bg-white hover:text-navy"
            >
              เข้าสู่ระบบ
            </button>
          )}

          <button
            type="button"
            className="grid size-9 cursor-pointer place-items-center rounded-lg transition hover:bg-white/10 @4xl:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <XIcon className="text-xl" /> : <MenuIcon className="text-xl" />}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="animate-fade-in border-t border-white/10 bg-navy-dark @4xl:hidden">
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-white/85 hover:bg-white/10"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 @md:hidden">
              <button
                type="button"
                onClick={() => requireAuth("/book")}
                className={buttonClass("primary", "md", "w-full")}
              >
                จองเลย
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
