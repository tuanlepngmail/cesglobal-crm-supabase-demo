"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/login/actions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: string;
  label: string;
  matches?: (pathname: string) => boolean;
};

const NAV: NavItem[] = [
  { href: "/", icon: "dashboard", label: "Dashboard", matches: (p) => p === "/" },
  {
    href: "/leads",
    icon: "group",
    label: "Leads",
    matches: (p) => p === "/leads" || p.startsWith("/leads/"),
  },
  { href: "/calendar", icon: "calendar_today", label: "Lịch làm việc" },
  { href: "/reports", icon: "analytics", label: "Reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 sticky top-0 bg-ivory border-r border-border-cream py-5 px-3 gap-2">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 py-3 mb-3">
        <div className="w-8 h-8 rounded-xl bg-terracotta flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined !text-[16px] text-ivory filled">hub</span>
        </div>
        <div>
          <h1 className="font-headline text-[17px] font-medium text-near-black leading-none">
            CRM Pro
          </h1>
          <p className="text-[10px] text-stone-gray uppercase tracking-[0.18em] mt-0.5">
            Sales Intelligence
          </p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 flex-grow">
        <p className="text-[10px] font-semibold text-warm-silver uppercase tracking-widest px-3 mb-1">
          Menu
        </p>
        {NAV.map((item) => {
          const active = item.matches
            ? item.matches(pathname)
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-[14px] font-medium",
                active
                  ? "bg-terracotta/10 text-terracotta"
                  : "text-olive-gray hover:bg-warm-sand hover:text-near-black",
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined !text-[20px] transition-all",
                  active ? "filled" : "",
                )}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-terracotta" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer nav */}
      <div className="flex flex-col gap-0.5 pt-4 border-t border-border-cream">
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-olive-gray hover:bg-warm-sand hover:text-near-black transition-colors text-[14px] font-medium"
        >
          <span className="material-symbols-outlined !text-[20px]">help_outline</span>
          <span>Help</span>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-olive-gray hover:bg-rose-50 hover:text-rose-600 transition-colors text-[14px] font-medium"
          >
            <span className="material-symbols-outlined !text-[20px]">logout</span>
            <span>Đăng xuất</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
