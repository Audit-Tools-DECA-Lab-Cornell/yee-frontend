"use client";

import type { ComponentProps, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { cn } from "@/lib/utils";

/**
 * Lives in the dashboard sidebar, so it wears the sidebar tokens and follows
 * the same rail geometry as the nav rows: 44px tall always, a 44px square once
 * the sidebar collapses, with the label kept for screen readers.
 *
 * Props are forwarded (and `onClick` composed) so it can be a tooltip trigger -
 * Radix clones this element and needs its ref and handlers to land on the
 * button underneath.
 */
export function LogoutButton({ className, onClick, ...props }: ComponentProps<"button">) {
	const router = useRouter();
	const { logout } = useAuth();

	return (
		<button
			type="button"
			{...props}
			onClick={(event: MouseEvent<HTMLButtonElement>) => {
				onClick?.(event);
				logout();
				router.push("/login");
			}}
			className={cn(
				"mt-3 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium whitespace-nowrap",
				"text-sidebar-foreground/70 transition-colors hover:bg-white/6 hover:text-sidebar-foreground",
				"focus-visible:ring-sidebar-ring focus-visible:ring-offset-sidebar",
				"rail-collapsed:w-11 rail-collapsed:justify-center rail-collapsed:gap-0 rail-collapsed:px-0",
				className
			)}>
			<LogOut className="size-4.5 shrink-0 rail-collapsed:size-5" aria-hidden="true" />
			<span className="truncate rail-collapsed:sr-only">Logout</span>
		</button>
	);
}
