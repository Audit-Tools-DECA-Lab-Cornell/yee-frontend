import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground border-border [a&]:hover:bg-secondary/90",
        success:
          "bg-[var(--yee-green-100)] text-[var(--yee-green-900)] border-[var(--yee-green-200)]",
        warning:
          "bg-amber-100 text-amber-900 border-amber-200",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 [a&]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

/** Dot sizes mirror the badge text — 6px fills `text-xs` contexts well. */
const dotColorMap: Record<string, string> = {
  default: "bg-primary-foreground",
  secondary: "bg-secondary-foreground/60",
  success: "bg-[var(--yee-green-600)]",
  warning: "bg-amber-600",
  destructive: "bg-destructive",
  outline: "bg-foreground/50"
};

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    /** Renders a small status dot before the label. */
    dot?: boolean;
  };

function Badge({
  className,
  variant = "default",
  asChild = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  const dotColor = dotColorMap[variant ?? "default"] ?? dotColorMap["default"];

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}>
      {dot ? (
        <span
          className={cn("size-1.5 rounded-full", dotColor)}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
