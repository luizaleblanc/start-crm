"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/shared/auth/auth-context";
import { AuthGuard } from "@/shared/auth/auth-guard";
import { AppShell } from "@/shared/ui/layout/app-shell";
import type { SidebarItem } from "@/shared/ui/layout/sidebar";
import { LogoMark } from "@/shared/ui/logo-mark";

const NAV_ITEMS: Array<Omit<SidebarItem, "active">> = [
  { label: "Painel", href: "/" },
  { label: "Leads", href: "/leads" },
  { label: "Negócios", href: "/deals" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShellWithNav>{children}</AppShellWithNav>
    </AuthGuard>
  );
}

function AppShellWithNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const items: SidebarItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  }));

  return (
    <AppShell
      sidebarItems={items}
      sidebarHeader={
        <div className="flex items-center gap-2">
          <LogoMark size={28} className="text-foreground" />
          <span className="text-h5 font-bold text-foreground">StartCRM</span>
        </div>
      }
      sidebarFooter={
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-md bg-foreground px-3 py-2 text-left text-body text-background transition-opacity hover:opacity-90"
        >
          Sair
        </button>
      }
      pageActions={<span className="text-body text-foreground">{user?.name}</span>}
    >
      {children}
    </AppShell>
  );
}
