"use client";

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { DetailTabKey, InstrumentSummary, StructuredInstrumentContent } from "./types";

/** Mutate the current draft in place; mirrors the original `updateEditor` flow. */
export type UpdateDraft = (mutator: (draft: StructuredInstrumentContent) => void) => void;

/** Labelled text input/textarea used across the light editors. */
export function EditableField({
	label,
	value,
	multiline = false,
	className,
	onChange
}: {
	label: string;
	value: string;
	multiline?: boolean;
	className?: string;
	onChange: (value: string) => void;
}) {
	const id = useId();
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
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

export function MetricCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-sm text-slate-500">{label}</p>
			<p className="mt-2 break-words text-lg font-semibold text-slate-950">{value}</p>
		</div>
	);
}

export function MetricRow({ summary }: { summary: InstrumentSummary }) {
	return (
		<div className="grid gap-3 md:grid-cols-4">
			<MetricCard label="Sections" value={String(summary.sections)} />
			<MetricCard label="Total Questions" value={String(summary.items)} />
			<MetricCard label="Pre-Audit Questions" value={String(summary.preAuditQuestions)} />
			<MetricCard label="Scale Guidance" value={String(summary.scaleGuidance)} />
		</div>
	);
}

export type TabItem = { key: DetailTabKey; label: string };

/**
 * Button-based tab bar (YEE has no Radix Tabs primitive). Mirrors the tab shell
 * used by the Playspace instrument editor, restyled with YEE tokens.
 */
export function TabBar({
	tabs,
	active,
	onChange,
	counts
}: {
	tabs: TabItem[];
	active: DetailTabKey;
	onChange: (tab: DetailTabKey) => void;
	counts?: Partial<Record<DetailTabKey, number>>;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{tabs.map(tab => {
				const count = counts?.[tab.key];
				return (
					<button
						key={tab.key}
						type="button"
						onClick={() => onChange(tab.key)}
						className={cn(
							"rounded-xl border px-3 py-2 text-sm transition",
							active === tab.key
								? "border-slate-900 bg-slate-900 text-white"
								: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
						)}>
						{tab.label}
						{typeof count === "number" ? ` (${count})` : ""}
					</button>
				);
			})}
		</div>
	);
}
