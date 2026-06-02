"use client";

import Link from "next/link";
import * as React from "react";

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectRecord } from "@/lib/dashboard/live-api";

const PLACE_TYPE_OPTIONS = [
	"Public parks",
	"Recreation / sports fields (e.g. basketball courts, skateparks, soccer/baseball fields)",
	"Trails / pathways",
	"Community gardens",
	"Public squares / plazas",
	"Community center outdoor spaces",
	"Woodland / forested areas",
];

const AUDITOR_POPULATION_OPTIONS = [
	"Community youth 12 years and under",
	"Community youth 13-17 years",
	"Community young adults 18-25",
	"Adults from youth / community organizations",
];

type GoogleAutocompleteResult = {
	addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
	formattedAddress?: string;
	location?: {
		latitude?: number;
		longitude?: number;
	};
};

type GoogleAutocompleteSuggestion = {
	placeId: string;
	text: string;
	secondaryText?: string;
};

export type PlaceProfileFormValues = {
	projectId: string;
	name: string;
	address: string;
	city: string;
	province: string;
	country: string;
	postalCode: string;
	placeType: string;
	otherPlaceType: string;
	startDate: string;
	endDate: string;
	estimatedAuditors: string;
	auditorPopulationTypes: string[];
	otherAuditorPopulationType: string;
	auditorInclusionExclusionCriteria: string;
	auditorNotes: string;
	latitude: number | null;
	longitude: number | null;
};

type PlaceProfileFormProps = {
	values: PlaceProfileFormValues;
	onChange: (values: PlaceProfileFormValues) => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	projects: ProjectRecord[];
	loadingProjects: boolean;
	saving: boolean;
	error: string | null;
	submitLabel: string;
	cancelHref: string;
	cancelLabel: string;
};

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

function buildMapQuery(values: PlaceProfileFormValues) {
	if (values.latitude !== null && values.longitude !== null) {
		return `${values.latitude},${values.longitude}`;
	}
	return [values.address, values.city, values.province, values.country, values.postalCode].filter(Boolean).join(", ");
}

function buildStaticMapUrl(apiKey: string | undefined, values: PlaceProfileFormValues, query: string) {
	if (!apiKey || !query) return null;
	const center =
		values.latitude !== null && values.longitude !== null
			? `${values.latitude},${values.longitude}`
			: query;
	const marker =
		values.latitude !== null && values.longitude !== null
			? `${values.latitude},${values.longitude}`
			: query;
	return `https://maps.googleapis.com/maps/api/staticmap?key=${encodeURIComponent(apiKey)}&size=1200x520&scale=2&zoom=15&maptype=roadmap&center=${encodeURIComponent(center)}&markers=color:0x10231f|${encodeURIComponent(marker)}`;
}

function normalizeGoogleAddressComponent(
	components: Array<{ longText?: string; shortText?: string; types?: string[] }> | undefined,
	type: string,
	preferShort = false,
) {
	const component = components?.find(entry => entry.types?.includes(type));
	if (!component) return "";
	return preferShort ? component.shortText ?? component.longText ?? "" : component.longText ?? component.shortText ?? "";
}

function buildStreetAddress(
	components: Array<{ longText?: string; shortText?: string; types?: string[] }> | undefined,
	fallback: string,
) {
	const streetNumber = normalizeGoogleAddressComponent(components, "street_number");
	const route = normalizeGoogleAddressComponent(components, "route");
	const subpremise = normalizeGoogleAddressComponent(components, "subpremise");
	const premise = normalizeGoogleAddressComponent(components, "premise");
	const lineOne = [streetNumber, route].filter(Boolean).join(" ").trim();
	if (lineOne && subpremise) return `${lineOne}, ${subpremise}`;
	if (lineOne) return lineOne;
	if (premise) return premise;
	return fallback;
}

function buildFallbackStaticMapUrl(values: PlaceProfileFormValues, query: string) {
	if (values.latitude !== null && values.longitude !== null) {
		return `https://maps.wikimedia.org/img/osm-intl,15,${values.longitude},${values.latitude},640x320@2x.png`;
	}
	if (!query) return null;
	return `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(query)}&zoom=15&size=640x320`;
}

function buildOpenStreetMapEmbedUrl(values: PlaceProfileFormValues) {
	if (values.latitude === null || values.longitude === null) return null;
	const latitude = values.latitude;
	const longitude = values.longitude;
	const offset = 0.008;
	const left = longitude - offset;
	const right = longitude + offset;
	const top = latitude + offset;
	const bottom = latitude - offset;
	return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function buildPlaceProfilePayload(values: PlaceProfileFormValues) {
	const customAuditorPopulationTypes = values.otherAuditorPopulationType
		.split(",")
		.map(value => value.trim())
		.filter(Boolean);
	const auditorPopulationTypes = values.auditorPopulationTypes.includes("Other")
		? [...values.auditorPopulationTypes.filter(value => value !== "Other"), ...customAuditorPopulationTypes]
		: values.auditorPopulationTypes;
	const resolvedPlaceType =
		values.placeType === "Other" ? values.otherPlaceType.trim() || undefined : values.placeType || undefined;

	return {
		project_id: values.projectId,
		name: values.name,
		address: values.address,
		city: values.city || undefined,
		province: values.province || undefined,
		country: values.country || undefined,
		postal_code: values.postalCode || undefined,
		place_type: resolvedPlaceType,
		start_date: values.startDate || undefined,
		end_date: values.endDate || undefined,
		estimated_auditors: values.estimatedAuditors ? Number(values.estimatedAuditors) : undefined,
		auditor_population_types: auditorPopulationTypes,
		auditor_inclusion_exclusion_criteria: values.auditorInclusionExclusionCriteria || undefined,
		auditor_notes: values.auditorNotes || undefined,
		lat: values.latitude ?? undefined,
		lng: values.longitude ?? undefined,
	};
}

export function derivePlaceProfileFormValues(place: {
	project_id: string;
	name: string;
	address: string;
	city: string;
	province: string;
	country: string;
	postal_code?: string | null;
	place_type: string;
	start_date?: string | null;
	end_date?: string | null;
	estimated_auditors?: number | null;
	auditor_population_types: string[];
	auditor_inclusion_exclusion_criteria: string;
	auditor_notes: string;
	lat?: number | null;
	lng?: number | null;
}): PlaceProfileFormValues {
	const isKnownPlaceType = PLACE_TYPE_OPTIONS.includes(place.place_type);
	const selectedPopulationTypes = place.auditor_population_types.filter(option =>
		AUDITOR_POPULATION_OPTIONS.includes(option),
	);
	const customPopulationTypes = place.auditor_population_types.filter(
		option => !AUDITOR_POPULATION_OPTIONS.includes(option),
	);

	return {
		projectId: place.project_id,
		name: place.name,
		address: place.address,
		city: place.city,
		province: place.province,
		country: place.country,
		postalCode: place.postal_code ?? "",
		placeType: place.place_type ? (isKnownPlaceType ? place.place_type : "Other") : "",
		otherPlaceType: place.place_type && !isKnownPlaceType ? place.place_type : "",
		startDate: place.start_date ?? "",
		endDate: place.end_date ?? "",
		estimatedAuditors:
			place.estimated_auditors !== null && place.estimated_auditors !== undefined ? String(place.estimated_auditors) : "",
		auditorPopulationTypes:
			customPopulationTypes.length > 0 ? [...selectedPopulationTypes, "Other"] : selectedPopulationTypes,
		otherAuditorPopulationType: customPopulationTypes.join(", "),
		auditorInclusionExclusionCriteria: place.auditor_inclusion_exclusion_criteria,
		auditorNotes: place.auditor_notes,
		latitude: place.lat ?? null,
		longitude: place.lng ?? null,
	};
}

export function PlaceProfileForm({
	values,
	onChange,
	onSubmit,
	projects,
	loadingProjects,
	saving,
	error,
	submitLabel,
	cancelHref,
	cancelLabel,
}: PlaceProfileFormProps) {
	const latestValuesRef = React.useRef(values);
	const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
	const [mapImageFailed, setMapImageFailed] = React.useState(false);
	const [mapImageSource, setMapImageSource] = React.useState<"google" | "osm">("google");
	const [suggestions, setSuggestions] = React.useState<GoogleAutocompleteSuggestion[]>([]);
	const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
	const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
	const [autocompleteFailed, setAutocompleteFailed] = React.useState(false);

	React.useEffect(() => {
		latestValuesRef.current = values;
	}, [values]);

	function update<K extends keyof PlaceProfileFormValues>(key: K, value: PlaceProfileFormValues[K]) {
		onChange({ ...values, [key]: value });
	}

	React.useEffect(() => {
		if (!googleMapsApiKey) return;
		const trimmedAddress = values.address.trim();
		if (trimmedAddress.length < 3) {
			setSuggestions([]);
			setSuggestionsOpen(false);
			setLoadingSuggestions(false);
			return;
		}

		let cancelled = false;
		const controller = new AbortController();
		const timeoutId = window.setTimeout(async () => {
			setLoadingSuggestions(true);
			try {
				const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
					method: "POST",
					signal: controller.signal,
					headers: {
						"Content-Type": "application/json",
						"X-Goog-Api-Key": googleMapsApiKey,
						"X-Goog-FieldMask":
							"suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
					},
					body: JSON.stringify({
						input: trimmedAddress,
						includeQueryPredictions: false,
					}),
				});

				if (!response.ok) {
					throw new Error(`Google autocomplete failed with ${response.status}`);
				}

				const payload = (await response.json()) as {
					suggestions?: Array<{
						placePrediction?: {
							placeId?: string;
							text?: { text?: string };
							structuredFormat?: {
								mainText?: { text?: string };
								secondaryText?: { text?: string };
							};
						};
					}>;
				};

				const nextSuggestions =
					payload.suggestions?.reduce<GoogleAutocompleteSuggestion[]>((accumulator, suggestion) => {
						const prediction = suggestion.placePrediction;
						const text = prediction?.text?.text ?? prediction?.structuredFormat?.mainText?.text ?? "";
						if (!prediction?.placeId || !text) {
							return accumulator;
						}
						accumulator.push({
							placeId: prediction.placeId,
							text,
							secondaryText: prediction.structuredFormat?.secondaryText?.text,
						});
						return accumulator;
					}, []) ?? [];

				if (!cancelled) {
					setSuggestions(nextSuggestions);
					setSuggestionsOpen(nextSuggestions.length > 0);
					setAutocompleteFailed(false);
				}
			} catch (error) {
				if (controller.signal.aborted || cancelled) return;
				console.error("Google address suggestions failed", error);
				setSuggestions([]);
				setSuggestionsOpen(false);
				setAutocompleteFailed(true);
			} finally {
				if (!cancelled) {
					setLoadingSuggestions(false);
				}
			}
		}, 250);

		return () => {
			cancelled = true;
			controller.abort();
			window.clearTimeout(timeoutId);
		};
	}, [googleMapsApiKey, values.address]);

	async function applySuggestion(suggestion: GoogleAutocompleteSuggestion) {
		if (!googleMapsApiKey) return;
		try {
			setLoadingSuggestions(true);
			const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(suggestion.placeId)}`, {
				headers: {
					"X-Goog-Api-Key": googleMapsApiKey,
					"X-Goog-FieldMask": "formattedAddress,addressComponents,location",
				},
			});
			if (!response.ok) {
				throw new Error(`Google place details failed with ${response.status}`);
			}
			const place = (await response.json()) as GoogleAutocompleteResult;
			const currentValues = latestValuesRef.current;
			const nextValues = {
				...currentValues,
				address: buildStreetAddress(place.addressComponents, suggestion.text ?? currentValues.address),
				city:
					normalizeGoogleAddressComponent(place.addressComponents, "locality") ||
					normalizeGoogleAddressComponent(place.addressComponents, "postal_town") ||
					currentValues.city,
				province:
					normalizeGoogleAddressComponent(place.addressComponents, "administrative_area_level_1", true) ||
					currentValues.province,
				country: normalizeGoogleAddressComponent(place.addressComponents, "country", true) || currentValues.country,
				postalCode: normalizeGoogleAddressComponent(place.addressComponents, "postal_code") || currentValues.postalCode,
				latitude: place.location?.latitude ?? currentValues.latitude,
				longitude: place.location?.longitude ?? currentValues.longitude,
			};
			onChange(nextValues);
			setSuggestions([]);
			setSuggestionsOpen(false);
			setAutocompleteFailed(false);
		} catch (error) {
			console.error("Google place details failed", error);
			setAutocompleteFailed(true);
		} finally {
			setLoadingSuggestions(false);
		}
	}

	const mapQuery = buildMapQuery(values);
	const googleMapsHref = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;
	const staticMapUrl = buildStaticMapUrl(googleMapsApiKey, values, mapQuery);
	const fallbackStaticMapUrl = buildFallbackStaticMapUrl(values, mapQuery);
	const openStreetMapEmbedUrl = buildOpenStreetMapEmbedUrl(values);
	const previewMapUrl = mapImageSource === "google" ? staticMapUrl ?? fallbackStaticMapUrl : fallbackStaticMapUrl;

	React.useEffect(() => {
		setMapImageFailed(false);
		setMapImageSource("google");
	}, [staticMapUrl, fallbackStaticMapUrl]);

	return (
		<form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
			<div className="space-y-2">
				<Label htmlFor="place-project">Project</Label>
				<select
					id="place-project"
					value={values.projectId}
					onChange={event => update("projectId", event.target.value)}
					disabled={loadingProjects || projects.length === 0}
					className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none">
					{projects.length === 0 ? <option value="">No Projects available</option> : null}
					{projects.map(project => (
						<option key={project.id} value={project.id}>
							{project.name}
						</option>
					))}
				</select>
			</div>
			<div className="space-y-2">
				<Label htmlFor="place-name">Place Name</Label>
				<Input id="place-name" placeholder="Cass Park" value={values.name} onChange={event => update("name", event.target.value)} required />
			</div>

			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor="place-address">Address</Label>
				<div className="relative">
					<Input
						id="place-address"
						placeholder="Start typing an address or location"
						value={values.address}
						onChange={event => {
							onChange({
								...values,
								address: event.target.value,
								latitude: null,
								longitude: null,
							});
						}}
						onFocus={() => {
							if (suggestions.length > 0) {
								setSuggestionsOpen(true);
							}
						}}
						onBlur={() => {
							window.setTimeout(() => setSuggestionsOpen(false), 120);
						}}
						required
					/>
					{googleMapsApiKey && suggestionsOpen && suggestions.length > 0 ? (
						<div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-lg">
							<ul className="max-h-72 overflow-y-auto py-2">
								{suggestions.map(suggestion => (
									<li key={suggestion.placeId}>
										<button
											type="button"
											onMouseDown={event => event.preventDefault()}
											onClick={() => void applySuggestion(suggestion)}
											className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-slate-50">
											<span className="text-sm font-medium text-slate-900">{suggestion.text}</span>
											{suggestion.secondaryText ? (
												<span className="text-xs text-slate-500">{suggestion.secondaryText}</span>
											) : null}
										</button>
									</li>
								))}
							</ul>
							<div className="border-t border-slate-100 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
								Powered by Google
							</div>
						</div>
					) : null}
				</div>
				<p className="text-xs text-slate-500">
					{googleMapsApiKey
						? autocompleteFailed
							? "Google address suggestions are unavailable right now. You can still type the address manually and use the map preview below."
							: loadingSuggestions
								? "Looking up Google address suggestions..."
								: "Start typing and choose a Google address suggestion to fill the location details automatically."
						: "Add the Google Maps API key to enable autocomplete. You can still complete the detailed location fields manually right now."}
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="place-city">City/Town</Label>
				<Input id="place-city" value={values.city} onChange={event => update("city", event.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="place-province">State/Province</Label>
				<Input id="place-province" value={values.province} onChange={event => update("province", event.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="place-country">Country</Label>
				<Input id="place-country" value={values.country} onChange={event => update("country", event.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="place-postal-code">Postal Code</Label>
				<Input id="place-postal-code" value={values.postalCode} onChange={event => update("postalCode", event.target.value)} />
			</div>

			<div className="space-y-3 sm:col-span-2">
				<Label>Place Type</Label>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button type="button" variant="outline" className="w-full justify-between rounded-2xl px-4 py-5 text-left font-normal">
							<span className="truncate">{values.placeType === "Other" ? `Other: ${values.otherPlaceType || "custom type"}` : values.placeType || "Select Place Type"}</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[28rem] rounded-2xl p-2">
						<DropdownMenuLabel>Type of Place</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{PLACE_TYPE_OPTIONS.map(option => (
							<button
								key={option}
								type="button"
								onClick={() => update("placeType", option)}
								className={`flex w-full rounded-sm px-2 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground ${
									values.placeType === option ? "bg-emerald-50 text-emerald-900" : "text-slate-700"
								}`}>
								{option}
							</button>
						))}
						<button
							type="button"
							onClick={() => update("placeType", "Other")}
							className={`flex w-full rounded-sm px-2 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground ${
								values.placeType === "Other" ? "bg-emerald-50 text-emerald-900" : "text-slate-700"
							}`}>
							Other
						</button>
					</DropdownMenuContent>
				</DropdownMenu>
				{values.placeType === "Other" ? (
					<div className="space-y-2">
						<Label htmlFor="place-type-other">Other Place Type</Label>
						<Input id="place-type-other" value={values.otherPlaceType} onChange={event => update("otherPlaceType", event.target.value)} />
					</div>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="place-start-date">Anticipated Start Date</Label>
				<Input id="place-start-date" type="date" value={values.startDate} onChange={event => update("startDate", event.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="place-end-date">Anticipated End Date</Label>
				<Input id="place-end-date" type="date" value={values.endDate} onChange={event => update("endDate", event.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="place-estimated-auditors">Estimated number of Auditors</Label>
				<Input
					id="place-estimated-auditors"
					type="number"
					min="0"
					value={values.estimatedAuditors}
					onChange={event => update("estimatedAuditors", event.target.value)}
				/>
			</div>

			<div className="space-y-2 sm:col-span-2">
				<Label>Auditor Population Type (check all that apply)</Label>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button type="button" variant="outline" className="w-full justify-between rounded-2xl px-4 py-5 text-left font-normal">
							<span className="truncate">
								{summarizeSelections(values.auditorPopulationTypes, values.otherAuditorPopulationType, "Select Auditor population types")}
							</span>
							<span className="ml-4 text-xs text-slate-500">{values.auditorPopulationTypes.length} selected</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[28rem] rounded-2xl p-2">
						<DropdownMenuLabel>Auditor Population Type (check all that apply)</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{AUDITOR_POPULATION_OPTIONS.map(option => (
							<DropdownMenuCheckboxItem
								key={option}
								checked={values.auditorPopulationTypes.includes(option)}
								onCheckedChange={() => update("auditorPopulationTypes", toggleArrayValue(values.auditorPopulationTypes, option))}>
								{option}
							</DropdownMenuCheckboxItem>
						))}
						<DropdownMenuCheckboxItem
							checked={values.auditorPopulationTypes.includes("Other")}
							onCheckedChange={() => update("auditorPopulationTypes", toggleArrayValue(values.auditorPopulationTypes, "Other"))}>
							Other
						</DropdownMenuCheckboxItem>
					</DropdownMenuContent>
				</DropdownMenu>
				{values.auditorPopulationTypes.includes("Other") ? (
					<div className="space-y-2">
						<Label htmlFor="place-auditor-population-other">Additional details for Other</Label>
						<Input
							id="place-auditor-population-other"
							value={values.otherAuditorPopulationType}
							onChange={event => update("otherAuditorPopulationType", event.target.value)}
						/>
					</div>
				) : null}
			</div>

			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor="place-auditor-criteria">Any inclusion / exclusion criteria for Auditors</Label>
				<Textarea
					id="place-auditor-criteria"
					value={values.auditorInclusionExclusionCriteria}
					onChange={event => update("auditorInclusionExclusionCriteria", event.target.value)}
					className="min-h-24"
				/>
			</div>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor="place-auditor-notes">Other notes about Auditors</Label>
				<Textarea
					id="place-auditor-notes"
					value={values.auditorNotes}
					onChange={event => update("auditorNotes", event.target.value)}
					className="min-h-24"
				/>
			</div>

			<div className="space-y-3 sm:col-span-2">
				<Label>Map preview</Label>
				{googleMapsHref ? (
					<div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
						{openStreetMapEmbedUrl ? (
							<div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
								<iframe
									src={openStreetMapEmbedUrl}
									title="Location map preview"
									className="h-56 w-full border-0"
									loading="lazy"
									referrerPolicy="no-referrer-when-downgrade"
								/>
							</div>
						) : previewMapUrl && !mapImageFailed ? (
							<div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
								<img
									src={previewMapUrl ?? ""}
									alt="Location preview"
									className="h-56 w-full object-cover"
									onError={() => {
										if (mapImageSource === "google" && fallbackStaticMapUrl) {
											setMapImageSource("osm");
											return;
										}
										setMapImageFailed(true);
									}}
								/>
							</div>
						) : (
							<p className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
								Map snapshot unavailable right now, but the Google Maps link below is still ready for this Place.
							</p>
						)}
						<p className="mt-4 text-sm leading-6 text-slate-600">
							Use the preview and saved location details to verify the map pin, then open the Place directly in Google Maps if you need a closer check.
						</p>
						<div className="mt-4 flex flex-wrap gap-3">
							<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
								<a href={googleMapsHref} target="_blank" rel="noreferrer">
									Open in Google Maps
								</a>
							</Button>
							{values.latitude !== null && values.longitude !== null ? (
								<p className="self-center text-xs text-slate-500">
									GPS pin: {values.latitude.toFixed(5)}, {values.longitude.toFixed(5)}
								</p>
							) : null}
						</div>
					</div>
				) : (
					<p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
						{googleMapsApiKey
							? "Add a complete address or location details to generate a Google Maps preview link here."
							: "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google Places autocomplete. The map preview link appears once a location is entered."}
					</p>
				)}
			</div>

			{error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
			<div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
				<Button type="submit" className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={saving || loadingProjects || projects.length === 0}>
					{saving ? "Saving..." : submitLabel}
				</Button>
				<Button asChild variant="outline" className="rounded-2xl">
					<Link href={cancelHref}>{cancelLabel}</Link>
				</Button>
			</div>
		</form>
	);
}
