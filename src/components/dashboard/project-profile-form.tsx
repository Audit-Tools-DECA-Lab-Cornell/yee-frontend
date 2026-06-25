"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProjectProfileFormValues = {
	name: string;
	description: string;
	placeTypes: string[];
	otherPlaceType: string;
	startDate: string;
	endDate: string;
	estimatedPlaces: string;
	auditorPopulationTypes: string[];
	otherAuditorPopulationType: string;
	auditorInclusionExclusionCriteria: string;
	auditorNotes: string;
};

type ProjectProfileFormProps = {
	values: ProjectProfileFormValues;
	onChange: (values: ProjectProfileFormValues) => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	saving: boolean;
	error: string | null;
	submitLabel: string;
	cancelHref: string;
	cancelLabel: string;
};

const PLACE_TYPE_OPTIONS = [
	"Public parks",
	"Recreation / sports fields (e.g. basketball courts, skateparks, soccer/baseball fields)",
	"Trails / pathways",
	"Community gardens",
	"Public squares / plazas",
	"Community center outdoor spaces",
	"Woodland / forested areas"
];

const AUDITOR_POPULATION_OPTIONS = [
	"Community youth 12 years and under",
	"Community youth 13-17 years",
	"Community young adults 18-25",
	"Adults from youth / community organizations"
];

function toggleArrayValue(values: string[], nextValue: string) {
	return values.includes(nextValue) ? values.filter(value => value !== nextValue) : [...values, nextValue];
}

function summarizeSelections(values: string[], otherValue: string, emptyLabel: string) {
	if (values.length === 0) return emptyLabel;
	const labels = values.includes("Other")
		? [...values.filter(value => value !== "Other"), otherValue.trim() ? `Other: ${otherValue.trim()}` : "Other"]
		: values;
	return labels.join(", ");
}

export function buildProjectProfilePayload(values: ProjectProfileFormValues) {
	const customPlaceTypes = values.otherPlaceType
		.split(",")
		.map(value => value.trim())
		.filter(Boolean);
	const placeTypes = values.placeTypes.includes("Other")
		? [...values.placeTypes.filter(value => value !== "Other"), ...customPlaceTypes]
		: values.placeTypes;
	const customAuditorPopulationTypes = values.otherAuditorPopulationType
		.split(",")
		.map(value => value.trim())
		.filter(Boolean);
	const populationTypes = values.auditorPopulationTypes.includes("Other")
		? [...values.auditorPopulationTypes.filter(value => value !== "Other"), ...customAuditorPopulationTypes]
		: values.auditorPopulationTypes;

	return {
		name: values.name,
		description: values.description || undefined,
		place_types: placeTypes,
		start_date: values.startDate || undefined,
		end_date: values.endDate || undefined,
		estimated_places: values.estimatedPlaces ? Number(values.estimatedPlaces) : undefined,
		auditor_population_types: populationTypes,
		auditor_inclusion_exclusion_criteria: values.auditorInclusionExclusionCriteria || undefined,
		auditor_notes: values.auditorNotes || undefined
	};
}

export function deriveProjectProfileFormValues(project: {
	name: string;
	description: string;
	place_types?: string[];
	start_date?: string | null;
	end_date?: string | null;
	estimated_places?: number | null;
	auditor_population_types?: string[];
	auditor_inclusion_exclusion_criteria?: string;
	auditor_notes?: string;
}): ProjectProfileFormValues {
	const placeTypes = project.place_types ?? [];
	const selectedBasePlaceTypes = placeTypes.filter(type => PLACE_TYPE_OPTIONS.includes(type));
	const customPlaceTypes = placeTypes.filter(type => !PLACE_TYPE_OPTIONS.includes(type));
	const populationTypes = project.auditor_population_types ?? [];
	const selectedBasePopulationTypes = populationTypes.filter(type => AUDITOR_POPULATION_OPTIONS.includes(type));
	const customPopulationTypes = populationTypes.filter(type => !AUDITOR_POPULATION_OPTIONS.includes(type));

	return {
		name: project.name,
		description: project.description,
		placeTypes: customPlaceTypes.length > 0 ? [...selectedBasePlaceTypes, "Other"] : selectedBasePlaceTypes,
		otherPlaceType: customPlaceTypes.join(", "),
		startDate: project.start_date ?? "",
		endDate: project.end_date ?? "",
		estimatedPlaces:
			project.estimated_places !== null && project.estimated_places !== undefined
				? String(project.estimated_places)
				: "",
		auditorPopulationTypes:
			customPopulationTypes.length > 0 ? [...selectedBasePopulationTypes, "Other"] : selectedBasePopulationTypes,
		otherAuditorPopulationType: customPopulationTypes.join(", "),
		auditorInclusionExclusionCriteria: project.auditor_inclusion_exclusion_criteria ?? "",
		auditorNotes: project.auditor_notes ?? ""
	};
}

export function ProjectProfileForm({
	values,
	onChange,
	onSubmit,
	saving,
	error,
	submitLabel,
	cancelHref,
	cancelLabel
}: ProjectProfileFormProps) {
	function update<K extends keyof ProjectProfileFormValues>(key: K, value: ProjectProfileFormValues[K]) {
		onChange({ ...values, [key]: value });
	}

	return (
		<form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor="project-name">Project Name</Label>
				<Input
					id="project-name"
					placeholder="Healthy Streets"
					value={values.name}
					onChange={event => update("name", event.target.value)}
					required
				/>
			</div>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor="project-summary">Project overview / aims</Label>
				<Textarea
					id="project-summary"
					placeholder="Describe the project purpose, scope, and what managers want auditors to learn from this work."
					value={values.description}
					onChange={event => update("description", event.target.value)}
					className="min-h-28"
				/>
			</div>

			<div className="space-y-3 sm:col-span-2">
				<Label>Types of Places to be Audited</Label>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="w-full justify-between rounded-lg px-4 py-5 text-left font-normal">
							<span className="truncate">
								{summarizeSelections(values.placeTypes, values.otherPlaceType, "Select Place Types")}
							</span>
							<span className="ml-4 text-xs text-muted-foreground">{values.placeTypes.length} selected</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[26rem] rounded-lg p-2">
						<DropdownMenuLabel>Type of Places to be Audited (check all that apply)</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{PLACE_TYPE_OPTIONS.map(option => (
							<DropdownMenuCheckboxItem
								key={option}
								checked={values.placeTypes.includes(option)}
								onCheckedChange={() =>
									update("placeTypes", toggleArrayValue(values.placeTypes, option))
								}>
								{option}
							</DropdownMenuCheckboxItem>
						))}
						<DropdownMenuCheckboxItem
							checked={values.placeTypes.includes("Other")}
							onCheckedChange={() => update("placeTypes", toggleArrayValue(values.placeTypes, "Other"))}>
							Other
						</DropdownMenuCheckboxItem>
					</DropdownMenuContent>
				</DropdownMenu>
				{values.placeTypes.includes("Other") ? (
					<div className="space-y-2">
						<Label htmlFor="project-place-type-other">Other Place Type</Label>
						<Input
							id="project-place-type-other"
							placeholder="Add a custom Place Type"
							value={values.otherPlaceType}
							onChange={event => update("otherPlaceType", event.target.value)}
						/>
					</div>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="project-start-date">Anticipated Start Date</Label>
				<Input
					id="project-start-date"
					type="date"
					value={values.startDate}
					onChange={event => update("startDate", event.target.value)}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="project-end-date">Anticipated End Date</Label>
				<Input
					id="project-end-date"
					type="date"
					value={values.endDate}
					onChange={event => update("endDate", event.target.value)}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="project-estimated-places">Estimated number of Places to be audited</Label>
				<Input
					id="project-estimated-places"
					type="number"
					min="0"
					placeholder="12"
					value={values.estimatedPlaces}
					onChange={event => update("estimatedPlaces", event.target.value)}
				/>
			</div>

			<div className="space-y-2 sm:col-span-2">
				<Label>Description of Auditors: population type (check all that apply)</Label>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="w-full justify-between rounded-lg px-4 py-5 text-left font-normal">
							<span className="truncate">
								{summarizeSelections(
									values.auditorPopulationTypes,
									values.otherAuditorPopulationType,
									"Select Auditor population types"
								)}
							</span>
							<span className="ml-4 text-xs text-muted-foreground">
								{values.auditorPopulationTypes.length} selected
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[28rem] rounded-lg p-2">
						<DropdownMenuLabel>Auditor Population Type (check all that apply)</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{AUDITOR_POPULATION_OPTIONS.map(option => (
							<DropdownMenuCheckboxItem
								key={option}
								checked={values.auditorPopulationTypes.includes(option)}
								onCheckedChange={() =>
									update(
										"auditorPopulationTypes",
										toggleArrayValue(values.auditorPopulationTypes, option)
									)
								}>
								{option}
							</DropdownMenuCheckboxItem>
						))}
						<DropdownMenuCheckboxItem
							checked={values.auditorPopulationTypes.includes("Other")}
							onCheckedChange={() =>
								update(
									"auditorPopulationTypes",
									toggleArrayValue(values.auditorPopulationTypes, "Other")
								)
							}>
							Other
						</DropdownMenuCheckboxItem>
					</DropdownMenuContent>
				</DropdownMenu>
				{values.auditorPopulationTypes.includes("Other") ? (
					<div className="space-y-2">
						<Label htmlFor="project-auditor-population-other">Additional details for Other</Label>
						<Input
							id="project-auditor-population-other"
							placeholder="Add one or more custom population types"
							value={values.otherAuditorPopulationType}
							onChange={event => update("otherAuditorPopulationType", event.target.value)}
						/>
					</div>
				) : null}
			</div>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor="project-auditor-criteria">Any inclusion / exclusion criteria for Auditors</Label>
				<Textarea
					id="project-auditor-criteria"
					placeholder="Describe who should or should not be invited to this Project."
					value={values.auditorInclusionExclusionCriteria}
					onChange={event => update("auditorInclusionExclusionCriteria", event.target.value)}
					className="min-h-24"
				/>
			</div>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor="project-auditor-notes">Other notes about Auditors</Label>
				<Textarea
					id="project-auditor-notes"
					placeholder="Add any setup notes managers should keep in mind while inviting or assigning Auditors."
					value={values.auditorNotes}
					onChange={event => update("auditorNotes", event.target.value)}
					className="min-h-24"
				/>
			</div>

			{error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
			<div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
				<Button
					type="submit"
					className="rounded-lg bg-primary text-white hover:bg-primary/90"
					disabled={saving}>
					{saving ? "Saving..." : submitLabel}
				</Button>
				<Button asChild variant="outline" className="rounded-lg">
					<Link href={cancelHref}>{cancelLabel}</Link>
				</Button>
			</div>
		</form>
	);
}
