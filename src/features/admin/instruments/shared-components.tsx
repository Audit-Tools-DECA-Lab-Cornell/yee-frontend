"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";

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

/** The single "demote but keep" treatment for raw identifiers (QIDs, rule codes, block keys). */
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

export function MetricCard({ label, value }: { label: string; value: string }) {
	const isZero = value === "0";
	return (
		<div className="rounded-md border border-border bg-muted p-4">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p
				className={cn(
					"mt-2 wrap-break-word text-lg font-semibold tabular-nums",
					isZero ? "text-muted-foreground" : "text-foreground"
				)}>
				{value}
			</p>
		</div>
	);
}

export function MetricRow({ summary }: { summary: InstrumentSummary }) {
	return (
		<div className="grid gap-3 md:grid-cols-4">
			<MetricCard label="Sections" value={String(summary.sections)} />
			<MetricCard label="Questions" value={String(summary.items)} />
			<MetricCard label="Pre-Audit" value={String(summary.preAuditQuestions)} />
			<MetricCard label="Scale Guidance" value={String(summary.scaleGuidance)} />
		</div>
	);
}

export type TabItem = { key: DetailTabKey; label: string };

/**
 * Accessible tab bar (YEE has no Radix Tabs primitive). Implements the WAI-ARIA
 * tablist pattern with roving tabindex + arrow-key navigation.
 *
 * The parent owns `idBase` (from `useId()`) and reuses it to wire the single
 * visible panel: render it with `id={`${idBase}-panel`}`, `role="tabpanel"`, and
 * `aria-labelledby={`${idBase}-tab-${active}`}`.
 */
export function TabBar({
	tabs,
	active,
	onChange,
	counts,
	idBase
}: {
	tabs: TabItem[];
	active: DetailTabKey;
	onChange: (tab: DetailTabKey) => void;
	counts?: Partial<Record<DetailTabKey, number>>;
	idBase: string;
}) {
	const focusTab = (key: DetailTabKey) => {
		if (typeof document !== "undefined") {
			document.getElementById(`${idBase}-tab-${key}`)?.focus();
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		let nextIndex: number | null = null;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
		else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
			nextIndex = (index - 1 + tabs.length) % tabs.length;
		else if (event.key === "Home") nextIndex = 0;
		else if (event.key === "End") nextIndex = tabs.length - 1;
		if (nextIndex === null) return;
		event.preventDefault();
		const next = tabs[nextIndex];
		onChange(next.key);
		focusTab(next.key);
	};

	return (
		<div role="tablist" aria-orientation="horizontal" className="flex flex-wrap gap-2">
			{tabs.map((tab, index) => {
				const count = counts?.[tab.key];
				const isActive = active === tab.key;
				return (
					<button
						key={tab.key}
						type="button"
						role="tab"
						id={`${idBase}-tab-${tab.key}`}
						aria-selected={isActive}
						aria-controls={`${idBase}-panel`}
						tabIndex={isActive ? 0 : -1}
						onClick={() => onChange(tab.key)}
						onKeyDown={event => handleKeyDown(event, index)}
						className={cn(
							"rounded-md border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
							isActive
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
						)}>
						{tab.label}
						{typeof count === "number" ? (
							<span className="ml-1 tabular-nums opacity-80">({count})</span>
						) : null}
					</button>
				);
			})}
		</div>
	);
}
