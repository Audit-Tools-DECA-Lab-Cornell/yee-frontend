"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
	const router = useRouter();
	const { logout } = useAuth();

	return (
		<button
			type="button"
			onClick={() => {
				logout();
				router.push("/login");
			}}
			className={cn(
				"mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-emerald-50/70 transition-colors hover:bg-white/6 hover:text-white",
				className
			)}>
			<LogOut className="size-4.5" />
			<span>Logout</span>
		</button>
	);
}
