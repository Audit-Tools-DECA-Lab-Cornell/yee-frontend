"use client";

import { useId, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { StructuredInstrumentContent } from "./types";

export type UpdateDraft = (mutator: (draft: StructuredInstrumentContent) => void) => void;

export function EditableField({
	label,
	labelColor,
	value,
	multiline = false,
	className,
	onChange
}: {
	label: string;
	labelColor?: string;
	value: string;
	multiline?: boolean;
	className?: string;
	onChange: (value: string) => void;
}) {
	const id = useId();
	return (
		<div className="space-y-2">
			<Label htmlFor={id} style={labelColor ? { color: labelColor } : undefined}>
				{label}
			</Label>
			{multiline ? (
				<Textarea
					id={id}
					value={value}
					onChange={event => onChange(event.target.value)}
					className={cn("min-h-[6rem]", className)}
				/>
			) : (
				<Input id={id} value={value} onChange={event => onChange(event.target.value)} className={className} />
			)}
		</div>
	);
}

export function FieldGroup({
	label,
	hint,
	className,
	children
}: {
	label: string;
	hint?: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<fieldset className={cn("rounded-md border-l-2 border-border bg-muted/70 p-3", className)}>
			<legend className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</legend>
			{hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
			<div className="mt-2 space-y-3">{children}</div>
		</fieldset>
	);
}

export function IdTag({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px] leading-none text-muted-foreground",
				className
			)}>
			{children}
		</span>
	);
}
