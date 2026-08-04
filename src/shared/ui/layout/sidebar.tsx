import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "../cn";

export interface SidebarItem {
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  header?: ReactNode;
  footer?: ReactNode;
}

export function Sidebar({ items, header, footer }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-background">
      {header && <div className="flex h-16 items-center px-6">{header}</div>}
      <nav className="flex flex-col gap-1 px-3 py-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "hover:bg-foreground/5 rounded-md px-3 py-2 text-body text-foreground transition-colors",
              item.active && "bg-primary/10 hover:bg-primary/10 font-medium text-primary",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {footer && <div className="mt-[26rem] px-3 py-4">{footer}</div>}
    </aside>
  );
}
