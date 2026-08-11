"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Today" },
  { href: "/stats", label: "My Stats" },
  { href: "/group", label: "Group" },
];

export default function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-brand-700">💪 Push-Up Challenge</span>
          <nav className="hidden gap-4 sm:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname === link.href
                    ? "text-brand-700"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">Hi, {userName}</span>
          <button onClick={logout} className="btn-secondary !px-3 !py-1.5 text-xs">
            Log out
          </button>
        </div>
      </div>
      <nav className="flex gap-4 border-t border-slate-100 px-4 py-2 sm:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium ${
              pathname === link.href ? "text-brand-700" : "text-slate-500"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
