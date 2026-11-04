import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import type { SidebarItem, SidebarStaticItem } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  sidebarItems: SidebarItem[];
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  sidebarSecondarySection?: { label: string; items: SidebarStaticItem[] };
  sidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  pageTitle?: string;
  pageSubtitle?: string;
  pageActions?: ReactNode;
  search?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  notifications?: boolean;
  children: ReactNode;
}

export function AppShell({
  sidebarItems,
  sidebarHeader,
  sidebarFooter,
  sidebarSecondarySection,
  sidebarCollapsed,
  onToggleSidebarCollapse,
  pageTitle,
  pageSubtitle,
  pageActions,
  search,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  notifications,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar
        items={sidebarItems}
        header={sidebarHeader}
        footer={sidebarFooter}
        secondarySection={sidebarSecondarySection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebarCollapse}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={pageActions}
          search={search}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
          searchPlaceholder={searchPlaceholder}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 pb-8 pt-8">{children}</main>
      </div>
    </div>
  );
}
