"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/shared/auth/auth-context";
import { AuthGuard } from "@/shared/auth/auth-guard";
import { Button } from "@/shared/ui/button";
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
      pageActions={
        <div className="flex items-center gap-3">
          <span className="text-caption text-muted-foreground">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
