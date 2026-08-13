import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../cn";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  active?: boolean;
  disabled?: boolean;
}

export interface SidebarStaticItem {
  label: string;
  icon?: LucideIcon;
  badge?: string;
}

interface SidebarSecondarySection {
  label: string;
  items: SidebarStaticItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  header?: ReactNode;
  footer?: ReactNode;
  secondarySection?: SidebarSecondarySection;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  items,
  header,
  footer,
  secondarySection,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200",
        collapsed ? "w-20" : "w-60",
      )}
    >
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight aria-hidden size={14} />
          ) : (
            <ChevronLeft aria-hidden size={14} />
          )}
        </button>
      )}

      {header && <div className="flex h-16 items-center px-6">{header}</div>}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <button
                key={item.label}
                type="button"
                disabled
                title={collapsed ? item.label : undefined}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-left text-body text-muted-foreground opacity-70"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {Icon && <Icon aria-hidden size={18} />}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <span className="bg-muted-foreground/10 rounded-full px-2 py-0.5 text-caption">
                      breve
                    </span>
                  </>
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "hover:bg-foreground/5 flex items-center gap-2.5 rounded-md px-3 py-2 text-body text-foreground transition-colors",
                item.active && "bg-primary/10 hover:bg-primary/10 font-medium text-primary",
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                {Icon && <Icon aria-hidden size={18} />}
              </span>
              {!collapsed && item.label}
            </Link>
          );
        })}

        {secondarySection && !collapsed && (
          <div className="mt-4 flex flex-col gap-1">
            <span className="px-3 text-h6 uppercase text-muted-foreground">
              {secondarySection.label}
            </span>
            {secondarySection.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-left text-body text-muted-foreground opacity-70"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {Icon && <Icon aria-hidden size={18} />}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-muted-foreground/10 rounded-full px-2 py-0.5 text-caption">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </nav>
      {footer && <div className="mt-auto border-t border-border px-3 py-3">{footer}</div>}
    </aside>
  );
}
