"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FilterOption = {
	value: string;
	label: string;
	keywords?: string[];
};

type SearchableMultiSelectFilterProps = {
	label: string;
	options: FilterOption[];
	selectedValues: string[];
	onChange: (values: string[]) => void;
	className?: string;
};

function matchesOption(option: FilterOption, query: string) {
	if (!query) return true;
	const haystack = [option.label, option.value, ...(option.keywords ?? [])].join(" ").toLowerCase();
	return haystack.includes(query.toLowerCase());
}

export function SearchableMultiSelectFilter({
	label,
	options,
	selectedValues,
	onChange,
	className
}: SearchableMultiSelectFilterProps) {
	const [query, setQuery] = React.useState("");

	const visibleOptions = React.useMemo(
		() => options.filter(option => matchesOption(option, query)),
		[options, query]
	);

	const selectedLabels = React.useMemo(
		() => options.filter(option => selectedValues.includes(option.value)).map(option => option.label),
		[options, selectedValues]
	);

	function toggleValue(value: string, checked: boolean) {
		if (checked) {
			onChange(Array.from(new Set([...selectedValues, value])));
			return;
		}
		onChange(selectedValues.filter(current => current !== value));
	}

	function clearSelection() {
		onChange([]);
	}

	const triggerLabel =
		selectedLabels.length === 0
			? label
			: selectedLabels.length <= 2
				? `${label}: ${selectedLabels.join(", ")}`
				: `${label}: ${selectedLabels.length} selected`;

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"h-11 justify-between rounded-2xl border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 hover:bg-slate-50",
						className
					)}>
					<span className="truncate">{triggerLabel}</span>
					<div className="ml-3 flex items-center gap-2">
						{selectedValues.length > 0 ? (
							<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
								{selectedValues.length}
							</span>
						) : null}
						<ChevronDown className="size-4 text-slate-400" />
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[290px] rounded-2xl border-slate-200 p-3 shadow-xl">
				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm font-semibold text-slate-900">{label}</p>
						{selectedValues.length > 0 ? (
							<button
								type="button"
								onClick={clearSelection}
								className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900">
								<X className="size-3.5" />
								Clear
							</button>
						) : null}
					</div>
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<Input
							value={query}
							onChange={event => setQuery(event.target.value)}
							placeholder={`Search ${label.toLowerCase()}...`}
							className="h-10 rounded-xl border-slate-200 pl-9"
						/>
					</div>
					<div className="max-h-64 space-y-1 overflow-y-auto pr-1">
						{visibleOptions.length === 0 ? (
							<div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">No results found.</div>
						) : (
							visibleOptions.map(option => (
								<DropdownMenuCheckboxItem
									key={option.value}
									checked={selectedValues.includes(option.value)}
									onCheckedChange={checked => toggleValue(option.value, checked === true)}
									onSelect={event => event.preventDefault()}
									className="rounded-xl py-2.5 pr-3 pl-9 text-sm text-slate-700 focus:bg-slate-50 focus:text-slate-950">
									<div className="flex min-w-0 items-center justify-between gap-3">
										<span className="truncate">{option.label}</span>
										{selectedValues.includes(option.value) ? <Check className="size-4 text-emerald-700" /> : null}
									</div>
								</DropdownMenuCheckboxItem>
							))
						)}
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function ClearFiltersButton({
	disabled,
	onClick
}: {
	disabled: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			onClick={onClick}
			disabled={disabled}
			className="h-11 rounded-2xl px-4 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:text-slate-400">
			Clear filters
		</Button>
	);
}
