"use client";

import * as React from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/components/ui/alert-dialog";

export type ConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	/** "destructive" renders the confirm button in a danger/red style. */
	variant?: "default" | "destructive";
	onConfirm: () => void | Promise<void>;
};

/**
 * A reusable AlertDialog wrapper that replaces window.confirm.
 *
 * Uses Radix AlertDialog (via shadcn) for accessible, focusable confirmation.
 * The "destructive" variant styles the confirm button red to signal irreversibility.
 */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "default",
	onConfirm
}: ConfirmDialogProps) {
	const [isPending, setIsPending] = React.useState(false);

	const handleConfirm = async () => {
		setIsPending(true);
		try {
			await onConfirm();
		} finally {
			setIsPending(false);
			onOpenChange(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
					<AlertDialogAction
						disabled={isPending}
						className={
							variant === "destructive"
								? "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500"
								: undefined
						}
						onClick={e => {
							e.preventDefault();
							void handleConfirm();
						}}>
						{isPending ? `${confirmLabel}...` : confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
