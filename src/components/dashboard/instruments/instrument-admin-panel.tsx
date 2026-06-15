"use client";

import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	createInstrumentVersion,
	deleteInstrumentVersion,
	fetchInstrumentVersions,
	updateInstrumentStatus,
	type InstrumentVersionRecord
} from "@/lib/dashboard/live-api";
import { cn } from "@/lib/utils";

type EditableSection = {
	block: string;
	title?: string;
	intro_text?: string;
	comment_prompt?: string;
};

type EditableItem = {
	item_id: string;
	base_question_id?: string;
	block?: string;
	block_title?: string;
	question_text?: string;
	item_kind?: string;
	choices?: Record<string, { Display?: string }>;
	answers?: Record<string, { Display?: string }>;
};

type InstrumentOption = {
	value: string;
	label: string;
};

type InstrumentPreAuditQuestion = {
	id: string;
	title: string;
	prompt: string;
	description?: string;
	options?: InstrumentOption[];
	multi_select?: boolean;
	required?: boolean;
	auto_generated?: boolean;
};

type InstrumentScaleRule = {
	value: string;
	label: string;
	add?: number | null;
	boost?: number | null;
	follow_up_behavior?: string | null;
	tag?: string | null;
};

type InstrumentScaleGuidance = {
	id: string;
	title: string;
	prompt: string;
	description?: string;
	rules?: InstrumentScaleRule[];
};

type InstrumentLegalDocument = {
	id: string;
	title: string;
	last_updated?: string | null;
	content: string;
	document_type?: string | null;
};

type StructuredInstrumentContent = {
	survey_name?: string;
	version?: string;
	instrument_version?: string;
	instrument_name?: string;
	instrument_key?: string;
	sections?: EditableSection[];
	scoring_items?: EditableItem[];
	preamble?: string[];
	pre_audit_questions?: InstrumentPreAuditQuestion[];
	scale_guidance?: InstrumentScaleGuidance[];
	legal_documents?: InstrumentLegalDocument[];
};

type DetailTabKey =
	| "preamble"
	| "sections"
	| "spreadsheet"
	| "preAudit"
	| "scaleGuidance"
	| "legalDocuments";

const detailTabs: { key: DetailTabKey; label: string }[] = [
	{ key: "preamble", label: "Preamble" },
	{ key: "sections", label: "Sections" },
	{ key: "spreadsheet", label: "Spreadsheet" },
	{ key: "preAudit", label: "Pre-Audit Questions" },
	{ key: "scaleGuidance", label: "Scale Guidance" },
	{ key: "legalDocuments", label: "Legal Documents" }
];

function cleanInstrumentText(value: string | null | undefined) {
	return (value ?? "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n\n")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
}

function isPlaceholderQuestionText(value: string) {
	const normalized = cleanInstrumentText(value).toLowerCase();
	return normalized === "click to write the question text";
}

function getDisplayQuestionText(item: EditableItem) {
	const questionText = cleanInstrumentText(item.question_text || "");
	if (!questionText || isPlaceholderQuestionText(questionText)) {
		const choicePrompts = Object.entries(item.choices ?? {})
			.map(([choiceId, choice]) => cleanInstrumentText(choice.Display || choiceId))
			.filter(Boolean);
		if (choicePrompts.length > 0) {
			return choicePrompts.join("\n");
		}
		if (item.answers && Object.keys(item.answers).length > 0) {
			return "Please answer the following questions.";
		}
		return item.item_id;
	}
	return questionText;
}

function getEditablePromptEntries(item: EditableItem) {
	const questionText = cleanInstrumentText(item.question_text || "");
	const choiceEntries = Object.entries(item.choices ?? {})
		.map(([choiceId, choice]) => ({
			entryKey: `choice-${choiceId}`,
			choiceId,
			label: `${item.item_id} · Prompt ${choiceId}`,
			value: cleanInstrumentText(choice.Display || choiceId),
			isChoice: true as const
		}))
		.filter(entry => entry.value);

	if ((!questionText || isPlaceholderQuestionText(questionText)) && choiceEntries.length > 0) {
		return choiceEntries;
	}

	return [
		{
			entryKey: "question-text",
			choiceId: null,
			label: item.item_id,
			value: questionText,
			isChoice: false as const
		}
	];
}

function isThrowawayVersion(version: InstrumentVersionRecord) {
	return version.instrument_version.toLowerCase().includes("smoke-test");
}

function summarizeInstrument(content: Record<string, unknown> | null) {
	if (!content) {
		return {
			name: "Unavailable",
			key: "yee",
			version: "Unknown",
			sections: 0,
			items: 0,
			preAuditQuestions: 0,
			scaleGuidance: 0,
			legalDocuments: 0
		};
	}

	return {
		name:
			typeof content.survey_name === "string"
				? content.survey_name
				: typeof content.instrument_name === "string"
					? content.instrument_name
					: "YEE Instrument",
		key: typeof content.instrument_key === "string" ? content.instrument_key : "yee",
		version:
			typeof content.version === "string"
				? content.version
				: typeof content.instrument_version === "string"
					? content.instrument_version
					: "Unknown",
		sections: Array.isArray(content.sections) ? content.sections.length : 0,
		items: Array.isArray(content.scoring_items) ? content.scoring_items.length : 0,
		preAuditQuestions: Array.isArray(content.pre_audit_questions) ? content.pre_audit_questions.length : 0,
		scaleGuidance: Array.isArray(content.scale_guidance) ? content.scale_guidance.length : 0,
		legalDocuments: Array.isArray(content.legal_documents) ? content.legal_documents.length : 0
	};
}

function getTypedContent(content: Record<string, unknown> | null): StructuredInstrumentContent | null {
	if (!content) return null;
	return content as StructuredInstrumentContent;
}

function getQuestionGroups(content: StructuredInstrumentContent | null) {
	const groups = new Map<string, { section: EditableSection | null; items: EditableItem[] }>();
	const sections = content?.sections ?? [];
	const items = content?.scoring_items ?? [];

	for (const section of sections) {
		groups.set(section.block, { section, items: [] });
	}

	for (const item of items) {
		const key = item.block ?? item.block_title ?? "other";
		const existing = groups.get(key) ?? { section: null, items: [] };
		existing.items.push(item);
		groups.set(key, existing);
	}

	return Array.from(groups.entries()).map(([blockKey, value]) => ({
		blockKey,
		section: value.section,
		items: value.items
	}));
}

function buildSpreadsheetRows(content: StructuredInstrumentContent | null) {
	return getQuestionGroups(content).flatMap(group => {
		const sectionTitle = cleanInstrumentText(group.section?.title || group.items[0]?.block_title || group.blockKey);
		const sectionDescription = cleanInstrumentText(group.section?.intro_text);
		const sectionPrompt = cleanInstrumentText(group.section?.comment_prompt);
		return [
			{
				id: `section-${group.blockKey}`,
				number: `Section ${sectionTitle}`,
				section: sectionTitle,
				prompt: [sectionDescription ? `Description: ${sectionDescription}` : "", sectionPrompt ? `Notes Prompt: ${sectionPrompt}` : ""]
					.filter(Boolean)
					.join("\n\n")
			},
			...group.items.map(item => ({
				id: item.item_id,
				number: item.item_id,
				section: "—",
				prompt: getDisplayQuestionText(item)
			}))
		];
	});
}

async function fetchCanonicalInstrument() {
	const response = await fetch("/api/yee/instrument", { cache: "no-store" });
	const text = await response.text();
	const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
	if (!response.ok) {
		const detail =
			typeof data.detail === "string"
				? data.detail
				: typeof data.error === "string"
					? data.error
					: "Could not load the current YEE instrument.";
		throw new Error(detail);
	}
	return data;
}

export function InstrumentAdminPanel() {
	const { session } = useAuth();
	const editorRef = React.useRef<HTMLDivElement | null>(null);

	const [versions, setVersions] = React.useState<InstrumentVersionRecord[]>([]);
	const [canonicalInstrument, setCanonicalInstrument] = React.useState<Record<string, unknown> | null>(null);
	const [selectedVersionId, setSelectedVersionId] = React.useState<string | null>(null);
	const [expandedVersionId, setExpandedVersionId] = React.useState<string | null>(null);
	const [detailTabByVersion, setDetailTabByVersion] = React.useState<Record<string, DetailTabKey>>({});
	const [instrumentKey, setInstrumentKey] = React.useState("yee");
	const [instrumentVersion, setInstrumentVersion] = React.useState("");
	const [editorValue, setEditorValue] = React.useState("");
	const [activateOnCreate, setActivateOnCreate] = React.useState(false);
	const [showAdvancedEditor, setShowAdvancedEditor] = React.useState(false);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [deletingId, setDeletingId] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [success, setSuccess] = React.useState<string | null>(null);

	const activeVersion = versions.find(version => version.is_active) ?? null;
	const selectedVersion = versions.find(version => version.id === selectedVersionId) ?? activeVersion ?? null;
	const activeSummary = summarizeInstrument(activeVersion?.content ?? canonicalInstrument);
	const parsedEditorInstrument = React.useMemo(() => {
		if (!editorValue.trim()) return null;
		try {
			return JSON.parse(editorValue) as StructuredInstrumentContent;
		} catch {
			return null;
		}
	}, [editorValue]);

	const groupedQuestionItems = React.useMemo(() => {
		const items = parsedEditorInstrument?.scoring_items ?? [];
		const groups = new Map<string, EditableItem[]>();
		for (const item of items) {
			const key = item.block_title || item.block || "Other";
			const existing = groups.get(key) ?? [];
			existing.push(item);
			groups.set(key, existing);
		}
		return Array.from(groups.entries());
	}, [parsedEditorInstrument]);

	const loadAll = React.useCallback(async () => {
		if (!session) return;
		setLoading(true);
		setError(null);
		try {
			const [versionRows, canonical] = await Promise.all([
				fetchInstrumentVersions(session, "yee"),
				fetchCanonicalInstrument()
			]);
			const filteredRows = versionRows.filter(version => !isThrowawayVersion(version));
			setVersions(filteredRows);
			setCanonicalInstrument(canonical);
			const nextSelected = filteredRows.find(version => version.is_active)?.id ?? filteredRows[0]?.id ?? null;
			setSelectedVersionId(nextSelected);
			setExpandedVersionId(nextSelected);
			if (!editorValue.trim()) {
				setEditorValue(JSON.stringify(canonical, null, 2));
				const canonicalSummary = summarizeInstrument(canonical);
				setInstrumentVersion(`${canonicalSummary.version}-draft`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not load instrument data.");
		} finally {
			setLoading(false);
		}
	}, [editorValue, session]);

	React.useEffect(() => {
		void loadAll();
	}, [loadAll]);

	if (!session) return null;

	function scrollToEditor() {
		editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function toDraftLabel(versionLabel: string) {
		return versionLabel.endsWith("-draft") ? versionLabel : `${versionLabel}-draft`;
	}

	function loadIntoEditor(content: Record<string, unknown>, versionLabel: string, message: string, sourceId?: string) {
		setEditorValue(JSON.stringify(content, null, 2));
		setInstrumentVersion(versionLabel);
		setActivateOnCreate(false);
		setShowAdvancedEditor(false);
		setSuccess(message);
		setError(null);
		if (sourceId) {
			setSelectedVersionId(sourceId);
			setExpandedVersionId(sourceId);
		}
		requestAnimationFrame(() => {
			scrollToEditor();
		});
	}

	async function handleCreate() {
		if (!session) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const parsed = JSON.parse(editorValue) as Record<string, unknown>;
			const created = await createInstrumentVersion(
				session,
				{
					instrument_key: instrumentKey.trim() || "yee",
					instrument_version: instrumentVersion.trim(),
					content: parsed
				},
				activateOnCreate
			);
			setSuccess(
				activateOnCreate
					? `Created and activated instrument version ${created.instrument_version}.`
					: `Created draft instrument version ${created.instrument_version}.`
			);
			await loadAll();
			setSelectedVersionId(created.id);
			setExpandedVersionId(created.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create instrument version.");
		} finally {
			setSaving(false);
		}
	}

	async function handleActivate(instrumentId: string) {
		if (!session) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const updated = await updateInstrumentStatus(session, instrumentId, { is_active: true });
			setSuccess(`Activated instrument version ${updated.instrument_version}.`);
			await loadAll();
			setSelectedVersionId(updated.id);
			setExpandedVersionId(updated.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not activate this instrument version.");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(instrumentId: string) {
		if (!session) return;
		setDeletingId(instrumentId);
		setError(null);
		setSuccess(null);
		try {
			await deleteInstrumentVersion(session, instrumentId);
			setSuccess("Deleted the instrument version.");
			await loadAll();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not delete this instrument version.");
		} finally {
			setDeletingId(null);
		}
	}

	function updateEditor(mutator: (draft: StructuredInstrumentContent) => void) {
		try {
			const draft = JSON.parse(editorValue || "{}") as StructuredInstrumentContent;
			mutator(draft);
			setEditorValue(JSON.stringify(draft, null, 2));
			setError(null);
		} catch {
			setError("The advanced JSON editor currently contains invalid JSON, so the friendly editor cannot update it safely.");
		}
	}

	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-[#3b3027] bg-[#352b25] text-white shadow-sm">
				<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d6c9bc]">Administrator Workspace</p>
						<CardTitle className="text-4xl text-white">Instrument Management</CardTitle>
						<CardDescription className="max-w-3xl text-base text-[#e9dfd4]">
							Review version history, open the current instrument as a draft, update wording, and publish the version the website should use.
						</CardDescription>
					</div>
					<div className="flex w-full flex-col gap-3 lg:w-auto">
						<Button
							type="button"
							variant="outline"
							className="rounded-2xl border-white/25 bg-white/90 text-[#352b25] hover:bg-white"
							onClick={() => {
								if (!canonicalInstrument) return;
								const currentVersion = summarizeInstrument(canonicalInstrument).version;
								loadIntoEditor(
									canonicalInstrument,
									toDraftLabel(currentVersion),
									"Opened the current website instrument in the draft editor.",
									activeVersion?.id
								);
							}}
							disabled={!canonicalInstrument}
						>
							Open Current Version
						</Button>
						<Button
							type="button"
							className="rounded-2xl bg-[#3e8f63] text-white hover:bg-[#347b55]"
							onClick={() => {
								const source = selectedVersion?.content ?? canonicalInstrument;
								if (!source) return;
								const label = selectedVersion
									? toDraftLabel(selectedVersion.instrument_version)
									: toDraftLabel(summarizeInstrument(canonicalInstrument).version);
								loadIntoEditor(
									source,
									label,
									selectedVersion
										? `Opened ${selectedVersion.instrument_version} as a new draft.`
										: "Opened the current website instrument as a new draft.",
									selectedVersion?.id
								);
							}}
							disabled={!selectedVersion && !canonicalInstrument}
						>
							Create New Draft
						</Button>
					</div>
				</CardHeader>
			</Card>

			{error ? (
				<Card className="rounded-[1.75rem] border-rose-200 bg-rose-50 shadow-sm">
					<CardHeader>
						<CardTitle>Instrument tool needs attention</CardTitle>
						<CardDescription className="text-rose-700">{error}</CardDescription>
					</CardHeader>
				</Card>
			) : null}

			{success ? (
				<Card className="rounded-[1.75rem] border-emerald-200 bg-emerald-50 shadow-sm">
					<CardContent className="py-4 text-sm font-medium text-emerald-800">{success}</CardContent>
				</Card>
			) : null}

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Version History</CardTitle>
					<CardDescription>
						Active version: {activeSummary.version}. Open a version to inspect it, edit it into a draft, publish it, or delete an inactive draft.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{loading ? (
						<p className="text-sm text-slate-500">Loading instrument versions...</p>
					) : versions.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
							No saved versions are available yet.
						</div>
					) : (
						versions.map(version => {
							const tab = detailTabByVersion[version.id] ?? "preamble";
							return (
								<div key={version.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
									<div
										className={cn(
											"flex flex-col gap-4 p-5",
											selectedVersionId === version.id ? "bg-emerald-50/70" : "bg-white"
										)}
									>
										<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
											<div className="space-y-2">
												<div className="flex flex-wrap items-center gap-2">
													<p className="break-words text-2xl font-semibold text-slate-900">{version.instrument_version}</p>
													<Badge className={cn("rounded-full", version.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-100")}>
														{version.is_active ? "Active" : "Inactive"}
													</Badge>
												</div>
												<p className="text-sm text-slate-500">Created {new Date(version.created_at).toLocaleString()}</p>
											</div>
											<div className="flex flex-wrap gap-2">
												<Button
													type="button"
													variant="outline"
													className="rounded-2xl"
													onClick={() => {
														setSelectedVersionId(version.id);
														setExpandedVersionId(current => (current === version.id ? null : version.id));
													}}
												>
													{expandedVersionId === version.id ? "Hide Details" : "View Details"}
												</Button>
												<Button
													type="button"
													className="rounded-2xl bg-[#1f5f45] text-white hover:bg-[#194e3a]"
													onClick={() =>
														loadIntoEditor(
															version.content,
															version.is_active ? `${version.instrument_version}-draft` : version.instrument_version,
															`Opened ${version.instrument_version} in the draft editor.`,
															version.id
														)
													}
												>
													Edit this version
												</Button>
												{!version.is_active ? (
													<Button
														type="button"
														className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
														onClick={() => void handleActivate(version.id)}
														disabled={saving}
													>
														Make Active
													</Button>
												) : null}
												{!version.is_active ? (
													<Button
														type="button"
														variant="outline"
														className="rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50"
														onClick={() => void handleDelete(version.id)}
														disabled={deletingId === version.id}
													>
														{deletingId === version.id ? "Deleting..." : "Delete"}
													</Button>
												) : null}
											</div>
										</div>
										{expandedVersionId === version.id ? (
											<VersionDetailsPanel
												content={getTypedContent(version.content)}
												tab={tab}
												onTabChange={nextTab =>
													setDetailTabByVersion(current => ({ ...current, [version.id]: nextTab }))
												}
											/>
										) : null}
									</div>
								</div>
							);
						})
					)}
				</CardContent>
			</Card>

			<div ref={editorRef}>
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Edit Draft Version</CardTitle>
					<CardDescription>
						Open the current version or any saved version above, update wording here, then save a new draft or publish it immediately.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="instrument-version">Version Label</Label>
							<Input
								id="instrument-version"
								value={instrumentVersion}
								onChange={event => setInstrumentVersion(event.target.value)}
								placeholder="Example: spring-2026, janet-review-1"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="instrument-key">Instrument Key</Label>
							<Input
								id="instrument-key"
								value={instrumentKey}
								onChange={event => setInstrumentKey(event.target.value)}
								readOnly
								className="bg-slate-50 text-slate-500"
							/>
						</div>
					</div>

					<div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
						<span className="font-medium">Advanced only:</span> the raw JSON editor below is for changing the survey definition itself, not for ordinary dashboard use.
					</div>

					<div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
						<div>
							<h3 className="text-base font-semibold text-slate-900">Friendly survey text editor</h3>
							<p className="mt-1 text-sm text-slate-600">
								These changes save into the new version you create below. Long text is wrapped here exactly so it stays readable.
							</p>
						</div>
						{parsedEditorInstrument ? (
							<div className="space-y-5">
								<div className="space-y-2">
									<Label htmlFor="friendly-survey-name">Survey Title</Label>
									<Input
										id="friendly-survey-name"
										value={parsedEditorInstrument.survey_name ?? ""}
										onChange={event =>
											updateEditor(draft => {
												draft.survey_name = event.target.value;
											})
										}
									/>
								</div>

								<div className="space-y-3">
									<p className="text-sm font-medium text-slate-900">Preamble copy</p>
									{(parsedEditorInstrument.preamble ?? []).map((paragraph, index) => (
										<div key={`preamble-${index}`} className="space-y-2">
											<Label>Preamble paragraph {index + 1}</Label>
											<Textarea
												value={cleanInstrumentText(paragraph)}
												onChange={event =>
													updateEditor(draft => {
														const preamble = [...(draft.preamble ?? [])];
														preamble[index] = event.target.value;
														draft.preamble = preamble;
													})
												}
												className="min-h-[6rem]"
											/>
										</div>
									))}
								</div>

								<div className="space-y-4">
									<p className="text-sm font-medium text-slate-900">Section text</p>
									{(parsedEditorInstrument.sections ?? []).map((section, index) => (
										<div key={`${section.block}-${index}`} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
											<p className="break-words text-sm font-semibold text-slate-900">
												{cleanInstrumentText(section.title || section.block)}
											</p>
											<div className="space-y-2">
												<Label>Section Title</Label>
												<Input
													value={cleanInstrumentText(section.title)}
													onChange={event =>
														updateEditor(draft => {
															const sections = [...(draft.sections ?? [])];
															if (!sections[index]) return;
															sections[index] = { ...sections[index], title: event.target.value };
															draft.sections = sections;
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label>Instructions</Label>
												<Textarea
													value={cleanInstrumentText(section.intro_text)}
													onChange={event =>
														updateEditor(draft => {
															const sections = [...(draft.sections ?? [])];
															if (!sections[index]) return;
															sections[index] = { ...sections[index], intro_text: event.target.value };
															draft.sections = sections;
														})
													}
													className="min-h-[8rem]"
												/>
											</div>
											<div className="space-y-2">
												<Label>Optional Comment Prompt</Label>
												<Textarea
													value={cleanInstrumentText(section.comment_prompt)}
													onChange={event =>
														updateEditor(draft => {
															const sections = [...(draft.sections ?? [])];
															if (!sections[index]) return;
															sections[index] = { ...sections[index], comment_prompt: event.target.value };
															draft.sections = sections;
														})
													}
													className="min-h-[5rem]"
												/>
											</div>
										</div>
									))}
								</div>

								<div className="space-y-4">
									<p className="text-sm font-medium text-slate-900">Question text</p>
									{groupedQuestionItems.map(([groupName, items]) => (
										<div key={groupName} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
											<p className="break-words text-sm font-semibold text-slate-900">{cleanInstrumentText(groupName)}</p>
											{items.map(item => {
												const itemIndex = (parsedEditorInstrument.scoring_items ?? []).findIndex(
													candidate => candidate.item_id === item.item_id
												);
												const editableEntries = getEditablePromptEntries(item);
												return (
													<div key={item.item_id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
														<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.item_id}</p>
														{editableEntries.map(entry => (
															<div key={entry.entryKey} className="space-y-2">
																<Label>{entry.label}</Label>
																<Textarea
																	value={entry.value}
																	onChange={event =>
																		updateEditor(draft => {
																			const scoringItems = [...(draft.scoring_items ?? [])];
																			if (itemIndex < 0 || !scoringItems[itemIndex]) return;
																			if (entry.isChoice && entry.choiceId) {
																				const currentChoices = { ...(scoringItems[itemIndex].choices ?? {}) };
																				currentChoices[entry.choiceId] = {
																					...(currentChoices[entry.choiceId] ?? {}),
																					Display: event.target.value
																				};
																				scoringItems[itemIndex] = {
																					...scoringItems[itemIndex],
																					choices: currentChoices
																				};
																			} else {
																				scoringItems[itemIndex] = {
																					...scoringItems[itemIndex],
																					question_text: event.target.value
																				};
																			}
																			draft.scoring_items = scoringItems;
																		})
																	}
																	className="min-h-[5rem]"
																/>
															</div>
														))}
													</div>
												);
											})}
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600">
								Open the current version or one of the saved versions above to start editing.
							</div>
						)}
					</div>

					<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
						<input
							id="activate-on-create"
							type="checkbox"
							checked={activateOnCreate}
							onChange={event => setActivateOnCreate(event.target.checked)}
							className="h-4 w-4 rounded border-slate-300"
						/>
						<Label htmlFor="activate-on-create" className="cursor-pointer text-sm font-medium">
							Publish this version immediately after saving
						</Label>
					</div>

					<div className="space-y-3">
						<Button
							type="button"
							variant="ghost"
							className="rounded-2xl px-0 text-slate-700 hover:bg-transparent hover:text-slate-900"
							onClick={() => setShowAdvancedEditor(current => !current)}
						>
							{showAdvancedEditor ? "Hide Advanced JSON Editor" : "Show Advanced JSON Editor"}
						</Button>
						{showAdvancedEditor ? (
							<div className="space-y-2">
								<Label htmlFor="instrument-json">Instrument JSON</Label>
								<Textarea
									id="instrument-json"
									value={editorValue}
									onChange={event => setEditorValue(event.target.value)}
									className="min-h-[28rem] font-mono text-xs"
									placeholder="Paste or edit the full YEE instrument JSON here..."
								/>
							</div>
						) : null}
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<Button
							type="button"
							className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
							onClick={() => void handleCreate()}
							disabled={saving || !instrumentVersion.trim() || !editorValue.trim()}
						>
							{saving ? "Saving..." : activateOnCreate ? "Save and Publish Version" : "Save Draft Version"}
						</Button>
					</div>
				</CardContent>
				</Card>
			</div>
		</div>
	);
}

function VersionDetailsPanel({
	content,
	tab,
	onTabChange
}: {
	content: StructuredInstrumentContent | null;
	tab: DetailTabKey;
	onTabChange: (tab: DetailTabKey) => void;
}) {
	const summary = summarizeInstrument((content as Record<string, unknown> | null) ?? null);
	const questionGroups = getQuestionGroups(content);
	const spreadsheetRows = buildSpreadsheetRows(content);

	return (
		<div className="space-y-5 border-t border-slate-200 pt-5">
			<div className="grid gap-3 md:grid-cols-4">
				<MetricCard label="Sections" value={String(summary.sections)} />
				<MetricCard label="Total Questions" value={String(summary.items)} />
				<MetricCard label="Pre-Audit Questions" value={String(summary.preAuditQuestions)} />
				<MetricCard label="Scale Guidance" value={String(summary.scaleGuidance)} />
			</div>

			<div className="flex flex-wrap gap-2">
				{detailTabs.map(detailTab => (
					<button
						key={detailTab.key}
						type="button"
						onClick={() => onTabChange(detailTab.key)}
						className={cn(
							"rounded-xl border px-3 py-2 text-sm transition",
							tab === detailTab.key
								? "border-slate-900 bg-slate-900 text-white"
								: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
						)}
					>
						{detailTab.label}
						{detailTab.key === "sections" ? ` (${summary.sections})` : ""}
						{detailTab.key === "preAudit" ? ` (${summary.preAuditQuestions})` : ""}
						{detailTab.key === "scaleGuidance" ? ` (${summary.scaleGuidance})` : ""}
						{detailTab.key === "legalDocuments" ? ` (${summary.legalDocuments})` : ""}
					</button>
				))}
			</div>

			{tab === "preamble" ? <PreamblePanel paragraphs={content?.preamble ?? []} /> : null}
			{tab === "sections" ? <SectionsPanel groups={questionGroups} /> : null}
			{tab === "spreadsheet" ? <SpreadsheetPanel rows={spreadsheetRows} /> : null}
			{tab === "preAudit" ? <PreAuditPanel questions={content?.pre_audit_questions ?? []} /> : null}
			{tab === "scaleGuidance" ? <ScaleGuidancePanel scales={content?.scale_guidance ?? []} /> : null}
			{tab === "legalDocuments" ? <LegalDocumentsPanel documents={content?.legal_documents ?? []} /> : null}
		</div>
	);
}

function PreamblePanel({ paragraphs }: { paragraphs: string[] }) {
	return (
		<div className="space-y-4">
			{paragraphs.map((paragraph, index) => (
				<div key={`preamble-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5">
					<p className="text-lg font-semibold text-slate-900">
						{index === 0 ? "How the tool is structured" : `Preamble note ${index + 1}`}
					</p>
					<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
						{cleanInstrumentText(paragraph)}
					</p>
				</div>
			))}
		</div>
	);
}

function SectionsPanel({
	groups
}: {
	groups: Array<{ blockKey: string; section: EditableSection | null; items: EditableItem[] }>;
}) {
	return (
		<div className="space-y-4">
			{groups.map((group, index) => (
				<div key={group.blockKey} className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-center gap-2">
						<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">{index + 1}</Badge>
						<p className="break-words text-2xl font-semibold text-slate-900">
							{cleanInstrumentText(group.section?.title || group.items[0]?.block_title || group.blockKey)}
						</p>
					</div>
					<p className="mt-2 text-sm text-slate-600">
						{group.items.length} questions across {new Set(group.items.map(item => item.item_kind || "scored")).size} unique modes
					</p>
					{group.section?.intro_text ? (
						<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
							<span className="font-medium text-slate-900">Instruction:</span>{" "}
							<span className="whitespace-pre-wrap break-words">{cleanInstrumentText(group.section.intro_text)}</span>
						</div>
					) : null}
					{group.section?.comment_prompt ? (
						<div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-sm text-slate-700">
							<span className="font-medium text-slate-900">Notes Prompt:</span>{" "}
							<span className="whitespace-pre-wrap break-words">{cleanInstrumentText(group.section.comment_prompt)}</span>
						</div>
					) : null}
					<div className="mt-4 space-y-3">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Questions ({group.items.length})</p>
						{group.items.map(item => (
							<div key={item.item_id} className="rounded-2xl border border-slate-200 bg-white p-4">
								<div className="flex flex-wrap items-center gap-2">
									<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">{item.item_id}</Badge>
									{item.item_kind ? (
										<Badge className="rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
											{item.item_kind}
										</Badge>
									) : null}
									<Badge className="rounded-lg bg-slate-900 text-white hover:bg-slate-900">
										{item.answers && Object.keys(item.answers).length > 0 ? "Matrix" : "Single select"}
									</Badge>
								</div>
								<p className="mt-3 whitespace-pre-wrap break-words text-lg font-medium text-slate-900">
									{getDisplayQuestionText(item)}
								</p>
								{item.choices && Object.keys(item.choices).length > 0 ? (
									<div className="mt-4 flex flex-wrap gap-2">
										{Object.entries(item.choices).map(([choiceId, choice]) => (
											<span
												key={`${item.item_id}-${choiceId}`}
												className="max-w-full whitespace-normal break-words rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
											>
												{cleanInstrumentText(choice.Display || choiceId)}
											</span>
										))}
									</div>
								) : null}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function SpreadsheetPanel({ rows }: { rows: Array<{ id: string; number: string; section: string; prompt: string }> }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
			<div className="grid grid-cols-[180px_240px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-700">
				<p>#</p>
				<p>Section</p>
				<p>Prompt</p>
			</div>
			<div className="max-h-[42rem] overflow-y-auto">
				{rows.map(row => (
					<div
						key={row.id}
						className="grid grid-cols-[180px_240px_minmax(0,1fr)] gap-4 border-b border-slate-100 px-6 py-4 text-sm text-slate-700 last:border-b-0"
					>
						<p className="whitespace-pre-wrap break-words font-medium text-slate-900">{row.number}</p>
						<p className="whitespace-pre-wrap break-words">{row.section}</p>
						<p className="whitespace-pre-wrap break-words leading-6">{row.prompt}</p>
					</div>
				))}
			</div>
		</div>
	);
}

function PreAuditPanel({ questions }: { questions: InstrumentPreAuditQuestion[] }) {
	return (
		<div className="space-y-4">
			{questions.map(question => (
				<div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-center gap-2">
						<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">{question.id}</Badge>
						{question.auto_generated ? (
							<Badge className="rounded-lg bg-slate-900 text-white hover:bg-slate-900">Auto generated</Badge>
						) : null}
						<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
							{question.multi_select ? "Multi select" : "Single select"}
						</Badge>
					</div>
					<p className="mt-4 break-words text-2xl font-semibold text-slate-900">{cleanInstrumentText(question.title)}</p>
					<p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-slate-900">
						{cleanInstrumentText(question.prompt)}
					</p>
					{question.description ? (
						<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
							{cleanInstrumentText(question.description)}
						</p>
					) : null}
					{question.options?.length ? (
						<div className="mt-4 flex flex-wrap gap-2">
							{question.options.map(option => (
								<span
									key={`${question.id}-${option.value}`}
									className="max-w-full whitespace-normal break-words rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
								>
									{cleanInstrumentText(option.label)}
								</span>
							))}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}

function ScaleGuidancePanel({ scales }: { scales: InstrumentScaleGuidance[] }) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			{scales.map(scale => (
				<div key={scale.id} className="rounded-2xl border border-slate-200 bg-white p-5">
					<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">{cleanInstrumentText(scale.title)}</Badge>
					<p className="mt-4 break-words text-2xl font-semibold text-slate-900">{cleanInstrumentText(scale.title)}</p>
					<p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium text-slate-900">
						{cleanInstrumentText(scale.prompt)}
					</p>
					{scale.description ? (
						<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
							{cleanInstrumentText(scale.description)}
						</p>
					) : null}
					<div className="mt-4 space-y-2">
						{(scale.rules ?? []).map(rule => (
							<div
								key={`${scale.id}-${rule.value}`}
								className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700"
							>
								<div className="flex flex-wrap items-center gap-2">
									<span className="break-words font-medium text-slate-900">{cleanInstrumentText(rule.label)}</span>
									{rule.tag ? <Badge className="rounded-full bg-white text-slate-600 hover:bg-white">{rule.tag}</Badge> : null}
								</div>
								<div className="flex flex-wrap gap-2 text-xs">
									{typeof rule.add === "number" ? <span>Add: {rule.add}</span> : null}
									{typeof rule.boost === "number" ? <span>Boost: {rule.boost}</span> : null}
									{rule.follow_up_behavior ? <span>{cleanInstrumentText(rule.follow_up_behavior)}</span> : null}
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function LegalDocumentsPanel({ documents }: { documents: InstrumentLegalDocument[] }) {
	return (
		<div className="space-y-4">
			{documents.map(document => (
				<div key={document.id} className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
								{cleanInstrumentText(document.document_type?.replaceAll("_", " ") || "Document")}
							</p>
							<p className="break-words text-2xl font-semibold text-slate-900">{cleanInstrumentText(document.title)}</p>
							{document.last_updated ? <p className="text-sm text-slate-500">Last Updated: {document.last_updated}</p> : null}
						</div>
						<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">{document.id}</Badge>
					</div>
					<p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
						{cleanInstrumentText(document.content)}
					</p>
				</div>
			))}
		</div>
	);
}

function MetricCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-sm text-slate-500">{label}</p>
			<p className="mt-2 break-words text-lg font-semibold text-slate-950">{value}</p>
		</div>
	);
}
