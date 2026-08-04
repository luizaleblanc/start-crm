import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import type { SidebarItem } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  sidebarItems: SidebarItem[];
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  pageTitle?: string;
  pageActions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  sidebarItems,
  sidebarHeader,
  sidebarFooter,
  pageTitle,
  pageActions,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar items={sidebarItems} header={sidebarHeader} footer={sidebarFooter} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={pageTitle} actions={pageActions} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
