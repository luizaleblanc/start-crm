"use client";

import {
  BarChart3,
  Calendar,
  Handshake,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/shared/auth/auth-context";
import { AuthGuard } from "@/shared/auth/auth-guard";
import { Avatar } from "@/shared/ui/avatar";
import { AppShell } from "@/shared/ui/layout/app-shell";
import type { SidebarItem } from "@/shared/ui/layout/sidebar";
import { LogoMark } from "@/shared/ui/logo-mark";

const NAV_ITEMS: Array<Omit<SidebarItem, "active">> = [
  { label: "Painel", href: "/", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Negócios", href: "/deals", icon: Handshake },
  { label: "Administração", href: "#administracao", icon: Settings, disabled: true },
];

const INTEGRATIONS_SECTION = {
  label: "Integrações",
  items: [
    { label: "Reuniões", icon: Calendar, badge: "breve" },
    { label: "Relatórios", icon: BarChart3, badge: "breve" },
    { label: "WhatsApp", icon: MessageCircle, badge: "breve" },
  ],
};

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
  const [collapsed, setCollapsed] = useState(false);

  const items: SidebarItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    active: item.disabled
      ? false
      : item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href),
  }));

  const activeItem = items.find((item) => item.active);

  return (
    <AppShell
      sidebarItems={items}
      sidebarSecondarySection={INTEGRATIONS_SECTION}
      sidebarCollapsed={collapsed}
      onToggleSidebarCollapse={() => setCollapsed((current) => !current)}
      pageTitle={activeItem?.label}
      sidebarHeader={
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center">
            <LogoMark size={38} className="text-foreground" />
          </span>
        </div>
      }
      sidebarFooter={
        user &&
        (collapsed ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={user.name} size="sm" />
            <button
              type="button"
              onClick={logout}
              aria-label="Sair"
              title="Sair"
              className="hover:bg-foreground/5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut aria-hidden size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-caption font-medium text-foreground">{user.name}</span>
              <span className="truncate text-caption text-muted-foreground">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Sair"
              title="Sair"
              className="hover:bg-foreground/5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut aria-hidden size={16} />
            </button>
          </div>
        ))
      }
      search
      notifications
    >
      {children}
    </AppShell>
  );
}
