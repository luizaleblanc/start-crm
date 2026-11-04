"use client";

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
        "border-border/80 relative flex h-full shrink-0 flex-col border-r bg-background transition-[width] duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="border-border/80 hover:bg-muted absolute -right-3.5 top-24 z-20 flex h-7 w-7 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-md transition-all hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight aria-hidden size={14} />
          ) : (
            <ChevronLeft aria-hidden size={14} />
          )}
        </button>
      )}

      {/* Cabeçalho da Logo com Respiro Generoso e Altura Ampla */}
      {header && (
        <div className="border-border/40 flex h-28 shrink-0 items-center justify-center border-b px-4">
          {header}
        </div>
      )}

      {/* Navegação Principal - Espaçamento pt-10 para descer os tópicos */}
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-6 pt-10">
        {items.map((item) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <button
                key={item.label}
                type="button"
                disabled
                title={collapsed ? item.label : undefined}
                className="flex cursor-not-allowed items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-body text-muted-foreground opacity-50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {Icon && <Icon aria-hidden size={20} />}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="bg-muted/60 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                "group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-body font-medium transition-all duration-150",
                item.active
                  ? "bg-foreground font-semibold text-background shadow-sm dark:bg-white dark:text-zinc-950"
                  : "hover:bg-card/70 text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                {Icon && (
                  <Icon
                    aria-hidden
                    size={20}
                    className={cn(
                      "transition-colors",
                      item.active
                        ? "text-inherit"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                )}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Seção Secundária (Integrações) */}
        {secondarySection && !collapsed && (
          <div className="border-border/40 mt-10 flex flex-col gap-2 border-t pt-8">
            <span className="text-muted-foreground/60 px-3.5 text-[11px] font-bold uppercase tracking-wider">
              {secondarySection.label}
            </span>
            {secondarySection.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="flex cursor-not-allowed items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left text-body text-muted-foreground opacity-50"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {Icon && <Icon aria-hidden size={18} />}
                  </span>
                  <span className="flex-1 text-caption font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="bg-muted/60 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Rodapé com Perfil do Usuário */}
      {footer && <div className="border-border/50 mt-auto border-t px-4 py-4">{footer}</div>}
    </aside>
  );
}
