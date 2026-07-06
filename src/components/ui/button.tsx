"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 rounded-control text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
				primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
				success: "bg-emerald-800 text-primary-foreground hover:bg-emerald-600/90 shadow-sm",
				outline: "border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
				quiet: "hover:bg-accent hover:text-accent-foreground",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				danger: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 shadow-sm",
				destructive:
					"bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 shadow-sm",
				toolbar: "text-muted-foreground hover:bg-accent hover:text-foreground h-auto p-1",
				link: "text-primary underline-offset-4 hover:underline"
			},
			size: {
				default: "h-8 px-3 has-[>svg]:px-2.5",
				xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-7 gap-1.5 px-2.5 has-[>svg]:px-2",
				lg: "h-10 px-5 has-[>svg]:px-4",
				icon: "size-8",
				"icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-7",
				"icon-lg": "size-10"
			}
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		}
	}
);

type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		isLoading?: boolean;
	};

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	isLoading = false,
	children,
	disabled,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={disabled ?? isLoading}
			aria-busy={isLoading}
			{...props}>
			{isLoading ? (
				<>
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					{children}
				</>
			) : (
				children
			)}
		</Comp>
	);
}

export { Button, buttonVariants };
