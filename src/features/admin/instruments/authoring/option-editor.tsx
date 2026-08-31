"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { AuthoringOption } from "./schema";

export function OptionEditor({
	idPrefix,
	label,
	options,
	triggerIds,
	onChange,
	onTriggerChange
}: {
	idPrefix: string;
	label: string;
	options: AuthoringOption[];
	triggerIds?: string[];
	onChange: (options: AuthoringOption[]) => void;
	onTriggerChange?: (ids: string[]) => void;
}) {
	function update(index: number, patch: Partial<AuthoringOption>) {
		onChange(options.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option)));
	}

	function move(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= options.length) return;
		const next = [...options];
		[next[index], next[nextIndex]] = [next[nextIndex], next[index]];
		onChange(next);
	}

	function remove(index: number) {
		const removed = options[index];
		onChange(options.filter((_, optionIndex) => optionIndex !== index));
		if (triggerIds?.includes(removed.id)) {
			onTriggerChange?.(triggerIds.filter(id => id !== removed.id));
		}
	}

	function add() {
		onChange([...options, { id: `option.${crypto.randomUUID()}`, label: "New option", score: 0 }]);
	}

	return (
		<fieldset className="space-y-3 rounded-md border border-border bg-background p-4">
			<legend className="px-1 text-sm font-semibold text-foreground">{label}</legend>
			{options.map((option, index) => {
				const inputId = `${idPrefix}-${option.id}`.replaceAll(/[^a-zA-Z0-9_-]/g, "-");
				const isTrigger = triggerIds?.includes(option.id) ?? false;
				return (
					<div
						key={option.id}
						className="grid gap-2 rounded-md border border-border/70 bg-card p-3 md:grid-cols-[1fr_6rem_auto] md:items-end">
						<label className="space-y-1 text-xs font-medium text-muted-foreground" htmlFor={inputId}>
							Option {index + 1}
							<Input
								id={inputId}
								value={option.label}
								onChange={event => update(index, { label: event.target.value })}
							/>
						</label>
						<label
							className="space-y-1 text-xs font-medium text-muted-foreground"
							htmlFor={`${inputId}-score`}>
							Score
							<Input
								id={`${inputId}-score`}
								type="number"
								value={option.score}
								onChange={event =>
									update(index, { score: Number.parseInt(event.target.value || "0", 10) })
								}
							/>
						</label>
						<div className="flex flex-wrap gap-1">
							{onTriggerChange ? (
								<label className="mr-2 flex items-center gap-2 text-xs text-muted-foreground">
									<input
										type="checkbox"
										checked={isTrigger}
										onChange={() =>
											onTriggerChange(
												isTrigger
													? (triggerIds ?? []).filter(id => id !== option.id)
													: [...(triggerIds ?? []), option.id]
											)
										}
									/>
									Shows follow-up
								</label>
							) : null}
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => move(index, -1)}
								disabled={index === 0}
								aria-label={`Move option ${index + 1} up`}>
								<ArrowUp aria-hidden="true" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => move(index, 1)}
								disabled={index === options.length - 1}
								aria-label={`Move option ${index + 1} down`}>
								<ArrowDown aria-hidden="true" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => remove(index)}
								aria-label={`Remove option ${index + 1}`}>
								<Trash2 aria-hidden="true" />
							</Button>
						</div>
					</div>
				);
			})}
			<Button type="button" variant="outline" size="sm" onClick={add}>
				<Plus aria-hidden="true" /> Add option
			</Button>
		</fieldset>
	);
}
