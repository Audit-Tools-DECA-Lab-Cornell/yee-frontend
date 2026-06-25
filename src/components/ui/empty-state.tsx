import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type EmptyStateProps = {
  /** Optional Lucide icon component to render above the title. */
  icon?: React.ElementType;
  title: string;
  description: string;
  /** Optional primary action button/link. */
  action?: EmptyStateAction;
  className?: string;
};

/**
 * Consistent empty state for tables, lists, and sections
 * with no data or matching results.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        className
      )}>
      {Icon ? (
        <div
          className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          aria-hidden="true">
          <Icon className="size-6" />
        </div>
      ) : null}

      <div className="max-w-sm space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {action ? (
        action.href ? (
          <Button asChild variant="outline" size="sm">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      ) : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
